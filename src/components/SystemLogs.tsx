import React, { useEffect, useState } from 'react';
import { ScrollText, Clock } from 'lucide-react';
import { getLogs, LogEntry } from '../services/geminiService';
interface Props { lang: 'PL' | 'EN'; }
const SystemLogs: React.FC<Props> = ({ lang }) => {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    useEffect(() => { const i = setInterval(() => setLogs([...getLogs()]), 1000); return () => clearInterval(i); }, []);
    const t = lang === 'PL' ? "LOGI SYSTEMOWE" : "SYSTEM LOGS";
    return (
        <div className="h-full p-12 font-mono">
            <h1 className="text-4xl font-bold text-white mb-8 flex gap-4"><ScrollText size={40} /> {t}</h1>
            <div className="bg-black/60 border border-white/10 rounded-3xl h-[calc(100%-6rem)] overflow-auto p-4">
                {logs.map(l => (
                    <div key={l.id} className="flex gap-6 text-sm p-2 hover:bg-white/5 rounded-xl text-slate-400">
                        <span className="w-24 text-slate-600">{l.uptime}s</span>
                        <span className={`font-bold ${l.status === 'SUCCESS' ? 'text-emerald-400' : 'text-red-400'}`}>{l.status}</span>
                        <span className="flex-1">{l.module}: {l.action}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};
export default SystemLogs;