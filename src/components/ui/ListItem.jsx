import React from 'react';
import { ChevronRight } from 'lucide-react';

export function ListItem({ title, subtitle, topText, onClick, icon: Icon, locked = false, tags = [], rightContent = null, onEdit, onDelete }) {
    return (
        <div
            onClick={locked ? undefined : onClick}
            className={`p-5 flex justify-between items-center bg-white border-b border-zinc-100 transition-colors ${locked ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer hover:bg-zinc-50'}`}
        >
            <div className="flex items-center gap-4">
                {Icon && (
                    <div className="w-12 h-12 bg-zinc-100 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-6 h-6 text-zinc-700" />
                    </div>
                )}
                <div className="flex flex-col">
                    {topText && <p className="text-[10px] font-bold text-zinc-400 mb-1 uppercase tracking-widest">{topText}</p>}
                    <h3 className="font-semibold text-zinc-900 uppercase tracking-wide text-sm">{title}</h3>
                    {subtitle && <p className={`text-[11px] font-bold mt-1 uppercase tracking-wider ${locked ? 'text-red-500' : 'text-zinc-400'}`}>{subtitle}</p>}
                    {tags && tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                            {tags.map((tag, idx) => (
                                <span key={idx} className="text-[9px] uppercase font-bold tracking-widest text-zinc-600 bg-zinc-200 px-2 py-0.5">{tag}</span>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            <div className="flex items-center gap-2">
                {onEdit && (
                    <button onClick={(e) => { e.stopPropagation(); onEdit(); }} className="p-2 text-zinc-400 hover:text-zinc-900 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                    </button>
                )}
                {onDelete && (
                    <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-2 text-zinc-400 hover:text-red-500 transition-colors">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                    </button>
                )}
                {rightContent ? rightContent : (!locked && !onEdit && !onDelete && <ChevronRight className="w-5 h-5 text-zinc-300 flex-shrink-0" />)}
            </div>
        </div>
    );
}
