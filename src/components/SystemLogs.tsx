import React, { useEffect, useState } from 'react';
import { ChevronDown, ChevronRight, Activity, Trash2 } from 'lucide-react';
import { getLogs, LogEntry } from '../services/systemUtils';

interface Props { lang: 'PL' | 'EN'; }

const SystemLogs: React.FC<Props> = ({ lang }) => {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [expanded, setExpanded] = useState<Record<string, boolean>>({});

    useEffect(() => { 
        setLogs([...getLogs()]); // Init
        const i = setInterval(() => {
            setLogs([...getLogs()]); // Poll for updates
        }, 1000); 
        return () => clearInterval(i); 
    }, []);

    const toggle = (id: string) => setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
    const clearLogs = () => {
        localStorage.removeItem('regis_system_logs');
        setLogs([]);
    };

    const t = lang === 'PL' ? "LOGI SYSTEMOWE" : "SYSTEM LOGS";
    return (
        <div className="h-full p-12 font-mono bg-black/20 flex flex-col">
            <header className="mb-8 flex items-center justify-between">
                <h1 className="text-4xl font-bold text-white flex items-center gap-4"><Activity size={40} className="text-emerald-500" /> {t}</h1>
                <button onClick={clearLogs} className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg"><Trash2/></button>
            </header>
            <div className="bg-black/80 border border-emerald-900/50 rounded-3xl flex-1 overflow-auto p-4 shadow-inner custom-scrollbar">
                {logs.length === 0 && <div className="text-slate-500 p-4">No logs recorded.</div>}
                {logs.map(l => (
                    <div key={l.id} className="mb-2 border-b border-white/5 pb-2">
                        <div className="flex gap-4 text-sm p-2 hover:bg-white/5 rounded-xl text-slate-400 cursor-pointer items-center" onClick={() => toggle(l.id)}>
                            <span className="w-4">{expanded[l.id] ? <ChevronDown size={14}/> : <ChevronRight size={14}/>}</span>
                            <span className="w-24 text-slate-600 font-bold text-xs">{new Date(l.timestamp).toLocaleTimeString()}</span>
                            <span className={`w-16 font-bold ${l.status === 'SUCCESS' || l.status === 'RES' ? 'text-emerald-400' : l.status === 'ERR' || l.status === 'FAIL' ? 'text-red-400' : 'text-yellow-400'}`}>{l.status}</span>
                            <span className="w-24 text-blue-400 font-bold">[{l.module}]</span>
                            <span className="flex-1 text-slate-300 truncate">{l.action}</span>
                        </div>
                        {expanded[l.id] && l.data && (<div className="ml-10 mt-2 p-3 bg-black/50 rounded-lg text-xs text-emerald-300 font-mono border border-emerald-900/30 overflow-x-auto"><pre>{JSON.stringify(l.data, null, 2)}</pre></div>)}
                    </div>
                ))}
            </div>
        </div>
    );
};
export default SystemLogs;