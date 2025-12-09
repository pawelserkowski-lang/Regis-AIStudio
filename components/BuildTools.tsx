import React, { useState } from 'react';
import { Bot, Terminal, Code, Sparkles, ExternalLink, Hammer, Triangle, Globe, GitBranch, Activity, Cpu } from 'lucide-react';

const BuildTools: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'JULES' | 'STUDIO' | 'VERCEL'>('JULES');

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
                        <Code size={16} /> GOOGLE_JULES
                    </button>
                    <button 
                        onClick={() => setActiveTab('STUDIO')}
                        className={`px-4 py-2 rounded-md text-sm font-bold font-mono transition-all flex items-center gap-2 ${activeTab === 'STUDIO' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        <Sparkles size={16} /> AI_STUDIO
                    </button>
                    <button 
                        onClick={() => setActiveTab('VERCEL')}
                        className={`px-4 py-2 rounded-md text-sm font-bold font-mono transition-all flex items-center gap-2 ${activeTab === 'VERCEL' ? 'bg-white/10 text-white border border-white/30 shadow-sm' : 'text-slate-500 hover:text-slate-300'}`}
                    >
                        <Triangle size={16} className={activeTab === 'VERCEL' ? "fill-white" : ""} /> VERCEL_EDGE
                    </button>
                </div>
            </header>

            <div className="flex-1 overflow-hidden relative">
                {activeTab === 'JULES' && (
                    <div className="h-full flex flex-col p-6 items-center justify-center text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="w-full max-w-4xl bg-[#0d1117] border border-slate-700 rounded-xl overflow-hidden shadow-2xl flex flex-col h-[70vh]">
                            {/* Fake Terminal Header */}
                            <div className="bg-slate-800 p-2 flex items-center gap-2 px-4 border-b border-slate-700">
                                <div className="flex gap-1.5">
                                    <div className="w-3 h-3 rounded-full bg-red-500"></div>
                                    <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                                    <div className="w-3 h-3 rounded-full bg-green-500"></div>
                                </div>
                                <div className="ml-4 text-xs text-slate-400 font-mono">jules_agent — python — 80x24</div>
                            </div>
                            
                            {/* Terminal Body */}
                            <div className="flex-1 p-6 font-mono text-left text-sm space-y-2 overflow-y-auto bg-[#0d1117]">
                                <div className="text-emerald-400">$ init jules_agent --mode=architect</div>
                                <div className="text-slate-300">[INFO] Loading Cognitive Core (Gemini 3 Pro)... OK</div>
                                <div className="text-slate-300">[INFO] Mounting File System... OK</div>
                                <div className="text-slate-300">[INFO] Connecting to GitHub Copilot Protocol... OK</div>
                                <div className="text-blue-400 mt-4">Jules Agent v1.0.4 [Ready]</div>
                                <div className="text-slate-500">Waiting for code task...</div>
                                <div className="mt-4 animate-pulse text-emerald-500">_</div>
                            </div>

                            <div className="p-4 border-t border-slate-700 bg-slate-900 flex gap-2">
                                <span className="text-emerald-500 font-bold">{'>'}</span>
                                <input type="text" placeholder="Describe a coding task..." className="bg-transparent w-full text-slate-200 outline-none font-mono text-sm" />
                            </div>
                        </div>
                        <p className="mt-6 text-slate-500 text-xs font-mono bg-black/40 px-3 py-1 rounded-full border border-white/5">
                            * Simulation Interface. Internal Auth Required.
                        </p>
                    </div>
                )}

                {activeTab === 'STUDIO' && (
                    <div className="h-full w-full flex items-center justify-center p-6 animate-in fade-in zoom-in-95 duration-300">
                        <div className="max-w-2xl w-full bg-black/80 border border-white/10 rounded-3xl p-12 flex flex-col items-center text-center shadow-2xl relative overflow-hidden group">
                             {/* Background Effects */}
                             <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-blue-900/20 via-black to-black opacity-50"></div>
                             
                             <div className="w-24 h-24 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-3xl flex items-center justify-center mb-8 shadow-[0_0_40px_rgba(37,99,235,0.3)] relative z-10 border border-white/10">
                                <Sparkles size={48} className="text-white drop-shadow-md" />
                             </div>

                             <h2 className="text-3xl font-bold text-white mb-4 relative z-10 tracking-tight font-mono">Google AI Studio</h2>
                             <p className="text-slate-400 text-base mb-10 max-w-lg leading-relaxed relative z-10">
                                Access the dedicated rapid prototyping environment for Gemini. 
                                Due to security protocols (X-Frame-Options), the studio must be launched in a secure external window.
                             </p>

                             <a 
                                href="https://aistudio.google.com/" 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="px-8 py-4 bg-white text-black rounded-xl font-bold text-sm tracking-wide uppercase flex items-center gap-3 hover:bg-slate-200 hover:scale-[1.02] transition-all shadow-[0_0_20px_rgba(255,255,255,0.15)] relative z-10 group/btn"
                            >
                                Launch Environment <ExternalLink size={18} className="text-slate-600 group-hover/btn:text-black transition-colors" />
                            </a>

                             <div className="mt-12 flex items-center gap-2 text-[10px] text-amber-500/80 font-mono relative z-10 bg-amber-900/10 px-3 py-1.5 rounded border border-amber-500/20">
                                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></span>
                                EMBEDDING RESTRICTED BY ORIGIN POLICY
                             </div>
                        </div>
                    </div>
                )}

                {activeTab === 'VERCEL' && (
                    <div className="h-full w-full flex items-center justify-center p-6 animate-in fade-in zoom-in-95 duration-300">
                        <div className="max-w-3xl w-full bg-black border border-white/10 rounded-2xl overflow-hidden shadow-2xl relative flex flex-col">
                            {/* Vercel Header */}
                            <div className="bg-black p-6 border-b border-white/10 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.2)]">
                                        <Triangle size={20} className="text-black fill-black" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
                                            Vercel Platform <span className="px-2 py-0.5 rounded-full bg-white/10 text-[10px] text-zinc-300 font-mono">PRO</span>
                                        </h2>
                                        <p className="text-xs text-zinc-500 font-mono tracking-wide">NEXT.JS // EDGE_FUNCTIONS // ANALYTICS</p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                     <a 
                                        href="https://vercel.com/dashboard" 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="px-4 py-2 border border-white/20 rounded-md text-sm text-zinc-300 hover:text-white hover:border-white transition-colors flex items-center gap-2"
                                     >
                                         Dashboard <ExternalLink size={12} />
                                     </a>
                                     <a 
                                        href="https://vercel.com/new" 
                                        target="_blank"
                                        rel="noopener noreferrer" 
                                        className="px-4 py-2 bg-white text-black rounded-md text-sm font-bold hover:bg-zinc-200 transition-colors shadow-[0_0_15px_rgba(255,255,255,0.1)]"
                                     >
                                        Deploy
                                     </a>
                                </div>
                            </div>
                            
                            {/* Vercel Content */}
                            <div className="p-8 bg-zinc-950 flex-1 relative">
                                {/* Grid Stats */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                                    <div className="bg-black border border-white/10 p-4 rounded-lg hover:border-white/30 transition-colors">
                                        <div className="text-zinc-500 text-xs font-mono mb-2 flex items-center gap-2"><Globe size={12}/> PROJECTS</div>
                                        <div className="text-2xl font-bold text-white tracking-tight">3 Active</div>
                                    </div>
                                    <div className="bg-black border border-white/10 p-4 rounded-lg hover:border-white/30 transition-colors">
                                        <div className="text-zinc-500 text-xs font-mono mb-2 flex items-center gap-2"><Activity size={12}/> TOTAL_REQUESTS</div>
                                        <div className="text-2xl font-bold text-white tracking-tight">24.5k</div>
                                    </div>
                                    <div className="bg-black border border-white/10 p-4 rounded-lg hover:border-white/30 transition-colors">
                                        {/* Added Cpu import to fix missing name error */}
                                        <div className="text-zinc-500 text-xs font-mono mb-2 flex items-center gap-2"><Cpu size={12}/> EDGE_LATENCY</div>
                                        <div className="text-2xl font-bold text-emerald-400 tracking-tight">45ms</div>
                                    </div>
                                </div>

                                {/* Deployment List */}
                                <div className="space-y-3">
                                     <div className="text-zinc-500 text-xs font-mono uppercase tracking-wider mb-2">Recent Deployments</div>
                                     
                                     {/* Mock Deployment Item 1 */}
                                     <div className="flex items-center justify-between p-4 border border-white/5 rounded-lg bg-black/50 hover:border-white/20 transition-colors group cursor-pointer relative overflow-hidden">
                                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-500"></div>
                                        <div className="flex items-center gap-4">
                                            <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                                                <Triangle size={12} className="text-emerald-500 fill-emerald-500" />
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-white group-hover:underline decoration-zinc-600 underline-offset-4 font-mono">regis-kernel-v1</div>
                                                <div className="text-xs text-zinc-500 flex items-center gap-2 mt-1">
                                                    <GitBranch size={10} /> 
                                                    <span>main</span>
                                                    <span className="text-zinc-700">•</span>
                                                    <span>git-3f82a9</span>
                                                    <span className="text-zinc-700">•</span>
                                                    <span>2m ago</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right hidden sm:block">
                                                <div className="text-xs text-white font-medium">Ready</div>
                                                <div className="text-[10px] text-zinc-500 font-mono">Production</div>
                                            </div>
                                            <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)] animate-pulse"></div>
                                        </div>
                                     </div>

                                     {/* Mock Deployment Item 2 */}
                                     <div className="flex items-center justify-between p-4 border border-white/5 rounded-lg bg-black/50 hover:border-white/20 transition-colors group cursor-pointer opacity-60 hover:opacity-100">
                                        <div className="flex items-center gap-4">
                                            <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center border border-white/5">
                                                <Triangle size={12} className="text-zinc-500" />
                                            </div>
                                            <div>
                                                <div className="text-sm font-bold text-zinc-300 font-mono">eps-landing-page</div>
                                                <div className="text-xs text-zinc-600 flex items-center gap-2 mt-1">
                                                    <GitBranch size={10} /> 
                                                    <span>dev</span>
                                                    <span className="text-zinc-700">•</span>
                                                    <span>4h ago</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <div className="text-right hidden sm:block">
                                                <div className="text-xs text-zinc-400">Ready</div>
                                                <div className="text-[10px] text-zinc-700 font-mono">Preview</div>
                                            </div>
                                            <div className="w-2 h-2 rounded-full bg-zinc-600"></div>
                                        </div>
                                     </div>
                                </div>
                            </div>
                            
                            {/* Footer */}
                            <div className="bg-black p-3 border-t border-white/10 flex justify-between items-center text-[10px] text-zinc-600 font-mono uppercase tracking-widest">
                                <span>Integration: GitHub</span>
                                <span className="flex items-center gap-1.5"><div className="w-1.5 h-1.5 bg-green-500 rounded-full"></div> All Systems Operational</span>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BuildTools;