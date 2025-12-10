import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import Registry from './components/Registry';
import BuildTools from './components/BuildTools';
import SystemLogs from './components/SystemLogs';
import Launcher from './components/Launcher';
import { View, Message, RegistryItem, Sender } from './types';
import { generateTitleForRegistry, systemLog } from './services/geminiService';

const DICTIONARY = {
  PL: {
    welcome: "System Online.\nWitaj ponownie, %USER%.\nJestem Regis. Czekam na instrukcje.",
    processing: "Przetwarzanie...",
    savedTag: "zapisane",
    bootInit: "Start Jądra Regis dla użytkownika: %USER%",
  },
  EN: {
    welcome: "System Online.\nWelcome back, %USER%.\nI am Regis. Ready for instructions.",
    processing: "Processing...",
    savedTag: "saved",
    bootInit: "Starting Regis Kernel for User: %USER%",
  }
};

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.CHAT);
  
  // LOGIKA STARTU:
  // 1. loading = true -> Launcher widoczny, App ukryta (opacity 0)
  // 2. loading = false -> Launcher znika (opacity 0), App widoczna (opacity 1)
  const [loading, setLoading] = useState(true);
  
  const [currentUser, setCurrentUser] = useState<string>('Pawel Serkowski');
  const [lang, setLang] = useState<'PL' | 'EN'>('PL');

  const [messages, setMessages] = useState<Message[]>(() => {
    try { return JSON.parse(localStorage.getItem('regis_messages') || '[]'); } catch { return []; }
  });

  const [registryItems, setRegistryItems] = useState<RegistryItem[]>(() => {
    try {
      const saved = localStorage.getItem('regis_registry');
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });

  useEffect(() => { localStorage.setItem('regis_messages', JSON.stringify(messages)); }, [messages]);
  useEffect(() => { localStorage.setItem('regis_registry', JSON.stringify(registryItems)); }, [registryItems]);

  useEffect(() => {
    // Symulacja czasu startu
    const timer = setTimeout(() => {
        setLoading(false);
        // Logika po załadowaniu
        const txt = DICTIONARY[lang];
        systemLog('BOOT', 'INIT', 'INFO', txt.bootInit.replace('%USER%', currentUser));
        if (messages.length === 0) {
            setMessages([{
                id: 'welcome',
                text: txt.welcome.replace('%USER%', currentUser),
                sender: Sender.BOT,
                timestamp: Date.now()
            }]);
        }
    }, 3500); // 3.5 sekundy launchera
    return () => clearTimeout(timer);
  }, []);

  const handleSaveToRegistry = async (content: string) => {
    const txt = DICTIONARY[lang];
    const newItem: RegistryItem = { 
        id: Date.now().toString(), 
        title: txt.processing, 
        content, 
        category: 'General', 
        dateAdded: Date.now(), 
        tags: [txt.savedTag] 
    };
    setRegistryItems(prev => [newItem, ...prev]);
    const title = await generateTitleForRegistry(content);
    setRegistryItems(prev => prev.map(i => i.id === newItem.id ? { ...i, title } : i));
  };

  const handleDeleteRegistryItem = (id: string) => {
    setRegistryItems(prev => prev.filter(item => item.id !== id));
  };

  return (
    <div className="relative flex h-full w-full bg-black text-slate-100 overflow-hidden">
      {/* TŁO GLOBALNE (Wspólne) */}
      <div className="absolute inset-0 z-0 bg-cover bg-center" style={{ backgroundImage: "url('https://pawelserkowski.pl/background.webp')", opacity: 0.4 }} />
      <div className="absolute inset-0 z-0 bg-black/50 pointer-events-none"></div>

      {/* WARSTWA 1: LAUNCHER (Z-50) */}
      {/* Znika poprzez CSS opacity, ale pozostaje w DOM przez chwilę, żeby nie było skoku */}
      <div className={`absolute inset-0 z-50 transition-opacity duration-1000 ${loading ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <Launcher />
      </div>

      {/* WARSTWA 2: GŁÓWNA APLIKACJA (Z-10) */}
      {/* Jest wyrenderowana OD RAZU, ale niewidoczna, dopóki Launcher nie zniknie */}
      <div className={`relative z-10 flex h-full w-full backdrop-blur-[1px] transition-opacity duration-1000 ${!loading ? 'opacity-100' : 'opacity-0'}`}>
        <Sidebar currentView={currentView} onViewChange={setCurrentView} lang={lang} setLang={setLang} />
        <main className="flex-1 h-full overflow-hidden relative">
            {(() => {
                switch (currentView) {
                case View.CHAT: return <ChatArea messages={messages} setMessages={setMessages} onSaveToRegistry={handleSaveToRegistry} lang={lang} />;
                case View.REGISTRY: return <Registry items={registryItems} onDeleteItem={handleDeleteRegistryItem} lang={lang} />;
                case View.BUILD: return <BuildTools lang={lang} />;
                case View.LOGS: return <SystemLogs lang={lang} />;
                default: return <div>View not found</div>;
                }
            })()}
        </main>
      </div>
    </div>
  );
};

export default App;