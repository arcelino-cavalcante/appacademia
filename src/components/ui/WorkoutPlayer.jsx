import React, { useState, useEffect, useRef } from 'react';
import { Share2, Video, X, ChevronRight, Play, Check, Dumbbell, Timer, Zap } from 'lucide-react';

export default function WorkoutPlayer({ exercicios, onFinish, onClose }) {
    // 1. Flatten all exercises into a linear sequence of "Sets"
    // For simplicity: iterate exercises linearly. Inside each exercise, iterate sets.
    // If it's a bi-set, we ideally should alternate, but let's stick to doing all sets of Ex A then all sets of Ex B for now unless grouped.
    // Actually, trainers love it when Bi-sets (vincular) alternate: A1 -> B1 -> A2 -> B2.

    const [flatSets, setFlatSets] = useState([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isResting, setIsResting] = useState(false);
    const [timeRemaining, setTimeRemaining] = useState(0);
    const [cargaReal, setCargaReal] = useState('');
    const [mostrarVideoForm, setMostrarVideoForm] = useState(false);
    const [sessionLogs, setSessionLogs] = useState([]);

    const audioContextRef = useRef(null);

    useEffect(() => {
        // Build the sequence
        let sequence = [];
        let i = 0;

        while (i < exercicios.length) {
            const ex = exercicios[i];

            // Check if part of a bi-set/tri-set group
            let group = [ex];
            let j = i;
            while (j < exercicios.length - 1 && exercicios[j].vincular) {
                group.push(exercicios[j + 1]);
                j++;
            }

            if (group.length > 1) {
                // Bi-set/Tri-set alternating logic
                // Find max sets in group
                let maxSets = 0;
                group.forEach(gEx => {
                    const sets = gEx.isAdvanced ? gEx.advancedSets.length : parseInt(gEx.series) || 3;
                    if (sets > maxSets) maxSets = sets;
                });

                for (let s = 0; s < maxSets; s++) {
                    group.forEach((gEx, gIdx) => {
                        const totalSets = gEx.isAdvanced ? gEx.advancedSets.length : parseInt(gEx.series) || 3;
                        if (s < totalSets) {
                            sequence.push(createSetObj(gEx, s, totalSets, gIdx === group.length - 1, true));
                        }
                    });
                }
                i = j + 1;
            } else {
                // Normal sequential sets
                const totalSets = ex.isAdvanced ? ex.advancedSets.length : parseInt(ex.series) || 3;
                for (let s = 0; s < totalSets; s++) {
                    sequence.push(createSetObj(ex, s, totalSets, true, false));
                }
                i++;
            }
        }

        setFlatSets(sequence);
        if (sequence.length > 0) {
            // carregar carga do primeiro
            setCargaReal(sequence[0].cargaPrevista);
        }
    }, [exercicios]);

    const createSetObj = (ex, setIndex, totalSets, isLastInGroup, isCircuito) => {
        let prevCarga = ex.carga;
        let prevReps = ex.reps;
        let prevDesc = ex.descanso;
        let pRir = ex.rir || '-';
        let pMetodo = ex.metodo;
        let pDetalhe = ex.detalheMetodo;
        let pTipoSerie = 'Padrão';

        if (ex.isAdvanced && ex.advancedSets && ex.advancedSets[setIndex]) {
            const sData = ex.advancedSets[setIndex];
            prevCarga = sData.carga || prevCarga;
            prevReps = sData.reps || prevReps;
            prevDesc = sData.descanso || prevDesc;
            pRir = sData.rir || pRir;
            pMetodo = sData.metodo || pMetodo;
            pDetalhe = sData.detalheMetodo || pDetalhe;
            pTipoSerie = sData.tipoSerie || pTipoSerie;
        }

        // Parse rest time to seconds
        let restSeconds = 0;
        const descMatch = (prevDesc || '').match(/(\d+)/);
        if (descMatch) restSeconds = parseInt(descMatch[1]);
        if (String(prevDesc).toLowerCase().includes('min')) restSeconds *= 60;
        if (restSeconds === 0) restSeconds = 60; // default 60s

        return {
            exId: ex.id,
            nome: ex.nome,
            video: ex.video,
            setAtual: setIndex + 1,
            totalSets: totalSets,
            cargaPrevista: prevCarga,
            repsPrevista: prevReps,
            descansoPrevisto: prevDesc,
            restSeconds: restSeconds,
            rir: pRir,
            metodo: pMetodo,
            detalheMetodo: pDetalhe,
            tipoSerie: pTipoSerie,
            isLastInGroup: isLastInGroup,
            isCircuito: isCircuito
        };
    };

    const playBeep = () => {
        try {
            if (!audioContextRef.current) {
                audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
            }
            const context = audioContextRef.current;
            const osc = context.createOscillator();
            const gainNode = context.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(800, context.currentTime); // 800Hz
            osc.frequency.exponentialRampToValueAtTime(1200, context.currentTime + 0.1);
            gainNode.gain.setValueAtTime(0, context.currentTime);
            gainNode.gain.linearRampToValueAtTime(1, context.currentTime + 0.05);
            gainNode.gain.linearRampToValueAtTime(0, context.currentTime + 0.5);
            osc.connect(gainNode);
            gainNode.connect(context.destination);
            osc.start();
            osc.stop(context.currentTime + 0.5);
        } catch (e) {
            console.log("Audio not supported or blocked");
        }
    };

    // Timer logic
    useEffect(() => {
        let interval;
        if (isResting && timeRemaining > 0) {
            interval = setInterval(() => {
                setTimeRemaining(prev => prev - 1);
            }, 1000);
        } else if (isResting && timeRemaining <= 0) {
            // Acabou o descanso
            playBeep();
            const proximoEx = currentIndex + 1 < flatSets.length ? flatSets[currentIndex + 1].nome : 'Tudo';
            if ('Notification' in window && Notification.permission === 'granted') {
                try {
                    new Notification('🚨 Chega de descanso!', {
                        body: `Próxima série de ${proximoEx} esperando. Vamos!`,
                        icon: '/favicon.ico', // assumes there's an icon
                        vibrate: [200, 100, 200]
                    });
                } catch (e) {
                    console.error("Notificação nativa falhou", e);
                }
            }
            avancarSerie();
        }
        return () => clearInterval(interval);
    }, [isResting, timeRemaining]);

    const handleConcluirSerieClick = () => {
        const currentSet = flatSets[currentIndex];

        // Se formos o último do bloco e tiver descanso > 0
        if (currentSet.isLastInGroup && currentSet.restSeconds > 0) {
            setTimeRemaining(currentSet.restSeconds);
            setIsResting(true);
        } else {
            // Pula direto pra proxima
            avancarSerie();
        }
    };

    const avancarSerie = () => {
        const logData = {
            nome: flatSets[currentIndex].nome,
            cargaReal: String(cargaReal).replace(',', '.').replace(/[^\d.]/g, ''),
            repsPrevista: flatSets[currentIndex].repsPrevista
        };
        const newLogs = [...sessionLogs, logData];
        setSessionLogs(newLogs);

        setIsResting(false);
        if (currentIndex < flatSets.length - 1) {
            setCurrentIndex(currentIndex + 1);
            setCargaReal(flatSets[currentIndex + 1].cargaPrevista);
        } else {
            onFinish(newLogs); // Terminou tudo
        }
    };

    if (flatSets.length === 0) return null;

    const currentSet = flatSets[currentIndex];

    if (isResting) {
        return (
            <div className="fixed inset-0 z-[200] bg-zinc-900 text-white flex flex-col items-center justify-center max-w-md mx-auto">
                <div className="text-center relative">
                    <Timer className="w-20 h-20 text-orange-500 mx-auto mb-6 opacity-20 animate-pulse" />
                    <div className="absolute inset-0 flex items-center justify-center flex-col">
                        <span className="text-6xl font-black tracking-tighter shadow-sm">{timeRemaining}</span>
                        <span className="text-xs uppercase font-bold tracking-widest text-zinc-400 mt-2">Segundos Restantes</span>
                    </div>
                </div>

                <p className="mt-12 text-zinc-400 text-xs font-bold uppercase tracking-widest text-center px-8">Prepare-se para a próxima série</p>
                <div className="mt-4 p-4 bg-zinc-800 border border-zinc-700 w-4/5 mx-auto rounded-xl flex flex-col items-center gap-2">
                    {currentIndex + 1 < flatSets.length && flatSets[currentIndex + 1].tipoSerie && flatSets[currentIndex + 1].tipoSerie !== 'Padrão' && (
                        <span className="bg-zinc-900 border border-zinc-700 text-[8px] font-black tracking-widest uppercase px-2 py-1 rounded-sm shadow-sm" style={{ color: flatSets[currentIndex + 1].tipoSerie.includes('Warm-up') ? '#22c55e' : flatSets[currentIndex + 1].tipoSerie.includes('Feeder') ? '#eab308' : flatSets[currentIndex + 1].tipoSerie.includes('Top Set') ? '#ef4444' : '#3b82f6' }}>
                            {flatSets[currentIndex + 1].tipoSerie}
                        </span>
                    )}
                    <p className="font-bold text-center">{currentIndex + 1 < flatSets.length ? flatSets[currentIndex + 1].nome : 'Fim do Treino!'}</p>
                </div>

                <div className="mt-16 flex gap-4 w-full px-8">
                    <button onClick={() => setTimeRemaining(timeRemaining + 15)} className="flex-1 border border-zinc-700 py-3 text-xs font-bold uppercase tracking-widest text-zinc-300 hover:bg-zinc-800 transition">+15s</button>
                    <button onClick={avancarSerie} className="flex-1 bg-white text-zinc-900 py-3 text-xs font-bold uppercase tracking-widest hover:bg-zinc-200 transition shadow-[0_0_20px_rgba(255,255,255,0.3)]">Pular</button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[150] bg-zinc-900 flex flex-col max-w-md mx-auto">
            {/* Header Reduzido */}
            <div className="h-14 flex items-center px-4 shrink-0 border-b border-zinc-800 relative justify-between">
                <div className="text-xs font-bold uppercase tracking-widest text-zinc-400">
                    {currentIndex + 1} <span className="text-zinc-600">/</span> {flatSets.length} Series
                </div>
                <button onClick={onClose} className="p-2 text-zinc-400 hover:text-white transition-colors bg-zinc-800/50 rounded-full"><X className="w-4 h-4" /></button>
            </div>

            {/* Video / Visual */}
            <div className="w-full shrink-0 bg-black relative shadow-2xl" style={{ height: '35vh' }}>
                {currentSet.video ? (
                    <video src={currentSet.video} autoPlay loop muted playsInline className="w-full h-full object-cover opacity-80" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center bg-zinc-800"><Dumbbell className="w-16 h-16 text-zinc-700" /></div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-zinc-900/40 to-transparent pointer-events-none" />

                <div className="absolute bottom-0 left-0 right-0 p-5">
                    <div className="flex gap-2 items-center mb-2">
                        {currentSet.isCircuito && (
                            <span className="bg-orange-500 text-white text-[8px] font-black tracking-widest uppercase px-2 py-1 rounded-sm shadow-sm flex items-center gap-1"><span style={{ fontSize: '10px' }}>🔗</span> Bi-Set</span>
                        )}
                        {currentSet.tipoSerie && currentSet.tipoSerie !== 'Padrão' && (
                            <span className="bg-zinc-800 border border-zinc-700 text-white text-[8px] font-black tracking-widest uppercase px-2 py-1 rounded-sm shadow-sm flex items-center gap-1" style={{ color: currentSet.tipoSerie.includes('Warm-up') ? '#22c55e' : currentSet.tipoSerie.includes('Feeder') ? '#eab308' : currentSet.tipoSerie.includes('Top Set') ? '#ef4444' : '#3b82f6' }}>{currentSet.tipoSerie}</span>
                        )}
                    </div>
                    <h2 className="text-2xl font-black text-white uppercase tracking-tighter leading-none shadow-sm">{currentSet.nome}</h2>
                    <p className="text-zinc-300 font-bold text-xs uppercase tracking-widest mt-2 bg-black/50 w-fit px-2 py-1 backdrop-blur-md border border-zinc-700/50">Série {currentSet.setAtual} de {currentSet.totalSets}</p>
                </div>
            </div>

            {/* Infos e Inputs */}
            <div className="flex-1 overflow-y-auto bg-zinc-900 px-5 pt-6 pb-24">

                {/* Metodos e Cadencia */}
                {(currentSet.metodo || currentSet.rir !== '-' || currentSet.detalheMetodo || currentSet.cadencia) && (
                    <div className="mb-6 bg-zinc-800/80 border border-zinc-700 p-3 rounded-lg flex flex-col gap-2">
                        {currentSet.metodo && currentSet.metodo !== 'Padrão' && (
                            <div className="flex items-center gap-2">
                                <Zap className="w-4 h-4 text-orange-500 fill-orange-500" />
                                <span className="text-white text-xs font-bold uppercase tracking-widest">Técnica: {currentSet.metodo}</span>
                            </div>
                        )}
                        {currentSet.detalheMetodo && currentSet.detalheMetodo !== '-' && currentSet.detalheMetodo !== 'Varia' && (
                            <div className="text-orange-400 text-[10px] font-bold uppercase tracking-widest pl-6">↳ {currentSet.detalheMetodo}</div>
                        )}
                        {currentSet.rir !== '-' && currentSet.rir !== 'Varia' && (
                            <div className="flex items-center justify-between pt-2 border-t border-zinc-700 mt-1">
                                <span className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest">Alvo RIR:</span>
                                <span className="text-white font-bold">{currentSet.rir}</span>
                            </div>
                        )}
                        {currentSet.cadencia && currentSet.cadencia !== '-' && currentSet.cadencia !== 'Varia' && (
                            <div className="flex items-center justify-between pt-2 border-t border-zinc-700 mt-1">
                                <span className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest flex items-center gap-1"><Timer className="w-3 h-3" /> Cadência (TUT):</span>
                                <span className="text-white font-black tracking-widest">{currentSet.cadencia}</span>
                            </div>
                        )}
                    </div>
                )}

                {/* Grid Metricas */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="bg-zinc-800 p-4 border border-zinc-700 flex flex-col items-center justify-center rounded-xl shadow-inner">
                        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-1">Repetições</span>
                        <span className="text-2xl font-black text-white">{currentSet.repsPrevista}</span>
                    </div>
                    <div className="bg-zinc-800 p-4 border border-zinc-700 flex flex-col justify-center rounded-xl shadow-inner relative overflow-hidden">
                        <span className="text-[10px] items-center text-center font-bold uppercase tracking-widest text-zinc-500 mb-1 z-10 w-full">Carga Usada</span>
                        <div className="flex z-10 items-center justify-center gap-1 w-full relative">
                            <input
                                type="text"
                                value={cargaReal}
                                onChange={(e) => setCargaReal(e.target.value)}
                                className="bg-transparent text-2xl font-black text-white outline-none w-20 text-center relative z-10 border-b-2 border-transparent focus:border-zinc-500 transition-colors"
                            />
                        </div>
                        {/* Fundo highlight leve */}
                        <div className="absolute inset-0 bg-white/5 opacity-0 focus-within:opacity-100 transition-opacity" />
                    </div>
                </div>

                {/* Upload Form Check */}
                <button onClick={() => setMostrarVideoForm(!mostrarVideoForm)} className="w-full flex items-center justify-center gap-2 py-3 border border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors text-[10px] font-bold uppercase tracking-widest rounded-lg">
                    <Video className="w-4 h-4" /> Enviar Form-Check ao Professor
                </button>
                {mostrarVideoForm && (
                    <div className="mt-3 p-4 bg-zinc-800 border border-zinc-700 rounded-lg animate-in fade-in slide-in-from-top-2">
                        <p className="text-[10px] text-zinc-400 uppercase tracking-widest mb-3 leading-relaxed">Grave um vídeo de 15s realizando a série. Seu treinador poderá corrigir sua postura e técnica (Upload simulado localmente).</p>
                        <label className="w-full flex items-center justify-center gap-2 bg-zinc-700 text-white py-3 uppercase text-xs font-bold tracking-widest cursor-pointer rounded-md hover:bg-zinc-600 transition-colors">
                            <input type="file" accept="video/*" capture="environment" className="hidden" onChange={(e) => {
                                if (e.target.files.length > 0) alert("Vídeo anexado com sucesso para envio posterior!");
                                setMostrarVideoForm(false);
                            }} />
                            Gravar Vídeo Agora
                        </label>
                    </div>
                )}
            </div>

            {/* Botão Flutuante Gigante de Concluir */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-zinc-900 via-zinc-900 to-transparent flex mx-auto max-w-md pointer-events-none pb-8">
                <button
                    onClick={handleConcluirSerieClick}
                    className="w-full bg-white text-zinc-900 h-16 rounded-xl flex items-center justify-center gap-3 hover:bg-zinc-200 transition-all shadow-[0_10px_40px_rgba(255,255,255,0.2)] active:scale-95 pointer-events-auto group mt-auto"
                >
                    <span className="font-black uppercase tracking-widest text-sm">Concluir Série</span>
                    <div className="bg-zinc-900 text-white rounded-full p-1.5 group-hover:translate-x-1 transition-transform">
                        <ChevronRight className="w-5 h-5" />
                    </div>
                </button>
            </div>
        </div>
    );
}
