// Zmodyfikowany plik: components/BuildTools.tsx

import React, { useState } from 'react';
import { Bot, Terminal, Code, Sparkles, ExternalLink, Hammer, Triangle, Globe, GitBranch, Activity, Cpu, FolderOpen, FileText } from 'lucide-react';

// Dodajemy interfejs dla obsługi plików (TypeScript może tego nie mieć w standardzie jeszcze)
interface FileSystemHandle {
  kind: 'file' | 'directory';
  name: string;
}

const BuildTools: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'JULES' | 'STUDIO' | 'VERCEL' | 'LOCAL'>('JULES');
    const [mountedFolder, setMountedFolder] = useState<string | null>(null);
    const [folderContent, setFolderContent] = useState<string[]>([]);

    // --- NEW: Folder Picker Handler ---
    const handleOpenFolder = async () => {
        try {
            // @ts-ignore - API jest eksperymentalne, ignorujemy błąd TS
            const dirHandle = await window.showDirectoryPicker();
            setMountedFolder(dirHandle.name);
            
            const files: string[] = [];
            // @ts-ignore
            for await (const entry of dirHandle.values()) {
                if (entry.kind === 'file') {
                    files.push(entry.name);
                }
            }
            setFolderContent(files);
        } catch (err) {
            console.error("Access denied or cancelled", err);
        }
    };

    return (
        <div className="h-full flex flex-col bg-black/40 backdrop-blur-sm">
            <header className="px-8 py-6 border-b border-white/10 flex items-center justify-between bg-black/20">
                <div>
                    <h1 className="text-2xl font-bold text-white font-mono tracking-tight flex items-center gap-3">
                        <Hammer className="text-emerald-500" size={24} />
                        BUILD_MODE
                    </h1>
                    <p className="text-slate-400 text-sm mt-1 font-mono">Advanced development and prompt engineering environment.</p>
                </div>
                <div className="flex bg-black/50 p-1 rounded-lg border border-white/10 shadow-inner">
                    <button 
                        onClick={() => setActiveTab('JULES')}
                        className={`px-4 py-2 rounded-md text-sm font-bold font-mono transition-all flex items-center gap-2 ${activeTab === 'JULES' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        <Code size={16} /> JULES
                    </button>
                    {/* ... (pozostałe przyciski bez zmian) ... */}
                    
                    {/* NEW BUTTON */}
                    <button 
                        onClick={() => setActiveTab('LOCAL')}
                        className={`px-4 py-2 rounded-md text-sm font-bold font-mono transition-all flex items-center gap-2 ${activeTab === 'LOCAL' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        <FolderOpen size={16} /> LOCAL_FS
                    </button>
                </div>
            </header>

            <div className="flex-1 overflow-hidden relative p-6">
                {/* ... (istniejące taby JULES, STUDIO, VERCEL - ukryte dla czytelności) ... */}

                {/* NEW TAB CONTENT */}
                {activeTab === 'LOCAL' && (
                    <div className="h-full flex flex-col items-center justify-center animate-in fade-in zoom-in-95 duration-300">
                        <div className="max-w-2xl w-full bg-black/80 border border-white/10 rounded-3xl p-12 flex flex-col items-center text-center shadow-2xl relative overflow-hidden">
                             
                             <div className="w-24 h-24 bg-gradient-to-br from-amber-600 to-orange-700 rounded-3xl flex items-center justify-center mb-8 shadow-[0_0_40px_rgba(245,158,11,0.3)] relative z-10 border border-white/10">
                                <FolderOpen size={48} className="text-white drop-shadow-md" />
                             </div>

                             <h2 className="text-3xl font-bold text-white mb-4 relative z-10 tracking-tight font-mono">Mount Local Context</h2>
                             <p className="text-slate-400 text-base mb-8 max-w-lg leading-relaxed relative z-10">
                                Securely mount a local directory to Regis using the File System Access API. 
                                This allows the AI to analyze your local codebase without uploading it to the cloud.
                             </p>

                             {!mountedFolder ? (
                                 <button 
                                    onClick={handleOpenFolder}
                                    className="px-8 py-4 bg-white text-black rounded-xl font-bold text-sm tracking-wide uppercase flex items-center gap-3 hover:bg-amber-400 hover:scale-[1.02] transition-all shadow-[0_0_20px_rgba(255,255,255,0.15)] relative z-10"
                                >
                                    <FolderOpen size={18} /> Select Working Directory
                                </button>
                             ) : (
                                 <div className="w-full bg-slate-900/50 rounded-xl border border-white/10 p-4 text-left overflow-hidden flex flex-col max-h-[300px]">
                                     <div className="flex justify-between items-center mb-4 border-b border-white/5 pb-2">
                                        <span className="text-emerald-400 font-mono text-sm font-bold flex items-center gap-2">
                                            <FolderOpen size={14}/> {mountedFolder}
                                        </span>
                                        <button onClick={() => setMountedFolder(null)} className="text-xs text-red-400 hover:underline">Unmount</button>
                                     </div>
                                     <div className="overflow-y-auto scrollbar-thin scrollbar-thumb-slate-700 space-y-1">
                                         {folderContent.map((file, idx) => (
                                             <div key={idx} className="flex items-center gap-2 text-slate-300 text-xs font-mono p-1 hover:bg-white/5 rounded">
                                                 <FileText size={12} className="text-slate-500" /> {file}
                                             </div>
                                         ))}
                                     </div>
                                 </div>
                             )}

                             <div className="mt-8 flex items-center gap-2 text-[10px] text-amber-500/80 font-mono relative z-10">
                                <Activity size={12} /> BROWSER SANDBOX: READ-ONLY ACCESS GRANTED
                             </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BuildTools;