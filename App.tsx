import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import Registry from './components/Registry';
import BuildTools from './components/BuildTools';
import SystemLogs from './components/SystemLogs';
import Launcher from './components/Launcher';
import { View, Message, RegistryItem, Sender } from './types';
import { generateTitleForRegistry, systemLog } from './services/geminiService';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.CHAT);
  // Default to authenticated to skip login as requested
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [currentUser, setCurrentUser] = useState<string>('Admin');

  // --- Initial State Hydration ---
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('regis_messages') || '[]');
    } catch { return []; }
  });

  const [registryItems, setRegistryItems] = useState<RegistryItem[]>(() => {
    try {
      const saved = localStorage.getItem('regis_registry');
      return saved ? JSON.parse(saved) : [
        {
            id: '1',
            title: 'Project Phoenix Plan',
            content: 'The Phoenix plan focuses on three core pillars: 1. Scalability of the backend infrastructure. 2. Frontend modernization using React 18. 3. AI integration for predictive analytics. The timeline is set for Q4 2024.',
            category: 'General',
            dateAdded: Date.now() - 10000000,
            tags: ['plan', 'roadmap']
        }
      ];
    } catch { return []; }
  });

  // --- Persistence Effects ---
  useEffect(() => {
    localStorage.setItem('regis_messages', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('regis_registry', JSON.stringify(registryItems));
  }, [registryItems]);

  // --- Boot Sequence Logging ---
  useEffect(() => {
    if (isAuthenticated) {
      systemLog('SYSTEM_BOOT', 'INIT', 'INFO', `Starting Regis Kernel for User: ${currentUser}`);
      setTimeout(() => systemLog('SYSTEM_BOOT', 'READY', 'SUCCESS', 'System Online'), 600);
      
      // Auto-Welcome
      if (messages.length === 0) {
        setMessages([{
            id: 'welcome',
            text: `System initialized. Necro-Cyber link established.\n\nWelcome back, Operator ${currentUser}.\nI am Regis. I have full access to your codebase and local environment. How can I assist you today?`,
            sender: Sender.BOT,
            timestamp: Date.now()
        }]);
      }
    }
  }, [isAuthenticated, currentUser]);

  // --- Handlers ---

  const handleSaveToRegistry = async (content: string) => {
    systemLog('REGISTRY', 'ADD_ITEM', 'INFO', 'Processing new entry...');
    const newItem: RegistryItem = {
      id: Date.now().toString(),
      title: 'Analyzing...',
      content: content,
      category: 'General',
      dateAdded: Date.now(),
      tags: ['saved-from-chat']
    };
    
    setRegistryItems(prev => [newItem, ...prev]);
    
    const title = await generateTitleForRegistry(content);
    setRegistryItems(prev => prev.map(item => item.id === newItem.id ? { ...item, title } : item));
    systemLog('REGISTRY', 'UPDATE_TITLE', 'SUCCESS', title);
  };

  const handleDeleteRegistryItem = (id: string) => {
    setRegistryItems(prev => prev.filter(item => item.id !== id));
  };

  if (!isAuthenticated) {
      return <Launcher onLogin={(user) => { setCurrentUser(user); setIsAuthenticated(true); }} />;
  }

  const renderView = () => {
    switch (currentView) {
      case View.CHAT: return <ChatArea messages={messages} setMessages={setMessages} onSaveToRegistry={handleSaveToRegistry} />;
      case View.REGISTRY: return <Registry items={registryItems} onDeleteItem={handleDeleteRegistryItem} />;
      case View.BUILD: return <BuildTools />;
      case View.LOGS: return <SystemLogs />;
      default: return <div>View not found</div>;
    }
  };

  return (
    <div className="flex h-screen bg-black text-slate-100 overflow-hidden relative">
      {/* Necro-Cyber Generative Background with Custom Image */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center opacity-40 pointer-events-none"
        style={{
          backgroundImage: "url('https://pawelserkowski.pl/background.png')",
        }}
      />
      
      {/* Dark Overlay to ensure text readability over the image */}
      <div className="absolute inset-0 z-0 bg-black/60 pointer-events-none"></div>

      {/* Layer 2: Smoke/Fog Simulation */}
      <div className="absolute inset-0 z-0 opacity-20 pointer-events-none mix-blend-screen"
         style={{
           backgroundImage: 'radial-gradient(at 80% 0%, hsla(148,60%,20%,1) 0px, transparent 50%), radial-gradient(at 0% 50%, hsla(158,60%,15%,1) 0px, transparent 50%), radial-gradient(at 80% 100%, hsla(148,60%,20%,1) 0px, transparent 50%)',
           filter: 'blur(40px)'
         }}
      ></div>
      
      {/* Tech Overlay Pattern */}
      <div className="absolute inset-0 z-0 bg-[linear-gradient(rgba(16,185,129,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(16,185,129,0.03)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>

      {/* Vignette */}
      <div className="absolute inset-0 z-0 bg-radial-gradient(circle, transparent 40%, #000 100%) pointer-events-none"></div>

      <div className="relative z-10 flex h-full w-full">
        <Sidebar currentView={currentView} onViewChange={setCurrentView} />
        <main className="flex-1 h-full overflow-hidden relative backdrop-blur-[2px]">
          {renderView()}
        </main>
      </div>
    </div>
  );
};

export default App;
