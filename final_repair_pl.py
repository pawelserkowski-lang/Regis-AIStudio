import os
import base64
import shutil

# ==============================================================================
# REGIS GOD MODE: FINAL FIX v10.0 (LAYERED ARCHITECTURE)
# Fixes:
# 1. Black Screen: Fixed #root height and race condition in mounting.
# 2. Launcher: Pure image, mix-blend-screen, layered on top of App.
# 3. Transitions: CSS-based opacity transition instead of conditional rendering.
# ==============================================================================

print(">>> URUCHAMIAM PROTOKÓŁ NAPRAWCZY v10.0 (WARSTWY) <<<")

# --- 0. PRZYGOTOWANIE KATALOGÓW ---
DIRS = ["src", "src/components", "src/services", "api", "public/static/images"]
for d in DIRS:
    if not os.path.exists(d):
        os.makedirs(d)

FILES = {}

# --- 1. KONFIGURACJA ---
FILES["package.json"] = r'''{
  "name": "regis-ai-studio",
  "private": true,
  "version": "1.0.1",
  "type": "module",
  "scripts": {
    "dev": "vite --host --no-open --clearScreen false",
    "build": "tsc && vite build",
    "launcher": "vite --host --no-open --clearScreen false", 
    "test:all": "npm run test:backend && npm run test:frontend"
  },
  "dependencies": {
    "@google/generative-ai": "^0.21.0", 
    "emoji-picker-react": "^4.9.2",
    "lucide-react": "^0.556.0",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "recharts": "^2.15.0"
  },
  "devDependencies": {
    "@vitejs/plugin-react": "^4.2.1",
    "autoprefixer": "^10.4.18",
    "postcss": "^8.4.35",
    "tailwindcss": "^3.4.1",
    "typescript": "^5.2.2",
    "vite": "^5.1.4",
    "vitest": "^4.0.15"
  }
}'''

FILES["vite.config.ts"] = r'''import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.API_KEY || process.env.API_KEY)
    },
    server: {
      port: 3000,
      strictPort: true,
      open: false,
      proxy: {
        '/api': 'http://localhost:8000'
      }
    }
  };
});'''

FILES["tailwind.config.js"] = r'''/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: ['"JetBrains Mono"', 'monospace'],
        sans: ['Inter', 'sans-serif'],
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      },
      transitionDuration: {
        '2000': '2000ms',
      }
    },
  },
  plugins: [],
}'''

FILES["postcss.config.js"] = r'''export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}'''

# --- 2. STYLE (FIX DLA PUSTEGO EKRANU) ---
FILES["src/index.css"] = r'''@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --bg: #000000;
  --glass: rgba(20, 20, 20, 0.85);
  --neon: #00ff9d;
}

html {
  font-size: 170%;
  height: 100%; /* WAŻNE */
}

@media (max-width: 1024px) {
  html {
    font-size: 100%;
  }
}

body {
  margin: 0;
  background-color: var(--bg);
  color: #eee;
  font-family: 'JetBrains Mono', monospace;
  overflow: hidden;
  height: 100%; /* WAŻNE */
}

#root {
  height: 100%; /* NAPRAWA BIAŁEGO EKRANU - React musi mieć wysokość */
  width: 100%;
}

::-webkit-scrollbar { width: 8px; height: 8px; }
::-webkit-scrollbar-track { background: #0f172a; }
::-webkit-scrollbar-thumb { background: #10b981; border-radius: 4px; }
::-webkit-scrollbar-thumb:hover { background: #34d399; }
'''

FILES["index.html"] = r'''<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>EPS AI Solutions</title>
    <style>
      @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
      @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap');
    </style>
  </head>
  <body class="bg-black text-slate-100">
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>'''

# --- 3. FRONTEND LOGIC ---

FILES["src/main.tsx"] = r'''import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error("Root missing");

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);'''

# APP.TSX - ARCHITEKTURA WARSTWOWA (APP ZAWSZE ZRENDEROWANY)
FILES["src/App.tsx"] = r'''import React, { useState, useEffect } from 'react';
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

export default App;'''

FILES["src/components/Launcher.tsx"] = r'''import React from 'react';

const Launcher: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center w-full h-full bg-black">
        <div className="relative z-10 flex flex-col items-center animate-in fade-in zoom-in duration-700">
            {/* LOGO - CZYSTE, BEZ ŻADNEGO KONTENERA */}
            {/* Używamy mix-blend-screen aby czarne tło PNG stało się przezroczyste */}
            <img 
                src="https://pawelserkowski.pl/logo.webp" 
                alt="Logo" 
                className="w-96 h-auto object-contain animate-pulse-slow"
                style={{ mixBlendMode: 'screen', filter: 'brightness(1.2) contrast(1.1)' }} 
            />
            
            <div className="mt-8 w-80 h-1 bg-emerald-900/30 rounded overflow-hidden">
                <div className="h-full bg-emerald-500 animate-[width_3.5s_ease-in-out_forwards]" style={{width: '0%'}}></div>
            </div>
            <p className="mt-6 text-emerald-500/50 text-xs tracking-[0.5em] font-mono">INITIALIZING...</p>
        </div>
    </div>
  );
};
export default Launcher;'''

# POZOSTAŁE PLIKI (BEZ ZMIAN, ALE KONIECZNE DO BUILD)
FILES["src/types.ts"] = r'''export enum Sender { USER = 'user', BOT = 'bot' }
export interface Attachment { type: 'image' | 'video' | 'audio'; url: string; mimeType: string; data?: string; }
export interface DetectionBox { label: string; confidence?: number; box_2d: [number, number, number, number]; }
export interface Message { id: string; text: string; sender: Sender; timestamp: number; isStreaming?: boolean; attachments?: Attachment[]; groundingMetadata?: any; visualAnalysis?: DetectionBox[]; }
export interface RegistryItem { id: string; title: string; content: string; category: string; dateAdded: number; tags: string[]; }
export enum View { CHAT = 'chat', REGISTRY = 'registry', BUILD = 'build', LOGS = 'logs' }
export type AIModelId = 'gemini-3-pro-preview' | 'gemini-2.5-flash';
export interface FileSystemHandle { kind: 'file' | 'directory'; name: string; }'''

FILES["src/services/geminiService.ts"] = r'''
import { GoogleGenerativeAI } from "@google/generative-ai";
import { DetectionBox, AIModelId } from "../types";

export interface LogEntry { id: string; timestamp: number; uptime: string; module: string; action: string; status: string; data?: any; }
const logHistory: LogEntry[] = [];
const SYSTEM_START = Date.now();

export const systemLog = (module: string, action: string, status: string, data?: any) => {
  const entry: LogEntry = { id: Math.random().toString(), timestamp: Date.now(), uptime: ((Date.now()-SYSTEM_START)/1000).toFixed(3), module, action, status, data };
  logHistory.unshift(entry);
  if(logHistory.length>500) logHistory.pop();
  return entry;
};
export const getLogs = () => logHistory;

export const executeSystemAction = async (action: string, payload: any = {}) => {
    systemLog('SYS', action, 'REQ');
    const res = await fetch('/api', { method: 'POST', body: JSON.stringify({ action, ...payload }) });
    return res.json();
};

let ai: GoogleGenerativeAI | null = null;
let chatSession: any = null;

const getAI = async () => {
    if(!ai) {
        const res = await fetch('/api/config');
        const { envKey } = await res.json();
        const key = envKey || (import.meta as any).env.VITE_API_KEY;
        if(!key) throw new Error("No API Key");
        ai = new GoogleGenerativeAI(key);
    }
    return ai;
};

let currentModel: AIModelId = 'gemini-3-pro-preview';

export const setChatModel = (id: AIModelId) => { currentModel = id; chatSession = null; };
export const getChatModel = () => currentModel;

export const sendMessageStream = async (msg: string, atts: any[], onChunk: (t: string, g?: any) => void) => {
    const client = await getAI();
    if(!chatSession) {
        const model = client.getGenerativeModel({ model: currentModel });
        chatSession = model.startChat();
    }
    const result = await chatSession.sendMessageStream(msg);
    for await (const chunk of result.stream) {
        const text = chunk.text();
        if(text) onChunk(text);
    }
};

export const generateTitleForRegistry = async (content: string) => {
    const client = await getAI();
    const model = client.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(`Title for: ${content.substring(0,100)}`);
    return result.response.text();
};

export const generateImage = async () => "https://placehold.co/600x400";
export const generateVideo = async () => "https://placehold.co/video.mp4";
export const generateSpeech = async () => "";
export const transcribeAudio = async () => "Audio Transcribed";
export const connectLiveSession = async () => ({ close: () => {} });
export const detectUIElements = async () => [{ label: "Btn", box_2d: [10,10,20,20] }];
'''

FILES["src/components/Sidebar.tsx"] = r'''import React from 'react';
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
export default Sidebar;'''

FILES["src/components/ChatArea.tsx"] = r'''import React, { useRef, useEffect, useState } from 'react';
import { Bot, User, BookmarkPlus, Loader2, Paperclip, Image as ImageIcon, Video, Sparkles, Radio, Search, ScanEye, ChevronDown } from 'lucide-react';
import { Message, Sender, Attachment, AIModelId } from '../types';
import { sendMessageStream, getChatModel } from '../services/geminiService';
import FileListView from './FileListView';

interface ChatAreaProps {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  onSaveToRegistry: (content: string) => void;
  lang: 'PL' | 'EN';
}

const TXT = {
  PL: { typeMsg: "Wpisz wiadomość lub /cmd...", save: "ZAPISZ", processing: "Myślę...", attach: "Plik", tools: "AI", live: "LIVE", scan: "Skan", genImg: "Obraz" },
  EN: { typeMsg: "Type a message or /cmd...", save: "SAVE", processing: "Thinking...", attach: "File", tools: "AI", live: "LIVE", scan: "Scan", genImg: "Image" }
};

const ChatArea: React.FC<ChatAreaProps> = ({ messages, setMessages, onSaveToRegistry, lang }) => {
  const t = TXT[lang];
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSend = async () => {
    if ((!input.trim() && attachments.length === 0) || isLoading) return;
    const userMessage: Message = { id: Date.now().toString(), text: input, sender: Sender.USER, timestamp: Date.now(), attachments: [...attachments] };
    const botMessageId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, userMessage, { id: botMessageId, text: '', sender: Sender.BOT, timestamp: Date.now(), isStreaming: true }]);
    
    setInput('');
    setAttachments([]);
    setIsLoading(true);

    try {
        await sendMessageStream(
            userMessage.text, 
            [],
            (chunk) => {
            setMessages(prev => prev.map(msg => 
                msg.id === botMessageId 
                ? { ...msg, text: msg.text + chunk } 
                : msg
            ));
        }
        );
    } catch (error: any) {
        setMessages(prev => prev.map(msg => msg.id === botMessageId ? { ...msg, text: `Error: ${error.message}` } : msg));
    } finally {
        setIsLoading(false);
        setMessages(prev => prev.map(msg => msg.id === botMessageId ? { ...msg, isStreaming: false } : msg));
    }
  };

  return (
    <div className="flex flex-col h-full relative">
      <div className="px-6 py-4 bg-black/60 backdrop-blur-md sticky top-0 z-10 flex justify-between items-center border-b border-white/5 shadow-lg shadow-black/20">
        <div className="flex items-center gap-3 relative">
            <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/30"><Bot className="text-emerald-400" size={24} /></div>
            <div className="text-base font-bold text-slate-100 font-mono tracking-wide">GEMINI-3-PRO</div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-8 scroll-smooth scrollbar-thin scrollbar-thumb-emerald-900 scrollbar-track-transparent">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === Sender.USER ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex max-w-[90%] md:max-w-[70%] ${msg.sender === Sender.USER ? 'flex-row-reverse' : 'flex-row'} items-start gap-5`}>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg border ${msg.sender === Sender.USER ? 'bg-slate-800 border-slate-600 text-slate-300' : 'bg-emerald-900/50 border-emerald-500/50 text-emerald-400'}`}>{msg.sender === Sender.USER ? <User size={24} /> : <Bot size={24} />}</div>
              <div className="flex flex-col gap-2 min-w-0 w-full">
                  <div className={`group relative p-6 rounded-3xl shadow-lg backdrop-blur-sm ${msg.sender === Sender.USER ? 'bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-tr-sm' : 'bg-black/60 text-slate-200 border border-white/10 rounded-tl-sm'}`}>
                    <div className="whitespace-pre-wrap leading-relaxed text-lg">{msg.text}</div>
                  </div>
              </div>
            </div>
          </div>
        ))}
        {isLoading && (<div className="flex items-center gap-2 text-slate-400 text-sm ml-20"><Loader2 size={16} className="animate-spin text-emerald-500" /><span className="font-mono text-emerald-500/80">{t.processing}</span></div>)}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-6 bg-gradient-to-t from-black via-black/90 to-transparent sticky bottom-0 z-20">
        <div className="max-w-5xl mx-auto flex items-end gap-3 bg-black/60 backdrop-blur-xl p-3 rounded-3xl shadow-2xl border border-white/10 focus-within:border-emerald-500/50 transition-all">
            <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }} placeholder={t.typeMsg} className="flex-1 bg-transparent border-none focus:ring-0 text-lg text-slate-100 placeholder:text-slate-500 px-4 py-3" />
            <button onClick={handleSend} disabled={isLoading} className="p-4 bg-emerald-600 text-white rounded-2xl hover:bg-emerald-500 transition-all"><CornerDownLeft size={24} /></button>
        </div>
      </div>
    </div>
  );
};
export default ChatArea;'''

FILES["src/components/Registry.tsx"] = r'''import React, { useState } from 'react';
import { Search, Trash2, Calendar, Database } from 'lucide-react';
import { RegistryItem } from '../types';
interface RegistryProps { items: RegistryItem[]; onDeleteItem: (id: string) => void; lang: 'PL'|'EN'; }
const Registry: React.FC<RegistryProps> = ({ items, onDeleteItem, lang }) => {
  const [term, setTerm] = useState('');
  const filtered = items.filter(i => i.title.toLowerCase().includes(term.toLowerCase()));
  const t = lang === 'PL' ? { title: "Rejestr", desc: "Magazyn danych.", search: "Szukaj...", noData: "Brak danych." } : { title: "Registry", desc: "Encrypted storage.", search: "Search...", noData: "No data found." };
  return (
    <div className="h-full overflow-y-auto p-12">
      <header className="mb-12"><h1 className="text-5xl font-bold text-white mb-4 font-mono">{t.title}</h1><p className="text-xl text-slate-400">{t.desc}</p></header>
      <div className="bg-black/40 backdrop-blur-md p-4 rounded-3xl border border-white/10 mb-10 flex items-center"><Search className="ml-4 text-slate-500" size={24} /><input value={term} onChange={e => setTerm(e.target.value)} className="w-full bg-transparent border-none p-4 text-xl text-slate-200 outline-none" placeholder={t.search} /></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filtered.map(item => (
            <div key={item.id} className="bg-black/40 p-6 rounded-3xl border border-white/5 hover:border-emerald-500/50 transition-all h-80 flex flex-col">
                <h3 className="text-2xl font-bold text-slate-200 mb-3">{item.title}</h3>
                <p className="text-slate-400 text-base line-clamp-4 flex-1">{item.content}</p>
                <div className="mt-auto flex justify-between text-sm text-slate-500"><span>{new Date(item.dateAdded).toLocaleDateString()}</span><button onClick={() => onDeleteItem(item.id)} className="hover:text-red-400"><Trash2 size={18} /></button></div>
            </div>
        ))}
      </div>
    </div>
  );
};
export default Registry;'''

FILES["src/components/BuildTools.tsx"] = r'''import React, { useState } from 'react';
import { HardDrive, RefreshCw } from 'lucide-react';
import { executeSystemAction } from '../services/geminiService';
interface Props { lang: 'PL'|'EN'; }
const BuildTools: React.FC<Props> = ({ lang }) => {
    const [tree, setTree] = useState('');
    const [path, setPath] = useState('.');
    const t = lang === 'PL' ? { title: "ROOT ACCESS", desc: "Interfejs plików.", ph: "Ścieżka" } : { title: "ROOT ACCESS", desc: "File interface.", ph: "Path" };
    const fetchTree = async () => { try { const res = await executeSystemAction('tree', { cwd: path }); setTree(res.tree); } catch { setTree("Error"); } };
    return (
        <div className="h-full flex flex-col p-12 bg-black/20">
            <header className="mb-10 flex justify-between items-center">
                <div><h1 className="text-4xl font-bold text-white font-mono flex items-center gap-4"><HardDrive className="text-emerald-500" size={40} /> {t.title}</h1><p className="text-xl text-slate-400 mt-2">{t.desc}</p></div>
                <div className="flex gap-3"><input value={path} onChange={e => setPath(e.target.value)} className="bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-slate-200 font-mono text-base" placeholder={t.ph} /><button onClick={fetchTree} className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-white"><RefreshCw size={24}/></button></div>
            </header>
            <div className="flex-1 bg-black/80 border border-white/10 rounded-3xl p-6 overflow-auto font-mono text-sm text-slate-300"><pre>{tree}</pre></div>
        </div>
    );
};
export default BuildTools;'''

FILES["src/components/SystemLogs.tsx"] = r'''import React, { useEffect, useState } from 'react';
import { ScrollText, Clock } from 'lucide-react';
import { getLogs, LogEntry } from '../services/geminiService';
interface Props { lang: 'PL' | 'EN'; }
const SystemLogs: React.FC<Props> = ({ lang }) => {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    useEffect(() => { const i = setInterval(() => setLogs([...getLogs()]), 1000); return () => clearInterval(i); }, []);
    const t = lang === 'PL' ? "LOGI SYSTEMOWE" : "SYSTEM LOGS";
    return (
        <div className="h-full p-12 font-mono">
            <h1 className="text-4xl font-bold text-white mb-8 flex gap-4"><ScrollText size={40} /> {t}</h1>
            <div className="bg-black/60 border border-white/10 rounded-3xl h-[calc(100%-6rem)] overflow-auto p-4">
                {logs.map(l => (
                    <div key={l.id} className="flex gap-6 text-sm p-2 hover:bg-white/5 rounded-xl text-slate-400">
                        <span className="w-24 text-slate-600">{l.uptime}s</span>
                        <span className={`font-bold ${l.status === 'SUCCESS' ? 'text-emerald-400' : 'text-red-400'}`}>{l.status}</span>
                        <span className="flex-1">{l.module}: {l.action}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};
export default SystemLogs;'''

FILES["src/components/FileListView.tsx"] = r'''import React from 'react';
import { File } from 'lucide-react';
import { Attachment } from '../types';
const FileListView: React.FC<{ items: Attachment[] }> = ({ items }) => (
    <div className="flex gap-3">{items.map((i, idx) => <div key={idx} className="p-3 bg-white/10 rounded-xl text-sm text-white flex items-center gap-2"><File size={16}/> File {idx+1}</div>)}</div>
);
export default FileListView;'''

FILES["src/components/VisualAnalyzer.tsx"] = r'''import React from 'react';
const VisualAnalyzer: React.FC<any> = () => <div>Analyzer Placeholder</div>;
export default VisualAnalyzer;'''

FILES["api/index.py"] = r'''from http.server import BaseHTTPRequestHandler
import os, json, subprocess, platform, shlex, base64
from io import BytesIO

try:
    from PIL import ImageGrab
    import psutil
    EXT = True
except: EXT = False

class handler(BaseHTTPRequestHandler):
    def _set_headers(self, s=200):
        self.send_response(s)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
    def do_OPTIONS(self): self._set_headers()

    def do_GET(self):
        if self.path == '/api/config':
            k = os.environ.get('GOOGLE_API_KEY', '')
            self._set_headers(200)
            self.wfile.write(json.dumps({"envKey": k}).encode())
        else: self._set_headers(404)

    def do_POST(self):
        try:
            sz = int(self.headers['Content-Length'])
            d = json.loads(self.rfile.read(sz))
            act = d.get('action', 'cmd'); cwd = d.get('cwd', os.getcwd())
            if not os.path.exists(cwd): cwd = os.getcwd()
            res = {}

            if act == 'screenshot':
                if EXT:
                    b = BytesIO(); ImageGrab.grab().save(b, format="JPEG", quality=50)
                    res = {"status":"ok", "img": base64.b64encode(b.getvalue()).decode()}
                else: res = {"error": "Install Pillow"}
            elif act == 'tree':
                ign = {'.git','node_modules','dist','build','.vscode','__pycache__'}
                tr = []
                for r, ds, fs in os.walk(cwd):
                    ds[:] = [x for x in ds if x not in ign]
                    lvl = r.replace(cwd, '').count(os.sep)
                    if lvl > 3: continue
                    tr.append(f"{'  '*lvl}📂 {os.path.basename(r)}/")
                    for f in fs:
                        if len(tr)>300: break
                        tr.append(f"{'  '*(lvl+1)}📄 {f}")
                    if len(tr)>300: break
                res = {"tree": "\n".join(tr)}
            elif act == 'kill_port':
                if EXT:
                    p = int(d.get('port',0)); k=False
                    for proc in psutil.process_iter(['pid']):
                        try:
                            for c in proc.connections():
                                if c.laddr.port == p: proc.kill(); k=True
                        except: pass
                    res = {"status": "killed" if k else "not_found"}
                else: res = {"error": "Install psutil"}
            elif act == 'command':
                c = d.get('command'); bg = d.get('background', False)
                if bg:
                    if platform.system()=="Windows": subprocess.Popen(c, shell=True, cwd=cwd, creationflags=subprocess.CREATE_NEW_CONSOLE)
                    else: subprocess.Popen(shlex.split(c), cwd=cwd, start_new_session=True)
                    res = {"stdout": "Background started", "code": 0}
                else:
                    r = subprocess.run(c, shell=True, capture_output=True, text=True, cwd=cwd, encoding='utf-8', errors='replace', timeout=45)
                    res = {"stdout": r.stdout, "stderr": r.stderr, "code": r.returncode}
            
            self._set_headers(200)
            self.wfile.write(json.dumps(res).encode())
        except Exception as e:
            self._set_headers(500)
            self.wfile.write(json.dumps({"error": str(e)}).encode())
'''

FILES["api/local_server.py"] = r'''import os
import sys
import time
import subprocess
from http.server import HTTPServer

def run_server():
    sys.path.append(os.path.dirname(os.path.abspath(__file__)))
    try:
        from index import handler
    except ImportError:
        sys.path.append(os.path.join(os.getcwd(), 'api'))
        from index import handler

    port = int(os.environ.get('PORT', 8000))
    print(f"Starting Python backend on http://localhost:{port}")

    if not os.environ.get('GOOGLE_API_KEY'):
        print("[WARN] GOOGLE_API_KEY is not set in environment variables.")

    server = HTTPServer(('localhost', port), handler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass

if __name__ == '__main__':
    run_server()
'''

FILES["run.py"] = r'''import subprocess, time, webbrowser, platform, sys
print(">>> STARTING REGIS (FINAL FIX) <<<")
print(" [1] Backend...")
if platform.system() == "Windows": subprocess.Popen("start cmd /k python api/local_server.py", shell=True)
else: subprocess.Popen([sys.executable, "api/local_server.py"])
time.sleep(2)
# UPEWNIAMY SIĘ ŻE OTWIERA SIĘ TYLKO RAZ
webbrowser.open("http://localhost:3000")
print(" [2] Frontend...")
try: subprocess.run("npm run launcher", shell=True)
except: pass
'''

# --- ZAPIS PLIKÓW ---
for name, content in FILES.items():
    with open(name, 'w', encoding='utf-8') as f:
        f.write(content.strip())
    print(f" [ZAKTUALIZOWANO] {name}")

# --- CZYSZCZENIE ŚMIECI ---
print("\n>>> CZYSZCZENIE ZBĘDNYCH PLIKÓW... <<<")
files_to_remove = ["fix_regis.py", "server.py", "index.tsx", "src/services/gemini.ts", "install_final.py"]
dirs_to_remove = ["services"]
for f in files_to_remove:
    if os.path.exists(f): os.remove(f)
for d in dirs_to_remove:
    if os.path.exists(d): shutil.rmtree(d)

print("\n>>> AKTUALIZACJA UKOŃCZONA <<<")
print("1. Wpisz w terminalu: npm uninstall @google/genai")
print("2. Wpisz w terminalu: npm install @google/generative-ai")
print("3. Uruchom serwer: python run.py")