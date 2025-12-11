import React, { useEffect, useState } from 'react';

const MatrixLoader: React.FC = () => {
  const [text, setText] = useState('');
  const chars = "WK7L0?1!@#$%^&*()_+=<>[]{}|;:,./";

  useEffect(() => {
    const interval = setInterval(() => {
      let newText = "";
      for (let i = 0; i < 12; i++) {
        newText += chars.charAt(Math.floor(Math.random() * chars.length));
      }
      setText(newText);
    }, 80);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-3 font-mono text-emerald-500 bg-black/40 px-4 py-2 rounded-lg border border-emerald-500/30 shadow-[0_0_10px_rgba(0,255,65,0.2)]">
      <div className="w-3 h-3 bg-emerald-500 animate-ping rounded-full"></div>
      <span className="tracking-widest text-sm font-bold shadow-emerald-500/50 drop-shadow-md">DECRYPTING: [{text}]</span>
    </div>
  );
};
export default MatrixLoader;