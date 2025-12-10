import React, { useState } from 'react';
import { Code, Sparkles, Hammer, Triangle, FolderOpen, FileText, HardDrive, CheckCircle } from 'lucide-react';

// Interfejs propsów dla BuildTools
interface BuildToolsProps {
    onMount?: (handle: any, files: string[]) => void;
    currentHandle?: any;
    currentFiles?: string[];
}

const BuildTools: React.FC<BuildToolsProps> = ({ onMount, currentHandle, currentFiles = [] }) => {
    // Używamy propsów jeśli są, lub lokalnego stanu jako fallback (dla testów)
    const [activeTab, setActiveTab] = useState<'JULES' | 'STUDIO' | 'VERCEL' | 'LOCAL'>('LOCAL');
    
    // --- Handler ---
    const handleOpenFolder = async () => {
        try {
            // @ts-ignore
            const dirHandle = await window.showDirectoryPicker({ mode: 'readwrite' });
            const files: string[] = [];
            // @ts-ignore
            for await (const entry of dirHandle.values()) {
                if (entry.kind === 'file' && !entry.name.startsWith('.') && !entry.name.includes('lock')) {
                    files.push(entry.name);
                }
            }
            
            // Przekazujemy dane w górę do App.tsx
            if (onMount) {
                onMount(dirHandle, files);
            }
        } catch (err) {
            console.error("Access denied", err);
        }
    };

    const mountedName = currentHandle ? currentHandle.name : null;
    const filesToList = currentFiles;

    return (
        <div className="h-full flex flex-col bg-black/40 backdrop-blur-sm">
            {/* Header bez zmian... */}
            <header className="px-8 py-6 border-b border-white/10 flex items-center justify-between bg-black/20">
                <div>
                    <h1 className="text-2xl font-bold text-white font-mono tracking-tight flex items-center gap-3">
                        <Hammer className="text-emerald-500" size={24} />
                        BUILD_MODE
                    </h1>
                    <p className="text-slate-400 text-sm mt-1 font-mono">Development environment.</p>
                </div>
                {/* ...Przyciski nawigacji... */}
            </header>

            <div className="flex-1 overflow-hidden relative">
                {activeTab === 'LOCAL' && (
                    <div className="h-full w-full flex items-center justify-center p-6 animate-in fade-in zoom-in-95 duration-300">
                        <div className="max-w-2xl w-full bg-black/80 border border-white/10 rounded-3xl p-8 flex flex-col items-center text-center shadow-2xl relative overflow-hidden">
                             
                             <div className="absolute inset-0 bg-gradient-to-b from-amber-900/10 to-black opacity-50 pointer-events-none"></div>

                             <div className={`w-20 h-20 rounded-2xl flex items-center justify-center mb-6 shadow-lg border relative z-10 transition-colors ${mountedName ? 'bg-emerald-900/20 border-emerald-500/30' : 'bg-amber-900/20 border-amber-500/20'}`}>
                                {mountedName ? <CheckCircle size={40} className="text-emerald-500" /> : <FolderOpen size={40} className="text-amber-500" />}
                             </div>

                             <h2 className="text-2xl font-bold text-white mb-2 relative z-10 font-mono">
                                 {mountedName ? 'FILE SYSTEM LINKED' : 'MOUNT LOCAL CONTEXT'}
                             </h2>
                             
                             {!mountedName ? (
                                 <button 
                                    onClick={handleOpenFolder}
                                    className="mt-6 px-8 py-4 bg-white text-black rounded-xl font-bold text-sm tracking-wide uppercase flex items-center gap-3 hover:bg-amber-400 transition-all shadow-xl relative z-10"
                                >
                                    <FolderOpen size={18} /> Select Directory
                                </button>
                             ) : (
                                 <div className="w-full mt-6 relative z-10 animate-in slide-in-from-bottom-2">
                                     <div className="bg-slate-900/80 rounded-xl border border-emerald-500/30 overflow-hidden flex flex-col max-h-[300px]">
                                         <div className="flex justify-between items-center p-3 border-b border-white/5 bg-emerald-900/10">
                                            <span className="text-emerald-400 font-mono text-xs font-bold flex items-center gap-2">
                                                <HardDrive size={12}/> {mountedName}
                                            </span>
                                            <span className="text-[10px] text-emerald-500/50 uppercase tracking-wider">Mounted Read/Write</span>
                                         </div>
                                         <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 p-2 space-y-1 text-left">
                                             {filesToList.map((file, idx) => (
                                                 <div key={idx} className="flex items-center gap-3 text-slate-300 text-xs font-mono p-2 hover:bg-white/5 rounded transition-colors border border-transparent hover:border-white/5">
                                                     <FileText size={14} className="text-slate-500" /> {file}
                                                 </div>
                                             ))}
                                         </div>
                                     </div>
                                 </div>
                             )}
                        </div>
                    </div>
                )}
                {/* ...Reszta tabów bez zmian... */}
            </div>
        </div>
    );
};

export default BuildTools;