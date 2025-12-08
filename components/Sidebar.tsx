import React from 'react';
import { MessageSquare, Github, Layers, Terminal, Cpu } from 'lucide-react';
import { View } from '../types';

interface SidebarProps {
  currentView: View;
  onViewChange: (view: View) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange }) => {
  const navItems = [
    { id: View.CHAT, icon: MessageSquare, label: 'Chat' },
    { id: View.REGISTRY, icon: Layers, label: 'Registry' },
  ];

  return (
    <div className="w-20 md:w-72 bg-black/60 backdrop-blur-xl flex flex-col justify-between h-full transition-all duration-300 relative z-20 border-r border-white/10 shadow-2xl">
      <div>
        {/* Brand */}
        <div className="p-6 mb-2 flex justify-center md:justify-start items-center group/brand relative">
            {/* Mobile View: Compact Icon */}
            <div className="md:hidden w-10 h-10 bg-gradient-to-br from-emerald-500 to-green-900 rounded-lg flex items-center justify-center text-white shadow-[0_0_15px_rgba(16,185,129,0.5)] border border-emerald-400/30 cursor-help">
                <Terminal size={20} />
            </div>
            
            {/* Tooltip for Brand (Mobile) */}
            <div className="md:hidden absolute left-full top-1/2 -translate-y-1/2 ml-4 px-3 py-1.5 bg-slate-900 border border-white/10 text-emerald-400 text-xs font-mono rounded-lg opacity-0 group-hover/brand:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-xl backdrop-blur-md">
                REGIS_KERNEL_V1
            </div>

            {/* Desktop View: Styled Vector Logo */}
            <div className="hidden md:flex items-center gap-3 w-full group cursor-default">
                <div className="relative">
                     <div className="absolute inset-0 bg-emerald-500 blur-lg rounded-full opacity-20 group-hover:opacity-40 transition-opacity duration-500"></div>
                     <div className="w-10 h-10 bg-gradient-to-tr from-emerald-600 to-black rounded-lg border border-emerald-500/50 flex items-center justify-center relative z-10 shadow-lg">
                        <Cpu size={20} className="text-emerald-400" />
                     </div>
                </div>
                <div>
                    <h1 className="text-xl font-bold text-white tracking-widest leading-none font-mono">EPS<span className="text-emerald-500">_AI</span></h1>
                    <p className="text-[10px] text-emerald-500/60 font-mono tracking-[0.2em] mt-1">SOLUTIONS</p>
                </div>
            </div>
        </div>

        {/* Navigation */}
        <nav className="px-3 space-y-2 mt-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`relative w-full flex items-center space-x-3 px-4 py-3.5 rounded-xl transition-all duration-200 group border ${
                currentView === item.id
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.1)]'
                  : 'border-transparent text-slate-400 hover:bg-white/5 hover:text-white hover:border-white/5'
              }`}
            >
              <item.icon size={22} className={`${currentView === item.id ? 'text-emerald-400 drop-shadow-[0_0_5px_rgba(52,211,153,0.5)]' : 'text-slate-500 group-hover:text-white'} transition-colors`} />
              <span className="hidden md:block font-medium text-sm tracking-wide">{item.label}</span>
              {currentView === item.id && (
                  <div className="hidden md:block ml-auto w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_5px_rgba(52,211,153,1)]"></div>
              )}
              
              {/* Custom Tooltip (Visible only on compact mode/mobile) */}
              <div className="md:hidden absolute left-full top-1/2 -translate-y-1/2 ml-4 px-3 py-1.5 bg-slate-900 border border-white/10 text-slate-200 text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-xl backdrop-blur-md">
                {item.label}
                {/* Arrow */}
                <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-slate-900 border-l border-b border-white/10 transform rotate-45"></div>
              </div>
            </button>
          ))}
        </nav>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-white/5">
        <a 
          href="#"
          className="relative group flex items-center space-x-3 px-4 py-3 text-slate-500 hover:text-white transition-colors rounded-xl hover:bg-white/5"
        >
          <Github size={20} />
          <span className="hidden md:block text-sm font-medium">Source Code</span>
          
          {/* Footer Tooltip */}
          <div className="md:hidden absolute left-full top-1/2 -translate-y-1/2 ml-4 px-3 py-1.5 bg-slate-900 border border-white/10 text-slate-200 text-xs font-medium rounded-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-xl backdrop-blur-md">
            Source Code
             <div className="absolute top-1/2 -left-1 -translate-y-1/2 w-2 h-2 bg-slate-900 border-l border-b border-white/10 transform rotate-45"></div>
          </div>
        </a>
      </div>
    </div>
  );
};

export default Sidebar;