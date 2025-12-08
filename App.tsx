import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import Registry from './components/Registry';
import Launcher from './components/Launcher';
import { View, Message, RegistryItem, Sender } from './types';
import { generateTitleForRegistry, systemLog } from './services/geminiService';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.CHAT);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<string>('Guest');

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
      default: return <div>View not found</div>;
    }
  };

  return (
    <div className="flex h-screen bg-black text-slate-100 overflow-hidden relative">
      <div 
        className="absolute inset-0 z-0 opacity-40 pointer-events-none"
        style={{
          background: `
            radial-gradient(circle at 50% 50%, rgba(16, 185, 129, 0.15) 0%, transparent 60%),
            radial-gradient(circle at 100% 0%, rgba(5, 150, 105, 0.2) 0%, transparent 50%),
            linear-gradient(to bottom right, #000000 0%, #0f172a 100%)
          `,
          backgroundSize: '200% 200%',
        }}
      />
      <div className="absolute inset-0 z-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>

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