import React from 'react';

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
export default Launcher;