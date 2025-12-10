import React, { useRef, useEffect, useState } from 'react';
import { Bot, User, BookmarkPlus, Loader2, Paperclip, Image as ImageIcon, Video, Sparkles, Radio, Search, ScanEye, ChevronDown, CornerDownLeft } from 'lucide-react';
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
export default ChatArea;