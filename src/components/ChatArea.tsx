import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Bot, User, CornerDownLeft, FolderOpen, Power, HelpCircle, FileText, Folder, Terminal, Paperclip, X, UploadCloud, Sparkles, LogOut, RefreshCw, Archive, ArrowUpLeft, Lightbulb, BookTemplate } from 'lucide-react';
import { Message, Sender, Attachment, AIModelId } from '../types';
import { sendMessageStream, improvePrompt, setModel } from '../services/ai';
import { executeSystemAction } from '../services/systemUtils';
import PromptTemplates from './PromptTemplates';
import KeyboardShortcutsHelp from './KeyboardShortcutsHelp';
import { MessageSkeleton, LoadingSpinner } from './LoadingSkeleton';
import ModelSelector from './ModelSelector';

interface ChatAreaProps {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  onSaveToRegistry: (content: string) => void;
  onAutoCurate: (text: string) => void;
  lang: 'PL' | 'EN';
  promptHistory: string[];
  addToHistory: (cmd: string) => void;
  onArchive: () => void;
  inputValue: string;
  setInputValue: React.Dispatch<React.SetStateAction<string>>;
}

const TXT = {
  PL: { typeMsg: "Wpisz komendę...", cwd: "KATALOG", restart: "Restart", help: "Pomoc", files: "PLIKI:", drop: "Upuść pliki", improving: "Ulepszam...", exit: "ZAMKNIJ", archive: "Archiwizuj", fileTooBig: "Plik za duży", invalidType: "Nieprawidłowy typ pliku", uploadError: "Błąd podczas wczytywania pliku" },
  EN: { typeMsg: "Enter command...", cwd: "WORK DIR", restart: "Restart", help: "Help", files: "FILES:", drop: "Drop files", improving: "Improving...", exit: "SHUTDOWN", archive: "Archive", fileTooBig: "File too large", invalidType: "Invalid file type", uploadError: "Error uploading file" }
};

// File upload constraints
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_FILE_TYPES = [
  'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
  'text/plain', 'text/csv', 'application/json', 'application/pdf'
];
const ALLOWED_EXTENSIONS = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.txt', '.csv', '.json', '.pdf'];

const QUICK_BUBBLES = [
    { label: "📂 LS", cmd: "ls -la", desc: "List Files" },
    { label: "win DIR", cmd: "dir", desc: "Win List" },
    { label: "🐍 VER", cmd: "python --version", desc: "Py Ver" },
    { label: "📦 PIP", cmd: "pip list", desc: "Libs" },
    { label: "👤 ME", cmd: "whoami", desc: "User" },
    { label: "🌐 IP", cmd: "ipconfig", desc: "Net" },
];

const ChatArea: React.FC<ChatAreaProps> = ({ messages, setMessages, onAutoCurate, lang, promptHistory, addToHistory, onArchive, inputValue, setInputValue }) => {
  const t = TXT[lang];
  const [isLoading, setIsLoading] = useState(false);
  const [isImproving, setIsImproving] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [cwd, setCwd] = useState('.');
  const [showCwdInput, setShowCwdInput] = useState(false);
  const [showPowerMenu, setShowPowerMenu] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [files, setFiles] = useState<any[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [dynamicSuggestions, setDynamicSuggestions] = useState<string[]>([]);
  const [showTemplates, setShowTemplates] = useState(false);
  const [currentModel, setCurrentModel] = useState<AIModelId>(() => {
    // Load saved model from localStorage or default to Sonnet 4
    try {
      const saved = localStorage.getItem('regis_selected_model');
      return (saved as AIModelId) || 'claude-sonnet-4-20250514';
    } catch {
      return 'claude-sonnet-4-20250514';
    }
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const processedMessageIds = useRef<Set<string>>(new Set());

  // Initialize AI service with saved model on mount
  useEffect(() => {
    setModel(currentModel);
  }, []); // Run once on mount

  // Cleanup old processed IDs to prevent memory leak
  useEffect(() => {
    const currentIds = new Set(messages.map(m => m.id));
    const processedIds = processedMessageIds.current;

    // Remove IDs that no longer exist in messages
    for (const id of processedIds) {
      if (!currentIds.has(id)) {
        processedIds.delete(id);
      }
    }

    // Keep only last 100 IDs max
    if (processedIds.size > 100) {
      const idsArray = Array.from(processedIds);
      const toRemove = idsArray.slice(0, idsArray.length - 100);
      toRemove.forEach(id => processedIds.delete(id));
    }
  }, [messages]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, dynamicSuggestions]);
  useEffect(() => { if (showCwdInput) fetchFiles(); }, [showCwdInput, cwd]);

  useEffect(() => {
      const lastMsg = messages[messages.length - 1];
      // Only process if it's a completed bot message we haven't processed yet
      if (lastMsg && lastMsg.sender === Sender.BOT && !lastMsg.isStreaming && !isLoading && !processedMessageIds.current.has(lastMsg.id)) {
          const suggestionMatch = lastMsg.text.match(/```json:SUGGESTIONS\s*([\s\S]*?)\s*```/);
          if (suggestionMatch) {
              try {
                  const suggs = JSON.parse(suggestionMatch[1]);
                  if (Array.isArray(suggs)) setDynamicSuggestions(suggs.slice(0, 6));
              } catch (e) {}
          }
          // Mark as processed to avoid re-processing
          processedMessageIds.current.add(lastMsg.id);
          onAutoCurate(lastMsg.text);
      }
  }, [messages, isLoading, onAutoCurate]);

  const renderMessageText = (text: string) => text.replace(/```json:SUGGESTIONS[\s\S]*?```/, "").trim();

  const fetchFiles = async () => {
      try {
          const res = await executeSystemAction('fs_list', { cwd });
          if (res.files) setFiles(res.files);
          if (res.cwd) setCwd(res.cwd);
      } catch (e) { console.error(e); }
  };

  const handleNavigate = (folderName: string) => {
      let newPath = cwd;
      if (folderName === "..") { newPath = `${cwd}/..`; } 
      else { newPath = cwd === '.' ? folderName : `${cwd}/${folderName}`; }
      setCwd(newPath);
  };

  const handleRestart = async () => {
      if (!confirm("Restart Session?")) return;
      window.location.reload();
  };

  const handleExit = async () => {
      if (!confirm("⚠️ KILL SYSTEM?")) return;
      setMessages([]);
      try { await executeSystemAction('shutdown'); } catch (e) { }
      document.body.innerHTML = "<div style='color:#00ff41;display:flex;justify-content:center;align-items:center;height:100vh;background:black;font-family:monospace;font-size:2em;text-align:center;'><h1>SYSTEM TERMINATED</h1></div>";
      setTimeout(() => window.close(), 2000);
  };

  const handleImprove = async () => {
      if (!inputValue.trim()) return;
      setIsImproving(true);
      try { const improved = await improvePrompt(inputValue); setInputValue(improved); } catch (e) { } finally { setIsImproving(false); }
  };

  const handleSelectTemplate = (template: string) => {
      setInputValue(template);
      setShowTemplates(false);
  };

  const handleModelChange = (modelId: AIModelId) => {
      setCurrentModel(modelId);
      setModel(modelId); // Update the AI service with the new model
      try {
        localStorage.setItem('regis_selected_model', modelId);
      } catch (error) {
        console.error('Failed to save selected model:', error);
      }
  };

  const navigateHistory = (direction: 'up' | 'down') => {
      let nextIndex = direction === 'up' ? historyIndex + 1 : historyIndex - 1;
      if (nextIndex >= 0 && nextIndex < promptHistory.length) {
          setHistoryIndex(nextIndex);
          setInputValue(promptHistory[nextIndex]);
      } else if (nextIndex < 0) {
          setHistoryIndex(-1);
          setInputValue('');
      }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
      // Ctrl+Enter or just Enter (without Shift) to send
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
      // Ctrl+K to open templates
      else if (e.key === 'k' && e.ctrlKey) { e.preventDefault(); setShowTemplates(true); }
      // Ctrl+/ for help
      else if (e.key === '/' && e.ctrlKey) { e.preventDefault(); setShowHelp(true); }
      // Arrow keys for history navigation
      else if (e.key === 'ArrowUp') { e.preventDefault(); navigateHistory('up'); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); navigateHistory('down'); }
      // Escape to close menus
      else if (e.key === 'Escape') {
          setShowTemplates(false);
          setShowHelp(false);
          setShowCwdInput(false);
          setShowPowerMenu(false);
      }
  };

  const handleCommand = async (cmdText: string) => {
    const command = cmdText.replace('/cmd', '').trim();
    if (!command) return;
    addToHistory(`/cmd ${command}`);
    const cmdMsgId = Date.now().toString();
    setMessages(prev => [...prev, { id: cmdMsgId, text: `/cmd ${command}`, sender: Sender.USER, timestamp: Date.now() }]);
    setInputValue('');
    setDynamicSuggestions([]);
    setIsLoading(true);
    try {
        const res = await executeSystemAction('command', { command, cwd });
        const output = res.stdout || res.stderr || (res.code === 0 ? "Done" : "Error");
        const header = res.cmd_executed && res.cmd_executed !== command ? `[CMD] ('${res.cmd_executed}'):` : `[CMD]:`;
        setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), text: `${header}\n${output}`, sender: Sender.BOT, timestamp: Date.now() }]);
        fetchFiles();
    } catch (e: any) {
        setMessages(prev => [...prev, { id: (Date.now() + 1).toString(), text: `Error: ${e.message}`, sender: Sender.BOT, timestamp: Date.now() }]);
    } finally { setIsLoading(false); }
  };

  const handleSend = async (overrideInput?: string) => {
    const textToSend = overrideInput || inputValue;
    if ((!textToSend.trim() && attachments.length === 0) || isLoading) return;
    addToHistory(textToSend);
    if (textToSend.trim().startsWith('/cmd') || textToSend.trim().startsWith('ls') || textToSend.trim().startsWith('dir')) {
        let cmd = textToSend;
        if(!cmd.startsWith('/cmd')) cmd = `/cmd ${cmd}`;
        await handleCommand(cmd); return; 
    }
    const userMessage: Message = { id: Date.now().toString(), text: textToSend, sender: Sender.USER, timestamp: Date.now(), attachments: [...attachments] };
    const botMessageId = (Date.now() + 1).toString();
    setMessages(prev => [...prev, userMessage, { id: botMessageId, text: '', sender: Sender.BOT, timestamp: Date.now(), isStreaming: true }]);
    setInputValue(''); setAttachments([]); setDynamicSuggestions([]); setIsLoading(true);
    try {
        await sendMessageStream(
            userMessage.text,
            {
                onToken: (chunk: string) => {
                    setMessages(prev => prev.map(msg => msg.id === botMessageId ? { ...msg, text: msg.text + chunk } : msg));
                },
                onComplete: () => {},
                onError: (err: Error) => {
                    setMessages(prev => prev.map(msg => msg.id === botMessageId ? { ...msg, text: `Error: ${err.message}` } : msg));
                }
            },
            userMessage.attachments?.map(att => ({ type: att.type, data: att.data || '', mimeType: att.mimeType }))
        );
    } catch (error: any) {
        setMessages(prev => prev.map(msg => msg.id === botMessageId ? { ...msg, text: `Error: ${error.message}` } : msg));
    } finally { setIsLoading(false); setMessages(prev => prev.map(msg => msg.id === botMessageId ? { ...msg, isStreaming: false } : msg)); }
  };

  const validateAndProcessFile = async (file: File): Promise<{ success: boolean; attachment?: Attachment; error?: string }> => {
    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return { success: false, error: `${t.fileTooBig}: ${file.name} (${(file.size / 1024 / 1024).toFixed(2)}MB > 10MB)` };
    }

    // Validate file type
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase();
    const isValidType = ALLOWED_FILE_TYPES.includes(file.type) || ALLOWED_EXTENSIONS.includes(fileExtension || '');

    if (!isValidType) {
      return { success: false, error: `${t.invalidType}: ${file.name} (${file.type || 'unknown'})` };
    }

    // Read file
    try {
      const reader = new FileReader();
      const result = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          if (typeof reader.result === 'string') {
            resolve(reader.result);
          } else {
            reject(new Error('Failed to read file as data URL'));
          }
        };
        reader.onerror = () => reject(new Error(`${t.uploadError}: ${file.name}`));
        reader.readAsDataURL(file);
      });

      const attachment: Attachment = {
        type: 'image', // For now, all files are treated as image type for the AI
        url: result,
        mimeType: file.type || 'application/octet-stream',
        data: result.split(',')[1]
      };

      return { success: true, attachment };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : `${t.uploadError}: ${file.name}` };
    }
  };

  const handleDragEnter = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); setIsDragging(false); };
  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); e.stopPropagation(); };
  const handleDrop = useCallback(async (e: React.DragEvent) => {
      e.preventDefault(); e.stopPropagation(); setIsDragging(false);
      const droppedFiles = Array.from(e.dataTransfer.files);
      if (droppedFiles.length === 0) return;

      const newAttachments: Attachment[] = [];
      const errors: string[] = [];

      for (const file of droppedFiles) {
          const result = await validateAndProcessFile(file);
          if (result.success && result.attachment) {
            newAttachments.push(result.attachment);
          } else if (result.error) {
            errors.push(result.error);
            console.error('File validation error:', result.error);
          }
      }

      if (errors.length > 0) {
        alert(errors.join('\n'));
      }

      if (newAttachments.length > 0) {
        setAttachments(prev => [...prev, ...newAttachments]);
      }
  }, [t]);
  const removeAttachment = (index: number) => setAttachments(prev => prev.filter((_, i) => i !== index));

  return (
    <div className="flex flex-col h-full relative" onDragEnter={handleDragEnter} onDragOver={handleDragOver} onDragLeave={handleDragLeave} onDrop={handleDrop}>
      {isDragging && (<div className="absolute inset-0 z-[100] bg-emerald-500/20 backdrop-blur-md border-4 border-emerald-500 border-dashed m-4 rounded-3xl flex items-center justify-center pointer-events-none"><div className="bg-black/90 p-8 rounded-3xl text-emerald-400 flex flex-col items-center gap-6 animate-bounce border border-emerald-500/50"><UploadCloud size={80} /><span className="text-3xl font-bold font-mono tracking-widest">{t.drop}</span></div></div>)}

      <div className="px-8 py-5 bg-black/80 backdrop-blur-xl sticky top-0 z-20 flex justify-between items-center border-b border-white/5 shadow-2xl">
        <div className="flex items-center gap-4 relative">
            <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/30"><Bot className="text-emerald-400" size={28} /></div>
            <div className="flex flex-col">
                <span className="text-xl font-bold text-slate-100 font-mono tracking-wide matrix-text-shadow">REGIS PRIME</span>
                <div className="flex gap-2">
                    <span className="text-[10px] bg-red-900/40 text-red-300 border border-red-800/50 px-2 py-0.5 rounded tracking-widest font-bold">GOD MODE</span>
                    <button type="button" onClick={() => setShowCwdInput(!showCwdInput)} className="text-[10px] bg-emerald-900/20 text-emerald-300 border border-emerald-800/50 px-2 py-0.5 rounded hover:bg-emerald-900/40 transition-colors cursor-pointer truncate max-w-[200px]">DIR: {cwd}</button>
                </div>
            </div>
        </div>
        <div className="flex gap-3 relative items-center">
            <ModelSelector currentModel={currentModel} onModelChange={handleModelChange} lang={lang} />
            <button type="button" onClick={() => setShowHelp(!showHelp)} className={`p-3 rounded-xl transition-all ${showHelp ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-500 hover:text-emerald-400 hover:bg-white/5'}`}><HelpCircle size={24} /></button>
            {showHelp && (<div className="absolute top-full right-0 mt-4 w-80 bg-slate-900/95 border border-emerald-500/30 p-6 rounded-2xl shadow-2xl z-[60] backdrop-blur-xl animate-in slide-in-from-top-2"><h3 className="text-emerald-400 font-bold mb-3 flex items-center gap-2"><Terminal size={16}/> COMMANDS</h3><ul className="space-y-2 text-sm text-slate-300 font-mono"><li><span className="text-emerald-500">/cmd [x]</span> Execute</li><li><span className="text-emerald-500">ls/dir</span> List</li></ul></div>)}
            <div className="relative">
                <button type="button" onClick={() => setShowPowerMenu(!showPowerMenu)} className={`p-3 rounded-xl transition-all ${showPowerMenu ? 'bg-red-500/20 text-red-400' : 'text-slate-500 hover:text-red-400 hover:bg-white/5'}`}><Power size={24} /></button>
                {showPowerMenu && (
                    <div className="absolute top-full right-0 mt-4 w-56 bg-slate-900/95 border border-white/10 rounded-2xl shadow-2xl z-[60] flex flex-col overflow-hidden backdrop-blur-xl animate-in slide-in-from-top-2">
                        <button type="button" onClick={onArchive} className="p-4 text-left hover:bg-emerald-500/10 text-slate-300 hover:text-emerald-400 flex items-center gap-3 text-sm font-bold"><Archive size={18}/> {t.archive}</button>
                        <button type="button" onClick={handleRestart} className="p-4 text-left hover:bg-emerald-500/20 text-slate-300 hover:text-emerald-400 flex items-center gap-2 text-sm border-t border-white/5"><RefreshCw size={18}/> {t.restart}</button>
                        <button type="button" onClick={handleExit} className="p-4 text-left hover:bg-red-500/20 text-red-300 hover:text-red-400 flex items-center gap-3 text-sm border-t border-white/5 font-bold"><LogOut size={18}/> {t.exit}</button>
                    </div>
                )}
            </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        <div className="flex-1 overflow-y-auto p-6 md:p-10 space-y-10 scroll-smooth scrollbar-thin scrollbar-thumb-emerald-900 scrollbar-track-transparent">
            {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.sender === Sender.USER ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex max-w-[85%] ${msg.sender === Sender.USER ? 'flex-row-reverse' : 'flex-row'} items-start gap-6`}>
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-xl border ${msg.sender === Sender.USER ? 'bg-slate-800 border-slate-600 text-slate-300' : 'bg-emerald-900/40 border-emerald-500/40 text-emerald-400'}`}>{msg.sender === Sender.USER ? <User size={28} /> : <Bot size={28} />}</div>
                <div className="flex flex-col gap-2 min-w-0 w-full">
                    <div className={`group relative p-8 rounded-[2rem] shadow-xl backdrop-blur-md ${msg.sender === Sender.USER ? 'bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-tr-sm' : 'bg-black/60 text-slate-200 border border-white/10 rounded-tl-sm'}`}>
                        <div className="whitespace-pre-wrap leading-relaxed text-xl font-mono">{renderMessageText(msg.text)}</div>
                        {msg.attachments && msg.attachments.length > 0 && (<div className="flex flex-wrap gap-3 mt-6 pt-6 border-t border-white/10">{msg.attachments.map((att, idx) => (<div key={idx} className="bg-black/30 p-3 rounded-xl text-sm flex items-center gap-3 border border-white/5">{att.type === 'image' && <img src={att.url} className="w-20 h-20 object-cover rounded-lg" />}<span className="opacity-70 text-xs truncate max-w-[120px]">{att.mimeType}</span></div>))}</div>)}
                    </div>
                </div>
                </div>
            </div>
            ))}
            {isLoading && <MessageSkeleton />}
            <div ref={messagesEndRef} />
        </div>
        
        {showCwdInput && (
            <div className="w-80 bg-black/90 border-l border-white/10 p-6 overflow-y-auto animate-in slide-in-from-right duration-300 shadow-2xl backdrop-blur-xl z-30">
                <h3 className="text-sm font-bold text-emerald-500 mb-6 uppercase tracking-widest border-b border-white/10 pb-3 flex items-center gap-2"><FolderOpen size={18}/> {t.files}</h3>
                <div className="space-y-1">
                    {files.map((f, i) => (
                        <div key={i} className={`flex items-center gap-3 text-sm p-3 rounded-xl cursor-pointer transition-all ${f.name === '..' ? 'bg-emerald-900/20 border border-emerald-900/50 text-emerald-400 font-bold mb-2' : f.is_dir ? 'hover:bg-white/10 text-slate-200' : 'hover:bg-white/5 text-slate-400'} group`} onClick={() => { if (f.name === "..") handleNavigate(".."); else if (f.is_dir) handleNavigate(f.name); else setInputValue(prev => prev + ` "${f.name}"`); }}>
                            {f.name === ".." ? <ArrowUpLeft size={18} /> : f.is_dir ? <Folder size={18} className="text-yellow-500 group-hover:text-yellow-400" /> : <FileText size={18} />}
                            <span className="truncate flex-1">{f.name === ".." ? "[..] UP LEVEL" : f.name}</span>
                        </div>
                    ))}
                </div>
            </div>
        )}
      </div>

      <div className="bg-gradient-to-t from-black via-black/95 to-transparent sticky bottom-0 z-20 flex flex-col gap-4 pb-10 px-10 pt-10">
        
        {dynamicSuggestions.length > 0 && (
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide animate-in slide-in-from-bottom-4 fade-in">
                {dynamicSuggestions.map((s, i) => (
                    <button type="button" key={i} onClick={() => handleSend(s)} className="flex-shrink-0 flex items-center gap-3 bg-indigo-500/20 hover:bg-indigo-500/40 border border-indigo-500/50 px-5 py-3 rounded-2xl transition-all group whitespace-nowrap shadow-lg shadow-indigo-900/20">
                        <Lightbulb size={18} className="text-indigo-400 group-hover:text-white" />
                        <span className="text-sm font-bold text-indigo-200 group-hover:text-white">{s}</span>
                    </button>
                ))}
            </div>
        )}

        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide visible overflow-visible">
            {QUICK_BUBBLES.map((q, i) => (
                <div key={i} className="group relative">
                    <button type="button" onClick={() => handleCommand(q.cmd)} className="flex-shrink-0 flex items-center gap-3 bg-white/5 hover:bg-emerald-500/20 border border-white/5 hover:border-emerald-500/50 px-6 py-4 rounded-2xl transition-all">
                        <div className="w-8 h-8 rounded-full bg-black/50 flex items-center justify-center text-emerald-400 group-hover:scale-110 transition-transform"><Terminal size={18} /></div>
                        <div className="text-left"><div className="text-sm font-bold text-slate-200 group-hover:text-emerald-300">{q.label}</div></div>
                    </button>
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 px-4 py-2 bg-black/90 border border-emerald-500/30 text-emerald-400 text-sm font-bold rounded-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-xl backdrop-blur-sm">{q.desc}</div>
                </div>
            ))}
        </div>

        {attachments.length > 0 && (<div className="flex gap-3 p-3 bg-emerald-900/20 rounded-2xl mb-2 border border-emerald-500/20">{attachments.map((att, idx) => (<div key={idx} className="relative group">{att.type === 'image' ? <img src={att.url} className="w-20 h-20 object-cover rounded-xl border border-emerald-500/50 shadow-lg" /> : <div className="w-20 h-20 bg-black/50 rounded-xl flex items-center justify-center border border-emerald-500/30"><FileText className="text-emerald-400" size={32} /></div>}<button type="button" onClick={() => removeAttachment(idx)} className="absolute -top-3 -right-3 bg-red-500 text-white rounded-full p-1.5 shadow-lg hover:scale-110 transition-transform"><X size={14} /></button></div>))}</div>)}
        
        <div className="w-full relative shadow-2xl shadow-emerald-900/10">
            <div className="flex items-end gap-4 bg-black/80 backdrop-blur-2xl p-5 rounded-[2rem] border border-white/10 focus-within:border-emerald-500/50 transition-all">
                <button type="button" onClick={() => setShowCwdInput(!showCwdInput)} className={`p-4 rounded-2xl transition-all ${showCwdInput ? 'bg-emerald-500/20 text-emerald-400' : 'hover:bg-white/5 text-slate-400'}`} title="Browse Files"><FolderOpen size={32} /></button>
                <label className="p-4 hover:bg-white/5 text-slate-400 rounded-2xl cursor-pointer transition-colors"><Paperclip size={32} /><input type="file" multiple className="hidden" onChange={async (e) => { if (e.target.files) { const files = Array.from(e.target.files); const newAttachments: Attachment[] = []; const errors: string[] = []; for (const file of files) { const result = await validateAndProcessFile(file); if (result.success && result.attachment) { newAttachments.push(result.attachment); } else if (result.error) { errors.push(result.error); console.error('File validation error:', result.error); } } if (errors.length > 0) { alert(errors.join('\n')); } if (newAttachments.length > 0) { setAttachments(prev => [...prev, ...newAttachments]); } e.target.value = ''; } }} /></label>
                <button type="button" onClick={() => setShowTemplates(true)} className="p-4 rounded-2xl transition-all hover:bg-purple-500/20 text-slate-400 hover:text-purple-400" title="Prompt Templates"><BookTemplate size={32} /></button>
                <button type="button" onClick={handleImprove} disabled={isImproving || !inputValue.trim()} className={`p-4 rounded-2xl transition-all ${isImproving ? 'text-emerald-400' : 'text-slate-400 hover:text-emerald-400 hover:bg-white/5'}`} title="Improve Prompt (AI)">
                    {isImproving ? <LoadingSpinner size="sm" className="text-emerald-400" /> : <Sparkles size={32} />}
                </button>
                <textarea value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyDown={handleKeyDown} placeholder={isImproving ? t.improving : t.typeMsg} disabled={isImproving} rows={1} autoComplete="off" autoCorrect="off" spellCheck="false" className="flex-1 bg-transparent border-none focus:ring-0 focus:outline-none text-2xl text-slate-100 placeholder:text-slate-600 px-4 py-3 font-mono resize-none overflow-y-auto max-h-40" style={{minHeight: '4rem'}} />
                <button type="button" onClick={() => handleSend()} disabled={isLoading || isImproving} className="p-6 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-[1.5rem] transition-all shadow-lg hover:shadow-emerald-500/20">
                    {isLoading ? <LoadingSpinner size="sm" /> : <CornerDownLeft size={32} />}
                </button>
            </div>
        </div>
      </div>

      {showTemplates && (
        <PromptTemplates
          onSelectTemplate={handleSelectTemplate}
          lang={lang}
          onClose={() => setShowTemplates(false)}
        />
      )}

      {showHelp && (
        <KeyboardShortcutsHelp
          lang={lang}
          onClose={() => setShowHelp(false)}
        />
      )}
    </div>
  );
};
export default ChatArea;