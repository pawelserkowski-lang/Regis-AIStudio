import React, { useState } from 'react';
import { DetectionBox } from '../types';
import { Scan, X } from 'lucide-react';

interface VisualAnalyzerProps {
  imageUrl: string;
  detections: DetectionBox[];
  onClose?: () => void;
}

const VisualAnalyzer: React.FC<VisualAnalyzerProps> = ({ imageUrl, detections, onClose }) => {
  const [hoveredBox, setHoveredBox] = useState<number | null>(null);

  // Helper to map 0-1000 coordinates to CSS percentages
  const getStyle = (box: [number, number, number, number]) => {
    const [ymin, xmin, ymax, xmax] = box;
    return {
      top: `${ymin / 10}%`,
      left: `${xmin / 10}%`,
      height: `${(ymax - ymin) / 10}%`,
      width: `${(xmax - xmin) / 10}%`,
    };
  };

  return (
    <div className="relative group rounded-xl overflow-hidden border border-emerald-500/50 shadow-[0_0_30px_rgba(16,185,129,0.15)] bg-black max-w-2xl mx-auto">
      {/* Header Overlay */}
      <div className="absolute top-0 left-0 right-0 p-3 bg-gradient-to-b from-black/80 to-transparent z-20 flex justify-between items-start pointer-events-none">
        <div className="flex items-center gap-2">
            <Scan size={16} className="text-emerald-400 animate-pulse" />
            <span className="text-xs font-mono text-emerald-400 font-bold tracking-widest bg-black/50 px-2 py-0.5 rounded border border-emerald-500/30">
                VISUAL_ANALYSIS_ACTIVE
            </span>
        </div>
        {onClose && (
            <button onClick={onClose} className="pointer-events-auto text-slate-400 hover:text-white bg-black/50 hover:bg-red-500/20 p-1 rounded transition-colors">
                <X size={16} />
            </button>
        )}
      </div>

      <div className="relative">
        <img src={imageUrl} alt="Analysis Target" className="w-full h-auto block" />
        
        {/* Detection Overlay Layer */}
        <div className="absolute inset-0 z-10">
          {detections.map((det, idx) => (
            <div
              key={idx}
              className={`absolute border-2 transition-all duration-300 cursor-help flex flex-col items-start ${
                hoveredBox === idx 
                ? 'border-emerald-400 bg-emerald-500/10 z-30 shadow-[0_0_15px_rgba(52,211,153,0.5)]' 
                : 'border-emerald-500/40 hover:border-emerald-400 z-20'
              }`}
              style={getStyle(det.box_2d)}
              onMouseEnter={() => setHoveredBox(idx)}
              onMouseLeave={() => setHoveredBox(null)}
            >
                {/* Label Tag */}
                <div className={`
                    absolute -top-6 left-0 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider whitespace-nowrap
                    transition-all duration-200
                    ${hoveredBox === idx ? 'bg-emerald-500 text-black translate-y-0 opacity-100' : 'bg-black/80 text-emerald-500 translate-y-1 opacity-0'}
                `}>
                    {det.label}
                </div>
                
                {/* Corner Accents */}
                <div className="absolute top-0 left-0 w-1 h-1 bg-emerald-400"></div>
                <div className="absolute bottom-0 right-0 w-1 h-1 bg-emerald-400"></div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Footer Stats */}
      <div className="bg-black/90 border-t border-emerald-500/30 p-2 flex justify-between items-center text-[10px] font-mono text-emerald-500/60">
        <span>DETECTED_NODES: {detections.length}</span>
        <span>CONFIDENCE_THRESHOLD: 0.85</span>
      </div>
    </div>
  );
};

export default VisualAnalyzer;