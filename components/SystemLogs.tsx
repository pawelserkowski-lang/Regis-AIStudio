import React, { useEffect, useState } from 'react';
import { ScrollText, RefreshCw, AlertTriangle, CheckCircle, Info, Clock } from 'lucide-react';
import { getLogs, LogEntry } from '../services/geminiService';

const SystemLogs: React.FC = () => {
    const [logs, setLogs] = useState<LogEntry[]>([]);

    const fetchLogs = () => {
        setLogs([...getLogs()]);
    };

    useEffect(() => {
        fetchLogs();
        const interval = setInterval(fetchLogs, 1000);
        return () => clearInterval(interval);
    }, []);

    const getIcon = (status: string) => {
        switch (status) {
            case 'SUCCESS': return <CheckCircle size={14} className="text-emerald-500" />;
            case 'ERROR': return <AlertTriangle size={14} className="text-red-500" />;
            case 'WARN': return <AlertTriangle size={14} className="text-amber-500" />;
            default: return <Info size={14} className="text-blue-500" />;
        }
    };

    const getColor = (status: string) => {
        switch (status) {
            case 'SUCCESS': return 'text-emerald-400';
            case 'ERROR': return 'text-red-400';
            case 'WARN': return 'text-amber-400';
            default: return 'text-blue-400';
        }
    };

    return (
        <div className="h-full flex flex-col p-8 overflow-hidden">
            <header className="mb-6 flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold text-white font-mono tracking-tight flex items-center gap-3">
                        <ScrollText className="text-slate-400" />
                        SYSTEM_LOGS
                    </h1>
                    <p className="text-slate-500 mt-1 font-mono text-sm">Real-time kernel diagnostics and event stream.</p>
                </div>
                <button onClick={fetchLogs} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors">
                    <RefreshCw size={20} />
                </button>
            </header>

            <div className="flex-1 bg-black/60 border border-white/10 rounded-xl overflow-hidden shadow-2xl backdrop-blur-md flex flex-col font-mono text-xs md:text-sm">
                <div className="bg-slate-900/50 border-b border-white/10 px-4 py-2 flex text-slate-500 font-bold uppercase tracking-wider text-[10px]">
                    <div className="w-24">Timestamp</div>
                    <div className="w-32">Module</div>
                    <div className="w-32">Action</div>
                    <div className="w-24">Status</div>
                    <div className="flex-1">Payload</div>
                </div>
                <div className="flex-1 overflow-y-auto p-2 space-y-1 scrollbar-thin scrollbar-thumb-emerald-900">
                    {logs.map((log) => (
                        <div key={log.id} className="flex items-start hover:bg-white/5 px-2 py-1.5 rounded transition-colors group">
                            <div className="w-24 text-slate-600 flex items-center gap-1">
                                <Clock size={10} /> {log.uptime}s
                            </div>
                            <div className="w-32 text-slate-400 font-bold">{log.module}</div>
                            <div className="w-32 text-slate-500">{log.action}</div>
                            <div className={`w-24 flex items-center gap-1.5 font-bold ${getColor(log.status)}`}>
                                {getIcon(log.status)} {log.status}
                            </div>
                            <div className="flex-1 text-slate-300 break-all whitespace-pre-wrap">
                                {typeof log.data === 'string' ? log.data : JSON.stringify(log.data)}
                            </div>
                        </div>
                    ))}
                    {logs.length === 0 && (
                        <div className="p-8 text-center text-slate-600 italic">No logs recorded yet...</div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default SystemLogs;
