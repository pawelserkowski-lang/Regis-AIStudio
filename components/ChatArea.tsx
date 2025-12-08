import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Bot, User, BookmarkPlus, Loader2, Paperclip, Image as ImageIcon, Video, Mic, Sparkles, X, MapPin, Globe, Volume2, StopCircle, CornerDownLeft, Radio, Search } from 'lucide-react';
import { Message, Sender, Attachment } from '../types';
import { sendMessageStream, generateImage, generateVideo, generateSpeech, connectLiveSession, transcribeAudio, AudioStreamPlayer } from '../services/geminiService';

interface ChatAreaProps {
  messages: Message[];
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  onSaveToRegistry: (content: string) => void;
}

const ChatArea: React.FC<ChatAreaProps> = ({ messages, setMessages, onSaveToRegistry }) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [showTools, setShowTools] = useState(false);
  
  // Live Mode State
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [liveSession, setLiveSession] = useState<any>(null);
  
  // Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const audioPlayerRef = useRef<AudioStreamPlayer>(new AudioStreamPlayer(24000));

  // --- Filtering ---
  const displayedMessages = useMemo(() => {
    if (!searchQuery) return messages;
    const lowerQuery = searchQuery.toLowerCase();
    return messages.filter(msg => msg.text.toLowerCase().includes(lowerQuery));
  }, [messages, searchQuery]);

  // --- Effects ---
  useEffect(() => {
    if (!searchQuery) {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, attachments, searchQuery]);

  useEffect(() => {
    // Cleanup audio player on unmount
    return () => audioPlayerRef.current.close();
  }, []);

  useEffect(() => {
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  // --- Handlers ---

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
          const result = e.target?.result as string;
          const base64 = result.split(',')[1];
          const type = file.type.startsWith('image/') ? 'image' : file.type.startsWith('video/') ? 'video' : 'audio';
          
          setAttachments(prev => [...prev, {
              type,
              url: result,
              mimeType: file.type,
              data: base64
          }]);
      };
      reader.readAsDataURL(file);
      e.target.value = ''; // Reset input
  };

  const handleSend = async () => {
    if ((!input.trim() && attachments.length === 0) || isLoading) return;

    // UI Updates
    if (searchQuery) {
        setSearchQuery('');
        setShowSearch(false);
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      sender: Sender.USER,
      timestamp: Date.now(),
      attachments: [...attachments]
    };
    const botMessageId = (Date.now() + 1).toString();
    const botMessage: Message = {
        id: botMessageId,
        text: '',
        sender: Sender.BOT,
        timestamp: Date.now(),
        isStreaming: true
    };

    setMessages(prev => [...prev, userMessage, botMessage]);
    
    // Capture current state for processing
    const currentAttachments = [...attachments];
    const userText = input;
    
    // Cleanup input state
    setInput('');
    setAttachments([]);
    setIsLoading(true);

    try {
      // Flow 1: Audio Transcription
      if (currentAttachments.length > 0 && currentAttachments[0].type === 'audio') {
           const transcription = await transcribeAudio(currentAttachments[0].data!);
            setMessages(prev => prev.map(msg => 
                msg.id === botMessageId 
                ? { ...msg, text: `Transcription:\n${transcription}`, isStreaming: false }
                : msg
            ));
      } 
      // Flow 2: Text/Multimodal Chat
      else {
           await sendMessageStream(
             userText, 
             currentAttachments.map(a => ({ data: a.data!, mimeType: a.mimeType })),
             (chunk, grounding) => {
                setMessages(prev => prev.map(msg => 
                    msg.id === botMessageId 
                    ? { 
                        ...msg, 
                        text: msg.text + chunk,
                        groundingMetadata: grounding || msg.groundingMetadata
                    }
                    : msg
                ));
            }
          );
      }
    } catch (error) {
      console.error("Message Error", error);
      setMessages(prev => prev.map(msg => 
        msg.id === botMessageId 
          ? { ...msg, text: "I encountered an error connecting to my services. Please try again." }
          : msg
      ));
    } finally {
      setIsLoading(false);
      setMessages(prev => prev.map(msg => msg.id === botMessageId ? { ...msg, isStreaming: false } : msg));
    }
  };

  const handleGenerateMedia = async (type: 'image' | 'video') => {
      const promptText = window.prompt(`Enter ${type} description:`);
      if (!promptText) return;
      
      setIsLoading(true);
      setShowTools(false);
      
      try {
          let msg: Message;
          if (type === 'image') {
              const isEditing = attachments.length > 0 && attachments[0].type === 'image';
              const imageBase64 = isEditing ? attachments[0].data : undefined;
              const resultUrl = await generateImage(promptText, { isEditing, imageBase64, width: "1K" });
              
              msg = {
                  id: Date.now().toString(),
                  text: `Generated Image for: "${promptText}"`,
                  sender: Sender.BOT,
                  timestamp: Date.now(),
                  attachments: [{ type: 'image', url: resultUrl, mimeType: 'image/png' }]
              };
          } else {
              const videoUrl = await generateVideo(promptText, '16:9');
              msg = {
                  id: Date.now().toString(),
                  text: `Generated Video for: "${promptText}"`,
                  sender: Sender.BOT,
                  timestamp: Date.now(),
                  attachments: [{ type: 'video', url: videoUrl, mimeType: 'video/mp4' }]
              };
          }
          setMessages(prev => [...prev, msg]);
          if (type === 'image') setAttachments([]); // Clear if used for editing
      } catch (e) {
          alert(`${type.toUpperCase()} generation failed. See console.`);
      } finally {
          setIsLoading(false);
      }
  };

  const handleToggleLive = async () => {
      if (isLiveMode) {
          if (liveSession) liveSession.close();
          setLiveSession(null);
          setIsLiveMode(false);
          audioPlayerRef.current.close();
      } else {
          setIsLiveMode(true);
          try {
              // Initialize audio context via player
              await audioPlayerRef.current.initialize();
              
              const session = await connectLiveSession(
                  (audioBase64) => audioPlayerRef.current.play(audioBase64), 
                  () => setIsLiveMode(false)
              );
              setLiveSession(session);
          } catch (e) {
              console.error("Live failed", e);
              setIsLiveMode(false);
          }
      }
  };

  const handleTTS = async (text: string) => {
      try {
          const url = await generateSpeech(text);
          const audio = new Audio(url);
          audio.play();
      } catch (e) { alert("TTS Failed"); }
  };

  // --- Render Helpers ---

  const renderLiveOverlay = () => (
      <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-xl flex flex-col items-center justify-center text-white animate-in fade-in duration-300">
        <div className="relative mb-8">
            <div className="absolute inset-0 bg-emerald-500 rounded-full animate-ping opacity-20"></div>
            <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-emerald-500 to-green-800 shadow-[0_0_50px_rgba(16,185,129,0.5)] flex items-center justify-center relative z-10 border border-emerald-400/50">
                <Mic size={56} className="text-white drop-shadow-md" />
            </div>
        </div>
        <h2 className="text-3xl font-bold mb-2 tracking-tight font-mono text-emerald-100">LIVE_LINK_ACTIVE</h2>
        <p className="text-emerald-400/70 mb-10 font-light">Listening on secure channel...</p>
        <button 
            onClick={handleToggleLive}
            className="px-8 py-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/50 text-red-400 rounded-full font-medium flex items-center gap-3 transition-all backdrop-blur-md group"
        >
            <StopCircle size={20} /> TERMINATE LINK
        </button>
      </div>
  );

  const Tooltip = ({ text }: { text: string }) => (
      <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-800 border border-white/10 text-slate-200 text-[10px] font-medium rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-lg">
          {text}
          <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-800 border-r border-b border-white/10 transform rotate-45"></div>
      </div>
  );

  return (
    <div className="flex flex-col h-full relative">
      {isLiveMode && renderLiveOverlay()}

      {/* Header */}
      <div className="px-6 py-4 bg-black/40 backdrop-blur-md sticky top-0 z-10 flex justify-between items-center border-b border-white/5 shadow-lg shadow-black/20">
        <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                <Bot className="text-emerald-400" size={20} />
            </div>
            <div className="hidden md:block">
                <h2 className="text-lg font-bold text-slate-100 leading-tight font-mono">Regis_Assistant</h2>
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_5px_#10b981]"></span>
                    <p className="text-xs text-emerald-400/70 font-medium tracking-wide">SYSTEM ONLINE</p>
                </div>
            </div>
        </div>

        <div className="flex items-center gap-3">
            <div className={`flex items-center transition-all duration-300 ${showSearch ? 'w-full md:w-64 bg-black/60 border border-emerald-500/30 rounded-full px-3 py-1.5' : 'w-auto'}`}>
                {showSearch ? (
                    <>
                        <Search size={16} className="text-emerald-500/70 mr-2 flex-shrink-0" />
                        <input 
                            autoFocus
                            type="text" 
                            placeholder="Search logs..." 
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-transparent border-none focus:ring-0 text-sm text-emerald-100 placeholder:text-emerald-500/30 w-full p-0"
                        />
                        <button onClick={() => { setShowSearch(false); setSearchQuery(''); }} className="ml-2 text-emerald-500/50 hover:text-emerald-400 relative group">
                            <X size={14} />
                             <Tooltip text="Clear Search" />
                        </button>
                    </>
                ) : (
                    <button onClick={() => setShowSearch(true)} className="p-2 text-slate-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded-full transition-colors relative group">
                        <Search size={20} />
                        <Tooltip text="Search Logs" />
                    </button>
                )}
            </div>

            <button 
                onClick={handleToggleLive}
                className={`relative group flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm transition-all border whitespace-nowrap ${
                    isLiveMode 
                    ? 'bg-red-500/10 text-red-400 border-red-500/50' 
                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20 hover:shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                }`}
            >
                <Radio size={16} className={isLiveMode ? "animate-pulse" : ""} />
                <span className="hidden md:inline">{isLiveMode ? 'LIVE ACTIVE' : 'LIVE MODE'}</span>
                {/* Tooltip for Live Button */}
                <div className="absolute top-full mt-3 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-900 border border-white/10 text-slate-200 text-xs font-medium rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 shadow-lg">
                    {isLiveMode ? "End Session" : "Start Live Session"}
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-slate-900 border-l border-t border-white/10 transform rotate-45"></div>
                </div>
            </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6 scroll-smooth scrollbar-thin scrollbar-thumb-emerald-900 scrollbar-track-transparent">
        {searchQuery && (
            <div className="flex justify-center mb-4">
                <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-4 py-1.5 rounded-full text-xs font-mono tracking-wide shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                    FILTERING: {displayedMessages.length} RESULT(S) FOUND
                </span>
            </div>
        )}

        {displayedMessages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === Sender.USER ? 'justify-end' : 'justify-start'}`}>
            <div className={`flex max-w-[90%] md:max-w-[70%] ${msg.sender === Sender.USER ? 'flex-row-reverse' : 'flex-row'} items-start gap-4`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg border ${
                msg.sender === Sender.USER 
                ? 'bg-slate-800 border-slate-600 text-slate-300' 
                : 'bg-emerald-900/50 border-emerald-500/50 text-emerald-400'
              }`}>
                {msg.sender === Sender.USER ? <User size={18} /> : <Bot size={18} />}
              </div>
              
              <div className="flex flex-col gap-1 min-w-0">
                  <span className={`text-[10px] font-medium uppercase tracking-wider ${msg.sender === Sender.USER ? 'text-right text-slate-500' : 'text-left text-emerald-500/50'}`}>
                      {msg.sender === Sender.USER ? 'YOU' : 'REGIS'} • {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>

                  <div className={`group relative p-5 rounded-2xl shadow-lg backdrop-blur-sm ${
                    msg.sender === Sender.USER 
                      ? 'bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-tr-sm' 
                      : 'bg-black/40 text-slate-200 border border-white/10 rounded-tl-sm'
                  }`}>
                    {msg.attachments?.map((att, idx) => (
                        <div key={idx} className="mb-4 rounded-xl overflow-hidden border border-white/20 bg-black/40">
                            {att.type === 'image' && <img src={att.url} alt="Generated" className="max-w-full h-auto" />}
                            {att.type === 'video' && <video src={att.url} controls className="max-w-full h-auto" />}
                            {att.type === 'audio' && <audio src={att.url} controls className="w-full" />}
                        </div>
                    ))}

                    <div className="whitespace-pre-wrap leading-relaxed text-[15px]">{msg.text}</div>
                    
                    {/* Bot Tools */}
                    {msg.sender === Sender.BOT && msg.text && (
                        <div className="absolute -bottom-8 left-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleTTS(msg.text)} className="relative group/btn p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-white/5 rounded-md">
                                <Volume2 size={14} />
                                <Tooltip text="Read Aloud" />
                            </button>
                            {!msg.isStreaming && (
                                <button onClick={() => onSaveToRegistry(msg.text)} className="relative group/btn p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-white/5 rounded-md">
                                    <BookmarkPlus size={14} />
                                    <Tooltip text="Save to Registry" />
                                </button>
                            )}
                        </div>
                    )}
                  </div>

                  {/* Grounding */}
                  {msg.groundingMetadata?.groundingChunks && (
                      <div className="flex flex-wrap gap-2 mt-2">
                          {msg.groundingMetadata.groundingChunks.map((chunk: any, i: number) => {
                              const uri = chunk.web?.uri || chunk.maps?.uri;
                              const title = chunk.web?.title || chunk.maps?.title || "Source";
                              const Icon = chunk.maps ? MapPin : Globe;
                              if (!uri) return null;
                              return (
                                  <a key={i} href={uri} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-2 py-1 rounded-md text-[10px] text-emerald-400 hover:bg-emerald-500/10">
                                      <Icon size={10} /> <span className="truncate max-w-[150px]">{title}</span>
                                  </a>
                              )
                          })}
                      </div>
                  )}
              </div>
            </div>
          </div>
        ))}
        
        {displayedMessages.length === 0 && searchQuery && (
             <div className="text-center text-slate-500 py-10 font-mono text-sm">NO DATA MATCHING QUERY "{searchQuery}"</div>
        )}
        
        {isLoading && messages[messages.length-1]?.sender === Sender.USER && (
           <div className="flex items-center gap-2 text-slate-400 text-xs ml-16">
             <Loader2 size={12} className="animate-spin text-emerald-500" />
             <span className="font-mono text-emerald-500/80">THINKING...</span>
           </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-4 md:p-6 bg-gradient-to-t from-black via-black/90 to-transparent sticky bottom-0 z-20">
        <div className="max-w-4xl mx-auto relative">
            {/* Attachment Preview */}
            {attachments.length > 0 && (
                <div className="absolute bottom-full left-0 mb-4 flex gap-3 p-2 bg-black/80 backdrop-blur-xl border border-white/10 rounded-xl shadow-lg">
                    {attachments.map((att, i) => (
                        <div key={i} className="h-16 w-16 rounded-lg bg-white/5 overflow-hidden relative border border-white/10 group">
                            {att.type === 'image' ? <img src={att.url} className="h-full w-full object-cover"/> : <div className="h-full w-full flex items-center justify-center text-slate-400"><Paperclip size={20}/></div>}
                            <button onClick={() => setAttachments([])} className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white"><X size={16}/></button>
                            <div className="absolute -top-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-800 text-xs text-white rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">Remove</div>
                        </div>
                    ))}
                </div>
            )}
            
            <div className="flex items-end gap-2 bg-black/60 backdrop-blur-xl p-2 rounded-2xl shadow-2xl border border-white/10 focus-within:border-emerald-500/50 transition-all">
                {/* Tools */}
                <div className="relative flex-shrink-0 flex items-end gap-1">
                    <button onClick={() => setShowTools(!showTools)} className={`relative group p-3 rounded-xl transition-all ${showTools ? 'bg-emerald-500/20 text-emerald-400' : 'text-slate-400 hover:text-emerald-400'}`}>
                        <Sparkles size={20} />
                        <Tooltip text="AI Tools" />
                    </button>
                    <button onClick={() => fileInputRef.current?.click()} className="relative group p-3 rounded-xl text-slate-400 hover:text-emerald-400">
                        <Paperclip size={20} />
                        <Tooltip text="Attach File" />
                    </button>
                    
                    {showTools && (
                        <div className="absolute bottom-full left-0 mb-4 w-52 bg-black/90 backdrop-blur-xl rounded-xl border border-white/10 p-2 flex flex-col gap-1 z-30 animate-in fade-in slide-in-from-bottom-2">
                            <button onClick={() => handleGenerateMedia('image')} className="flex items-center gap-3 px-3 py-2.5 hover:bg-white/10 rounded-lg text-sm text-slate-300 hover:text-emerald-400 relative group">
                                <ImageIcon size={18} /> Generate Image
                            </button>
                            <button onClick={() => handleGenerateMedia('video')} className="flex items-center gap-3 px-3 py-2.5 hover:bg-white/10 rounded-lg text-sm text-slate-300 hover:text-emerald-400 relative group">
                                <Video size={18} /> Generate Video
                            </button>
                        </div>
                    )}
                </div>

                <div className="flex-1 relative flex items-end gap-2">
                    <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileUpload} accept="image/*,video/*,audio/*" />
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                        placeholder={attachments.length > 0 ? "Ask about this media..." : "Type a message..."}
                        className="w-full pl-2 pr-2 py-3 bg-transparent border-none focus:ring-0 resize-none max-h-32 min-h-[50px] scrollbar-hide text-slate-100 placeholder:text-slate-500"
                        rows={1}
                    />
                </div>

                <button
                    onClick={handleSend}
                    disabled={(!input.trim() && attachments.length === 0) || isLoading}
                    className="relative group p-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all mb-0.5 mr-0.5"
                >
                    {isLoading ? <Loader2 size={20} className="animate-spin"/> : <CornerDownLeft size={20} />}
                    <Tooltip text="Send Message" />
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ChatArea;