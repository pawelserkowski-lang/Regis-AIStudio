import React, { useState, useEffect } from 'react';
import { MonitorPlay, RefreshCw, ExternalLink, Globe, AlertCircle } from 'lucide-react';

interface Props { lang: 'PL' | 'EN'; }

const STORAGE_KEY = 'regis_live_preview_url';
const DEFAULT_URL = 'http://localhost:3000';

const LivePreview: React.FC<Props> = ({ lang }) => {
    // Load URL from localStorage or use default
    const [url, setUrl] = useState(() => {
        try {
            return localStorage.getItem(STORAGE_KEY) || DEFAULT_URL;
        } catch {
            return DEFAULT_URL;
        }
    });
    const [key, setKey] = useState(0); // Force iframe refresh
    const [loadError, setLoadError] = useState(false);

    // Persist URL to localStorage
    useEffect(() => {
        try {
            localStorage.setItem(STORAGE_KEY, url);
        } catch (error) {
            console.error('Failed to save preview URL to localStorage:', error);
        }
    }, [url]);

    const t = lang === 'PL'
        ? {
            title: "PODGLĄD NA ŻYWO",
            desc: "Podgląd lokalnej aplikacji webowej.",
            refresh: "Odśwież",
            open: "Otwórz w nowym oknie",
            go: "Jedź",
            errorTitle: "Nie można połączyć",
            errorDesc: "Serwer odrzucił połączenie. Upewnij się, że aplikacja działa na:",
            errorTip: "Uruchom serwer deweloperski (np. npm run dev) lub zmień URL powyżej."
        }
        : {
            title: "LIVE VIEW",
            desc: "Local web application preview.",
            refresh: "Refresh",
            open: "Open in new tab",
            go: "Go",
            errorTitle: "Cannot Connect",
            errorDesc: "Server refused connection. Make sure your application is running on:",
            errorTip: "Start your dev server (e.g., npm run dev) or change the URL above."
        };

    const handleRefresh = () => {
        setLoadError(false);
        setKey(k => k + 1);
    };

    const handleUrlChange = (newUrl: string) => {
        setUrl(newUrl);
        setLoadError(false);
    };

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
                            onChange={(e) => handleUrlChange(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleRefresh()}
                            className="w-full bg-black/50 border border-white/10 rounded-xl pl-10 pr-4 py-2.5 text-slate-200 font-mono text-sm focus:border-emerald-500 outline-none transition-all"
                        />
                    </div>
                    <button onClick={handleRefresh} className="p-2.5 bg-white/5 hover:bg-emerald-600 rounded-xl text-white transition-colors border border-white/5" title={t.refresh}>
                        <RefreshCw size={20} />
                    </button>
                    <a href={url} target="_blank" rel="noreferrer" className="p-2.5 bg-white/5 hover:bg-blue-600 rounded-xl text-white transition-colors border border-white/5" title={t.open}>
                        <ExternalLink size={20} />
                    </a>
                </div>
            </header>
            
            <div className="flex-1 bg-white rounded-xl overflow-hidden border border-white/10 shadow-2xl relative">
                {loadError ? (
                    <div className="absolute inset-0 flex items-center justify-center bg-slate-900">
                        <div className="text-center p-8 max-w-md">
                            <div className="mb-4 inline-flex p-4 bg-red-500/10 rounded-full">
                                <AlertCircle className="text-red-500" size={48} />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">{t.errorTitle}</h3>
                            <p className="text-slate-400 mb-4">{t.errorDesc}</p>
                            <code className="block bg-black/50 text-emerald-400 px-4 py-2 rounded-lg mb-4 font-mono text-sm">
                                {url}
                            </code>
                            <p className="text-sm text-slate-500">{t.errorTip}</p>
                        </div>
                    </div>
                ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-slate-400 bg-slate-900 -z-10">
                        Loading {url}...
                    </div>
                )}
                <iframe
                    key={key}
                    src={url}
                    className="w-full h-full"
                    title="Live Preview"
                    sandbox="allow-same-origin allow-scripts allow-forms allow-popups allow-modals allow-presentation"
                    allow="accelerometer; camera; encrypted-media; geolocation; gyroscope; microphone; midi; clipboard-read; clipboard-write"
                    onError={() => setLoadError(true)}
                />
            </div>
        </div>
    );
};
export default LivePreview;