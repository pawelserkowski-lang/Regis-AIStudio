import React from 'react';
import { MessageSquare, Book, BarChart2, Github, Settings, Layers, Terminal } from 'lucide-react';
import { View } from '../types';

interface SidebarProps {
  currentView: View;
  onViewChange: (view: View) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onViewChange }) => {
  const navItems = [
    { id: View.CHAT, icon: MessageSquare, label: 'Chat' },
    { id: View.REGISTRY, icon: Layers, label: 'Registry' },
    { id: View.STATS, icon: BarChart2, label: 'Analytics' },
  ];

  return (
    <div className="w-20 md:w-72 bg-black/60 backdrop-blur-xl flex flex-col justify-between h-full transition-all duration-300 relative z-20 border-r border-white/10 shadow-2xl">
      <div>
        {/* Brand - Adapted for Large Logo */}
        <div className="p-4 md:p-6 mb-2 flex justify-center md:justify-start items-center">
            {/* Mobile View: Compact Icon */}
            <div className="md:hidden w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-900 rounded-xl flex items-center justify-center text-white shadow-[0_0_15px_rgba(16,185,129,0.5)] border border-emerald-400/30">
                <Terminal size={24} />
            </div>

            {/* Desktop View: Full Logo Image */}
            <div className="hidden md:block w-full">
                <div className="relative group">
                    <div className="absolute -inset-1 bg-emerald-500/20 blur-xl rounded-full opacity-50 group-hover:opacity-75 transition duration-500"></div>
                    <img 
                        src="/logo.png" 
                        alt="EPS AI SOLUTIONS" 
                        className="relative w-full h-auto object-contain max-h-28 drop-shadow-[0_0_10px_rgba(16,185,129,0.5)] transition-transform duration-300 hover:scale-105" 
                    />
                </div>
            </div>
        </div>

        {/* Navigation */}
        <nav className="px-3 space-y-2 mt-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={`w-full flex items-center space-x-3 px-4 py-3.5 rounded-xl transition-all duration-200 group border ${
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
            </button>
          ))}
        </nav>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-white/5">
        <a 
          href="#"
          className="flex items-center space-x-3 px-4 py-3 text-slate-500 hover:text-white transition-colors rounded-xl hover:bg-white/5"
        >
          <Github size={20} />
          <span className="hidden md:block text-sm font-medium">Source Code</span>
        </a>
      </div>
    </div>
  );
};

export default Sidebar;