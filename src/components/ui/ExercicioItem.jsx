import React from 'react';
import { Repeat, Weight, Timer, Zap, GripVertical } from 'lucide-react';

export function ExercicioItem({ nome, series, reps, carga, descanso, metodo, video, isAdvanced, advancedSets, rir, detalheMetodo, vincular, onEdit, onDelete, dragHandleProps }) {
    return (
        <div className="p-5 bg-white flex flex-col gap-3 border-b border-zinc-100 relative group">
            {/* Absolute positioning for actions so they don't break layout if not hovered/active on mobile, but here just right-aligned */}
            <div className="flex items-start gap-4">
                {dragHandleProps && (
                    <div {...dragHandleProps} className="mt-4 -ml-2 p-1 text-zinc-300 hover:text-zinc-500 cursor-grab active:cursor-grabbing flex-shrink-0">
                        <GripVertical className="w-5 h-5" />
                    </div>
                )}
                {video ? (
                    <div className="w-16 h-16 flex-shrink-0 bg-zinc-100 border border-zinc-900 overflow-hidden">
                        <video autoPlay loop muted playsInline className="w-full h-full object-cover">
                            <source src={video} type="video/mp4" />
                        </video>
                    </div>
                ) : (
                    <div className="w-2 h-16 flex-shrink-0 bg-zinc-900" />
                )}

                <div className="flex flex-col flex-1 pt-1 w-full">
                    <div className="flex justify-between items-start">
                        <h3 className="font-bold text-zinc-900 uppercase tracking-wide text-sm leading-tight pr-2">{nome}</h3>
                        <div className="flex items-center gap-1 flex-shrink-0 -mt-1 -mr-2">
                            {onEdit && (
                                <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="p-1.5 text-zinc-400 hover:text-zinc-900 transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                                </button>
                            )}
                            {onDelete && (
                                <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-1.5 text-zinc-400 hover:text-red-500 transition-colors">
                                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                                </button>
                            )}
                        </div>
                    </div>

                    {isAdvanced && advancedSets && advancedSets.length > 0 ? (
                        <div className="flex flex-col gap-1.5 mt-3 w-full">
                            {advancedSets.map((set, idx) => (
                                <div key={set.id} className={`border px-2 py-1.5 flex flex-col gap-1 ${set.metodo ? 'bg-zinc-900 border-zinc-900' : 'bg-zinc-50 border-zinc-200'}`}>
                                    <div className="flex items-center gap-3 w-full">
                                        <div className="w-16 flex-shrink-0 flex flex-col">
                                            <span className={`text-[10px] uppercase font-bold ${set.metodo ? 'text-white' : 'text-zinc-900'}`}>Sér {idx + 1}</span>
                                            {set.tipoSerie && set.tipoSerie !== 'Padrão' && <span className="text-[9px] font-bold tracking-tight mt-0.5 leading-none whitespace-nowrap overflow-visible" style={{ color: set.tipoSerie.includes('Warm-up') ? '#22c55e' : set.tipoSerie.includes('Feeder') ? '#eab308' : set.tipoSerie.includes('Top Set') ? '#ef4444' : '#3b82f6' }}>{set.tipoSerie}</span>}
                                            {set.metodo && <span className="text-[8px] text-zinc-300 uppercase tracking-widest leading-tight mt-0.5">{set.metodo}</span>}
                                        </div>
                                        <div className="flex flex-1 justify-between gap-1 flex-wrap text-right">
                                            <span className={`text-[9px] uppercase tracking-wider font-bold ${set.metodo ? 'text-zinc-400' : 'text-zinc-500'}`}>Rep: <span className={set.metodo ? 'text-white' : 'text-zinc-900'}>{set.reps || '-'}</span></span>
                                            <span className={`text-[9px] uppercase tracking-wider font-bold ${set.metodo ? 'text-zinc-400' : 'text-zinc-500'}`}>Cg: <span className={set.metodo ? 'text-white' : 'text-zinc-900'}>{set.carga || '-'}</span></span>
                                            <span className={`text-[9px] uppercase tracking-wider font-bold ${set.metodo ? 'text-zinc-400' : 'text-zinc-500'}`}>Desc: <span className={set.metodo ? 'text-white' : 'text-zinc-900'}>{set.descanso || '-'}</span></span>
                                            <span className={`text-[9px] uppercase tracking-wider font-bold ${set.metodo ? 'text-zinc-400' : 'text-zinc-500'}`}>TUT: <span className={set.metodo ? 'text-white' : 'text-zinc-900'}>{set.cadencia || '-'}</span></span>
                                        </div>
                                    </div>
                                    {(set.rir || set.detalheMetodo) && (
                                        <div className="flex flex-col gap-0.5 mt-1 border-t border-zinc-200/20 pt-1">
                                            {set.rir && <span className={`text-[9px] uppercase tracking-widest ${set.metodo ? 'text-zinc-400' : 'text-zinc-500'}`}>RIR: <span className={set.metodo ? 'text-white' : 'text-zinc-900 font-bold'}>{set.rir}</span></span>}
                                            {set.detalheMetodo && <span className={`text-[9px] uppercase tracking-widest ${set.metodo ? 'text-orange-400' : 'text-orange-600'}`}>↳ {set.detalheMetodo}</span>}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-wrap gap-2 mt-3">
                            <div className="bg-zinc-100 px-2 py-1 flex items-center gap-1 border border-zinc-200">
                                <Repeat className="w-3 h-3 text-zinc-500" />
                                <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-500">Sér: <span className="text-zinc-900">{series}</span></span>
                            </div>
                            <div className="bg-zinc-100 px-2 py-1 flex items-center gap-1 border border-zinc-200">
                                <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-500">Rep: <span className="text-zinc-900">{reps}</span></span>
                            </div>
                            <div className="bg-zinc-100 px-2 py-1 flex items-center gap-1 border border-zinc-200">
                                <Weight className="w-3 h-3 text-zinc-500" />
                                <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-500">Cg: <span className="text-zinc-900">{carga}</span></span>
                            </div>
                            <div className="bg-zinc-100 px-2 py-1 flex items-center gap-1 border border-zinc-200">
                                <Timer className="w-3 h-3 text-zinc-500" />
                                <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-500">Desc: <span className="text-zinc-900">{descanso}</span></span>
                            </div>

                            {metodo && metodo !== 'Padrão' && metodo !== 'Varia' && (
                                <div className="bg-zinc-900 px-2 py-1 flex items-center gap-1 border border-zinc-900 w-full mt-1">
                                    <Zap className="w-3 h-3 text-white fill-white" />
                                    <span className="text-[10px] uppercase tracking-wider font-bold text-white">Técnica: {metodo}</span>
                                </div>
                            )}
                            {rir && rir !== '-' && rir !== 'Varia' && (
                                <div className="bg-zinc-100 px-2 py-1 flex items-center gap-1 border border-zinc-200 w-full mt-1">
                                    <span className="text-[10px] uppercase tracking-wider font-bold text-zinc-500">RIR: <span className="text-zinc-900">{rir}</span></span>
                                </div>
                            )}
                            {detalheMetodo && detalheMetodo !== '-' && detalheMetodo !== 'Varia' && (
                                <div className="bg-orange-50 px-2 py-1 flex items-center gap-1 border border-orange-200 w-full mt-1">
                                    <span className="text-[10px] uppercase tracking-wider font-bold text-orange-600">↳ {detalheMetodo}</span>
                                </div>
                            )}
                        </div>
                    )}
                    {vincular && (
                        <div className="mt-3 flex items-center gap-2 bg-zinc-50 px-2 py-1.5 border border-zinc-200 rounded-sm w-fit border-l-2 border-l-zinc-900">
                            <span style={{ fontSize: '10px' }}>🔗</span>
                            <span className="text-[9px] uppercase tracking-widest font-bold text-zinc-600">Bi-Set (Conectado ao Próximo)</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
