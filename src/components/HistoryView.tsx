import React, { useState } from 'react';
import { Clock, Trash2, Play, Calendar, Search } from 'lucide-react';
import { ChatSession, Message } from '../types';

interface Props {
    lang: 'PL'|'EN';
    onLoadSession: (msgs: Message[]) => void;
    sessions: ChatSession[];
    setSessions: React.Dispatch<React.SetStateAction<ChatSession[]>>;
}

const HistoryView: React.FC<Props> = ({ lang, onLoadSession, sessions, setSessions }) => {
    const [searchTerm, setSearchTerm] = useState('');

    const deleteSession = (id: string) => {
        const newSessions = sessions.filter(s => s.id !== id);
        setSessions(newSessions);
        // Persistence is handled in App.tsx
    };

    // Filter sessions based on search term (searches in title and message content)
    const filteredSessions = sessions.filter(session => {
        if (!searchTerm.trim()) return true;
        const term = searchTerm.toLowerCase();

        // Search in session title
        if (session.title.toLowerCase().includes(term)) return true;

        // Search in message content
        return session.messages.some(msg =>
            msg.text.toLowerCase().includes(term)
        );
    });

    const t = lang === 'PL'
        ? { title: "ARCHIWUM SESJI", desc: "Przeglądaj zapisane konwersacje.", empty: "Brak zapisanych sesji.", load: "Wczytaj", del: "Usuń", msgs: "wiadomości", search: "Szukaj w sesjach...", noResults: "Brak wyników wyszukiwania." }
        : { title: "SESSION ARCHIVE", desc: "Browse saved conversations.", empty: "No saved sessions.", load: "Load", del: "Delete", msgs: "messages", search: "Search sessions...", noResults: "No search results found." };

    return (
        <div className="h-full flex flex-col p-12 bg-black/20 overflow-y-auto">
            <header className="mb-10">
                <h1 className="text-4xl font-bold text-white font-mono flex items-center gap-4"><Clock className="text-emerald-500" size={40} /> {t.title}</h1>
                <p className="text-xl text-slate-400 mt-2">{t.desc}</p>
            </header>

            {/* Search Input */}
            <div className="bg-black/40 backdrop-blur-md p-4 rounded-3xl border border-white/10 mb-6 flex items-center">
                <Search className="ml-4 text-slate-500" size={24} />
                <input
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                    className="w-full bg-transparent border-none p-4 text-xl text-slate-200 outline-none"
                    placeholder={t.search}
                />
            </div>

            <div className="grid grid-cols-1 gap-4">
                {sessions.length === 0 && <div className="text-slate-500 italic text-lg">{t.empty}</div>}
                {sessions.length > 0 && filteredSessions.length === 0 && searchTerm.trim() && (
                    <div className="text-slate-500 italic text-lg">{t.noResults}</div>
                )}
                {filteredSessions.map(s => (
                    <div key={s.id} className="bg-black/40 border border-white/5 rounded-2xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 hover:border-emerald-500/30 transition-all group">
                        <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                                <span className="text-emerald-400 font-bold text-lg">{s.title || "Untitled Session"}</span>
                                <span className="text-slate-600 text-xs px-2 py-1 bg-white/5 rounded-md flex items-center gap-1"><Calendar size={10}/> {new Date(s.date).toLocaleString()}</span>
                            </div>
                            <p className="text-slate-400 text-sm line-clamp-1 font-mono">
                                {s.messages[0]?.text.substring(0, 100) || "Empty..."}
                            </p>
                            <div className="mt-2 text-xs text-slate-600 flex gap-2">
                                <span>ID: {s.id.substring(0,8)}</span>
                                <span>•</span>
                                <span>{s.messages.length} {t.msgs}</span>
                            </div>
                        </div>
                        <div className="flex gap-3">
                            <button onClick={() => onLoadSession(s.messages)} className="flex items-center gap-2 px-4 py-2 bg-emerald-600/10 text-emerald-400 rounded-xl hover:bg-emerald-600 hover:text-white transition-all border border-emerald-600/20">
                                <Play size={16} /> {t.load}
                            </button>
                            <button onClick={() => deleteSession(s.id)} className="p-2 text-slate-500 hover:text-red-400 transition-colors">
                                <Trash2 size={20} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};
export default HistoryView;