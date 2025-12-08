import React from 'react';
import { X, FileAudio, FileVideo, Image as ImageIcon, File } from 'lucide-react';
import { Attachment } from '../types';

interface FileListViewProps {
  items: Attachment[];
  onRemove?: (index: number) => void;
  readOnly?: boolean;
}

const FileListView: React.FC<FileListViewProps> = ({ items, onRemove, readOnly = false }) => {
  if (!items || items.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-3">
      {items.map((item, index) => (
        <div 
          key={index} 
          className={`relative group rounded-xl overflow-hidden border border-white/10 bg-black/40 ${readOnly ? 'shadow-md' : 'shadow-lg w-16 h-16'}`}
          style={readOnly ? { maxWidth: '100%', width: 'auto' } : {}}
        >
          {/* Thumbnail / Icon Logic */}
          <div className={`flex items-center justify-center ${readOnly ? 'min-w-[120px]' : 'w-full h-full'}`}>
            {item.type === 'image' ? (
              <div className="relative overflow-hidden w-full h-full">
                <img 
                  src={item.url} 
                  alt="Attachment" 
                  className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${readOnly ? 'max-h-[300px] w-auto rounded-lg' : ''}`} 
                />
                {/* Visual indicator for processed/restored images in readOnly mode */}
                {readOnly && (
                  <div className="absolute inset-0 ring-1 ring-inset ring-white/10 rounded-lg pointer-events-none"></div>
                )}
              </div>
            ) : (
              <div className={`flex flex-col items-center justify-center gap-2 ${readOnly ? 'p-4 bg-white/5 rounded-lg w-full' : 'w-full h-full bg-slate-900'}`}>
                {item.type === 'video' ? (
                  <>
                    <FileVideo size={readOnly ? 32 : 20} className="text-emerald-400" />
                    {readOnly && <video src={item.url} controls className="mt-2 max-h-[300px] w-full rounded-lg" />}
                  </>
                ) : item.type === 'audio' ? (
                   <>
                    <FileAudio size={readOnly ? 32 : 20} className="text-amber-400" />
                    {readOnly && <audio src={item.url} controls className="mt-2 w-full" />}
                   </>
                ) : (
                  <File size={readOnly ? 32 : 20} className="text-slate-400" />
                )}
                {/* Label for generic files in read-only mode if needed */}
                {!readOnly && <span className="sr-only">{item.type}</span>}
              </div>
            )}
          </div>

          {/* Remove Button (Only if not readOnly) */}
          {!readOnly && onRemove && (
            <>
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                <button 
                  onClick={(e) => { e.stopPropagation(); onRemove(index); }}
                  className="p-1 rounded-full bg-red-500/20 text-red-400 hover:bg-red-500 hover:text-white transition-colors"
                  title="Remove file"
                >
                  <X size={14} />
                </button>
              </div>
              {/* Type Indicator Badge (Small) */}
              <div className="absolute top-0.5 right-0.5 pointer-events-none">
                 <div className={`w-2 h-2 rounded-full ${item.type === 'image' ? 'bg-emerald-500' : item.type === 'video' ? 'bg-blue-500' : 'bg-amber-500'} shadow-[0_0_5px_currentColor]`}></div>
              </div>
            </>
          )}
        </div>
      ))}
    </div>
  );
};

export default FileListView;