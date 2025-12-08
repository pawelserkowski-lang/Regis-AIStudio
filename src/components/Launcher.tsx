import React, { useState, useEffect, useRef } from 'react';
import { Shield, Lock, Activity, Zap, Fingerprint, Power, User, Key, Check, Cpu, HardDrive, Wifi, Speaker, Terminal } from 'lucide-react';

interface LauncherProps {
  onLogin: (username: string) => void;
}

interface SystemRequirement {
  id: string;
  label: string;
  icon: any;
  status: 'PENDING' | 'CHECKING' | 'INSTALLING' | 'DONE' | 'FAILED';
  check: () => boolean;
}

const Launcher: React.FC<LauncherProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [status, setStatus] = useState<'BOOTING' | 'SYSTEM_CHECK' | 'NO_KEY' | 'IDLE' | 'VERIFYING' | 'ACCESS_GRANTED' | 'ACCESS_DENIED'>('BOOTING');
  
  // Requirement Checks Configuration
  const [requirements, setRequirements] = useState<SystemRequirement[]>([
    { id: 'mem', label: 'MEMORY_ALLOC', icon: HardDrive, status: 'PENDING', check: () => !!window.localStorage },
    { id: 'net', label: 'NEURAL_LINK', icon: Wifi, status: 'PENDING', check: () => navigator.onLine },
    { id: 'aud', label: 'AUDIO_CORE', icon: Speaker, status: 'PENDING', check: () => !!(window.AudioContext || (window as any).webkitAudioContext) },
    { id: 'cry', label: 'CRYPTO_SHARD', icon: Lock, status: 'PENDING', check: () => !!window.crypto },
    { id: 'gpu', label: 'VISUAL_CTX', icon: Cpu, status: 'PENDING', check: () => !!document.createElement('canvas').getContext('2d') },
  ]);

  const isBypassed = useRef(false);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const triggerQuickLaunch = () => {
    if (isBypassed.current || status === 'NO_KEY') return;
    isBypassed.current = true;
    
    if (isMounted.current) {
        setUsername('DEV_OVERRIDE');
        setPassword('*********');
        setStatus('ACCESS_GRANTED');
    }
    
    setTimeout(() => {
        if (isMounted.current) onLogin('DEV_OVERRIDE');
    }, 100); 
  };

  // Keyboard Shortcut for Quick Bypass (Alt + Q)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.altKey && (e.key === 'q' || e.key === 'Q')) {
        triggerQuickLaunch();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onLogin, status]);

  // Boot Sequence & Diagnostics
  useEffect(() => {
    const bootSystem = async () => {
      if (isBypassed.current) return;

      // Phase 1: Artificial Boot Delay
      await new Promise(r => setTimeout(r, 800));
      if (!isMounted.current) return;
      
      setStatus('SYSTEM_CHECK');

      // Phase 2: Sequential Requirement Check
      const updatedReqs = [...requirements];
      
      for (let i = 0; i < updatedReqs.length; i++) {
        if (!isMounted.current) return;

        // Set Checking
        setRequirements(prev => prev.map((r, idx) => idx === i ? { ...r, status: 'CHECKING' } : r));
        await new Promise(r => setTimeout(r, 300));

        // Set Installing/Mounting simulation
        setRequirements(prev => prev.map((r, idx) => idx === i ? { ...r, status: 'INSTALLING' } : r));
        await new Promise(r => setTimeout(r, 400)); // Simulate install time

        // Perform Actual Check & Result
        const result = updatedReqs[i].check();
        setRequirements(prev => prev.map((r, idx) => idx === i ? { ...r, status: result ? 'DONE' : 'FAILED' } : r));
        await new Promise(r => setTimeout(r, 200));
      }

      // Phase 3: Auth Check
      await new Promise(r => setTimeout(r, 500));
      if (!isMounted.current) return;

      const hasEnvKey = !!process.env.API_KEY && process.env.API_KEY.length > 0;
      const hasLocalKey = !!localStorage.getItem('GEMINI_API_KEY');
      
      if (!hasEnvKey && !hasLocalKey) {
        setStatus('NO_KEY');
      } else {
        setStatus('IDLE');
      }
    };

    bootSystem();
  }, []); // Run once on mount

  const handleSaveKey = (e: React.FormEvent) => {
    e.preventDefault();
    if (!apiKey) return;
    
    localStorage.setItem('GEMINI_API_KEY', apiKey);
    window.location.reload(); // Reload to initialize services with new key
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;

    setStatus('VERIFYING');

    // Fast verification
    setTimeout(() => {
      if (!isMounted.current) return;

      if (password.length < 3) {
        setStatus('ACCESS_DENIED');
        setTimeout(() => {
            if (isMounted.current) setStatus('IDLE');
        }, 500);
      } else {
        setStatus('ACCESS_GRANTED');
        setTimeout(() => {
          if (isMounted.current) onLogin(username);
        }, 200);
      }
    }, 200);
  };

  const renderRequirementsList = () => (
    <div className="w-full space-y-3 font-mono text-xs">
      <div className="text-[10px] text-emerald-500/50 uppercase tracking-widest mb-4 border-b border-emerald-500/10 pb-2">
        Kernel Module Installation
      </div>
      {requirements.map((req) => (
        <div key={req.id} className="flex items-center justify-between group">
          <div className="flex items-center gap-3">
             <req.icon size={14} className={`${
                req.status === 'PENDING' ? 'text-slate-700' :
                req.status === 'FAILED' ? 'text-red-500' : 
                'text-emerald-500'
             }`} />
             <span className={`${
                req.status === 'PENDING' ? 'text-slate-600' : 'text-slate-300'
             }`}>{req.label}</span>
          </div>
          <div className="w-24 text-right">
             {req.status === 'PENDING' && <span className="text-slate-700">...</span>}
             {req.status === 'CHECKING' && <span className="text-amber-400 animate-pulse">CHECKING</span>}
             {req.status === 'INSTALLING' && <span className="text-emerald-400 animate-pulse">INSTALLING</span>}
             {req.status === 'DONE' && <span className="text-emerald-500 font-bold">[ OK ]</span>}
             {req.status === 'FAILED' && <span className="text-red-500 font-bold">[ ERR ]</span>}
          </div>
        </div>
      ))}
      <div className="mt-4 pt-2 border-t border-emerald-500/10 text-center">
         <span className="animate-pulse text-emerald-500/70">INITIALIZING CORE SERVICES...</span>
      </div>
    </div>
  );

  const renderKeyInput = () => (
     <form onSubmit={handleSaveKey} className="w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="space-y-2">
            <label className="text-[10px] text-amber-500 font-bold tracking-widest uppercase ml-1 animate-pulse">Missing Neural Link</label>
            <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-amber-500 transition-colors">
                    <Key size={16} fill="currentColor" className="opacity-50" />
                </div>
                <input 
                    type="password" 
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    className="w-full bg-amber-900/10 border border-amber-900/30 rounded-xl py-3.5 pl-11 pr-4 text-amber-100 placeholder-amber-800/50 focus:outline-none focus:border-amber-500/40 focus:ring-1 focus:ring-amber-500/10 transition-all text-sm font-mono"
                    placeholder="ENTER GEMINI API KEY"
                    autoFocus
                />
            </div>
            <p className="text-[9px] text-slate-500 px-1">
                Enter your Google Gemini API Key to initialize the Regis kernel. This key is stored locally in your browser.
            </p>
        </div>
        <button 
            type="submit"
            disabled={!apiKey}
            className="w-full py-3.5 rounded-xl font-bold tracking-[0.1em] uppercase text-sm flex items-center justify-center gap-2 transition-all duration-300 border bg-amber-900/20 border-amber-500/30 text-amber-500 hover:bg-amber-500 hover:text-black hover:border-amber-400 disabled:opacity-50 disabled:cursor-not-allowed"
        >
             <Check size={16} /> INITIALIZE SYSTEM
        </button>
     </form>
  );

  const renderLoginForm = () => (
    <form onSubmit={handleLogin} className="w-full space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
        {/* Identity Input */}
        <div className="space-y-2">
            <label className="text-[10px] text-slate-500 font-bold tracking-widest uppercase ml-1">Identity</label>
            <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-emerald-500 transition-colors">
                    <User size={16} fill="currentColor" className="opacity-50" />
                </div>
                <input 
                    type="text" 
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    disabled={status !== 'IDLE'}
                    className="w-full bg-slate-900/30 border border-slate-800 rounded-xl py-3.5 pl-11 pr-4 text-slate-200 placeholder-slate-700 focus:outline-none focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/10 transition-all text-sm font-medium"
                    placeholder="OPERATOR ID"
                    autoFocus
                />
            </div>
        </div>

        {/* Passcode Input */}
            <div className="space-y-2">
            <label className="text-[10px] text-slate-500 font-bold tracking-widest uppercase ml-1">Passcode</label>
            <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-emerald-500 transition-colors">
                    <Shield size={16} fill="currentColor" className="opacity-50" />
                </div>
                <input 
                    type="password" 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={status !== 'IDLE'}
                    className="w-full bg-slate-900/30 border border-slate-800 rounded-xl py-3.5 pl-11 pr-4 text-slate-200 placeholder-slate-700 focus:outline-none focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/10 transition-all text-sm tracking-widest"
                    placeholder="••••••••••••"
                />
            </div>
        </div>

        {/* Submit Button */}
        <button 
            type="submit"
            disabled={status !== 'IDLE' || !username || !password}
            className={`w-full mt-8 py-3.5 rounded-xl font-bold tracking-[0.1em] uppercase text-sm flex items-center justify-center gap-2 transition-all duration-300 group disabled:opacity-50 disabled:cursor-not-allowed border ${
                status === 'ACCESS_DENIED'
                ? 'bg-red-900/20 border-red-500/40 text-red-500'
                : 'bg-emerald-900/20 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500 hover:text-black hover:border-emerald-400 hover:shadow-[0_0_20px_rgba(16,185,129,0.3)]'
            }`}
        >
                {status === 'VERIFYING' ? (
                <Activity className="animate-spin" size={16} />
                ) : (
                <Power size={16} className={status === 'ACCESS_GRANTED' ? 'text-white' : ''} />
                )}
                
                {status === 'VERIFYING' && 'VERIFYING...'}
                {status === 'ACCESS_DENIED' && 'ACCESS DENIED'}
                {status === 'ACCESS_GRANTED' && 'SUCCESS'}
                {status === 'IDLE' && 'INITIALIZE'}
        </button>
    </form>
  );

  return (
    <div className="h-screen w-full bg-[#020202] flex items-center justify-center font-mono text-slate-200 selection:bg-emerald-500/30 relative overflow-hidden">
        {/* Background Ambient Glow */}
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] blur-[100px] rounded-full pointer-events-none transition-colors duration-1000 ${status === 'NO_KEY' ? 'bg-amber-900/10' : 'bg-emerald-900/10'}`}></div>

        {/* Main Card Container */}
        <div className={`relative w-full max-w-[420px] p-1 rounded-3xl bg-black shadow-2xl z-10 border transition-colors duration-500 ${status === 'NO_KEY' ? 'border-amber-900/40' : 'border-emerald-900/40'}`}>
             {/* Inner Outline */}
             <div className={`absolute inset-2 rounded-2xl pointer-events-none border transition-colors duration-500 ${status === 'NO_KEY' ? 'border-amber-500/5' : 'border-emerald-500/5'}`}></div>
             
             <div className="p-8 pb-6 flex flex-col items-center relative min-h-[500px]">
                
                {/* Fingerprint / Scanner / Loader Header */}
                <div className="mb-8 relative group transition-all duration-500">
                    <div className={`w-20 h-20 rounded-full border border-dashed flex items-center justify-center relative bg-black/50 backdrop-blur-sm transition-colors duration-500 overflow-hidden ${
                         status === 'NO_KEY' ? 'border-amber-800/60' : 
                         status === 'SYSTEM_CHECK' ? 'border-emerald-500/30 w-full h-auto rounded-xl aspect-auto py-2 px-4' :
                         'border-emerald-800/60'
                    }`}>
                        
                        {status === 'SYSTEM_CHECK' ? (
                            <Terminal size={24} className="text-emerald-500 animate-pulse" />
                        ) : status === 'BOOTING' ? (
                            <Activity size={32} className="text-emerald-700 animate-pulse" />
                        ) : (
                            <>
                                {status !== 'NO_KEY' && (
                                    <>
                                        <div className="absolute inset-0 rounded-full animate-[spin_10s_linear_infinite] border-t border-emerald-500/20"></div>
                                        {/* Scanning Line Animation */}
                                        <div className="absolute left-0 right-0 h-0.5 bg-emerald-400/80 shadow-[0_0_10px_rgba(52,211,153,0.8)] animate-scan-vertical z-20"></div>
                                    </>
                                )}
                                <Fingerprint size={40} className={`relative z-10 transition-colors duration-500 ${
                                    status === 'ACCESS_GRANTED' ? 'text-emerald-400' : 
                                    status === 'NO_KEY' ? 'text-amber-500' : 'text-emerald-600'
                                }`} />
                            </>
                        )}
                    </div>
                </div>

                {/* Title */}
                <h1 className="text-2xl font-bold text-white tracking-[0.3em] mb-10 flex gap-4">
                    <span>EPS</span>
                    <span>AI</span>
                </h1>

                {/* Content Switcher */}
                <div className="w-full flex-1 flex flex-col justify-center">
                    {status === 'BOOTING' && (
                         <div className="text-center space-y-2">
                             <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
                             <p className="text-xs text-emerald-500/50 tracking-widest">BOOT SEQUENCE INITIATED</p>
                         </div>
                    )}
                    {status === 'SYSTEM_CHECK' && renderRequirementsList()}
                    {status === 'NO_KEY' && renderKeyInput()}
                    {(status === 'IDLE' || status === 'VERIFYING' || status === 'ACCESS_GRANTED' || status === 'ACCESS_DENIED') && renderLoginForm()}
                </div>

                {/* Divider */}
                <div className="w-full h-px bg-gradient-to-r from-transparent via-slate-800 to-transparent mt-10 mb-6"></div>

                {/* Footer Content */}
                <div className="w-full flex flex-col items-center gap-5">
                    <p className="text-[9px] text-slate-600 tracking-widest font-bold uppercase">Authorized Terminal Detected</p>
                    
                    {status !== 'NO_KEY' && status !== 'BOOTING' && status !== 'SYSTEM_CHECK' && (
                        <button 
                            onClick={triggerQuickLaunch}
                            className="flex items-center gap-3 group px-4 py-2 rounded-lg hover:bg-white/5 transition-colors"
                        >
                            <Zap size={14} className="text-amber-500 fill-amber-500" />
                            <span className="text-xs text-slate-400 font-bold tracking-wide group-hover:text-emerald-400 transition-colors">QUICK LAUNCH</span>
                            <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700 font-mono group-hover:border-emerald-500/30 group-hover:text-emerald-500 transition-colors">ALT+Q</span>
                        </button>
                    )}
                </div>

                <div className="w-full flex justify-between mt-8 pt-4 border-t border-slate-900">
                    <div className="flex items-center gap-2 text-[9px] text-slate-700 uppercase tracking-widest font-bold">
                        <Lock size={10} /> SECURE GATEWAY
                    </div>
                     <div className="text-[9px] text-slate-700 uppercase tracking-widest font-bold font-mono">ID: 65958</div>
                </div>

             </div>
        </div>
    </div>
  );
};

export default Launcher;