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
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [currentUser, setCurrentUser] = useState<string>('Admin');

  // --- NEW: Global File System State ---
  // Przechowujemy uchwyt do folderu tutaj, aby był dostępny w ChatArea i BuildTools
  const [fsHandle, setFsHandle] = useState<any>(null); // 'any' bo TS marudzi na natywne typy API
  const [fsFiles, setFsFiles] = useState<string[]>([]);

  // --- Initial State Hydration (Bez zmian) ---
  const [messages, setMessages] = useState<Message[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('regis_messages') || '[]');
    } catch { return []; }
  });

  const [registryItems, setRegistryItems] = useState<RegistryItem[]>(() => {
    try {
      const saved = localStorage.getItem('regis_registry');
      return saved ? JSON.parse(saved) : [{
            id: '1',
            title: 'Project Phoenix Plan',
            content: 'Initial roadmap...',
            category: 'General',
            dateAdded: Date.now(),
            tags: ['plan']
      }];
    } catch { return []; }
  });

  // --- Persistence Effects (Bez zmian) ---
  useEffect(() => {
    localStorage.setItem('regis_messages', JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('regis_registry', JSON.stringify(registryItems));
  }, [registryItems]);

  useEffect(() => {
    if (isAuthenticated) {
      systemLog('SYSTEM_BOOT', 'INIT', 'INFO', `Starting Regis Kernel for User: ${currentUser}`);
      if (messages.length === 0) {
        setMessages([{
            id: 'welcome',
            text: `System initialized. Local Access Mode Available.\n\nWelcome back, Operator ${currentUser}.`,
            sender: Sender.BOT,
            timestamp: Date.now()
        }]);
      }
    }
  }, [isAuthenticated, currentUser]);

  // --- Handlers (Bez zmian) ---
  const handleSaveToRegistry = async (content: string) => {
    const newItem: RegistryItem = {
      id: Date.now().toString(),
      title: 'New Note',
      content: content,
      category: 'General',
      dateAdded: Date.now(),
      tags: ['saved']
    };
    setRegistryItems(prev => [newItem, ...prev]);
    const title = await generateTitleForRegistry(content);
    setRegistryItems(prev => prev.map(item => item.id === newItem.id ? { ...item, title } : item));
  };

  const handleDeleteRegistryItem = (id: string) => {
    setRegistryItems(prev => prev.filter(item => item.id !== id));
  };

  if (!isAuthenticated) {
      return <Launcher onLogin={(user) => { setCurrentUser(user); setIsAuthenticated(true); }} />;
  }

  // --- View Rendering with Props ---
  const renderView = () => {
    switch (currentView) {
      case View.CHAT: 
        return <ChatArea 
                  messages={messages} 
                  setMessages={setMessages} 
                  onSaveToRegistry={handleSaveToRegistry}
                  // TODO: W przyszłości przekażemy tu fsHandle do czytania plików
               />;
      case View.REGISTRY: 
        return <Registry items={registryItems} onDeleteItem={handleDeleteRegistryItem} />;
      case View.BUILD: 
        // Przekazujemy funkcje do zarządzania stanem plików
        return <BuildTools 
                  onMount={(handle, files) => {
                      setFsHandle(handle);
                      setFsFiles(files);
                      systemLog('FS_MOUNT', 'SUCCESS', 'SUCCESS', `Mounted ${files.length} files`);
                  }}
                  currentHandle={fsHandle}
                  currentFiles={fsFiles}
               />;
      case View.LOGS: return <SystemLogs />;
      default: return <div>View not found</div>;
    }
  };

  return (
    <div className="flex h-screen bg-black text-slate-100 overflow-hidden relative">
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center opacity-40 pointer-events-none"
        style={{ backgroundImage: "url('https://pawelserkowski.pl/background.webp')" }}
      />
      <div className="absolute inset-0 z-0 bg-black/60 pointer-events-none"></div>
      
      <div className="relative z-10 flex h-full w-full">
        {/* Przekazujemy info o zamontowaniu do Sidebara (opcjonalnie można dodać ikonkę) */}
        <Sidebar currentView={currentView} onViewChange={setCurrentView} />
        <main className="flex-1 h-full overflow-hidden relative backdrop-blur-[2px]">
          {renderView()}
        </main>
      </div>
    </div>
  );
};

export default App;