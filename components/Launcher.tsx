import React, { useState, useEffect, useRef } from 'react';
import { Shield, Lock, Activity, Zap, Fingerprint, Power, User } from 'lucide-react';

interface LauncherProps {
  onLogin: (username: string) => void;
}

const Launcher: React.FC<LauncherProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [status, setStatus] = useState<'BOOTING' | 'IDLE' | 'VERIFYING' | 'ACCESS_GRANTED' | 'ACCESS_DENIED'>('BOOTING');
  
  const isBypassed = useRef(false);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const triggerQuickLaunch = () => {
    if (isBypassed.current) return;
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
  }, [onLogin]);

  // Boot Sequence & Diagnostics (Optimized for speed)
  useEffect(() => {
    const runDiagnostics = async () => {
      if (isBypassed.current) return;
      
      const hasApiKey = !!process.env.API_KEY;
      
      if (!hasApiKey) {
        setStatus('ACCESS_DENIED');
      } else {
        // Almost instant boot
        setTimeout(() => {
            if (isMounted.current && !isBypassed.current) setStatus('IDLE');
        }, 100);
      }
    };

    runDiagnostics();
  }, []);

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

  return (
    <div className="h-screen w-full bg-[#020202] flex items-center justify-center font-mono text-slate-200 selection:bg-emerald-500/30 relative overflow-hidden">
        {/* Background Ambient Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-900/10 blur-[100px] rounded-full pointer-events-none"></div>

        {/* Main Card Container */}
        <div className="relative w-full max-w-[420px] p-1 rounded-3xl bg-black shadow-2xl z-10 border border-emerald-900/40">
             {/* Inner Outline */}
             <div className="absolute inset-2 rounded-2xl pointer-events-none border border-emerald-500/5"></div>
             
             <div className="p-8 pb-6 flex flex-col items-center relative">
                
                {/* Fingerprint Header */}
                <div className="mb-8 relative group">
                    <div className="w-20 h-20 rounded-full border border-dashed border-emerald-800/60 flex items-center justify-center relative bg-black/50 backdrop-blur-sm">
                        <div className="absolute inset-0 rounded-full animate-[spin_10s_linear_infinite] border-t border-emerald-500/20"></div>
                        <Fingerprint size={40} className={`relative z-10 transition-colors duration-500 ${status === 'ACCESS_GRANTED' ? 'text-emerald-400' : 'text-emerald-600'}`} />
                    </div>
                    <div className="absolute inset-0 bg-emerald-500/20 blur-xl rounded-full opacity-10 group-hover:opacity-30 transition-opacity"></div>
                </div>

                {/* Title */}
                <h1 className="text-2xl font-bold text-white tracking-[0.3em] mb-10 flex gap-4">
                    <span>EPS</span>
                    <span>AI</span>
                </h1>

                {/* Form */}
                <form onSubmit={handleLogin} className="w-full space-y-6">
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
                         {status === 'BOOTING' || status === 'VERIFYING' ? (
                            <Activity className="animate-spin" size={16} />
                         ) : (
                            <Power size={16} className={status === 'ACCESS_GRANTED' ? 'text-white' : ''} />
                         )}
                         
                         {status === 'BOOTING' && 'SYSTEM CHECK...'}
                         {status === 'VERIFYING' && 'VERIFYING...'}
                         {status === 'ACCESS_DENIED' && 'ACCESS DENIED'}
                         {status === 'ACCESS_GRANTED' && 'SUCCESS'}
                         {status === 'IDLE' && 'INITIALIZE'}
                    </button>
                </form>

                {/* Divider */}
                <div className="w-full h-px bg-gradient-to-r from-transparent via-slate-800 to-transparent mt-10 mb-6"></div>

                {/* Footer Content */}
                <div className="w-full flex flex-col items-center gap-5">
                    <p className="text-[9px] text-slate-600 tracking-widest font-bold uppercase">Authorized Terminal Detected</p>
                    
                    <button 
                        onClick={triggerQuickLaunch}
                        className="flex items-center gap-3 group px-4 py-2 rounded-lg hover:bg-white/5 transition-colors"
                    >
                        <Zap size={14} className="text-amber-500 fill-amber-500" />
                        <span className="text-xs text-slate-400 font-bold tracking-wide group-hover:text-emerald-400 transition-colors">QUICK LAUNCH</span>
                        <span className="text-[9px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded border border-slate-700 font-mono group-hover:border-emerald-500/30 group-hover:text-emerald-500 transition-colors">ALT+Q</span>
                    </button>
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