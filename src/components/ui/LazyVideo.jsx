import React from 'react';
import { Dumbbell, Activity, Zap, Weight } from 'lucide-react';

// 🚀 Componente Anti-Crash: Estratégia de Ícones Inteligentes (Zero Video na Listagem)
export const getMuscleIcon = (muscle) => {
    const m = (muscle || '').toLowerCase();
    if (m.includes('peito')) return Activity;
    if (m.includes('costa') || m.includes('dorsal')) return Activity;
    if (m.includes('perna') || m.includes('coxa') || m.includes('gluteo') || m.includes('quadriceps')) return Activity;
    if (m.includes('ombro') || m.includes('deltoide')) return Weight;
    if (m.includes('braco') || m.includes('biceps') || m.includes('triceps')) return Zap;
    if (m.includes('abdomen') || m.includes('core')) return Activity;
    return Dumbbell;
};

export const LazyVideo = ({ src, muscle, className, style }) => {
    const Icon = getMuscleIcon(muscle);

    return (
        <div className={className} style={{ ...style, position: 'relative', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#27272a' }}>
            <div className="flex flex-col items-center justify-center w-full gap-1 opacity-40">
                <Icon className="w-6 h-6 text-zinc-400" />
                <span className="text-[7px] font-black uppercase tracking-tighter text-zinc-500">{muscle || 'Treino'}</span>
            </div>
        </div>
    );
};
