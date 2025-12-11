import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar';
import ChatArea from './components/ChatArea';
import Registry from './components/Registry';
import LivePreview from './components/LivePreview';
import SystemLogs from './components/SystemLogs';
import Launcher from './components/Launcher';
import HistoryView from './components/HistoryView';
import { View, Message, RegistryItem, Sender, ChatSession } from './types';
import { generateTitleForRegistry, systemLog, autoCurateRegistry } from './services/geminiService';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>(View.CHAT);
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState<'PL' | 'EN'>('PL');
  
  const [chatInput, setChatInput] = useState('');

  // STATE
  const [messages, setMessages] = useState<Message[]>(() => {
    try { return JSON.parse(localStorage.getItem('regis_messages') || '[]'); } catch { return []; }
  });

  const [promptHistory, setPromptHistory] = useState<string[]>(() => {
      try { return JSON.parse(localStorage.getItem('regis_prompt_history') || '[]'); } catch { return []; }
  });

  const [sessions, setSessions] = useState<ChatSession[]>(() => {
      try { return JSON.parse(localStorage.getItem('regis_sessions') || '[]'); } catch { return []; }
  });

  const [registryItems, setRegistryItems] = useState<RegistryItem[]>(() => {
    try { return JSON.parse(localStorage.getItem('regis_registry') || '[]'); } catch { return []; }
  });

  // PERSISTENCE
  useEffect(() => { localStorage.setItem('regis_messages', JSON.stringify(messages)); }, [messages]);
  useEffect(() => { localStorage.setItem('regis_registry', JSON.stringify(registryItems)); }, [registryItems]);
  
  // AUTO-SAVE SESSION LOGIC
  useEffect(() => { 
      localStorage.setItem('regis_sessions', JSON.stringify(sessions)); 
  }, [sessions]);

  // ON MESSAGE CHANGE -> UPDATE CURRENT SESSION IN HISTORY
  const currentSessionIdRef = useRef<string>(Date.now().toString()); // ID for the active session

  useEffect(() => {
      if (messages.length === 0) return;

      setSessions(prev => {
          const sid = currentSessionIdRef.current;
          const existingIdx = prev.findIndex(s => s.id === sid);
          
          const updatedSession: ChatSession = {
              id: sid,
              date: Date.now(),
              title: messages[0]?.text.substring(0, 40) + "..." || "New Session",
              messages: messages
          };

          if (existingIdx >= 0) {
              // Update existing
              const newSessions = [...prev];
              newSessions[existingIdx] = updatedSession;
              return newSessions;
          } else {
              // Create new (Top of list)
              return [updatedSession, ...prev];
          }
      });
  }, [messages]);

  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  const addToHistory = (cmd: string) => {
      setPromptHistory(prev => {
          // Limit increased to 100
          const newHist = [cmd, ...prev.filter(c => c !== cmd)].slice(0, 100);
          localStorage.setItem('regis_prompt_history', JSON.stringify(newHist));
          return newHist;
      });
  };

  const handleSidebarPromptClick = (cmd: string) => {
      setChatInput(cmd);
      setCurrentView(View.CHAT);
  };

  const handleArchiveSession = () => {
      // Start a fresh session ID
      if (messages.length === 0) return;
      if (!confirm("Archive current session and start fresh?")) return;
      
      setMessages([]);
      // Generate new ID for next messages
      currentSessionIdRef.current = Date.now().toString();
      systemLog('SESSION', 'NEW', 'SUCCESS', { newId: currentSessionIdRef.current });
  };

  const handleAutoCurate = async (text: string) => {
      const item = await autoCurateRegistry(text);
      if (item) {
          const newItem: RegistryItem = { 
              id: Date.now().toString(), title: item.title, content: item.content, 
              category: 'Auto', dateAdded: Date.now(), tags: item.tags 
          };
          setRegistryItems(prev => [newItem, ...prev]);
          systemLog('REGISTRY', 'AUTO-SAVE', 'SUCCESS', newItem);
      }
  };

  const handleSaveToRegistry = async (content: string) => {
    const newItem: RegistryItem = { id: Date.now().toString(), title: "Manual Save", content, category: 'General', dateAdded: Date.now(), tags: ['manual'] };
    setRegistryItems(prev => [newItem, ...prev]);
  };

  const handleDeleteRegistryItem = (id: string) => { setRegistryItems(prev => prev.filter(item => item.id !== id)); };

  const handleLoadSession = (msgs: Message[]) => {
      if(!confirm("Load this session? Current unsaved messages will be overwritten.")) return;
      setMessages(msgs);
      // We don't change session ID, so further edits update the loaded session? 
      // Or we should maybe branch off. For simplicity, we just load state.
      setCurrentView(View.CHAT);
  };

  return (
    <div className="relative flex h-full w-full bg-black text-slate-100 overflow-hidden font-mono">
      <div className="absolute inset-0 z-0 bg-[url('https://pawelserkowski.pl/background.webp')] bg-cover bg-center opacity-20" />
      <div className="absolute inset-0 z-0 bg-black/60" />

      <div className={`absolute inset-0 z-50 transition-opacity duration-1000 ${loading ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}>
        <Launcher />
      </div>

      <div className={`relative z-10 flex h-full w-full backdrop-blur-[2px] transition-opacity duration-1000 ${!loading ? 'opacity-100' : 'opacity-0'}`}>
        <Sidebar 
            currentView={currentView} 
            onViewChange={setCurrentView} 
            lang={lang} 
            setLang={setLang} 
            promptHistory={promptHistory} 
            onPromptSelect={handleSidebarPromptClick} 
        />
        <main className="flex-1 h-full overflow-hidden relative">
            {(() => {
                switch (currentView) {
                case View.CHAT: return (
                    <ChatArea 
                        messages={messages} 
                        setMessages={setMessages} 
                        onSaveToRegistry={handleSaveToRegistry} 
                        onAutoCurate={handleAutoCurate} 
                        lang={lang} 
                        promptHistory={promptHistory} 
                        addToHistory={addToHistory} 
                        onArchive={handleArchiveSession}
                        inputValue={chatInput}
                        setInputValue={setChatInput}
                    />
                );
                case View.HISTORY: return <HistoryView lang={lang} sessions={sessions} setSessions={setSessions} onLoadSession={handleLoadSession} />;
                case View.LIVE: return <LivePreview lang={lang} />;
                case View.REGISTRY: return <Registry items={registryItems} onDeleteItem={handleDeleteRegistryItem} lang={lang} />;
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