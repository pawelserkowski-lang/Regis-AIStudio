import React from 'react';
import { MessageSquare, Layers, Terminal, ScrollText, Globe, Clock, Copy, MonitorPlay, Activity } from 'lucide-react';
import { View } from '../types';

interface SidebarProps {
  currentView: View;
  onViewChange: (view: View) => void;
  lang: 'PL' | 'EN';
  setLang: (l: 'PL' | 'EN') => void;
  promptHistory: string[];
  onPromptSelect: (cmd: string) => void; // New Prop
}

const LABELS = {
  PL: { chat: 'Czat', history: 'Historia', live: 'Live', reg: 'Baza', logs: 'Logi', perf: 'Wydajność', prompts: 'OSTATNIE' },
  EN: { chat: 'Chat', history: 'History', live: 'Live', reg: 'Base', logs: 'Logs', perf: 'Performance', prompts: 'RECENT' }
};

const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange, lang, setLang, promptHistory, onPromptSelect }) => {
  const t = LABELS[lang];
  const navItems = [
    { id: View.CHAT, icon: MessageSquare, label: t.chat },
    { id: View.LIVE, icon: MonitorPlay, label: t.live },
    { id: View.HISTORY, icon: Clock, label: t.history },
    { id: View.REGISTRY, icon: Layers, label: t.reg },
    { id: View.LOGS, icon: ScrollText, label: t.logs },
    { id: View.PERFORMANCE, icon: Activity, label: t.perf },
  ];

  return (
    <div className="w-20 md:w-80 bg-black backdrop-blur-xl flex flex-col h-full border-r border-white/5 z-20 shadow-2xl transition-all duration-300">
      <div className="p-6 flex justify-center md:justify-start items-center">
            <div className="hidden md:flex items-center justify-center w-full mt-4">
                <img src="https://pawelserkowski.pl/logo.webp" alt="EPS AI" className="w-auto h-32 object-contain" style={{ mixBlendMode: 'screen', filter: 'brightness(1.2)' }} />
            </div>
            <div className="md:hidden w-12 h-12 bg-emerald-900/50 rounded-xl flex items-center justify-center border border-emerald-500/30"><Terminal size={24} className="text-emerald-400" /></div>
      </div>

      <nav className="px-4 space-y-2 flex-shrink-0">
          {navItems.map((item) => (
            <button key={item.id} onClick={() => onViewChange(item.id)} className={`relative w-full flex items-center space-x-4 px-4 py-4 rounded-2xl transition-all duration-200 group border ${currentView === item.id ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'border-transparent text-slate-400 hover:bg-white/5 hover:text-white'}`}>
              <item.icon size={24} className={`${currentView === item.id ? 'text-emerald-400' : 'text-slate-500 group-hover:text-white'} transition-colors`} />
              <span className="hidden md:block font-medium text-base tracking-wide">{item.label}</span>
            </button>
          ))}
      </nav>

      <div className="flex-1 overflow-hidden flex flex-col mt-6 border-t border-white/5 pt-4 px-4 pb-4">
          <div className="hidden md:flex items-center gap-2 text-sm font-bold text-emerald-500 mb-4 px-2 uppercase tracking-widest border-b border-white/5 pb-2">
              <Terminal size={16} /> {t.prompts}
          </div>
          <div className="flex-1 overflow-y-auto space-y-2 scrollbar-thin scrollbar-thumb-emerald-900/20 pr-1">
              {promptHistory.map((cmd, idx) => (
                  <button 
                    key={idx} 
                    onClick={() => onPromptSelect(cmd)}
                    className="w-full text-left group flex items-center justify-between p-3 rounded-xl bg-white/5 hover:bg-emerald-500/10 border border-transparent hover:border-emerald-500/30 transition-all"
                    title="Insert to Chat"
                  >
                      <span className="text-sm text-slate-300 font-mono truncate w-full group-hover:text-emerald-300">{cmd}</span>
                      <Copy size={14} className="text-slate-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </button>
              ))}
          </div>
      </div>

      <div className="p-6 border-t border-white/5">
        <button onClick={() => setLang(lang === 'PL' ? 'EN' : 'PL')} className="flex items-center gap-3 text-xs font-mono text-emerald-600 hover:text-emerald-400 transition-colors w-full justify-center md:justify-start">
            <Globe size={16} /><span className="hidden md:inline">LANG: <span className="font-bold">{lang}</span></span>
        </button>
      </div>
    </div>
  );
};
export default Sidebar;