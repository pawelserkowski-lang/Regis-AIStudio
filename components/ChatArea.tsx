import React, { useRef, useEffect, useState } from 'react';
import { Send, Bot, User, BookmarkPlus, Loader2, Paperclip, Image as ImageIcon, Video, Mic, Sparkles, X, MapPin, Globe, Volume2, StopCircle, CornerDownLeft, Smile, Radio } from 'lucide-react';
import EmojiPicker, { EmojiClickData, EmojiStyle } from 'emoji-picker-react';
import { Message, Sender, Attachment } from '../types';
import { sendMessageStream, generateImage, generateVideo, generateSpeech, connectLiveSession, transcribeAudio } from '../services/geminiService';

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
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [isLiveMode, setIsLiveMode] = useState(false);
  const [liveSession, setLiveSession] = useState<any>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Audio Context Ref for Live API
  const audioContextRef = useRef<AudioContext | null>(null);
  const nextAudioStartTimeRef = useRef<number>(0);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, attachments]);

  useEffect(() => {
    return () => {
      audioContextRef.current?.close();
    };
  }, []);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
        textareaRef.current.style.height = 'auto';
        textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 120)}px`;
    }
  }, [input]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
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
      e.target.value = '';
  };

  const handleSend = async () => {
    if ((!input.trim() && attachments.length === 0) || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: input,
      sender: Sender.USER,
      timestamp: Date.now(),
      attachments: [...attachments]
    };

    setMessages(prev => [...prev, userMessage]);
    const currentAttachments = [...attachments];
    setInput('');
    setAttachments([]);
    setShowEmojiPicker(false);
    setIsLoading(true);

    const botMessageId = (Date.now() + 1).toString();
    const botMessage: Message = {
      id: botMessageId,
      text: '',
      sender: Sender.BOT,
      timestamp: Date.now(),
      isStreaming: true
    };

    setMessages(prev => [...prev, botMessage]);

    try {
      if (currentAttachments.length > 0 && currentAttachments[0].type === 'audio') {
           const transcription = await transcribeAudio(currentAttachments[0].data!);
            setMessages(prev => prev.map(msg => 
                msg.id === botMessageId 
                ? { ...msg, text: `Transcription:\n${transcription}` }
                : msg
            ));
      } else {
           await sendMessageStream(
             userMessage.text, 
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
          });
      }
    } catch (error) {
      console.error("Failed to send message", error);
      setMessages(prev => prev.map(msg => 
        msg.id === botMessageId 
          ? { ...msg, text: "I encountered an error connecting to my services. Please try again." }
          : msg
      ));
    } finally {
      setIsLoading(false);
      setMessages(prev => prev.map(msg => 
        msg.id === botMessageId 
          ? { ...msg, isStreaming: false }
          : msg
      ));
    }
  };

  const handleGenerateImage = async () => {
      const promptText = window.prompt("Enter image description:");
      if (!promptText) return;
      
      setIsLoading(true);
      try {
          const isEditing = attachments.length > 0 && attachments[0].type === 'image';
          const imgBase64 = isEditing ? attachments[0].data : undefined;

          const resultUrl = await generateImage(promptText, { 
              isEditing, 
              imageBase64: imgBase64,
              width: "1K",
              aspectRatio: "1:1"
          });
          
          const msg: Message = {
              id: Date.now().toString(),
              text: `Generated Image for: "${promptText}"`,
              sender: Sender.BOT,
              timestamp: Date.now(),
              attachments: [{ type: 'image', url: resultUrl, mimeType: 'image/png' }]
          };
          setMessages(prev => [...prev, msg]);
          setAttachments([]);
      } catch (e) {
          alert("Image generation failed");
      } finally {
          setIsLoading(false);
          setShowTools(false);
      }
  };

  const handleGenerateVideo = async () => {
      const promptText = window.prompt("Enter video description:");
      if (!promptText) return;
      setIsLoading(true);
      try {
          const videoUrl = await generateVideo(promptText, '16:9');
          const msg: Message = {
              id: Date.now().toString(),
              text: `Generated Video for: "${promptText}"`,
              sender: Sender.BOT,
              timestamp: Date.now(),
              attachments: [{ type: 'video', url: videoUrl, mimeType: 'video/mp4' }]
          };
          setMessages(prev => [...prev, msg]);
      } catch (e) {
          alert("Video generation failed (it takes time!)");
      } finally {
          setIsLoading(false);
          setShowTools(false);
      }
  };

  const decodePCM = (base64: string, ctx: AudioContext): AudioBuffer => {
      const bin = atob(base64);
      const len = bin.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) bytes[i] = bin.charCodeAt(i);
      
      const int16 = new Int16Array(bytes.buffer);
      const float32 = new Float32Array(int16.length);
      for(let i=0; i<int16.length; i++) float32[i] = int16[i] / 32768.0;
      
      const buffer = ctx.createBuffer(1, float32.length, 24000); 
      buffer.getChannelData(0).set(float32);
      return buffer;
  }

  const playAudioChunk = async (base64: string) => {
      if (!audioContextRef.current) {
          audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
      }
      const ctx = audioContextRef.current;
      
      if (ctx.state === 'suspended') {
          await ctx.resume();
      }

      try {
        const buffer = decodePCM(base64, ctx);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        
        const currentTime = ctx.currentTime;
        if (nextAudioStartTimeRef.current < currentTime) {
            nextAudioStartTimeRef.current = currentTime;
        }
        
        source.start(nextAudioStartTimeRef.current);
        nextAudioStartTimeRef.current += buffer.duration;
        
      } catch (e) { console.error("Audio decode error", e); }
  };

  const handleToggleLive = async () => {
      if (isLiveMode) {
          if (liveSession) liveSession.close();
          setLiveSession(null);
          setIsLiveMode(false);
          nextAudioStartTimeRef.current = 0;
          if (audioContextRef.current) {
              audioContextRef.current.close().then(() => {
                  audioContextRef.current = null;
              });
          }
      } else {
          setIsLiveMode(true);
          try {
              if (!audioContextRef.current) {
                  audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
                  nextAudioStartTimeRef.current = audioContextRef.current.currentTime;
              }

              const session = await connectLiveSession((audioBase64) => {
                  playAudioChunk(audioBase64);
              }, () => setIsLiveMode(false));
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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };
  
  const handleEmojiClick = (emojiData: EmojiClickData) => {
      setInput(prev => prev + emojiData.emoji);
  };

  return (
    <div className="flex flex-col h-full relative">
      {/* Live Mode Overlay */}
      {isLiveMode && (
          <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-xl flex flex-col items-center justify-center text-white transition-all duration-500">
              <div className="relative">
                <div className="absolute inset-0 bg-emerald-500 rounded-full animate-ping opacity-20"></div>
                <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-emerald-500 to-green-800 shadow-[0_0_50px_rgba(16,185,129,0.5)] flex items-center justify-center mb-8 relative z-10 border border-emerald-400/50">
                    <Mic size={56} className="text-white drop-shadow-md" />
                </div>
              </div>
              <h2 className="text-3xl font-bold mb-2 tracking-tight font-mono text-emerald-100">LIVE_LINK_ACTIVE</h2>
              <p className="text-emerald-400/70 mb-10 font-light">Listening on secure channel...</p>
              <button 
                onClick={handleToggleLive}
                className="px-8 py-4 bg-red-500/10 hover:bg-red-500/20 border border-red-500/50 text-red-400 rounded-full font-medium flex items-center gap-3 transition-all backdrop-blur-md"
              >
                  <StopCircle size={20} /> TERMINATE LINK
              </button>
          </div>
      )}

      {/* Header */}
      <div className="px-8 py-5 bg-black/40 backdrop-blur-md sticky top-0 z-10 flex justify-between items-center border-b border-white/5 shadow-lg shadow-black/20">
        <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-lg border border-emerald-500/30 shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                <Bot className="text-emerald-400" size={20} />
            </div>
            <div>
                <h2 className="text-lg font-bold text-slate-100 leading-tight font-mono">Regis_Assistant</h2>
                <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_5px_#10b981]"></span>
                    <p className="text-xs text-emerald-400/70 font-medium tracking-wide">SYSTEM ONLINE</p>
                </div>
            </div>
        </div>
        <button 
            onClick={handleToggleLive}
            className={`flex items-center gap-2 px-4 py-2 rounded-full font-medium text-sm transition-all border ${
                isLiveMode 
                ? 'bg-red-500/10 text-red-400 border-red-500/50' 
                : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/20 hover:shadow-[0_0_15px_rgba(16,185,129,0.2)]'
            }`}
        >
            <Radio size={16} className={isLiveMode ? "animate-pulse" : ""} />
            {isLiveMode ? 'LIVE ACTIVE' : 'INITIATE LIVE'}
        </button>
      </div>

      {/* Messages List */}
      <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 scroll-smooth scrollbar-thin scrollbar-thumb-emerald-900 scrollbar-track-transparent">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === Sender.USER ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`flex max-w-[85%] md:max-w-[70%] ${msg.sender === Sender.USER ? 'flex-row-reverse' : 'flex-row'} items-start gap-4`}>
              {/* Avatar */}
              <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg border ${
                msg.sender === Sender.USER 
                ? 'bg-slate-800 border-slate-600 text-slate-300' 
                : 'bg-emerald-900/50 border-emerald-500/50 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]'
              }`}>
                {msg.sender === Sender.USER ? <User size={18} /> : <Bot size={18} />}
              </div>
              
              <div className="flex flex-col gap-2 min-w-0">
                  {/* Sender Name */}
                  <span className={`text-xs font-medium ${msg.sender === Sender.USER ? 'text-right text-slate-400' : 'text-left text-emerald-500/70'}`}>
                      {msg.sender === Sender.USER ? 'YOU' : 'REGIS'} • {new Date(msg.timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </span>

                  {/* Message Bubble */}
                  <div className={`group relative p-5 rounded-2xl shadow-lg backdrop-blur-sm ${
                    msg.sender === Sender.USER 
                      ? 'bg-gradient-to-br from-emerald-600 to-teal-700 text-white rounded-tr-sm border border-emerald-400/20' 
                      : 'bg-black/40 text-slate-200 border border-white/10 rounded-tl-sm'
                  }`}>
                    {/* Attachments */}
                    {msg.attachments?.map((att, idx) => (
                        <div key={idx} className="mb-4 rounded-xl overflow-hidden border border-white/20 bg-black/40">
                            {att.type === 'image' && <img src={att.url} alt="Generated" className="max-w-full h-auto" />}
                            {att.type === 'video' && <video src={att.url} controls className="max-w-full h-auto" />}
                            {att.type === 'audio' && <audio src={att.url} controls className="w-full" />}
                        </div>
                    ))}

                    <div className="whitespace-pre-wrap leading-relaxed text-[15px]">
                        {msg.text}
                    </div>
                    
                    {/* Bot Actions */}
                    {msg.sender === Sender.BOT && msg.text && (
                        <div className="absolute -bottom-8 left-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button onClick={() => handleTTS(msg.text)} className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-white/5 rounded-md transition-colors" title="Read Aloud">
                                <Volume2 size={14} />
                            </button>
                            {!msg.isStreaming && (
                                <button 
                                    onClick={() => onSaveToRegistry(msg.text)}
                                    className="p-1.5 text-slate-400 hover:text-emerald-400 hover:bg-white/5 rounded-md transition-colors"
                                    title="Save to Registry"
                                >
                                    <BookmarkPlus size={14} />
                                </button>
                            )}
                        </div>
                    )}
                  </div>
                  
                  {/* Grounding Chips */}
                  {msg.groundingMetadata?.groundingChunks && (
                      <div className="flex flex-wrap gap-2 mt-1">
                          {msg.groundingMetadata.groundingChunks.map((chunk: any, i: number) => {
                              if (chunk.web?.uri) {
                                  return (
                                      <a key={i} href={chunk.web.uri} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-2.5 py-1.5 rounded-lg text-xs font-medium text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/30 transition-all shadow-sm">
                                          <Globe size={12} className="text-emerald-500" /> 
                                          <span className="truncate max-w-[200px]">{chunk.web.title || "Source"}</span>
                                      </a>
                                  )
                              }
                              if (chunk.maps?.uri) {
                                   return (
                                      <a key={i} href={chunk.maps.uri} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 bg-white/5 border border-white/10 px-2.5 py-1.5 rounded-lg text-xs font-medium text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/30 transition-all shadow-sm">
                                          <MapPin size={12} className="text-green-500" /> 
                                          <span className="truncate max-w-[200px]">{chunk.maps.title || "Location"}</span>
                                      </a>
                                  )
                              }
                              return null;
                          })}
                      </div>
                  )}
              </div>
            </div>
          </div>
        ))}
        {isLoading && messages[messages.length-1]?.sender === Sender.USER && (
           <div className="flex items-center gap-3 text-slate-400 text-sm ml-16 bg-black/40 px-4 py-2 rounded-full w-fit border border-emerald-500/20 shadow-[0_0_10px_rgba(16,185,129,0.1)]">
             <Loader2 size={16} className="animate-spin text-emerald-500" />
             <span className="font-medium font-mono text-emerald-500/80">PROCESSING...</span>
           </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Floating Input Area */}
      <div className="p-6 bg-gradient-to-t from-black via-black/80 to-transparent sticky bottom-0 z-20">
        <div className="max-w-4xl mx-auto relative">
             {/* Attachment Previews */}
            {attachments.length > 0 && (
                <div className="absolute bottom-full left-0 mb-4 flex gap-3 p-2 bg-black/80 backdrop-blur-xl border border-white/10 rounded-xl shadow-lg">
                    {attachments.map((att, i) => (
                        <div key={i} className="h-16 w-16 rounded-lg bg-white/5 overflow-hidden relative border border-white/10 group">
                            {att.type === 'image' ? <img src={att.url} className="h-full w-full object-cover"/> : <div className="h-full w-full flex items-center justify-center text-slate-400"><Paperclip size={20}/></div>}
                            <button onClick={() => setAttachments([])} className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity"><X size={16}/></button>
                        </div>
                    ))}
                </div>
            )}
            
            {/* Emoji Picker Popover */}
            {showEmojiPicker && (
                <div className="absolute bottom-24 right-0 z-50">
                    <EmojiPicker 
                        onEmojiClick={handleEmojiClick}
                        previewConfig={{ showPreview: false }}
                        width={300}
                        height={400}
                        theme={EmojiStyle.DARK as any}
                    />
                    <div 
                        className="fixed inset-0 z-[-1]" 
                        onClick={() => setShowEmojiPicker(false)}
                    />
                </div>
            )}

            {/* Input Capsule */}
            <div className="flex items-end gap-2 bg-black/60 backdrop-blur-xl p-2 rounded-2xl shadow-[0_0_20px_rgba(0,0,0,0.5)] border border-white/10 focus-within:ring-2 focus-within:ring-emerald-500/30 focus-within:border-emerald-500/50 transition-all">
                {/* Tools Toggle */}
                <div className="relative flex-shrink-0 flex items-end gap-1">
                    <button 
                        onClick={() => setShowTools(!showTools)}
                        className={`p-3 rounded-xl transition-all duration-200 ${showTools ? 'bg-emerald-500/20 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.2)]' : 'bg-transparent text-slate-400 hover:bg-white/5 hover:text-emerald-400'}`}
                        title="Generative Tools"
                    >
                        <Sparkles size={20} />
                    </button>
                    
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="p-3 rounded-xl transition-all duration-200 bg-transparent text-slate-400 hover:bg-white/5 hover:text-emerald-400"
                        title="Attach File"
                    >
                        <Paperclip size={20} />
                    </button>
                    
                    {showTools && (
                        <div className="absolute bottom-full left-0 mb-4 w-52 bg-black/90 backdrop-blur-xl rounded-xl shadow-2xl border border-white/10 p-2 flex flex-col gap-1 z-30 animate-in fade-in slide-in-from-bottom-2 duration-200">
                            <button onClick={handleGenerateImage} className="flex items-center gap-3 px-3 py-2.5 hover:bg-white/10 rounded-lg text-sm text-slate-300 hover:text-emerald-400 transition-colors">
                                <ImageIcon size={18} /> Generate Image
                            </button>
                            <button onClick={handleGenerateVideo} className="flex items-center gap-3 px-3 py-2.5 hover:bg-white/10 rounded-lg text-sm text-slate-300 hover:text-emerald-400 transition-colors">
                                <Video size={18} /> Generate Video
                            </button>
                        </div>
                    )}
                </div>

                <div className="flex-1 relative flex items-end gap-2">
                    <input 
                        type="file" 
                        ref={fileInputRef} 
                        className="hidden" 
                        onChange={handleFileUpload} 
                        accept="image/*,video/*,audio/*"
                    />
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={attachments.length > 0 ? "Ask about this media..." : "Type a message..."}
                        className="w-full pl-2 pr-2 py-3 bg-transparent border-none focus:ring-0 resize-none max-h-32 min-h-[50px] scrollbar-hide text-slate-100 placeholder:text-slate-500"
                        rows={1}
                    />
                    
                    {/* Emoji Trigger */}
                    <button 
                        onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                        className={`p-2 mb-1.5 rounded-lg transition-colors ${showEmojiPicker ? 'text-emerald-400 bg-emerald-500/10' : 'text-slate-400 hover:text-emerald-400 hover:bg-white/5'}`}
                    >
                        <Smile size={20} />
                    </button>
                </div>

                <button
                    onClick={handleSend}
                    disabled={(!input.trim() && attachments.length === 0) || isLoading}
                    className="p-3 bg-emerald-600 text-white rounded-xl hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:shadow-[0_0_20px_rgba(16,185,129,0.5)] active:scale-95 mb-0.5 mr-0.5"
                >
                    {isLoading ? <Loader2 size={20} className="animate-spin"/> : <CornerDownLeft size={20} />}
                </button>
            </div>
            
            <div className="text-center mt-3 text-xs text-slate-500 font-mono">
                Regis_System_Link_Active
            </div>
        </div>
      </div>
    </div>
  );
};

export default ChatArea;