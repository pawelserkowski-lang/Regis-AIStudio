import React, { useState } from 'react';
import { MonitorPlay, RefreshCw, ExternalLink, Globe } from 'lucide-react';

interface Props { lang: 'PL' | 'EN'; }

const LivePreview: React.FC<Props> = ({ lang }) => {
    // Default to common dev ports
    const [url, setUrl] = useState('http://localhost:3000');
    const [key, setKey] = useState(0); // Force iframe refresh

    const t = lang === 'PL'
        ? { title: "PODGLĄD NA ŻYWO", desc: "Podgląd lokalnej aplikacji webowej.", refresh: "Odśwież", open: "Otwórz w nowym oknie", go: "Jedź" }
        : { title: "LIVE VIEW", desc: "Local web application preview.", refresh: "Refresh", open: "Open in new tab", go: "Go" };

    return (
        <div className="h-full flex flex-col p-6 bg-black/20">
            <header className="mb-6 flex flex-col md:flex-row justify-between items-center gap-4 bg-black/40 p-4 rounded-2xl border border-white/5">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                        <MonitorPlay className="text-emerald-500" size={28} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white font-mono tracking-tight">{t.title}</h1>
                        <p className="text-xs text-slate-400">{t.desc}</p>
                    </div>
                </div>
                
                <div className="flex gap-2 w-full md:w-auto items-center">
                    <div className="relative flex-1 md:w-80 group">
                        <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-500 transition-colors" size={16} />
                        <input
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && setKey(k => k + 1)}
                            className="w-full bg-black/50 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-slate-200 font-mono text-sm focus:border-emerald-500 outline-none transition-all"
                        />
                    </div>
                    <button onClick={() => setKey(k => k + 1)} className="p-2.5 bg-white/5 hover:bg-emerald-600 rounded-xl text-white transition-colors border border-white/5" title={t.refresh}>
                        <RefreshCw size={20} />
                    </button>
                    <a href={url} target="_blank" rel="noreferrer" className="p-2.5 bg-white/5 hover:bg-blue-600 rounded-xl text-white transition-colors border border-white/5" title={t.open}>
                        <ExternalLink size={20} />
                    </a>
                </div>
            </header>
            
            <div className="flex-1 bg-white rounded-xl overflow-hidden border border-white/10 shadow-2xl relative">
                <div className="absolute inset-0 flex items-center justify-center text-slate-400 bg-slate-900 -z-10">
                    Loading {url}...
                </div>
                <iframe
                    key={key}
                    src={url}
                    className="w-full h-full"
                    title="Live Preview"
                    sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-presentation"
                    allow="accelerometer; camera; encrypted-media; geolocation; gyroscope; microphone; midi; clipboard-read; clipboard-write"
                />
            </div>
        </div>
    );
};
export default LivePreview;