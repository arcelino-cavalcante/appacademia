import React, { useState, useEffect } from 'react';
import { auth, db } from './lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import { collection, doc, setDoc, deleteDoc, getDocs, getDoc, query, where } from 'firebase/firestore';
import {
    Users,
    Settings,
    Plus,
    ChevronRight,
    ArrowLeft,
    Dumbbell,
    Calendar,
    ClipboardList,
    BookOpen,
    Search,
    X,
    Weight,
    Timer,
    Repeat,
    Check,
    Trash2,
    Zap,
    LogOut,
    UserCircle,
    Activity,
    BarChart2,
    Lock,
    TrendingUp,
    MessageCircle,
    AlertCircle,
    BrainCircuit,
    Wand2,
    Loader2,
    Play
} from 'lucide-react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import OpenAI from "openai";
import { ListItem } from './components/ui/ListItem';
import { ExercicioItem } from './components/ui/ExercicioItem';
import WorkoutPlayer from './components/ui/WorkoutPlayer';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const AvatarMasculino = ({ className }) => (
    <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path d="M18 18c4.418 0 8-3.582 8-8s-3.582-8-8-8-8 3.582-8 8 3.582 8 8 8z" fill="currentColor" />
        <path d="M18 21.6c-5.99 0-18 3.011-18 9.027V36h36v-5.373c0-6.016-12.01-9.027-18-9.027z" fill="currentColor" opacity="0.8" />
    </svg>
);

const AvatarFeminino = ({ className }) => (
    <svg viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <path d="M18 18c4.418 0 8-3.582 8-8s-3.582-8-8-8-8 3.582-8 8 3.582 8 8 8z" fill="currentColor" />
        <path d="M18 21.6c-5.99 0-18 3.011-18 9.027V36h36v-5.373c0-6.016-12.01-9.027-18-9.027z" fill="currentColor" opacity="0.8" />
        <path d="M26 10c0 4.418-3.582 10-8 10s-8-5.582-8-10v5c0 4.418 3.582 8 8 8s8-3.582 8-8v-5z" fill="currentColor" opacity="0.9" />
    </svg>
);

const AppLogo = ({ className }) => (
    <svg viewBox="0 0 512 512" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <rect width="512" height="512" rx="112" fill="#18181b" />
        <g transform="translate(0, 10)">
            <polygon points="256,120 130,400 195,400 256,260" fill="#ffffff" />
            <polygon points="256,120 382,400 317,400 256,260" fill="#a1a1aa" />
            <path d="M140 280 L350 230 L370 270 L160 320 Z" fill="#f97316" />
        </g>
    </svg>
);

export default function App() {
    // --- Estados de Controle do Aplicativo (Login/Modos) ---
    const [appMode, setAppMode] = useState('login'); // 'login', 'trainer', 'student'
    const [loginStep, setLoginStep] = useState('choice'); // 'choice', 'student_select'
    const [studentLoginEmail, setStudentLoginEmail] = useState('');
    const [studentLoginPassword, setStudentLoginPassword] = useState('');
    const [loggedStudent, setLoggedStudent] = useState(null);

    // --- Estados de Navegação do TREINADOR ---
    const [currentView, setCurrentView] = useState('dashboard'); // painel inicial
    const [selectedAluno, setSelectedAluno] = useState(null);
    const [trainerAlunoTab, setTrainerAlunoTab] = useState('rotinas'); // 'rotinas', 'feedbacks'
    const [selectedRotina, setSelectedRotina] = useState(null);
    const [selectedTreino, setSelectedTreino] = useState(null);
    const [selectedBibTreino, setSelectedBibTreino] = useState(null);

    // --- Estados de Navegação do ALUNO ---
    const [studentView, setStudentView] = useState('rotinas'); // rotinas, treinos, exercicios, ajustes, evolucao
    const [studentSelectedRotina, setStudentSelectedRotina] = useState(null);
    const [studentSelectedTreino, setStudentSelectedTreino] = useState(null);
    const [isWorkoutPlayerOpen, setIsWorkoutPlayerOpen] = useState(false);
    const [currentWorkoutLogs, setCurrentWorkoutLogs] = useState([]);
    const [notificationPermission, setNotificationPermission] = useState('Notification' in window ? Notification.permission : 'denied');

    const requestNotificationPermission = async () => {
        if (!('Notification' in window)) {
            alert("Seu navegador não suporta notificações nativas.");
            return;
        }
        const permission = await Notification.requestPermission();
        setNotificationPermission(permission);
    };

    // --- Estados dos Modais de Criação ---
    const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
    const [studentSearchTerm, setStudentSearchTerm] = useState('');
    const [newStudentData, setNewStudentData] = useState({ nome: '', email: '', whatsapp: '', senha: '', tags: [], genero: 'masculino' });
    const [newTagInput, setNewTagInput] = useState('');

    const [isAddRoutineModalOpen, setIsAddRoutineModalOpen] = useState(false);
    const [newRoutineData, setNewRoutineData] = useState({ nome: '', tipo: 'semanal', restrito: false });

    const [isWorkoutSelectionOpen, setIsWorkoutSelectionOpen] = useState(false);
    const [novoNomeTreino, setNovoNomeTreino] = useState('');

    const [isExerciseSelectionOpen, setIsExerciseSelectionOpen] = useState(false);
    const [isExerciseConfigOpen, setIsExerciseConfigOpen] = useState(false);
    const [selectedApiExercise, setSelectedApiExercise] = useState(null);
    const [selectedCategory, setSelectedCategory] = useState('Todas');

    const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState(false);
    const [rpeValue, setRpeValue] = useState(5);

    // --- AI Generator States ---
    const [isIAGeneratorOpen, setIsIAGeneratorOpen] = useState(false);
    const [iaPrompt, setIaPrompt] = useState('');
    const [isGeneratingIA, setIsGeneratingIA] = useState(false);
    const [iaGeneratedTreino, setIaGeneratedTreino] = useState(null);

    // --- Estado da API de Exercícios ---
    const [apiExercicios, setApiExercicios] = useState([]);
    const [categoriasApi, setCategoriasApi] = useState(['Todas']);
    const [searchTerm, setSearchTerm] = useState('');

    // --- DADOS DO BANCO (Firebase) ---
    const [alunos, setAlunos] = useState([]);
    const [rotinas, setRotinas] = useState([]);
    const [treinos, setTreinos] = useState([]);
    const [exercicios, setExercicios] = useState([]);
    const [bibliotecaTreinos, setBibliotecaTreinos] = useState([]);
    const [bibliotecaExercicios, setBibliotecaExercicios] = useState([]);
    const [feedbacks, setFeedbacks] = useState([]);

    const [firebaseUser, setFirebaseUser] = useState(null);
    const [trainerEmail, setTrainerEmail] = useState('');
    const [isRegistering, setIsRegistering] = useState(false);
    const [trainerPassword, setTrainerPassword] = useState('');
    const [trainerApiKey, setTrainerApiKey] = useState('');
    const [isFetchingData, setIsFetchingData] = useState(false);

    // --- Estados de Inputs Genéricos (Formulários) ---
    const [novoNome, setNovoNome] = useState('');
    const [novoDiaTreino, setNovoDiaTreino] = useState('Segunda-feira');
    const diasDaSemana = ['Domingo', 'Segunda-feira', 'Terça-feira', 'Quarta-feira', 'Quinta-feira', 'Sexta-feira', 'Sábado'];

    // --- Estados de Configuração de Exercício (Modais) ---
    const [novasSeries, setNovasSeries] = useState('');
    const [novasReps, setNovasReps] = useState('');
    const [novaCarga, setNovaCarga] = useState('');
    const [novoDescanso, setNovoDescanso] = useState('');
    const [novoMetodo, setNovoMetodo] = useState('Padrão');
    const [isAdvancedMode, setIsAdvancedMode] = useState(false);
    const [advancedSets, setAdvancedSets] = useState([
        { id: 1, reps: '', carga: '', descanso: '', cadencia: '', metodo: '', tipoSerie: 'Padrão', notaBiomecanica: '' }
    ]);
    const metodosTreino = ['Padrão', 'Drop Set', 'Rest-Pause', '🔥 Cluster Sets', 'Pico de Contração', 'Isometria', 'Bi-set', '🔥 FST-7', '🔥 SST (Sarcoplasma Stimulating)', '🔥 GVT (10x10)', 'Pirâmide', 'Até a Falha'];
    const tiposDeSerie = ['Padrão', '🟢 Warm-up', '🟡 Feeder', '🔴 Top Set', '🔵 Back-off'];

    // --- Estados de Edição CRUD ---
    const [editingStudentId, setEditingStudentId] = useState(null);
    const [editingRoutineId, setEditingRoutineId] = useState(null);
    const [editingExercicioId, setEditingExercicioId] = useState(null);

    // --- Efeitos ---
    useEffect(() => {
        const loadAllData = async () => {
            if (appMode === 'login') return; // Otmização 1: Não carrega o mundo inteiro no Login
            setIsFetchingData(true);
            try {
                if (appMode === 'trainer') {
                    // Carga Completa para o Treinador (Com caching ou leitura bruta para masterização)
                    const fetchD = async (cName) => {
                        const snap = await getDocs(collection(db, cName));
                        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
                    };
                    setAlunos(await fetchD('alunos'));
                    setRotinas(await fetchD('rotinas'));
                    setTreinos(await fetchD('treinos'));
                    setExercicios(await fetchD('exercicios'));
                    setBibliotecaTreinos(await fetchD('bibliotecaTreinos'));
                    setBibliotecaExercicios(await fetchD('bibliotecaExercicios'));
                    setFeedbacks(await fetchD('feedbacks'));

                    if (firebaseUser) {
                        const trDoc = await getDoc(doc(db, 'trainers', firebaseUser.uid));
                        if (trDoc.exists() && trDoc.data().openai_api_key) {
                            setTrainerApiKey(trDoc.data().openai_api_key);
                        }
                    }
                } else if (appMode === 'student' && loggedStudent) {
                    // Otimização Absoluta 2: Filtros Indexados (Isola leituras economizando 90% da cota Spark)
                    const fetchQ = async (cName, qFilter) => {
                        const snap = await getDocs(query(collection(db, cName), qFilter));
                        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
                    };

                    const studentRots = await fetchQ('rotinas', where('alunoId', '==', loggedStudent.id));
                    setRotinas(studentRots);

                    const rotinaIds = studentRots.map(r => r.id);
                    let studentTreinos = [];
                    if (rotinaIds.length > 0) {
                        studentTreinos = await fetchQ('treinos', where('rotinaId', 'in', rotinaIds));
                    }
                    setTreinos(studentTreinos);

                    const treinoIds = studentTreinos.map(t => t.id);
                    let studentExs = [];
                    if (treinoIds.length > 0) {
                        const chunks = [];
                        for (let i = 0; i < treinoIds.length; i += 30) {
                            const chunk = treinoIds.slice(i, i + 30);
                            const res = await fetchQ('exercicios', where('treinoId', 'in', chunk));
                            chunks.push(...res);
                        }
                        studentExs = chunks;
                    }
                    setExercicios(studentExs);

                    const studentFeeds = await fetchQ('feedbacks', where('alunoId', '==', loggedStudent.id));
                    setFeedbacks(studentFeeds);
                }
            } catch (e) {
                console.error("Erro ao carregar do Firebase", e);
            }
            setIsFetchingData(false);
        };
        loadAllData();
    }, [appMode, loginStep, firebaseUser, loggedStudent]);


    useEffect(() => {
        const API_URL = "https://raw.githubusercontent.com/arcelino-cavalcante/api-exercicios-gym/main/database.json";
        fetch(API_URL)
            .then(res => res.json())
            .then(data => {
                setApiExercicios(data);
                const getCategory = (ex) => ex.musculo || ex.bodyPart || ex.target || ex.muscle || ex.grupo_muscular || ex.categoria || 'Geral';
                const categoriasUnicas = [...new Set(data.map(getCategory))].filter(Boolean).sort();
                setCategoriasApi(['Todas', ...categoriasUnicas]);
            })
            .catch(err => console.error("Erro ao carregar exercícios:", err));
    }, []);

    // --- Funções Comuns ---
    const handleLogout = async () => {
        try {
            await signOut(auth);
            setFirebaseUser(null);
        } catch (e) { console.error("Erro logout", e); }
        setAppMode('login');
        setLoginStep('choice');
        setLoggedStudent(null);
        setCurrentView('dashboard');
        setStudentView('rotinas');
        setTrainerAlunoTab('rotinas');
    };

    const getCategory = (ex) => ex.musculo || ex.bodyPart || ex.target || ex.muscle || ex.grupo_muscular || ex.categoria || 'Geral';


    // ============================================================================
    // RENDER: TELA DE LOGIN
    // ============================================================================
    if (appMode === 'login') {
        return (
            <div className="min-h-screen bg-zinc-900 flex flex-col items-center justify-center font-sans text-white p-6 max-w-md mx-auto selection:bg-white selection:text-zinc-900 relative shadow-2xl">
                <div className="flex flex-col items-center mb-16">
                    <AppLogo className="w-24 h-24 mb-6 drop-shadow-2xl hover:scale-105 transition-transform" />
                    <h1 className="text-2xl font-bold uppercase tracking-widest text-center">App Personal</h1>
                    <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mt-2">Plataforma de Treinos</p>
                </div>

                <div className="w-full flex flex-col gap-4">
                    {loginStep === 'trainer_auth' ? (
                        <div className="flex flex-col gap-4 bg-zinc-800 p-6 border border-zinc-700">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">{isRegistering ? 'Cadastrar Treinador' : 'Login Treinador'}</label>
                            <input type="email" placeholder="E-mail" value={trainerEmail} onChange={e => setTrainerEmail(e.target.value)} className="w-full bg-zinc-900 border border-zinc-600 px-4 py-3 text-sm outline-none text-white focus:border-white transition-colors" />
                            <input type="password" placeholder="Senha" value={trainerPassword} onChange={e => setTrainerPassword(e.target.value)} className="w-full bg-zinc-900 border border-zinc-600 px-4 py-3 text-sm outline-none text-white focus:border-white transition-colors" />

                            <div className="flex gap-2 mb-2">
                                <span className="text-xs text-zinc-400 cursor-pointer hover:text-white" onClick={() => setIsRegistering(!isRegistering)}>
                                    {isRegistering ? 'Já tenho conta. Fazer Login' : 'Não tenho conta. Cadastrar'}
                                </span>
                            </div>

                            <div className="flex gap-2 mt-2">
                                <button onClick={() => setLoginStep('choice')} className="w-1/3 border border-zinc-600 text-white py-3 uppercase font-bold tracking-widest text-xs hover:bg-zinc-700 transition-colors">Voltar</button>
                                <button onClick={async () => {
                                    try {
                                        let cred;
                                        if (isRegistering) {
                                            cred = await createUserWithEmailAndPassword(auth, trainerEmail, trainerPassword);
                                            alert("Conta criada com sucesso! Entrando...");
                                        } else {
                                            cred = await signInWithEmailAndPassword(auth, trainerEmail, trainerPassword);
                                        }
                                        setFirebaseUser(cred.user);
                                        setAppMode('trainer');
                                    } catch (e) {
                                        alert(isRegistering ? "Erro ao criar: " + e.message : "Credenciais inválidas: " + e.message);
                                    }
                                }} className="flex-1 bg-white text-zinc-900 py-3 uppercase font-bold tracking-widest text-xs hover:bg-zinc-200 transition-colors">{isRegistering ? 'Criar' : 'Entrar'}</button>
                            </div>
                        </div>
                    ) : loginStep === 'choice' ? (
                        <>
                            <button onClick={() => setLoginStep('trainer_auth')} className="w-full bg-white text-zinc-900 py-4 uppercase font-bold tracking-widest text-sm hover:bg-zinc-200 transition-colors flex justify-center items-center gap-2">
                                <Settings className="w-5 h-5" /> Entrar como Treinador
                            </button>
                            <button onClick={() => setLoginStep('student_select')} className="w-full border border-zinc-700 text-white py-4 uppercase font-bold tracking-widest text-sm hover:bg-zinc-800 transition-colors flex justify-center items-center gap-2">
                                <UserCircle className="w-5 h-5" /> Entrar como Aluno
                            </button>
                        </>
                    ) : (
                        <div className="flex flex-col gap-4 bg-zinc-800 p-6 border border-zinc-700">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Login Aluno</label>

                            <input
                                type="email"
                                placeholder="E-mail do Aluno"
                                value={studentLoginEmail}
                                onChange={(e) => setStudentLoginEmail(e.target.value)}
                                className="w-full bg-zinc-900 border border-zinc-600 px-4 py-3 text-sm outline-none text-white focus:border-white transition-colors"
                            />

                            <input
                                type="password"
                                placeholder="Senha"
                                value={studentLoginPassword}
                                onChange={(e) => setStudentLoginPassword(e.target.value)}
                                className="w-full bg-zinc-900 border border-zinc-600 px-4 py-3 text-sm outline-none text-white focus:border-white transition-colors"
                            />

                            <div className="flex gap-2 mt-2">
                                <button onClick={() => setLoginStep('choice')} className="w-1/3 border border-zinc-600 text-white py-3 uppercase font-bold tracking-widest text-xs hover:bg-zinc-700 transition-colors">Voltar</button>
                                <button
                                    onClick={async () => {
                                        if (!studentLoginEmail || !studentLoginPassword) {
                                            alert('Preencha e-mail e senha.');
                                            return;
                                        }
                                        setIsFetchingData(true);
                                        try {
                                            const qExact = query(collection(db, 'alunos'), where('email', '==', studentLoginEmail));
                                            const snap = await getDocs(qExact);
                                            let matchedDoc = snap.docs.find(d => d.data().senha === studentLoginPassword);

                                            if (!matchedDoc) {
                                                const allAlunosSnap = await getDocs(collection(db, 'alunos'));
                                                matchedDoc = allAlunosSnap.docs.find(d => d.data().email?.toLowerCase() === studentLoginEmail.toLowerCase() && d.data().senha === studentLoginPassword);
                                            }

                                            if (matchedDoc) {
                                                setLoggedStudent({ id: matchedDoc.id, ...matchedDoc.data() });
                                                setAppMode('student');
                                            } else {
                                                alert('E-mail ou senha incorretos.');
                                            }
                                        } catch (e) {
                                            alert("Erro na conexão: " + e.message);
                                        }
                                        setIsFetchingData(false);
                                    }}
                                    className="flex-1 bg-white text-zinc-900 py-3 uppercase font-bold tracking-widest text-xs hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >Acessar Treinos</button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // ============================================================================
    // RENDER: MODO ALUNO
    // ============================================================================
    if (appMode === 'student') {
        const handleStudentBackNav = () => {
            if (studentView === 'exercicios') setStudentView('treinos');
            else if (studentView === 'treinos') setStudentView('rotinas');
        };

        const getStudentHeaderTitle = () => {
            if (studentView === 'rotinas') return 'Minhas Fichas';
            if (studentView === 'treinos') return studentSelectedRotina?.nome || 'Treinos';
            if (studentView === 'exercicios') return studentSelectedTreino?.nome || 'Exercícios';
            if (studentView === 'ajustes') return 'Meu Perfil';
            return 'Área do Aluno';
        };

        const handleConcluirTreino = () => {
            let totalVolumeLoad = 0;
            let max1RM = 0;

            if (currentWorkoutLogs && currentWorkoutLogs.length > 0) {
                currentWorkoutLogs.forEach(log => {
                    const carga = parseFloat(log.cargaReal) || 0;
                    const repsMatch = (log.repsPrevista || '').toString().match(/(\d+)/);
                    const reps = repsMatch ? parseInt(repsMatch[1]) : 1;

                    if (carga > 0 && reps > 0) {
                        totalVolumeLoad += (carga * reps);
                        // Brzycki formula: 1RM = Weight / (1.0278 - (0.0278 x Reps))
                        let oneRM = carga / (1.0278 - (0.0278 * reps));
                        if (oneRM <= carga) oneRM = carga * 1.05; // fallback
                        if (oneRM > max1RM) max1RM = oneRM;
                    }
                });
            }

            const newFeedback = {
                id: Date.now(),
                alunoId: loggedStudent.id,
                treinoId: studentSelectedTreino.id,
                treinoNome: studentSelectedTreino.nome,
                data: new Date().toLocaleDateString('pt-BR'),
                rpe: rpeValue,
                volumeLoad: totalVolumeLoad,
                max1RM: Math.round(max1RM)
            };
            setFeedbacks([...feedbacks, newFeedback]);
            setDoc(doc(db, 'feedbacks', newFeedback.id.toString()), newFeedback);
            setIsFeedbackModalOpen(false);
            setRpeValue(5);
            setCurrentWorkoutLogs([]);
            setStudentView('evolucao'); // Direciona para evolution graph
        };

        return (
            <div className="min-h-screen bg-zinc-100 font-sans text-zinc-900 selection:bg-zinc-900 selection:text-white pb-[calc(7rem+env(safe-area-inset-bottom))] pt-[calc(4rem+env(safe-area-inset-top))] max-w-md mx-auto relative shadow-2xl">
                <header className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-md h-[calc(4rem+env(safe-area-inset-top))] pt-[env(safe-area-inset-top)] bg-zinc-900 z-40 flex items-center justify-between px-4 shadow-md">
                    <div className="w-10 flex items-center justify-start">
                        {['treinos', 'exercicios'].includes(studentView) && (
                            <button onClick={handleStudentBackNav} className="p-2 -ml-2 text-white hover:bg-zinc-800 transition-colors"><ArrowLeft className="w-6 h-6" /></button>
                        )}
                    </div>
                    <h1 className="text-sm font-bold uppercase tracking-widest text-white truncate flex-1 text-center">{getStudentHeaderTitle()}</h1>
                    <div className="w-10 flex items-center justify-end"><UserCircle className="w-6 h-6 text-zinc-400" /></div>
                </header>

                <main className="w-full flex flex-col min-h-[calc(100vh-8rem)]">
                    {studentView === 'rotinas' && (
                        <>
                            <div className="p-5 bg-white border-b border-zinc-200">
                                <h2 className="text-lg font-bold text-zinc-900 uppercase tracking-wide">Olá, {loggedStudent?.nome}</h2>
                                <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest mt-1">Aqui estão seus programas de treino</p>
                            </div>
                            {rotinas.filter(r => r.alunoId === loggedStudent?.id).map(rotina => (
                                <ListItem key={rotina.id} title={rotina.nome} subtitle={rotina.tipo === 'semanal' ? "Rotina Semanal" : "Rotina Livre"} icon={Calendar} onClick={() => { setStudentSelectedRotina(rotina); setStudentView('treinos'); }} />
                            ))}
                            {rotinas.filter(r => r.alunoId === loggedStudent?.id).length === 0 && (
                                <div className="p-10 text-center text-xs text-zinc-400 font-bold uppercase tracking-widest">Nenhuma rotina atribuída a você.</div>
                            )}
                        </>
                    )}

                    {studentView === 'treinos' && treinos.filter(t => t.rotinaId === studentSelectedRotina?.id).map(treino => {
                        const hoje = diasDaSemana[new Date().getDay()];
                        const isRestricted = studentSelectedRotina?.tipo === 'semanal' && studentSelectedRotina?.restrito;
                        const isToday = treino.diaSemana === hoje;
                        const isLocked = isRestricted && !isToday;

                        return (
                            <ListItem
                                key={treino.id} title={treino.nome} subtitle={isLocked ? "Bloqueado Hoje" : "Ver Exercícios"}
                                topText={treino.diaSemana} icon={isLocked ? Lock : ClipboardList} locked={isLocked}
                                onClick={() => { setStudentSelectedTreino(treino); setStudentView('exercicios'); }}
                            />
                        );
                    })}

                    {studentView === 'exercicios' && (
                        <>
                            <div className="flex-1 overflow-y-auto">
                                <div className="p-4 bg-zinc-900 border-b border-zinc-800 flex justify-between items-center shadow-lg sticky top-0 z-30">
                                    <div className="flex flex-col flex-1 truncate pr-2">
                                        <h2 className="text-white font-black text-sm uppercase tracking-widest truncate">{studentSelectedTreino?.nome}</h2>
                                        <span className="text-zinc-400 text-[10px] font-bold uppercase tracking-widest mt-0.5">Visão Tradicional</span>
                                    </div>
                                    <button onClick={() => setIsWorkoutPlayerOpen(true)} className="bg-orange-500 hover:bg-orange-600 active:scale-95 transition-all w-12 h-12 shrink-0 rounded-full flex items-center justify-center shadow-[0_0_15px_rgba(249,115,22,0.4)] relative">
                                        <Play className="w-5 h-5 text-white ml-0.5 fill-white" />
                                        <div className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-black tracking-widest px-1.5 py-0.5 rounded-sm border border-black shadow">FOCO</div>
                                    </button>
                                </div>
                                {exercicios.filter(e => e.treinoId === studentSelectedTreino?.id).sort((a, b) => (a.ordem || 0) - (b.ordem || 0)).map(exercicio => (
                                    <ExercicioItem key={exercicio.id} {...exercicio} />
                                ))}
                            </div>
                            <div className="p-4 mt-auto border-t border-zinc-200 bg-white">
                                <button
                                    onClick={() => setIsFeedbackModalOpen(true)}
                                    className="w-full bg-zinc-900 text-white py-4 flex items-center justify-center gap-2 hover:bg-zinc-800 transition-colors uppercase font-bold text-xs tracking-widest shadow-md"
                                >
                                    <Check className="w-5 h-5" /> Concluir Treino
                                </button>
                            </div>
                        </>
                    )}

                    {studentView === 'ajustes' && (
                        <div className="p-5">
                            <div className="bg-white border border-zinc-200 p-5 flex flex-col items-center justify-center gap-3">
                                <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center border border-zinc-200">
                                    {loggedStudent?.genero === 'feminino' ? <AvatarFeminino className="w-8 h-8 text-zinc-400" /> : <AvatarMasculino className="w-8 h-8 text-zinc-400" />}
                                </div>
                                <h3 className="font-bold text-zinc-900 uppercase tracking-wide text-sm">{loggedStudent?.nome}</h3>
                                <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-400 bg-zinc-100 px-3 py-1">Conta de Aluno</span>
                            </div>
                            <button onClick={handleLogout} className="w-full bg-zinc-900 text-white py-4 mt-4 flex items-center justify-center gap-2 hover:bg-zinc-800 transition-colors uppercase font-bold text-xs tracking-widest shadow-md">
                                <LogOut className="w-5 h-5" /> Sair da Conta
                            </button>
                            {'Notification' in window && notificationPermission !== 'granted' && (
                                <button onClick={requestNotificationPermission} className="w-full bg-orange-50 border-2 border-orange-500 text-orange-600 py-4 mt-4 flex items-center justify-center gap-2 hover:bg-orange-100 transition-colors uppercase font-bold text-xs tracking-widest shadow-md">
                                    <AlertCircle className="w-5 h-5" /> Ativar Alertas de Treino
                                </button>
                            )}
                        </div>
                    )}

                    {studentView === 'evolucao' && (
                        <div className="p-5 overflow-y-auto w-full max-w-full">
                            <div className="text-center mb-6">
                                <TrendingUp className="w-10 h-10 text-orange-500 mx-auto mb-2" />
                                <h2 className="text-xl font-black uppercase tracking-widest text-zinc-900">Dashboard Alpha</h2>
                                <p className="text-xs font-bold uppercase tracking-widest text-zinc-400 mt-1">Evolução do Músculo</p>
                            </div>

                            <div className="bg-white p-4 shadow-sm border border-zinc-200 mb-6">
                                <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-900 mb-1 flex items-center gap-2"><Activity className="w-4 h-4 text-orange-500" /> Volume Load Reativo</h3>
                                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mb-4 leading-tight">Carga Acumulada x Reps levantadas.</p>
                                <div className="h-48 w-full font-bold text-xs uppercase tracking-widest">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={feedbacks.filter(f => f.alunoId === loggedStudent?.id).slice(-10)} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                            <XAxis dataKey="data" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#a1a1aa' }} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#a1a1aa' }} />
                                            <Tooltip contentStyle={{ backgroundColor: '#18181b', color: '#fff', border: 'none', fontSize: '10px', textTransform: 'uppercase', fontWeight: 700 }} />
                                            <Line type="monotone" dataKey="volumeLoad" stroke="#f97316" strokeWidth={3} dot={{ r: 4, fill: '#f97316', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>

                            <div className="bg-white p-4 shadow-sm border border-zinc-200">
                                <h3 className="text-sm font-bold uppercase tracking-widest text-zinc-900 mb-1 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-amber-500" /> Predição de 1RM Max</h3>
                                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mb-4 leading-tight">Sua força máxima teórica (Brzycki).</p>
                                <div className="h-48 w-full font-bold text-xs uppercase tracking-widest">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={feedbacks.filter(f => f.alunoId === loggedStudent?.id).slice(-10)} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                                            <XAxis dataKey="data" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#a1a1aa' }} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#a1a1aa' }} />
                                            <Tooltip contentStyle={{ backgroundColor: '#18181b', color: '#fff', border: 'none', fontSize: '10px', textTransform: 'uppercase', fontWeight: 700 }} />
                                            <Line type="monotone" dataKey="max1RM" stroke="#eab308" strokeWidth={3} dot={{ r: 4, fill: '#eab308', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        </div>
                    )}
                </main>

                <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md h-[calc(5rem+env(safe-area-inset-bottom))] pb-[calc(0.25rem+env(safe-area-inset-bottom))] bg-white border-t border-zinc-200 z-40 flex justify-around items-center shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                    <button onClick={() => setStudentView('rotinas')} className={`flex flex-col items-center justify-center w-full h-full transition-colors relative ${['rotinas', 'treinos', 'exercicios'].includes(studentView) ? 'text-zinc-900' : 'text-zinc-400 hover:text-zinc-900'}`}>
                        {['rotinas', 'treinos', 'exercicios'].includes(studentView) && <div className="absolute top-0 left-0 right-0 h-[3px] bg-zinc-900" />}
                        <Dumbbell className="w-6 h-6 mb-1.5" /><span className="text-xs uppercase font-bold tracking-widest">Treinos</span>
                    </button>
                    <button onClick={() => setStudentView('evolucao')} className={`flex flex-col items-center justify-center w-full h-full transition-colors relative ${studentView === 'evolucao' ? 'text-zinc-900' : 'text-zinc-400 hover:text-zinc-900'}`}>
                        {studentView === 'evolucao' && <div className="absolute top-0 left-0 right-0 h-[3px] bg-zinc-900" />}
                        <TrendingUp className="w-6 h-6 mb-1.5" /><span className="text-xs uppercase font-bold tracking-widest">Evolução</span>
                    </button>
                    <button onClick={() => setStudentView('ajustes')} className={`flex flex-col items-center justify-center w-full h-full transition-colors relative ${studentView === 'ajustes' ? 'text-zinc-900' : 'text-zinc-400 hover:text-zinc-900'}`}>
                        {studentView === 'ajustes' && <div className="absolute top-0 left-0 right-0 h-[3px] bg-zinc-900" />}
                        <UserCircle className="w-6 h-6 mb-1.5" /><span className="text-xs uppercase font-bold tracking-widest">Perfil</span>
                    </button>
                </nav>

                {/* MODAL DO ALUNO: FEEDBACK DE ESFORÇO */}
                {isFeedbackModalOpen && (
                    <div className="fixed inset-0 bg-zinc-900/90 z-[100] flex flex-col justify-end">
                        <div className="bg-white w-full max-w-md mx-auto relative p-6 animate-in slide-in-from-bottom">
                            <button onClick={() => setIsFeedbackModalOpen(false)} className="absolute top-4 right-4 text-zinc-400 hover:text-zinc-900"><X className="w-6 h-6" /></button>

                            <h2 className="text-xl font-bold text-zinc-900 uppercase tracking-wide mt-2 text-center">Bom trabalho!</h2>
                            <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest mt-2 text-center mb-6">Qual foi a dificuldade do treino?</p>

                            <div className="flex flex-col gap-2">
                                <div className="flex justify-between px-1 text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                                    <span>Mui. Leve</span>
                                    <span>Extremo</span>
                                </div>
                                <div className="grid grid-cols-5 gap-2">
                                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                                        <button
                                            key={num}
                                            onClick={() => setRpeValue(num)}
                                            className={`py-3 text-sm font-bold border transition-colors ${rpeValue === num
                                                ? 'bg-zinc-900 text-white border-zinc-900 shadow-md transform -translate-y-1'
                                                : 'bg-zinc-50 text-zinc-500 border-zinc-200 hover:bg-zinc-100'
                                                }`}
                                        >
                                            {num}
                                        </button>
                                    ))}
                                </div>
                                <div className="text-center mt-3 mb-6">
                                    <span className="text-[11px] font-bold uppercase tracking-widest px-3 py-1 bg-zinc-100 text-zinc-600">
                                        Nível Selecionado: {rpeValue}
                                    </span>
                                </div>
                            </div>

                            <button onClick={handleConcluirTreino} className="w-full bg-zinc-900 text-white py-4 flex items-center justify-center gap-2 hover:bg-zinc-800 transition-colors uppercase font-bold text-xs tracking-widest shadow-md">
                                <Check className="w-5 h-5" /> Enviar Feedback
                            </button>
                        </div>
                    </div>
                )}

                {isWorkoutPlayerOpen && (
                    <WorkoutPlayer
                        exercicios={exercicios.filter(e => e.treinoId === studentSelectedTreino?.id).sort((a, b) => (a.ordem || 0) - (b.ordem || 0))}
                        onClose={() => setIsWorkoutPlayerOpen(false)}
                        onFinish={(logs) => {
                            setIsWorkoutPlayerOpen(false);
                            setCurrentWorkoutLogs(logs || []);
                            setIsFeedbackModalOpen(true);
                        }}
                    />
                )}
            </div>
        );
    }

    // ============================================================================
    // RENDER: MODO TREINADOR (App Original)
    // ============================================================================
    const handleTrainerBack = () => {
        setNovoNome('');
        if (currentView === 'exercicios') setCurrentView('treinos');
        else if (currentView === 'treinos') setCurrentView('rotinas');
        else if (currentView === 'rotinas') {
            setCurrentView('alunos');
            setTrainerAlunoTab('rotinas'); // Reset tab when leaving
        }
        else if (currentView === 'biblioteca_exercicios') setCurrentView('biblioteca');
    };

    const getTrainerHeaderTitle = () => {
        switch (currentView) {
            case 'dashboard': return 'Painel Geral';
            case 'alunos': return 'Meus Alunos';
            case 'rotinas': return selectedAluno ? `Aluno: ${selectedAluno.nome}` : 'Rotinas';
            case 'treinos': return selectedRotina ? `Rotina: ${selectedRotina.nome}` : 'Treinos';
            case 'exercicios': return selectedTreino ? `Treino: ${selectedTreino.nome}` : 'Exercícios';
            case 'biblioteca': return 'Biblioteca de Treinos';
            case 'biblioteca_exercicios': return selectedBibTreino ? `Bib: ${selectedBibTreino.nome}` : 'Exercícios Base';
            case 'ajustes': return 'Ajustes do Treinador';
            default: return 'App Personal';
        }
    };

    const handleAddSimples = (e) => {
        e.preventDefault();
        if (!novoNome.trim()) return;
        const newId = Date.now();
        if (currentView === 'biblioteca') {
            const newDoc = { id: newId, nome: novoNome };
            setBibliotecaTreinos([...bibliotecaTreinos, newDoc]);
            setDoc(doc(db, 'bibliotecaTreinos', newId.toString()), newDoc);
        }
        setNovoNome('');
    };

    const handleSaveNewRoutine = (e) => {
        if (e) e.preventDefault();
        if (!newRoutineData.nome.trim()) return;

        if (editingRoutineId) {
            const updated = { ...rotinas.find(r => r.id === editingRoutineId), ...newRoutineData, restrito: newRoutineData.tipo === 'semanal' ? newRoutineData.restrito : false };
            setRotinas(rotinas.map(r => r.id === editingRoutineId ? updated : r));
            setDoc(doc(db, 'rotinas', editingRoutineId.toString()), updated, { merge: true });
        } else {
            const newId = Date.now();
            const newDoc = {
                id: newId,
                alunoId: selectedAluno.id,
                ...newRoutineData,
                restrito: newRoutineData.tipo === 'semanal' ? newRoutineData.restrito : false
            };
            setRotinas([...rotinas, newDoc]);
            setDoc(doc(db, 'rotinas', newId.toString()), newDoc);
        }

        setNewRoutineData({ nome: '', tipo: 'semanal', restrito: false });
        setEditingRoutineId(null);
        setIsAddRoutineModalOpen(false);
    };

    const handleEditRoutine = (rotina) => {
        setEditingRoutineId(rotina.id);
        setNewRoutineData({ nome: rotina.nome || '', tipo: rotina.tipo || 'semanal', restrito: rotina.restrito || false });
        setIsAddRoutineModalOpen(true);
    };

    const handleDeleteRoutine = async (id) => {
        if (window.confirm('Tem certeza que deseja apagar esta rotina e TODOS os treinos dentro dela?')) {
            const rotinaTreinos = treinos.filter(t => t.rotinaId === id);
            const rotinaTreinosIds = rotinaTreinos.map(t => t.id);
            const rotinaExercicios = exercicios.filter(e => rotinaTreinosIds.includes(e.treinoId));

            setRotinas(rotinas.filter(r => r.id !== id));
            setTreinos(treinos.filter(t => t.rotinaId !== id));
            setExercicios(exercicios.filter(e => !rotinaTreinosIds.includes(e.treinoId)));
            if (selectedRotina?.id === id) { setSelectedRotina(null); setCurrentView('rotinas'); }

            await deleteDoc(doc(db, 'rotinas', id.toString()));
            await Promise.all([
                ...rotinaTreinos.map(t => deleteDoc(doc(db, 'treinos', t.id.toString()))),
                ...rotinaExercicios.map(e => deleteDoc(doc(db, 'exercicios', e.id.toString())))
            ]);
        }
    };

    const handleSaveNewStudent = (e) => {
        if (e) e.preventDefault();
        if (!newStudentData.nome.trim()) return;

        if (editingStudentId) {
            const updated = { ...alunos.find(a => a.id === editingStudentId), ...newStudentData };
            setAlunos(alunos.map(a => a.id === editingStudentId ? updated : a));
            setDoc(doc(db, 'alunos', editingStudentId.toString()), updated, { merge: true });
        } else {
            const newId = Date.now();
            const newDoc = { id: newId, ...newStudentData };
            setAlunos([...alunos, newDoc]);
            setDoc(doc(db, 'alunos', newId.toString()), newDoc);
        }

        setNewStudentData({ nome: '', email: '', whatsapp: '', senha: '', tags: [], genero: 'masculino' });
        setNewTagInput('');
        setEditingStudentId(null);
        setIsAddStudentModalOpen(false);
    };

    const handleEditStudent = (aluno) => {
        setEditingStudentId(aluno.id);
        setNewStudentData({ nome: aluno.nome || '', email: aluno.email || '', whatsapp: aluno.whatsapp || '', senha: aluno.senha || '', tags: aluno.tags || [], genero: aluno.genero || 'masculino' });
        setIsAddStudentModalOpen(true);
    };

    const handleDeleteStudent = async (id) => {
        if (window.confirm('Tem certeza que deseja apagar este aluno e TODO o seu histórico (rotinas, treinos e feedbacks)?')) {
            const studentRotinas = rotinas.filter(r => r.alunoId === id);
            const studentRotinasIds = studentRotinas.map(r => r.id);
            const studentTreinos = treinos.filter(t => studentRotinasIds.includes(t.rotinaId));
            const studentTreinosIds = studentTreinos.map(t => t.id);
            const studentExercicios = exercicios.filter(e => studentTreinosIds.includes(e.treinoId));
            const studentFeedbacks = feedbacks.filter(f => f.alunoId === id);

            setAlunos(alunos.filter(a => a.id !== id));
            setRotinas(rotinas.filter(r => r.alunoId !== id));
            setTreinos(treinos.filter(t => !studentRotinasIds.includes(t.rotinaId)));
            setExercicios(exercicios.filter(e => !studentTreinosIds.includes(e.treinoId)));
            setFeedbacks(feedbacks.filter(f => f.alunoId !== id));
            if (selectedAluno?.id === id) { setSelectedAluno(null); setCurrentView('alunos'); }

            await deleteDoc(doc(db, 'alunos', id.toString()));
            await Promise.all([
                ...studentRotinas.map(r => deleteDoc(doc(db, 'rotinas', r.id.toString()))),
                ...studentTreinos.map(t => deleteDoc(doc(db, 'treinos', t.id.toString()))),
                ...studentExercicios.map(e => deleteDoc(doc(db, 'exercicios', e.id.toString()))),
                ...studentFeedbacks.map(f => deleteDoc(doc(db, 'feedbacks', f.id.toString())))
            ]);
        }
    };

    const handleCreateBlankTreino = () => {
        if (!novoNomeTreino.trim()) return;
        const newId = Date.now();
        const newDoc = {
            id: newId,
            rotinaId: selectedRotina.id,
            nome: novoNomeTreino,
            diaSemana: selectedRotina?.tipo === 'semanal' ? novoDiaTreino : null
        };
        setTreinos([...treinos, newDoc]);
        setDoc(doc(db, 'treinos', newId.toString()), newDoc);
        setNovoNomeTreino('');
        setIsWorkoutSelectionOpen(false);
    };

    const handleEditTreino = (treino) => {
        const newName = window.prompt("Editar nome do treino:", treino.nome);
        if (newName && newName.trim()) {
            setTreinos(treinos.map(t => t.id === treino.id ? { ...t, nome: newName.trim() } : t));
            setDoc(doc(db, 'treinos', treino.id.toString()), { nome: newName.trim() }, { merge: true });
        }
    };

    const handleDeleteTreino = async (id) => {
        if (window.confirm('Tem certeza que deseja apagar este treino e os exercícios dele?')) {
            const treinoExercicios = exercicios.filter(e => e.treinoId === id);

            setTreinos(treinos.filter(t => t.id !== id));
            setExercicios(exercicios.filter(e => e.treinoId !== id));

            await deleteDoc(doc(db, 'treinos', id.toString()));
            await Promise.all(treinoExercicios.map(e => deleteDoc(doc(db, 'exercicios', e.id.toString()))));
        }
    };

    const handleDeleteBibTreino = async (id) => {
        if (window.confirm('Tem certeza que deseja apagar este treino da biblioteca e todos os exercícios dele?')) {
            const bibExercicios = bibliotecaExercicios.filter(e => e.treinoId === id);

            setBibliotecaTreinos(bibliotecaTreinos.filter(t => t.id !== id));
            setBibliotecaExercicios(bibliotecaExercicios.filter(e => e.treinoId !== id));
            if (selectedBibTreino?.id === id) { setSelectedBibTreino(null); setCurrentView('biblioteca'); }

            await deleteDoc(doc(db, 'bibliotecaTreinos', id.toString()));
            await Promise.all(bibExercicios.map(e => deleteDoc(doc(db, 'bibliotecaExercicios', e.id.toString()))));
        }
    };

    const handleEditExercicio = (ex) => {
        setEditingExercicioId(ex.id);
        setSelectedApiExercise({ name: ex.nome, video: ex.video });
        setIsAdvancedMode(ex.isAdvanced);
        setAdvancedSets(ex.advancedSets && ex.advancedSets.length > 0 ? ex.advancedSets : [{ id: 1, reps: '', carga: '', descanso: '', cadencia: '', metodo: '', tipoSerie: 'Padrão', notaBiomecanica: '' }]);
        setNovasSeries(ex.series !== 'Varia' ? ex.series : '');
        setNovasReps(ex.reps !== 'Varia' ? ex.reps : '');
        setNovaCarga(ex.carga !== 'Varia' ? ex.carga : '');
        setNovoDescanso(ex.descanso !== 'Varia' ? ex.descanso : '');
        setNovoMetodo(ex.metodo !== 'Varia' ? ex.metodo : 'Padrão');
        setIsExerciseConfigOpen(true);
    };

    const handleDeleteExercicio = async (id, isLib = false) => {
        if (window.confirm('Tem certeza que deseja apagar este exercício?')) {
            if (isLib) {
                setBibliotecaExercicios(bibliotecaExercicios.filter(e => e.id !== id));
                await deleteDoc(doc(db, 'bibliotecaExercicios', id.toString()));
            } else {
                setExercicios(exercicios.filter(e => e.id !== id));
                await deleteDoc(doc(db, 'exercicios', id.toString()));
            }
        }
    };

    const handleImportFromLibrary = (bibTreino) => {
        const newTreinoId = Date.now();
        setTreinos([...treinos, {
            id: newTreinoId,
            rotinaId: selectedRotina.id,
            nome: bibTreino.nome,
            diaSemana: selectedRotina?.tipo === 'semanal' ? novoDiaTreino : null
        }]);

        const exercisesToCopy = bibliotecaExercicios.filter(e => e.treinoId === bibTreino.id);
        if (exercisesToCopy.length > 0) {
            const newExercises = exercisesToCopy.map((ex, idx) => ({
                ...ex,
                id: Date.now() + idx + 100,
                treinoId: newTreinoId
            }));
            setExercicios([...exercicios, ...newExercises]);
        }
        setIsWorkoutSelectionOpen(false);
    };

    const handleSaveExerciseClick = () => {
        if (!selectedApiExercise) return;
        const newId = Date.now();
        const exName = selectedApiExercise.name || selectedApiExercise.nome;
        const exVideo = selectedApiExercise.video || selectedApiExercise.mp4 || selectedApiExercise.url;
        const newEx = {
            id: editingExercicioId || newId,
            treinoId: currentView === 'exercicios' ? selectedTreino.id : selectedBibTreino.id,
            nome: exName, video: exVideo, isAdvanced: isAdvancedMode,
            advancedSets: isAdvancedMode ? [...advancedSets] : [],
            series: isAdvancedMode ? advancedSets.length.toString() : (novasSeries || '-'),
            reps: isAdvancedMode ? 'Varia' : (novasReps || '-'),
            carga: isAdvancedMode ? 'Varia' : (novaCarga || '-'),
            descanso: isAdvancedMode ? 'Varia' : (novoDescanso || '-'),
            metodo: isAdvancedMode ? 'Varia' : (novoMetodo || 'Padrão')
        };

        if (editingExercicioId) {
            if (currentView === 'exercicios') {
                setExercicios(exercicios.map(e => e.id === editingExercicioId ? newEx : e));
                setDoc(doc(db, 'exercicios', editingExercicioId.toString()), newEx, { merge: true });
            } else {
                setBibliotecaExercicios(bibliotecaExercicios.map(e => e.id === editingExercicioId ? newEx : e));
                setDoc(doc(db, 'bibliotecaExercicios', editingExercicioId.toString()), newEx, { merge: true });
            }
        } else {
            if (currentView === 'exercicios') {
                const currentLen = exercicios.filter(e => e.treinoId === selectedTreino.id).length;
                newEx.ordem = currentLen;
                setExercicios([...exercicios, newEx]);
                setDoc(doc(db, 'exercicios', newId.toString()), newEx);
            } else {
                const currentLen = bibliotecaExercicios.filter(e => e.treinoId === selectedBibTreino.id).length;
                newEx.ordem = currentLen;
                setBibliotecaExercicios([...bibliotecaExercicios, newEx]);
                setDoc(doc(db, 'bibliotecaExercicios', newId.toString()), newEx);
            }
        }

        setNovasSeries(''); setNovasReps(''); setNovaCarga(''); setNovoDescanso(''); setNovoMetodo('Padrão');
        setIsAdvancedMode(false); setAdvancedSets([{ id: 1, reps: '', carga: '', descanso: '', cadencia: '', metodo: '', notaBiomecanica: '' }]);
        setSelectedApiExercise(null); setIsExerciseConfigOpen(false);
        setEditingExercicioId(null);
    };

    const handleAddAdvancedSet = () => setAdvancedSets([...advancedSets, { id: Date.now(), reps: '', carga: '', descanso: '', cadencia: '', metodo: '', tipoSerie: 'Padrão', notaBiomecanica: '' }]);
    const handleRemoveAdvancedSet = (id) => { if (advancedSets.length > 1) setAdvancedSets(advancedSets.filter(s => s.id !== id)); };
    const handleUpdateAdvancedSet = (id, field, value) => setAdvancedSets(advancedSets.map(s => s.id === id ? { ...s, [field]: value } : s));

    const handleDragEnd = async (result) => {
        if (!result.destination) return;
        const { source, destination } = result;
        if (source.index === destination.index) return;

        const isLib = currentView === 'biblioteca_exercicios';
        const list = isLib
            ? bibliotecaExercicios.filter(e => e.treinoId === selectedBibTreino?.id).sort((a, b) => (a.ordem || 0) - (b.ordem || 0))
            : exercicios.filter(e => e.treinoId === selectedTreino?.id).sort((a, b) => (a.ordem || 0) - (b.ordem || 0));

        const reorderedList = Array.from(list);
        const [removed] = reorderedList.splice(source.index, 1);
        reorderedList.splice(destination.index, 0, removed);

        // Update ordem values locally
        const newItemsIds = reorderedList.map(item => item.id);

        if (isLib) {
            setBibliotecaExercicios(prev => prev.map(e => {
                if (e.treinoId === selectedBibTreino?.id) {
                    const newIndex = newItemsIds.indexOf(e.id);
                    return { ...e, ordem: newIndex !== -1 ? newIndex : (e.ordem || 0) };
                }
                return e;
            }));
        } else {
            setExercicios(prev => prev.map(e => {
                if (e.treinoId === selectedTreino?.id) {
                    const newIndex = newItemsIds.indexOf(e.id);
                    return { ...e, ordem: newIndex !== -1 ? newIndex : (e.ordem || 0) };
                }
                return e;
            }));
        }

        // Update DB
        await Promise.all(reorderedList.map((item, index) => {
            const collectionName = isLib ? 'bibliotecaExercicios' : 'exercicios';
            return setDoc(doc(db, collectionName, item.id.toString()), { ordem: index }, { merge: true });
        }));
    };

    return (
        <div className="min-h-screen bg-zinc-100 font-sans text-zinc-900 selection:bg-zinc-900 selection:text-white pb-[calc(7rem+env(safe-area-inset-bottom))] pt-[calc(4rem+env(safe-area-inset-top))] max-w-md mx-auto relative shadow-2xl">
            <header className="fixed top-0 left-1/2 -translate-x-1/2 w-full max-w-md h-[calc(4rem+env(safe-area-inset-top))] pt-[env(safe-area-inset-top)] bg-zinc-900 z-40 flex items-center justify-between px-4 shadow-md">
                <div className="w-10 flex items-center justify-start">
                    {(!['dashboard', 'alunos', 'biblioteca', 'ajustes'].includes(currentView)) && (
                        <button onClick={handleTrainerBack} className="p-2 -ml-2 text-white hover:bg-zinc-800 transition-colors">
                            <ArrowLeft className="w-6 h-6" />
                        </button>
                    )}
                </div>
                <h1 className="text-sm font-bold uppercase tracking-widest text-white truncate flex-1 text-center">
                    {getTrainerHeaderTitle()}
                </h1>
                <div className="w-10 flex items-center justify-end">
                    {currentView === 'ajustes' && <Settings className="w-5 h-5 text-zinc-400" />}
                </div>
            </header>

            <main className="w-full flex flex-col min-h-[calc(100vh-8rem)]">

                {currentView === 'dashboard' && (
                    <div className="flex flex-col flex-1 p-5 gap-4">
                        <div className="bg-white border border-zinc-200 p-5 shadow-sm">
                            <h2 className="text-lg font-bold text-zinc-900 uppercase tracking-wide">Olá, Personal</h2>
                            <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest mt-1">Resumo do seu negócio</p>
                        </div>

                        {(() => {
                            if (alunos.length === 0) return null;

                            // Finds first student who hasn't submitted any feedback yet, 
                            // or you can expand this to check days since last feedback.
                            const alunoInativo = alunos.find(a => !feedbacks.some(f => f.alunoId === a.id));

                            if (!alunoInativo) return null;

                            return (
                                <div className="bg-red-50 border border-red-100 p-4 shadow-sm flex items-start gap-3">
                                    <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                                    <div className="flex flex-col">
                                        <span className="text-[10px] uppercase font-bold tracking-widest text-red-500">Aviso de Inatividade</span>
                                        <p className="text-xs text-zinc-900 mt-1">O aluno <span className="font-bold">{alunoInativo.nome}</span> precisa de acompanhamento (sem treinos recentes).</p>
                                    </div>
                                </div>
                            );
                        })()}

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white border border-zinc-200 p-5 shadow-sm flex flex-col items-start gap-1 relative overflow-hidden">
                                <Users className="w-16 h-16 text-zinc-100 absolute -right-2 -bottom-2 z-0" />
                                <span className="text-3xl font-bold text-zinc-900 relative z-10">{alunos.length}</span>
                                <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 relative z-10">Alunos Ativos</span>
                            </div>
                            <div className="bg-white border border-zinc-200 p-5 shadow-sm flex flex-col items-start gap-1 relative overflow-hidden">
                                <TrendingUp className="w-16 h-16 text-zinc-100 absolute -right-2 -bottom-2 z-0" />
                                <span className="text-3xl font-bold text-zinc-900 relative z-10">{feedbacks.length}</span>
                                <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 relative z-10">Treinos Concluídos</span>
                            </div>
                            <div className="bg-white border border-zinc-200 p-5 shadow-sm flex flex-col items-start gap-1 relative overflow-hidden">
                                <ClipboardList className="w-16 h-16 text-zinc-100 absolute -right-2 -bottom-2 z-0" />
                                <span className="text-3xl font-bold text-zinc-900 relative z-10">{treinos.length}</span>
                                <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 relative z-10">Treinos Criados</span>
                            </div>
                            <div className="bg-white border border-zinc-200 p-5 shadow-sm flex flex-col items-start gap-1 relative overflow-hidden">
                                <BookOpen className="w-16 h-16 text-zinc-100 absolute -right-2 -bottom-2 z-0" />
                                <span className="text-3xl font-bold text-zinc-900 relative z-10">{bibliotecaExercicios.length}</span>
                                <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-500 relative z-10">Ex. na Biblioteca</span>
                            </div>
                        </div>

                        <div className="mt-4 flex flex-col gap-3">
                            <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-400 ml-1">Ações Rápidas</span>
                            <button onClick={() => { setCurrentView('alunos'); setIsAddStudentModalOpen(true); }} className="w-full bg-zinc-900 text-white py-4 px-5 flex items-center justify-between hover:bg-zinc-800 transition-colors shadow-md group">
                                <div className="flex items-center gap-3"><UserCircle className="w-5 h-5" /><span className="uppercase font-bold text-xs tracking-widest">Novo Aluno</span></div><Plus className="w-5 h-5 text-zinc-400 group-hover:text-white transition-colors" />
                            </button>
                            <button onClick={() => setCurrentView('biblioteca')} className="w-full bg-white border border-zinc-200 text-zinc-900 py-4 px-5 flex items-center justify-between hover:bg-zinc-50 transition-colors shadow-sm group">
                                <div className="flex items-center gap-3"><BookOpen className="w-5 h-5 text-zinc-400 group-hover:text-zinc-900" /><span className="uppercase font-bold text-xs tracking-widest">Acessar Biblioteca</span></div><ChevronRight className="w-5 h-5 text-zinc-300 group-hover:text-zinc-900 transition-colors" />
                            </button>
                        </div>
                    </div>
                )}

                {currentView === 'alunos' && (
                    <div className="bg-white p-5 shadow-sm relative z-10 flex gap-2">
                        <div className="relative flex-1">
                            <input type="text" placeholder="Buscar aluno..." value={studentSearchTerm} onChange={(e) => setStudentSearchTerm(e.target.value)} className="w-full bg-zinc-100 border-none px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-zinc-900 rounded-none placeholder-zinc-400 font-medium pl-10" />
                            <Search className="w-4 h-4 text-zinc-400 absolute left-4 top-1/2 transform -translate-y-1/2" />
                        </div>
                        <button onClick={() => setIsAddStudentModalOpen(true)} className="bg-zinc-900 text-white px-5 py-3 hover:bg-zinc-800 transition-colors rounded-none flex items-center justify-center shadow-md flex-shrink-0"><Plus className="w-5 h-5" /></button>
                    </div>
                )}

                {/* CABEÇALHO DO ALUNO COM WHATSAPP */}
                {currentView === 'rotinas' && selectedAluno && (
                    <div className="bg-white p-5 border-b border-zinc-200">
                        <div className="flex justify-between items-center">
                            <div>
                                <h2 className="text-lg font-bold text-zinc-900 uppercase tracking-wide">{selectedAluno.nome}</h2>
                                {selectedAluno.tags && selectedAluno.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-1.5">
                                        {selectedAluno.tags.map((t, idx) => (
                                            <span key={idx} className="text-[9px] uppercase font-bold tracking-widest text-zinc-600 bg-zinc-200 px-2 py-0.5">{t}</span>
                                        ))}
                                    </div>
                                )}
                            </div>
                            {selectedAluno.whatsapp && (
                                <a
                                    href={`https://wa.me/${(selectedAluno.whatsapp || '').toString().replace(/\D/g, '')}?text=Olá! ${selectedAluno.nome}, tenho uma dúvida sobre o seu treino...`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-10 h-10 flex-shrink-0 bg-green-500 text-white flex items-center justify-center shadow-md hover:bg-green-600 transition-colors cursor-pointer"
                                >
                                    <MessageCircle className="w-5 h-5" />
                                </a>
                            )}
                        </div>
                    </div>
                )}

                {/* TABS NO TOPO DA TELA "ROTINAS DO ALUNO" */}
                {currentView === 'rotinas' && (
                    <div className="bg-zinc-100 p-2 flex gap-2 border-b border-zinc-200">
                        <button
                            onClick={() => setTrainerAlunoTab('rotinas')}
                            className={`flex-1 py-3 text-[10px] uppercase font-bold tracking-widest transition-colors border shadow-sm ${trainerAlunoTab === 'rotinas' ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white text-zinc-500 border-zinc-200 hover:bg-zinc-50'}`}
                        >
                            Fichas
                        </button>
                        <button
                            onClick={() => setTrainerAlunoTab('feedbacks')}
                            className={`flex-1 py-3 text-[10px] uppercase font-bold tracking-widest transition-colors border shadow-sm ${trainerAlunoTab === 'feedbacks' ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white text-zinc-500 border-zinc-200 hover:bg-zinc-50'}`}
                        >
                            Evolução
                        </button>
                    </div>
                )}

                {currentView === 'biblioteca' && (
                    <div className="bg-white p-5 shadow-sm relative z-10">
                        <form onSubmit={handleAddSimples} className="flex flex-col gap-3">
                            <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Criar Treino Base</label>
                            <div className="flex gap-2">
                                <input type="text" placeholder="Nome..." value={novoNome} onChange={(e) => setNovoNome(e.target.value)} className="flex-1 bg-zinc-100 border-none px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-zinc-900 rounded-none placeholder-zinc-400 font-medium" />
                                <button type="submit" className="bg-zinc-900 text-white px-5 py-3 hover:bg-zinc-800 transition-colors rounded-none flex items-center justify-center shadow-md"><Plus className="w-5 h-5" /></button>
                            </div>
                        </form>
                    </div>
                )}

                {/* Listagens */}
                <div className="flex flex-col flex-1">
                    {currentView === 'alunos' && alunos
                        .filter(a => a.nome.toLowerCase().includes(studentSearchTerm.toLowerCase()))
                        .map(aluno => (
                            <ListItem key={aluno.id} title={aluno.nome} icon={aluno.genero === 'feminino' ? AvatarFeminino : AvatarMasculino} onClick={() => { setSelectedAluno(aluno); setCurrentView('rotinas'); setTrainerAlunoTab('rotinas'); }} onEdit={() => handleEditStudent(aluno)} onDelete={() => handleDeleteStudent(aluno.id)} tags={aluno.tags || []} />
                        ))}

                    {/* RENDERS DA TELA "ROTINAS DO ALUNO" DEPENDENDO DA TAB ATIVA */}
                    {currentView === 'rotinas' && trainerAlunoTab === 'rotinas' && rotinas.filter(r => r.alunoId === selectedAluno.id).map(rotina => (
                        <ListItem key={rotina.id} title={rotina.nome} subtitle={rotina.tipo === 'semanal' ? (rotina.restrito ? "Semanal (Acesso Restrito)" : "Rotina Semanal") : "Rotina Livre"} icon={Calendar} onClick={() => { setSelectedRotina(rotina); setCurrentView('treinos'); }} onEdit={() => handleEditRoutine(rotina)} onDelete={() => handleDeleteRoutine(rotina.id)} />
                    ))}

                    {currentView === 'rotinas' && trainerAlunoTab === 'feedbacks' && (
                        <div className="flex flex-col">
                            {/* DASHBOARD RADAR TREINADOR */}
                            <div className="p-5 bg-zinc-900 border-b-4 border-orange-500 mb-2 shadow-sm">
                                <h2 className="text-lg font-black uppercase tracking-widest text-white flex items-center gap-2"><Activity className="w-5 h-5 text-orange-500" /> Radar de Evolução</h2>
                                <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest mt-1 mb-6 leading-tight">Métricas globais do aluno: <span className="text-white">{selectedAluno?.nome}</span></p>

                                <h3 className="text-[11px] font-bold uppercase tracking-widest text-zinc-300 mb-2 flex items-center gap-2"><Activity className="w-3 h-3 text-orange-500" /> Volume Load Acumulado</h3>
                                <div className="h-32 w-full font-bold text-[10px] uppercase tracking-widest mb-6">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={feedbacks.filter(f => f.alunoId === selectedAluno.id).slice(-10)} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#3f3f46" />
                                            <XAxis dataKey="data" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#71717a' }} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#71717a' }} />
                                            <Tooltip contentStyle={{ backgroundColor: '#18181b', color: '#fff', border: '1px solid #3f3f46', fontSize: '10px', textTransform: 'uppercase', fontWeight: 700, borderRadius: '8px' }} />
                                            <Line type="monotone" dataKey="volumeLoad" stroke="#f97316" strokeWidth={3} dot={{ r: 4, fill: '#f97316', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                                <h3 className="text-[11px] font-bold uppercase tracking-widest text-zinc-300 mb-2 flex items-center gap-2"><TrendingUp className="w-3 h-3 text-amber-500" /> Predição 1RM Max</h3>
                                <div className="h-32 w-full font-bold text-[10px] uppercase tracking-widest">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <LineChart data={feedbacks.filter(f => f.alunoId === selectedAluno.id).slice(-10)} margin={{ top: 5, right: 5, left: -25, bottom: 5 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#3f3f46" />
                                            <XAxis dataKey="data" axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#71717a' }} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 9, fill: '#71717a' }} />
                                            <Tooltip contentStyle={{ backgroundColor: '#18181b', color: '#fff', border: '1px solid #3f3f46', fontSize: '10px', textTransform: 'uppercase', fontWeight: 700, borderRadius: '8px' }} />
                                            <Line type="monotone" dataKey="max1RM" stroke="#eab308" strokeWidth={3} dot={{ r: 4, fill: '#eab308', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                            {feedbacks.filter(f => f.alunoId === selectedAluno.id).map(fb => (
                                <div key={fb.id} className="p-5 bg-white border-b border-zinc-100 hover:bg-zinc-50 transition-colors">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{fb.data}</span>
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-900 bg-zinc-100 px-3 py-1 border border-zinc-200 flex items-center gap-1">
                                            Esforço: <span className={fb.rpe >= 8 ? 'text-red-600' : 'text-zinc-900'}>{fb.rpe}/10</span>
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3 mt-3">
                                        <div className="w-10 h-10 bg-zinc-100 flex items-center justify-center flex-shrink-0">
                                            <TrendingUp className="w-5 h-5 text-zinc-700" />
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-500">Treino Concluído</span>
                                            <h3 className="font-semibold text-zinc-900 uppercase tracking-wide text-sm leading-tight mt-1">{fb.treinoNome}</h3>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {feedbacks.filter(f => f.alunoId === selectedAluno.id).length === 0 && (
                                <div className="p-10 text-center text-xs text-zinc-400 font-bold uppercase tracking-widest">Nenhum treino concluído ainda.</div>
                            )}
                        </div>
                    )}

                    {currentView === 'treinos' && treinos.filter(t => t.rotinaId === selectedRotina.id).map(treino => (
                        <ListItem key={treino.id} title={treino.nome} subtitle="Ver Exercícios" topText={treino.diaSemana} icon={ClipboardList} onClick={() => { setSelectedTreino(treino); setCurrentView('exercicios'); }} onEdit={() => handleEditTreino(treino)} onDelete={() => handleDeleteTreino(treino.id)} />
                    ))}

                    {currentView === 'biblioteca' && bibliotecaTreinos.map(treino => (
                        <ListItem key={treino.id} title={treino.nome} subtitle="Ver Exercícios Base" icon={BookOpen} onClick={() => { setSelectedBibTreino(treino); setCurrentView('biblioteca_exercicios'); }} onDelete={() => handleDeleteBibTreino(treino.id)} />
                    ))}

                    {currentView === 'exercicios' && (
                        <DragDropContext onDragEnd={handleDragEnd}>
                            <Droppable droppableId="exercicios-lista">
                                {(provided) => (
                                    <div {...provided.droppableProps} ref={provided.innerRef}>
                                        {exercicios.filter(e => e.treinoId === selectedTreino.id).sort((a, b) => (a.ordem || 0) - (b.ordem || 0)).map((exercicio, index) => (
                                            <Draggable key={exercicio.id.toString()} draggableId={exercicio.id.toString()} index={index}>
                                                {(provided) => (
                                                    <div ref={provided.innerRef} {...provided.draggableProps}>
                                                        <ExercicioItem {...exercicio} dragHandleProps={provided.dragHandleProps} onEdit={() => handleEditExercicio(exercicio)} onDelete={() => handleDeleteExercicio(exercicio.id)} />
                                                    </div>
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        </DragDropContext>
                    )}

                    {currentView === 'biblioteca_exercicios' && (
                        <DragDropContext onDragEnd={handleDragEnd}>
                            <Droppable droppableId="bib-exercicios-lista">
                                {(provided) => (
                                    <div {...provided.droppableProps} ref={provided.innerRef}>
                                        {bibliotecaExercicios.filter(e => e.treinoId === selectedBibTreino.id).sort((a, b) => (a.ordem || 0) - (b.ordem || 0)).map((exercicio, index) => (
                                            <Draggable key={exercicio.id.toString()} draggableId={exercicio.id.toString()} index={index}>
                                                {(provided) => (
                                                    <div ref={provided.innerRef} {...provided.draggableProps}>
                                                        <ExercicioItem {...exercicio} dragHandleProps={provided.dragHandleProps} onEdit={() => handleEditExercicio(exercicio)} onDelete={() => handleDeleteExercicio(exercicio.id, true)} />
                                                    </div>
                                                )}
                                            </Draggable>
                                        ))}
                                        {provided.placeholder}
                                    </div>
                                )}
                            </Droppable>
                        </DragDropContext>
                    )}

                    {currentView === 'ajustes' && (
                        <div className="p-5">
                            <div className="bg-white border border-zinc-200 p-5 flex flex-col items-center justify-center gap-3">
                                <div className="w-16 h-16 bg-zinc-100 rounded-full flex items-center justify-center border border-zinc-200"><Settings className="w-8 h-8 text-zinc-400" /></div>
                                <h3 className="font-bold text-zinc-900 uppercase tracking-wide text-sm">Conta Personal</h3>
                                <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-400 bg-zinc-100 px-3 py-1">Acesso Administrativo</span>
                            </div>

                            <div className="bg-white border border-zinc-200 p-5 mt-4">
                                <h4 className="text-[11px] font-black uppercase tracking-widest text-zinc-900 mb-2 flex items-center gap-2"><BrainCircuit className="w-4 h-4 text-orange-500" /> OpenAI API Key</h4>
                                <p className="text-[9px] text-zinc-400 font-bold uppercase tracking-widest mb-3 leading-tight">Sua chave é salva apenas neste aplicativo para habilitar a geração de treinos rápidos (Fast-Track).</p>
                                <div className="flex gap-2">
                                    <input type="password" placeholder="sk-..." value={trainerApiKey} onChange={(e) => setTrainerApiKey(e.target.value)} className="flex-1 bg-zinc-100 border-none px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-orange-500 transition-all font-medium" />
                                    <button onClick={async () => {
                                        if (!firebaseUser) return;
                                        try {
                                            await setDoc(doc(db, 'trainers', firebaseUser.uid), { openai_api_key: trainerApiKey }, { merge: true });
                                            alert('Configurações salvas!');
                                        } catch (e) { alert('Erro: ' + e.message); }
                                    }} className="bg-zinc-900 text-white px-4 py-2 hover:bg-zinc-800 transition-colors uppercase font-bold text-[10px] tracking-widest flex items-center gap-1 shadow-md">
                                        <Check className="w-4 h-4" /> Salvar
                                    </button>
                                </div>
                            </div>

                            <button onClick={handleLogout} className="w-full bg-zinc-900 text-white py-4 mt-6 flex items-center justify-center gap-2 hover:bg-zinc-800 transition-colors uppercase font-bold text-xs tracking-widest shadow-md">
                                <LogOut className="w-5 h-5" /> Sair da Conta
                            </button>
                        </div>
                    )}

                    {currentView === 'alunos' && alunos.length === 0 && <div className="p-10 text-center text-xs text-zinc-400 font-bold uppercase tracking-widest">Nenhum aluno cadastrado.</div>}
                    {currentView === 'rotinas' && trainerAlunoTab === 'rotinas' && rotinas.filter(r => r.alunoId === selectedAluno?.id).length === 0 && <div className="p-10 text-center text-xs text-zinc-400 font-bold uppercase tracking-widest">Nenhuma rotina cadastrada.</div>}
                    {currentView === 'treinos' && treinos.filter(t => t.rotinaId === selectedRotina?.id).length === 0 && <div className="p-10 text-center text-xs text-zinc-400 font-bold uppercase tracking-widest">Nenhum treino cadastrado.</div>}

                    {['rotinas', 'treinos', 'exercicios', 'biblioteca_exercicios'].includes(currentView) && (
                        <div className="p-4 mt-auto">
                            {/* Só mostra o botão de + Rotina se estiver na tab de Rotinas */}
                            {!(currentView === 'rotinas' && trainerAlunoTab === 'feedbacks') && (
                                <button
                                    onClick={() => {
                                        if (currentView === 'rotinas') setIsAddRoutineModalOpen(true);
                                        else if (currentView === 'treinos') setIsWorkoutSelectionOpen(true);
                                        else setIsExerciseSelectionOpen(true);
                                    }}
                                    className="w-full bg-zinc-900 text-white py-4 flex items-center justify-center gap-2 hover:bg-zinc-800 transition-colors uppercase font-bold text-xs tracking-widest shadow-md"
                                >
                                    <Plus className="w-5 h-5" />
                                    {currentView === 'rotinas' ? 'Adicionar Rotina' : currentView === 'treinos' ? 'Adicionar Treino' : 'Adicionar Exercício'}
                                </button>
                            )}
                        </div>
                    )}

                    {currentView === 'ia_trainer' && (
                        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
                            <div className="w-24 h-24 rounded-full bg-orange-50 flex items-center justify-center mb-6 shadow-inner border border-orange-100">
                                <BrainCircuit className="w-12 h-12 text-orange-500" />
                            </div>
                            <h2 className="text-2xl font-black uppercase tracking-widest text-zinc-900 mb-2">Treinador I.A.</h2>
                            <p className="text-sm font-medium text-zinc-500 mb-8 max-w-xs">
                                Descreva o foco muscular e técnicas que a Inteligência Artificial monta a estrutura térmica perfeita.
                            </p>
                            <button
                                onClick={() => setIsIAGeneratorOpen(true)}
                                className="w-full max-w-xs bg-orange-500 text-white py-4 px-6 rounded-none font-bold uppercase tracking-widest text-sm shadow-[0_0_20px_rgba(249,115,22,0.4)] hover:bg-orange-600 transition-all active:scale-95 flex items-center justify-center gap-2"
                            >
                                <Wand2 className="w-5 h-5" /> Iniciar Gerador
                            </button>
                        </div>
                    )}

                </div>
            </main>

            {/* NAV INFERIOR DO TREINADOR */}
            <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-md h-[calc(5rem+env(safe-area-inset-bottom))] pb-[calc(0.25rem+env(safe-area-inset-bottom))] bg-white border-t border-zinc-200 z-40 flex justify-between items-center shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                <button onClick={() => setCurrentView('dashboard')} className={`flex flex-col items-center justify-center flex-1 h-full transition-colors relative ${currentView === 'dashboard' ? 'text-zinc-900' : 'text-zinc-400 hover:text-zinc-900'}`}>
                    {currentView === 'dashboard' && <div className="absolute top-0 left-0 right-0 h-[3px] bg-zinc-900" />}
                    <Activity className="w-6 h-6 mb-1.5" /><span className="text-[10px] uppercase font-bold tracking-widest">Painel</span>
                </button>
                <button onClick={() => setCurrentView('alunos')} className={`flex flex-col items-center justify-center flex-1 h-full transition-colors relative ${['alunos', 'rotinas', 'treinos', 'exercicios'].includes(currentView) ? 'text-zinc-900' : 'text-zinc-400 hover:text-zinc-900'}`}>
                    {['alunos', 'rotinas', 'treinos', 'exercicios'].includes(currentView) && <div className="absolute top-0 left-0 right-0 h-[3px] bg-zinc-900" />}
                    <Users className="w-6 h-6 mb-1.5" /><span className="text-[10px] uppercase font-bold tracking-widest">Alunos</span>
                </button>
                <button onClick={() => setCurrentView('biblioteca')} className={`flex flex-col items-center justify-center flex-1 h-full transition-colors relative ${['biblioteca', 'biblioteca_exercicios'].includes(currentView) ? 'text-zinc-900' : 'text-zinc-400 hover:text-zinc-900'}`}>
                    {['biblioteca', 'biblioteca_exercicios'].includes(currentView) && <div className="absolute top-0 left-0 right-0 h-[3px] bg-zinc-900" />}
                    <BookOpen className="w-6 h-6 mb-1.5" /><span className="text-[10px] uppercase font-bold tracking-widest">Biblio</span>
                </button>
                <button onClick={() => setCurrentView('ia_trainer')} className={`flex flex-col items-center justify-center flex-1 h-full transition-colors relative ${currentView === 'ia_trainer' ? 'text-orange-500' : 'text-zinc-400 hover:text-orange-500'}`}>
                    {currentView === 'ia_trainer' && <div className="absolute top-0 left-0 right-0 h-[3px] bg-orange-500" />}
                    <BrainCircuit className="w-6 h-6 mb-1.5" /><span className="text-[10px] uppercase font-bold tracking-widest">A.I.</span>
                </button>
                <button onClick={() => setCurrentView('ajustes')} className={`flex flex-col items-center justify-center flex-1 h-full transition-colors relative ${currentView === 'ajustes' ? 'text-zinc-900' : 'text-zinc-400 hover:text-zinc-900'}`}>
                    {currentView === 'ajustes' && <div className="absolute top-0 left-0 right-0 h-[3px] bg-zinc-900" />}
                    <Settings className="w-6 h-6 mb-1.5" /><span className="text-[10px] uppercase font-bold tracking-widest">Ajustes</span>
                </button>
            </nav>

            {/* MODAIS (Aluno, Rotina, Treino, Exercício) OMITIDOS POR BREVIDADE MAS INTACTOS */}

            {/* MODAL IA GENERATOR */}
            {isIAGeneratorOpen && (
                <div className="fixed inset-0 bg-white z-[110] flex flex-col max-w-md mx-auto">
                    <header className="h-16 bg-orange-500 flex items-center px-4 shadow-md flex-shrink-0 relative">
                        <button onClick={() => { setIsIAGeneratorOpen(false); setIaGeneratedTreino(null); setIaPrompt(''); }} className="absolute left-2 p-2 text-white hover:bg-orange-600 transition-colors z-10"><X className="w-6 h-6" /></button>
                        <h1 className="text-sm font-bold uppercase tracking-widest text-white truncate w-full text-center flex items-center justify-center gap-2"><BrainCircuit className="w-4 h-4" /> A.I. Fast-Track</h1>
                    </header>
                    <div className="flex-1 overflow-y-auto p-5 bg-zinc-50">
                        {!iaGeneratedTreino ? (
                            <>
                                <div className="bg-white p-5 border border-zinc-200 shadow-sm mb-6">
                                    <h3 className="text-[11px] font-black uppercase tracking-widest text-zinc-900 mb-3 flex items-center gap-2">
                                        <MessageCircle className="w-4 h-4 text-orange-500" /> Descreva o Treino
                                    </h3>
                                    <textarea
                                        value={iaPrompt}
                                        onChange={(e) => setIaPrompt(e.target.value)}
                                        placeholder="Ex: Monte um treino focado em Posterior de Coxa e Glúteos. Use Bi-set no agachamento búlgaro. Quero 5 exercícios focados em hipertrofia (Descanso de 60s)."
                                        className="w-full h-40 bg-zinc-100 border-none px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-orange-500 transition-all resize-none placeholder-zinc-400 font-medium"
                                    />
                                </div>

                                <button
                                    onClick={async () => {
                                        if (!iaPrompt.trim()) return;
                                        if (!trainerApiKey) {
                                            alert("Configure a sua API Key da OpenAI na guia 'Ajustes' para ativar o Módulo I.A.");
                                            return;
                                        }
                                        setIsGeneratingIA(true);
                                        try {
                                            const openai = new OpenAI({ apiKey: trainerApiKey, dangerouslyAllowBrowser: true });

                                            // Provide only the names of exercises up to a limit or just explain the list loosely (since the list is huge, we ask standard muscle mapping)
                                            // The best practice is to ask the model to reply with JSON containing an array matching our exact model.

                                            const nomesValidos = apiExercicios.map(ex => ex.nome).join(' | ');
                                            const systemMessage = `Você é um Personal Trainer de Elite especialista em Hipertrofia.
Sua função é gerar 1 treino focado em partes musculares requisitadas pelo usuário.
REGRA DE OURO (MANDATÓRIO): Você SÓ PODE e DEVE escolher exercícios desta exata lista delimitada por pipes a seguir, copiando o nome exatamente como está, sem inventar nenhum outro:
[LISTA_DE_EXERCÍCIOS_PERMITIDOS: ${nomesValidos}]

A saída deve ser RIGOROSAMENTE e EXCLUSIVAMENTE um objeto JSON válido, contendo as propriedades:
1. "nome": (String com título do treino)
2. "exercicios": (Array de objetos, onde cada objeto tem { "nome": "...", "series": "...", "reps": "...", "carga": "-", "descanso": "...", "metodo": "..." }).
Nota para metodo: pode ser 'Padrão', 'Drop Set', 'Rest-Pause', 'FST-7', 'Bi-set', 'Pico de Contração'. Sempre preenchido. As reps devem ser numéricas (ex: '10-12'). NÃO use markdown (\`\`\`json) na sua resposta.`;

                                            const response = await openai.chat.completions.create({
                                                model: "gpt-4o-mini",
                                                messages: [
                                                    { role: "system", content: systemMessage },
                                                    { role: "user", content: iaPrompt }
                                                ],
                                                temperature: 0.7
                                            });

                                            const output = response.choices[0].message.content.trim();
                                            const jsonStart = output.indexOf('{');
                                            const jsonEnd = output.lastIndexOf('}') + 1;
                                            const parsedOutput = JSON.parse(output.substring(jsonStart, jsonEnd));

                                            setIaGeneratedTreino(parsedOutput);
                                        } catch (e) {
                                            alert("Falha ao gerar treino: " + e.message);
                                            console.error(e);
                                        }
                                        setIsGeneratingIA(false);
                                    }}
                                    disabled={isGeneratingIA || !iaPrompt.trim()}
                                    className={`w-full py-4 flex items-center justify-center gap-2 transition-colors uppercase font-bold text-xs tracking-widest shadow-md ${isGeneratingIA ? 'bg-zinc-300 text-zinc-500' : 'bg-orange-500 text-white hover:bg-orange-600'}`}
                                >
                                    {isGeneratingIA ? <><Loader2 className="w-5 h-5 animate-spin" /> Mapeando Biblioteca...</> : <><Wand2 className="w-5 h-5" /> Gerar Treino Mágico</>}
                                </button>
                            </>
                        ) : (
                            <div className="fade-in">
                                <div className="bg-orange-50 border-l-4 border-orange-500 p-4 mb-6">
                                    <h3 className="text-sm font-black uppercase tracking-widest text-zinc-900">{iaGeneratedTreino.nome}</h3>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-orange-600 mt-1">Gerado com Sucesso</p>
                                </div>

                                <div className="space-y-3 mb-8">
                                    {iaGeneratedTreino.exercicios.map((ex, idx) => (
                                        <ExercicioItem key={idx} {...ex} />
                                    ))}
                                </div>

                                <div className="flex gap-2 sticky bottom-0 bg-zinc-50 pt-2 pb-4">
                                    <button onClick={() => setIaGeneratedTreino(null)} className="flex-1 bg-white border border-zinc-300 text-zinc-700 py-4 font-bold text-[10px] uppercase tracking-widest">Descartar</button>
                                    <button onClick={async () => {
                                        if (!iaGeneratedTreino) return;
                                        try {
                                            const newId = Date.now();

                                            // 1. Salvar o Treino na Biblioteca
                                            const treinoDoc = { id: newId, nome: iaGeneratedTreino.nome, iaGenerated: true };
                                            await setDoc(doc(db, 'bibliotecaTreinos', newId.toString()), treinoDoc);
                                            setBibliotecaTreinos(prev => [...prev, treinoDoc]);

                                            // 2. Salvar os Exercícios atrelados a ele na Biblioteca
                                            const exerciciosPromessas = iaGeneratedTreino.exercicios.map((ex, i) => {
                                                const exId = newId + i + 1;
                                                // Tenta achar o vídeo na nossa API
                                                const apiExMatch = apiExercicios.find(a => (a.name || a.nome || '') === ex.nome);

                                                const exDoc = {
                                                    id: exId,
                                                    treinoId: newId,
                                                    nome: ex.nome,
                                                    series: ex.series?.replace(/\D/g, '') || "4",
                                                    reps: ex.reps,
                                                    carga: ex.carga,
                                                    descanso: ex.descanso,
                                                    metodo: ex.metodo,
                                                    video: apiExMatch ? (apiExMatch.video || apiExMatch.mp4 || apiExMatch.url || '') : '',
                                                    ordem: i
                                                };
                                                setBibliotecaExercicios(prev => [...prev, exDoc]);
                                                return setDoc(doc(db, 'bibliotecaExercicios', exId.toString()), exDoc);
                                            });

                                            await Promise.all(exerciciosPromessas);

                                            alert("Treino I.A. salvo com sucesso na sua Biblioteca Mestra!");
                                            setIsIAGeneratorOpen(false);
                                            setIaGeneratedTreino(null);
                                            setIaPrompt('');
                                            setCurrentView('biblioteca'); // Redireciona para ver o resultado
                                        } catch (e) {
                                            alert("Erro ao salvar: " + e.message);
                                        }
                                    }} className="flex-1 bg-zinc-900 text-white py-4 font-bold text-[10px] uppercase tracking-widest flex items-center justify-center gap-1 shadow-md"><Check className="w-4 h-4" /> Salvar na Biblioteca</button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {isAddStudentModalOpen && (
                <div className="fixed inset-0 bg-white z-[110] flex flex-col max-w-md mx-auto">
                    <header className="h-16 bg-zinc-900 flex items-center px-4 shadow-md flex-shrink-0 relative">
                        <button onClick={() => setIsAddStudentModalOpen(false)} className="absolute left-2 p-2 text-white hover:bg-zinc-800 transition-colors z-10"><ArrowLeft className="w-6 h-6" /></button>
                        <h1 className="text-sm font-bold uppercase tracking-widest text-white truncate w-full text-center">Cadastrar Aluno</h1>
                    </header>

                    <div className="flex-1 overflow-y-auto p-5">
                        <div className="flex flex-col items-center justify-center mb-6 mt-4">
                            <div className="w-20 h-20 bg-zinc-100 rounded-full flex items-center justify-center border border-zinc-200 mb-4 transition-transform hover:scale-105 shadow-sm">
                                {newStudentData.genero === 'feminino' ? <AvatarFeminino className="w-12 h-12 text-zinc-300" /> : <AvatarMasculino className="w-12 h-12 text-zinc-300" />}
                            </div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Dados do Perfil</p>
                        </div>

                        <form onSubmit={handleSaveNewStudent} className="flex flex-col gap-4">
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Gênero do Aluno</label>
                                <div className="flex bg-zinc-100 border border-zinc-200 p-1 rounded-sm gap-1">
                                    <button
                                        type="button"
                                        onClick={() => setNewStudentData({ ...newStudentData, genero: 'masculino' })}
                                        className={`flex-1 py-3 text-xs uppercase font-bold tracking-widest flex items-center justify-center transition-all ${newStudentData.genero === 'masculino' ? 'bg-zinc-900 border border-zinc-900 text-white shadow-md' : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200'}`}
                                    >
                                        Homem
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setNewStudentData({ ...newStudentData, genero: 'feminino' })}
                                        className={`flex-1 py-3 text-xs uppercase font-bold tracking-widest flex items-center justify-center transition-all ${newStudentData.genero === 'feminino' ? 'bg-zinc-900 border border-zinc-900 text-white shadow-md' : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200'}`}
                                    >
                                        Mulher
                                    </button>
                                </div>
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Nome Completo</label>
                                <input type="text" placeholder="Ex: Carlos Mendes" value={newStudentData.nome} onChange={(e) => setNewStudentData({ ...newStudentData, nome: e.target.value })} className="bg-zinc-100 border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-zinc-900 focus:bg-white transition-colors rounded-none placeholder-zinc-400 font-medium" />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">E-mail</label>
                                <input type="email" placeholder="Ex: carlos@email.com" value={newStudentData.email} onChange={(e) => setNewStudentData({ ...newStudentData, email: e.target.value })} className="bg-zinc-100 border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-zinc-900 focus:bg-white transition-colors rounded-none placeholder-zinc-400 font-medium" />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">WhatsApp</label>
                                <input type="tel" placeholder="Ex: (11) 99999-9999" value={newStudentData.whatsapp} onChange={(e) => setNewStudentData({ ...newStudentData, whatsapp: e.target.value })} className="bg-zinc-100 border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-zinc-900 focus:bg-white transition-colors rounded-none placeholder-zinc-400 font-medium" />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Tags / Classificação</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        placeholder="Ex: Emagrecimento, Lesão..."
                                        value={newTagInput}
                                        onChange={(e) => setNewTagInput(e.target.value)}
                                        className="flex-1 bg-zinc-100 border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-zinc-900 focus:bg-white transition-colors rounded-none placeholder-zinc-400 font-medium"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (newTagInput.trim()) {
                                                setNewStudentData({ ...newStudentData, tags: [...(newStudentData.tags || []), newTagInput.trim()] });
                                                setNewTagInput('');
                                            }
                                        }}
                                        className="bg-zinc-900 text-white px-5 flex items-center justify-center shadow-md hover:bg-zinc-800 transition-colors"
                                    >
                                        <Plus className="w-5 h-5" />
                                    </button>
                                </div>
                                {newStudentData.tags && newStudentData.tags.length > 0 && (
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        {newStudentData.tags.map((tag, idx) => (
                                            <div key={idx} className="flex items-center gap-1 bg-zinc-200 px-2 py-1">
                                                <span className="text-[10px] uppercase font-bold tracking-widest text-zinc-700">{tag}</span>
                                                <button type="button" onClick={() => setNewStudentData({ ...newStudentData, tags: newStudentData.tags.filter((_, i) => i !== idx) })}><X className="w-3 h-3 text-zinc-500" /></button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Senha de Login do Aluno</label>
                                <input type="text" placeholder="Defina uma senha..." value={newStudentData.senha} onChange={(e) => setNewStudentData({ ...newStudentData, senha: e.target.value })} className="bg-zinc-100 border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-zinc-900 focus:bg-white transition-colors rounded-none placeholder-zinc-400 font-medium" />
                            </div>

                            <div className="mt-8 mb-4">
                                <button type="submit" className="w-full bg-zinc-900 text-white py-4 flex items-center justify-center gap-2 hover:bg-zinc-800 transition-colors uppercase font-bold text-xs tracking-widest shadow-md">
                                    <Check className="w-5 h-5" /> Salvar Novo Aluno
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isAddRoutineModalOpen && (
                <div className="fixed inset-0 bg-white z-[110] flex flex-col max-w-md mx-auto">
                    <header className="h-16 bg-zinc-900 flex items-center px-4 shadow-md flex-shrink-0 relative">
                        <button onClick={() => setIsAddRoutineModalOpen(false)} className="absolute left-2 p-2 text-white hover:bg-zinc-800 transition-colors z-10"><ArrowLeft className="w-6 h-6" /></button>
                        <h1 className="text-sm font-bold uppercase tracking-widest text-white truncate w-full text-center">Cadastrar Rotina</h1>
                    </header>

                    <div className="flex-1 overflow-y-auto p-5">
                        <div className="flex flex-col items-center justify-center mb-6 mt-4">
                            <div className="w-20 h-20 bg-zinc-100 rounded-full flex items-center justify-center border border-zinc-200 mb-4"><Calendar className="w-10 h-10 text-zinc-300" /></div>
                            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">Configuração da Ficha</p>
                        </div>
                        <form onSubmit={handleSaveNewRoutine} className="flex flex-col gap-5">
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Nome da Rotina</label>
                                <input type="text" placeholder="Ex: Hipertrofia Mês 2" value={newRoutineData.nome} onChange={(e) => setNewRoutineData({ ...newRoutineData, nome: e.target.value })} className="bg-zinc-100 border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-zinc-900 focus:bg-white transition-colors rounded-none placeholder-zinc-400 font-medium" />
                            </div>
                            <div className="flex flex-col gap-2">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">Tipo de Rotina</label>
                                <div className="flex gap-2">
                                    <button type="button" onClick={() => setNewRoutineData({ ...newRoutineData, tipo: 'semanal' })} className={`flex-1 py-3 text-[10px] uppercase font-bold tracking-widest border transition-colors ${newRoutineData.tipo === 'semanal' ? 'bg-zinc-900 text-white border-zinc-900 shadow-sm' : 'bg-zinc-100 text-zinc-400 border-zinc-200 hover:bg-zinc-200'}`}>Semanal</button>
                                    <button type="button" onClick={() => setNewRoutineData({ ...newRoutineData, tipo: 'livre' })} className={`flex-1 py-3 text-[10px] uppercase font-bold tracking-widest border transition-colors ${newRoutineData.tipo === 'livre' ? 'bg-zinc-900 text-white border-zinc-900 shadow-sm' : 'bg-zinc-100 text-zinc-400 border-zinc-200 hover:bg-zinc-200'}`}>Livre</button>
                                </div>
                            </div>

                            {newRoutineData.tipo === 'semanal' && (
                                <div className="flex items-center justify-between bg-zinc-50 border border-zinc-200 p-4 mt-2 cursor-pointer hover:bg-zinc-100 transition-colors" onClick={() => setNewRoutineData({ ...newRoutineData, restrito: !newRoutineData.restrito })}>
                                    <div className="flex flex-col pr-4"><span className="text-[11px] font-bold uppercase tracking-widest text-zinc-900">Restringir Acesso ao Dia</span><span className="text-[10px] text-zinc-500 font-medium mt-1 leading-relaxed">O aluno só poderá visualizar o treino correspondente ao dia de hoje.</span></div>
                                    <div className={`w-10 h-6 flex items-center rounded-full p-1 flex-shrink-0 transition-colors duration-300 ${newRoutineData.restrito ? 'bg-zinc-900' : 'bg-zinc-300'}`}><div className={`bg-white w-4 h-4 rounded-full shadow-md transform transition-transform duration-300 ${newRoutineData.restrito ? 'translate-x-4' : ''}`}></div></div>
                                </div>
                            )}

                            <div className="mt-8 mb-4">
                                <button type="submit" className="w-full bg-zinc-900 text-white py-4 flex items-center justify-center gap-2 hover:bg-zinc-800 transition-colors uppercase font-bold text-xs tracking-widest shadow-md">
                                    <Check className="w-5 h-5" /> Salvar Nova Rotina
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isWorkoutSelectionOpen && (
                <div className="fixed inset-0 bg-zinc-100 z-[100] flex flex-col max-w-md mx-auto">
                    <header className="h-16 bg-zinc-900 flex items-center px-4 shadow-md flex-shrink-0 relative">
                        <button onClick={() => setIsWorkoutSelectionOpen(false)} className="absolute left-2 p-2 text-white hover:bg-zinc-800 transition-colors z-10"><ArrowLeft className="w-6 h-6" /></button>
                        <h1 className="text-sm font-bold uppercase tracking-widest text-white truncate w-full text-center">Adicionar Treino</h1>
                    </header>
                    <div className="flex-1 overflow-y-auto">
                        {selectedRotina?.tipo === 'semanal' && (
                            <div className="p-5 bg-zinc-100 border-b border-zinc-200">
                                <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2 block">Dia do Treino</label>
                                <div className="relative border border-zinc-300 bg-white shadow-sm">
                                    <select value={novoDiaTreino} onChange={(e) => setNovoDiaTreino(e.target.value)} className="w-full bg-transparent px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-zinc-900 rounded-none font-bold uppercase tracking-wide text-zinc-900 appearance-none cursor-pointer">
                                        {diasDaSemana.map(d => (<option key={d} value={d}>{d}</option>))}
                                    </select>
                                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-zinc-900"><ChevronRight className="w-5 h-5 rotate-90" /></div>
                                </div>
                            </div>
                        )}
                        <div className="p-5 bg-white border-b border-zinc-200">
                            <h2 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-3">Criar Treino em Branco</h2>
                            <form onSubmit={(e) => { e.preventDefault(); handleCreateBlankTreino(); }} className="flex gap-2">
                                <input type="text" placeholder="Nome do treino..." value={novoNomeTreino} onChange={(e) => setNovoNomeTreino(e.target.value)} className="flex-1 bg-zinc-100 border-none px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-zinc-900 rounded-none placeholder-zinc-400 font-medium" />
                                <button type="submit" className="bg-zinc-900 text-white px-5 py-3 hover:bg-zinc-800 transition-colors rounded-none flex items-center justify-center shadow-md"><Plus className="w-5 h-5" /></button>
                            </form>
                        </div>
                        <div className="p-5">
                            <h2 className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 mb-3">Ou Importar da Biblioteca</h2>
                            <div className="flex flex-col gap-2">
                                {bibliotecaTreinos.map(bib => (
                                    <div key={bib.id} onClick={() => handleImportFromLibrary(bib)} className="p-4 bg-white border border-zinc-200 flex justify-between items-center cursor-pointer hover:border-zinc-900 transition-colors shadow-sm">
                                        <div className="flex items-center gap-3"><BookOpen className="w-5 h-5 text-zinc-400" /><span className="font-bold text-zinc-900 uppercase text-xs tracking-wide">{bib.nome}</span></div><Plus className="w-5 h-5 text-zinc-900" />
                                    </div>
                                ))}
                                {bibliotecaTreinos.length === 0 && <div className="p-8 text-center border border-dashed border-zinc-300 bg-white"><span className="text-xs text-zinc-400 font-bold uppercase tracking-widest">Sua biblioteca está vazia</span></div>}
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {isExerciseSelectionOpen && (
                <div className="fixed inset-0 bg-zinc-100 z-[100] flex flex-col max-w-md mx-auto">
                    <header className="h-16 bg-zinc-900 flex items-center px-4 gap-2 flex-shrink-0 shadow-md">
                        <button onClick={() => setIsExerciseSelectionOpen(false)} className="p-2 -ml-2 text-white hover:bg-zinc-800 transition-colors"><ArrowLeft className="w-6 h-6" /></button>
                        <div className="flex-1 flex items-center bg-zinc-800/50 px-3 py-2 border border-zinc-700/50 focus-within:border-zinc-500 transition-colors">
                            <Search className="w-4 h-4 text-zinc-400 mr-2 shrink-0" />
                            <input type="text" placeholder="Buscar exercício..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-transparent border-none text-white placeholder-zinc-400 outline-none text-xs font-bold uppercase tracking-wider" />
                            {searchTerm && <button onClick={() => setSearchTerm('')} className="text-zinc-400 hover:text-white ml-2 shrink-0"><X className="w-4 h-4" /></button>}
                        </div>
                    </header>
                    <div className="bg-white border-b border-zinc-200 px-4 py-3 flex gap-2 overflow-x-auto [&::-webkit-scrollbar]:hidden flex-shrink-0">
                        {categoriasApi.map(cat => (
                            <button key={cat} onClick={() => setSelectedCategory(cat)} className={`whitespace-nowrap px-4 py-2 text-[10px] uppercase font-bold tracking-widest transition-colors border ${selectedCategory === cat ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-zinc-100 text-zinc-600 border-zinc-200 hover:bg-zinc-200'}`}>{cat}</button>
                        ))}
                    </div>
                    <div className="flex-1 overflow-y-auto">
                        {apiExercicios.filter(ex => {
                            const exName = (ex.name || ex.nome || '').toLowerCase();
                            const exCat = getCategory(ex);
                            return exName.includes(searchTerm.toLowerCase()) && (selectedCategory === 'Todas' || exCat === selectedCategory);
                        }).slice(0, 50).map((ex, idx) => (
                            <div key={idx} className="p-4 border-b border-zinc-200 bg-white flex items-center gap-4 cursor-pointer hover:bg-zinc-50 transition-colors" onClick={() => { setSelectedApiExercise(ex); setIsExerciseSelectionOpen(false); setIsExerciseConfigOpen(true); }}>
                                {(ex.video || ex.mp4 || ex.url) ? <video src={ex.video || ex.mp4 || ex.url} className="w-16 h-16 object-cover border border-zinc-900 flex-shrink-0 bg-zinc-100" muted loop playsInline /> : <div className="w-16 h-16 bg-zinc-100 border border-zinc-900 flex-shrink-0 flex items-center justify-center"><Dumbbell className="w-6 h-6 text-zinc-300" /></div>}
                                <div className="flex flex-col"><span className="font-semibold text-zinc-900 uppercase text-xs leading-relaxed">{ex.name || ex.nome}</span><span className="text-[10px] text-zinc-500 uppercase font-bold tracking-widest mt-1">{getCategory(ex)}</span></div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {isExerciseConfigOpen && selectedApiExercise && (
                <div className="fixed inset-0 bg-white z-[110] flex flex-col max-w-md mx-auto">
                    <header className="h-16 bg-zinc-900 flex items-center px-4 shadow-md flex-shrink-0 relative">
                        <button onClick={() => { setIsExerciseConfigOpen(false); setIsExerciseSelectionOpen(true); setIsAdvancedMode(false); setAdvancedSets([{ id: 1, reps: '', carga: '', descanso: '', cadencia: '', metodo: '', notaBiomecanica: '' }]); }} className="absolute left-2 p-2 text-white hover:bg-zinc-800 transition-colors z-10"><ArrowLeft className="w-6 h-6" /></button>
                        <h1 className="text-sm font-bold uppercase tracking-widest text-white truncate w-full text-center">Configurar Exercício</h1>
                    </header>
                    <div className="flex-1 overflow-y-auto pb-24">
                        <div className="bg-zinc-100 border-b border-zinc-200">
                            {(selectedApiExercise.video || selectedApiExercise.mp4 || selectedApiExercise.url) ? <video src={selectedApiExercise.video || selectedApiExercise.mp4 || selectedApiExercise.url} className="w-full aspect-video object-cover bg-black" autoPlay loop muted playsInline /> : <div className="w-full aspect-video flex items-center justify-center bg-zinc-200"><Dumbbell className="w-12 h-12 text-zinc-400" /></div>}
                            <div className="p-5">
                                <h2 className="text-lg font-bold text-zinc-900 uppercase tracking-wide leading-tight">{selectedApiExercise.name || selectedApiExercise.nome}</h2>
                                <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest mt-1">{getCategory(selectedApiExercise)}</p>
                            </div>
                        </div>
                        <div className="px-5 pt-5 pb-2">
                            <div className="flex bg-zinc-100 border border-zinc-200 p-1">
                                <button onClick={() => setIsAdvancedMode(false)} className={`flex-1 py-2 text-[10px] uppercase font-bold tracking-widest transition-colors ${!isAdvancedMode ? 'bg-zinc-900 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-900'}`}>Modo Simples</button>
                                <button onClick={() => setIsAdvancedMode(true)} className={`flex-1 py-2 text-[10px] uppercase font-bold tracking-widest transition-colors ${isAdvancedMode ? 'bg-zinc-900 text-white shadow-sm' : 'text-zinc-500 hover:text-zinc-900'}`}>Modo Avançado</button>
                            </div>
                        </div>
                        {!isAdvancedMode ? (
                            <div className="px-5 pb-5 pt-2 grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-2"><label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-1"><Repeat className="w-3 h-3" /> Séries</label><input type="text" inputMode="decimal" placeholder="Ex: 4" value={novasSeries} onChange={(e) => setNovasSeries(e.target.value)} className="bg-zinc-100 border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-zinc-900 focus:bg-white transition-colors rounded-none placeholder-zinc-400 font-medium" /></div>
                                <div className="flex flex-col gap-2"><label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-1"><Repeat className="w-3 h-3" /> Repetições</label><input type="text" inputMode="decimal" placeholder="Ex: 10 a 12" value={novasReps} onChange={(e) => setNovasReps(e.target.value)} className="bg-zinc-100 border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-zinc-900 focus:bg-white transition-colors rounded-none placeholder-zinc-400 font-medium" /></div>
                                <div className="flex flex-col gap-2"><label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-1"><Weight className="w-3 h-3" /> Carga</label><input type="text" inputMode="decimal" placeholder="Ex: 20kg" value={novaCarga} onChange={(e) => setNovaCarga(e.target.value)} className="bg-zinc-100 border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-zinc-900 focus:bg-white transition-colors rounded-none placeholder-zinc-400 font-medium" /></div>
                                <div className="flex flex-col gap-2"><label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-1"><Timer className="w-3 h-3" /> Descanso</label><input type="text" inputMode="decimal" placeholder="Ex: 60s" value={novoDescanso} onChange={(e) => setNovoDescanso(e.target.value)} className="bg-zinc-100 border border-zinc-200 px-4 py-3 text-sm outline-none focus:border-zinc-900 focus:bg-white transition-colors rounded-none placeholder-zinc-400 font-medium" /></div>
                                <div className="flex flex-col gap-2 col-span-2 mt-2">
                                    <label className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 flex items-center gap-1"><Zap className="w-3 h-3" /> Método / Técnica</label>
                                    <div className="relative border border-zinc-200 bg-zinc-100"><select value={novoMetodo} onChange={(e) => setNovoMetodo(e.target.value)} className="w-full bg-transparent px-4 py-3 text-sm outline-none focus:ring-2 focus:ring-zinc-900 rounded-none font-bold uppercase tracking-wide text-zinc-900 appearance-none cursor-pointer">{metodosTreino.map(m => (<option key={m} value={m}>{m}</option>))}</select><div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-zinc-900"><ChevronRight className="w-5 h-5 rotate-90" /></div></div>
                                </div>
                            </div>
                        ) : (
                            <div className="px-5 pb-5 pt-2 flex flex-col gap-3">
                                {advancedSets.map((set, index) => (
                                    <div key={set.id} className="bg-zinc-50 border border-zinc-200 p-3">
                                        <div className="flex justify-between items-center mb-3"><span className="text-[10px] font-bold uppercase tracking-widest text-zinc-900">Série {index + 1}</span>{advancedSets.length > 1 && <button onClick={() => handleRemoveAdvancedSet(set.id)} className="text-zinc-400 hover:text-red-500 transition-colors p-1"><Trash2 className="w-4 h-4" /></button>}</div>
                                        <div className="flex gap-1.5">
                                            <input type="text" inputMode="decimal" placeholder="Reps" value={set.reps} onChange={(e) => handleUpdateAdvancedSet(set.id, 'reps', e.target.value)} className="w-1/4 bg-white border border-zinc-200 px-1 py-2 text-xs outline-none focus:border-zinc-900 transition-colors rounded-none placeholder-zinc-400 font-medium text-center" />
                                            <input type="text" inputMode="decimal" placeholder="Cg(kg)" value={set.carga} onChange={(e) => handleUpdateAdvancedSet(set.id, 'carga', e.target.value)} className="w-1/4 bg-white border border-zinc-200 px-1 py-2 text-xs outline-none focus:border-zinc-900 transition-colors rounded-none placeholder-zinc-400 font-medium text-center" />
                                            <input type="text" inputMode="decimal" placeholder="Desc" value={set.descanso} onChange={(e) => handleUpdateAdvancedSet(set.id, 'descanso', e.target.value)} className="w-1/4 bg-white border border-zinc-200 px-1 py-2 text-xs outline-none focus:border-zinc-900 transition-colors rounded-none placeholder-zinc-400 font-medium text-center" />
                                            <input type="text" inputMode="decimal" placeholder="Cad" value={set.cadencia || ''} onChange={(e) => handleUpdateAdvancedSet(set.id, 'cadencia', e.target.value)} className="w-1/4 bg-white border border-zinc-200 px-1 py-2 text-xs outline-none focus:border-zinc-900 transition-colors rounded-none placeholder-zinc-400 font-medium text-center" />
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 mt-2">
                                            <div className="relative border border-zinc-200 bg-white">
                                                <select value={set.tipoSerie || 'Padrão'} onChange={(e) => handleUpdateAdvancedSet(set.id, 'tipoSerie', e.target.value)} className="w-full bg-transparent px-2 py-2 text-[10px] outline-none focus:ring-1 focus:ring-zinc-900 rounded-none font-bold uppercase tracking-widest text-zinc-600 appearance-none cursor-pointer text-center">
                                                    {tiposDeSerie.map(t => (<option key={t} value={t}>{t === 'Padrão' ? '+ Tipo Série' : t}</option>))}
                                                </select><div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-zinc-400"><ChevronRight className="w-4 h-4 rotate-90" /></div>
                                            </div>
                                            <div className="relative border border-zinc-200 bg-white">
                                                <select value={set.metodo} onChange={(e) => handleUpdateAdvancedSet(set.id, 'metodo', e.target.value)} className="w-full bg-transparent px-2 py-2 text-[10px] outline-none focus:ring-1 focus:ring-zinc-900 rounded-none font-bold uppercase tracking-widest text-zinc-600 appearance-none cursor-pointer text-center">
                                                    <option value="">+ Adicionar Técnica</option>{metodosTreino.filter(m => m !== 'Padrão').map(m => (<option key={m} value={m}>{m}</option>))}
                                                </select><div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-zinc-400"><ChevronRight className="w-4 h-4 rotate-90" /></div>
                                            </div>
                                        </div>
                                        <div className="mt-2 w-full">
                                            <input type="text" placeholder="💡 Dica / Gatilho Biomecânico (Opcional)" value={set.notaBiomecanica || ''} onChange={(e) => handleUpdateAdvancedSet(set.id, 'notaBiomecanica', e.target.value)} className="w-full bg-orange-50/50 border-l-2 border-l-orange-500 border border-zinc-200 px-3 py-2 text-[10px] outline-none focus:bg-orange-50 focus:border-orange-500 transition-colors rounded-none placeholder-orange-300 font-bold uppercase tracking-widest text-zinc-700" />
                                        </div>
                                    </div>
                                ))}
                                <button onClick={handleAddAdvancedSet} className="w-full border border-dashed border-zinc-300 py-4 text-[10px] font-bold uppercase tracking-widest text-zinc-500 hover:text-zinc-900 hover:border-zinc-900 hover:bg-zinc-50 transition-colors flex items-center justify-center gap-2"><Plus className="w-4 h-4" /> Adicionar Série</button>
                            </div>
                        )}
                    </div>
                    <div className="p-4 bg-white border-t border-zinc-200 mt-auto flex-shrink-0 pb-8"><button onClick={handleSaveExerciseClick} className="w-full bg-zinc-900 text-white py-4 flex items-center justify-center gap-2 hover:bg-zinc-800 transition-colors uppercase font-bold text-xs tracking-widest shadow-md"><Check className="w-5 h-5" /> Salvar no Treino</button></div>
                </div>
            )}
        </div>
    );
}