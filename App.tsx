import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import Registry from './components/Registry';
import Stats from './components/Stats';
import { View, Message, RegistryItem, Sender } from './types';
import { generateTitleForRegistry, systemLog } from './services/geminiService';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.CHAT);
  
  // Boot Sequence Logging
  useEffect(() => {
    systemLog('SYSTEM_BOOT', 'INIT', 'INFO', 'Starting Regis Kernel v1.0.0...');
    setTimeout(() => systemLog('SYSTEM_BOOT', 'ENV_CHECK', 'SUCCESS', 'Environment Variables Loaded'), 200);
    setTimeout(() => systemLog('SYSTEM_BOOT', 'MOUNT', 'SUCCESS', 'Virtual DOM Mounted'), 400);
    setTimeout(() => systemLog('SYSTEM_BOOT', 'READY', 'SUCCESS', 'System Online. Waiting for Input.'), 600);
  }, []);

  // View Change Logging
  useEffect(() => {
    systemLog('UI_LAYER', 'VIEW_SWITCH', 'INFO', `Active View: ${currentView.toUpperCase()}`);
  }, [currentView]);

  // Chat State with Persistence
  const [messages, setMessages] = useState<Message[]>(() => {
    const saved = localStorage.getItem('regis_messages');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        systemLog('PERSISTENCE', 'LOAD_MSG', 'SUCCESS', `Hydrated ${parsed.length} messages`);
        return parsed;
      } catch (e) {
        systemLog('PERSISTENCE', 'LOAD_MSG', 'ERROR', 'Corruption detected in message store');
      }
    }
    return [{
      id: 'welcome',
      text: "System initialized. Necro-Cyber link established.\n\nI am Regis. I have full access to your codebase and local environment. I can read your source files and make direct modifications. How can I assist you?",
      sender: Sender.BOT,
      timestamp: Date.now()
    }];
  });

  // Registry State with Persistence
  const [registryItems, setRegistryItems] = useState<RegistryItem[]>(() => {
    const saved = localStorage.getItem('regis_registry');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        systemLog('PERSISTENCE', 'LOAD_REG', 'SUCCESS', `Hydrated ${parsed.length} registry items`);
        return parsed;
      } catch (e) {
        systemLog('PERSISTENCE', 'LOAD_REG', 'ERROR', 'Corruption detected in registry store');
      }
    }
    return [
      {
        id: '1',
        title: 'Project Phoenix Plan',
        content: 'The Phoenix plan focuses on three core pillars: 1. Scalability of the backend infrastructure. 2. Frontend modernization using React 18. 3. AI integration for predictive analytics. The timeline is set for Q4 2024.',
        category: 'General',
        dateAdded: Date.now() - 10000000,
        tags: ['plan', 'roadmap']
      },
      {
        id: '2',
        title: 'React Hooks Best Practices',
        content: 'Always use useEffect for side effects. Don\'t lie to the dependency array. Use useMemo for expensive calculations and useCallback for passing functions to child components to prevent unnecessary re-renders.',
        category: 'Code',
        dateAdded: Date.now() - 5000000,
        tags: ['react', 'dev']
      }
    ];
  });

  // Persist Messages
  useEffect(() => {
    localStorage.setItem('regis_messages', JSON.stringify(messages));
    // systemLog('PERSISTENCE', 'AUTO_SAVE', 'INFO', 'Messages synced to local storage'); // Commented out to reduce noise
  }, [messages]);

  // Persist Registry
  useEffect(() => {
    localStorage.setItem('regis_registry', JSON.stringify(registryItems));
    // systemLog('PERSISTENCE', 'AUTO_SAVE', 'INFO', 'Registry synced to local storage');
  }, [registryItems]);

  const handleSaveToRegistry = async (content: string) => {
    systemLog('REGISTRY', 'ADD_ITEM', 'INFO', 'Processing new entry...');
    // Optimistically add item
    const newItem: RegistryItem = {
      id: Date.now().toString(),
      title: 'Generating Title...',
      content: content,
      category: 'General', // Default, could be AI analyzed
      dateAdded: Date.now(),
      tags: ['saved-from-chat']
    };
    
    setRegistryItems(prev => [newItem, ...prev]);
    
    // Switch to registry view to show feedback
    // setCurrentView(View.REGISTRY); // Optional: stay in chat or switch

    // Async title generation
    const title = await generateTitleForRegistry(content);
    
    setRegistryItems(prev => prev.map(item => 
      item.id === newItem.id ? { ...item, title } : item
    ));
    systemLog('REGISTRY', 'UPDATE_TITLE', 'SUCCESS', `Title assigned: ${title}`);
  };

  const handleDeleteRegistryItem = (id: string) => {
    systemLog('REGISTRY', 'DELETE', 'WARN', `Removing Node ID: ${id}`);
    setRegistryItems(prev => prev.filter(item => item.id !== id));
  };

  const renderView = () => {
    switch (currentView) {
      case View.CHAT:
        return (
          <ChatArea 
            messages={messages} 
            setMessages={setMessages}
            onSaveToRegistry={handleSaveToRegistry}
          />
        );
      case View.REGISTRY:
        return (
          <Registry 
            items={registryItems} 
            onDeleteItem={handleDeleteRegistryItem}
          />
        );
      case View.STATS:
        return (
          <Stats items={registryItems} />
        );
      default:
        return <div>View not found</div>;
    }
  };

  return (
    <div className="flex h-screen bg-black text-slate-100 overflow-hidden relative">
      {/* Background Image Layer */}
      <div 
        className="absolute inset-0 z-0 opacity-80"
        style={{
          backgroundImage: 'url(/background.jpg)', // Ensure your image is named background.jpg in public folder
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'brightness(0.7) contrast(1.1)'
        }}
      />
      {/* Overlay Gradient for readability */}
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-black/80 via-black/40 to-emerald-900/30 pointer-events-none" />

      {/* Content */}
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