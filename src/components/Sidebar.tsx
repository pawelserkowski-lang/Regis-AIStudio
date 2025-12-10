import React from 'react';
import { MessageSquare, Github, Layers, Terminal, Hammer, ScrollText, Globe } from 'lucide-react';
import { View } from '../types';

interface SidebarProps {
  currentView: View;
  onViewChange: (view: View) => void;
  lang: 'PL' | 'EN';
  setLang: (l: 'PL' | 'EN') => void;
}

const LABELS = {
  PL: { chat: 'Czat', build: 'Narzędzia', reg: 'Rejestr', logs: 'Logi Systemowe', src: 'Kod Źródłowy' },
  EN: { chat: 'Chat', build: 'Build Tools', reg: 'Registry', logs: 'System Logs', src: 'Source Code' }
};

const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange, lang, setLang }) => {
  const t = LABELS[lang];
  const navItems = [
    { id: View.CHAT, icon: MessageSquare, label: t.chat },
    { id: View.BUILD, icon: Hammer, label: t.build },
    { id: View.REGISTRY, icon: Layers, label: t.reg },
    { id: View.LOGS, icon: ScrollText, label: t.logs },
  ];

  return (
    <div className="w-20 md:w-80 bg-black backdrop-blur-xl flex flex-col justify-between h-full border-r border-white/5 z-20 shadow-2xl transition-all duration-300">
      <div>
        <div className="p-6 mb-2 flex justify-center md:justify-start items-center relative overflow-visible">
            <div className="hidden md:flex items-center justify-center w-full mb-10 mt-6">
                <div className="relative w-full flex justify-center">
                    <img 
                        src="https://pawelserkowski.pl/logo.webp" 
                        alt="EPS AI Solutions" 
                        className="w-auto h-40 md:h-60 object-contain"
                        style={{ mixBlendMode: 'screen', filter: 'brightness(1.2)' }}
                    />
                </div>
            </div>
            <div className="md:hidden w-12 h-12 bg-emerald-900/50 rounded-xl flex items-center justify-center border border-emerald-500/30"><Terminal size={24} className="text-emerald-400" /></div>
        </div>

        <nav className="px-5 space-y-4 mt-2">
          {navItems.map((item) => (
            <button key={item.id} onClick={() => onViewChange(item.id)} className={`relative w-full flex items-center space-x-5 px-6 py-5 rounded-3xl transition-all duration-200 group border ${currentView === item.id ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]' : 'border-transparent text-slate-400 hover:bg-white/5 hover:text-white hover:border-white/5'}`}>
              <item.icon size={28} className={`${currentView === item.id ? 'text-emerald-400' : 'text-slate-500 group-hover:text-white'} transition-colors`} />
              <span className="hidden md:block font-medium text-lg tracking-wide">{item.label}</span>
              {currentView === item.id && (<div className="hidden md:block ml-auto w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,1)]"></div>)}
            </button>
          ))}
        </nav>
      </div>
      <div className="p-8 border-t border-white/5 flex flex-col gap-4">
        <div className="flex items-center justify-center md:justify-between px-2 py-1">
            <button onClick={() => setLang(lang === 'PL' ? 'EN' : 'PL')} className="flex items-center gap-3 text-base font-mono text-emerald-500 hover:text-emerald-400 transition-colors">
                <Globe size={20} /><span className="hidden md:inline">JĘZYK: <span className="font-bold">{lang}</span></span>
            </button>
        </div>
      </div>
    </div>
  );
};
export default Sidebar;