import React from 'react';
import { Search, Trash2, Calendar, Tag, ArrowRight } from 'lucide-react';
import { RegistryItem } from '../types';

interface RegistryProps {
  items: RegistryItem[];
  onDeleteItem: (id: string) => void;
}

const Registry: React.FC<RegistryProps> = ({ items, onDeleteItem }) => {
  const [searchTerm, setSearchTerm] = React.useState('');

  const filteredItems = items.filter(item => 
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div className="h-full overflow-y-auto p-6 md:p-12 scrollbar-thin scrollbar-thumb-emerald-900 scrollbar-track-transparent">
      <div className="max-w-7xl mx-auto">
        <header className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <h1 className="text-4xl font-bold text-white mb-3 tracking-tight font-mono">Knowledge_Registry</h1>
            <p className="text-lg text-slate-400 max-w-xl">Encrypted storage for AI-generated insights and strategic data.</p>
          </div>
          <div className="text-right hidden md:block">
            <p className="text-3xl font-bold text-emerald-400 drop-shadow-[0_0_10px_rgba(52,211,153,0.5)]">{items.length}</p>
            <p className="text-sm font-medium text-slate-500 uppercase tracking-wider font-mono">Total Nodes</p>
          </div>
        </header>

        {/* Search and Filter Bar */}
        <div className="bg-black/40 backdrop-blur-md p-2 rounded-2xl shadow-lg border border-white/10 mb-10 flex flex-col md:flex-row gap-2 items-center max-w-3xl">
          <div className="relative flex-1 w-full">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-500" size={20} />
            <input 
              type="text" 
              placeholder="Search registry..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-transparent border-none rounded-xl focus:ring-0 text-slate-200 placeholder:text-slate-600"
            />
          </div>
          <div className="w-full md:w-auto border-t md:border-t-0 md:border-l border-white/10 pt-2 md:pt-0 pl-0 md:pl-2">
            <select className="w-full md:w-auto px-4 py-3 bg-transparent border-none rounded-xl text-slate-400 font-medium focus:ring-2 focus:ring-emerald-500/20 cursor-pointer hover:text-emerald-400 transition-colors [&>option]:bg-slate-900">
              <option>All Categories</option>
              <option>General</option>
              <option>Code</option>
              <option>Ideas</option>
            </select>
          </div>
        </div>

        {/* Grid of Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredItems.map(item => (
            <div key={item.id} className="group bg-black/40 backdrop-blur-sm rounded-2xl p-1 border border-white/5 hover:border-emerald-500/50 hover:shadow-[0_0_20px_rgba(16,185,129,0.15)] transition-all duration-300 hover:-translate-y-1 flex flex-col h-80">
              <div className="h-full p-5 flex flex-col">
                <div className="flex justify-between items-start mb-4">
                    <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                    {item.category}
                    </span>
                    <button 
                    onClick={() => onDeleteItem(item.id)}
                    className="p-2 -mr-2 -mt-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all opacity-0 group-hover:opacity-100"
                    >
                    <Trash2 size={16} />
                    </button>
                </div>
                
                <h3 className="text-xl font-bold text-slate-200 mb-3 line-clamp-2 leading-tight group-hover:text-emerald-400 transition-colors">{item.title}</h3>
                
                <div className="flex-1 overflow-hidden relative mb-4">
                    <p className="text-slate-400 text-sm leading-relaxed line-clamp-5">
                    {item.content}
                    </p>
                    <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-black/60 via-black/40 to-transparent"></div>
                </div>

                <div className="pt-4 border-t border-white/5 mt-auto">
                    <div className="flex items-center gap-2 mb-3 overflow-hidden">
                        {item.tags.slice(0, 3).map(tag => (
                            <span key={tag} className="inline-flex items-center gap-1 text-[10px] uppercase font-bold tracking-wider text-slate-500 bg-white/5 px-2 py-1 rounded-md">
                            <Tag size={10} /> {tag}
                            </span>
                        ))}
                    </div>
                    <div className="flex items-center justify-between text-xs text-slate-500 font-medium">
                        <div className="flex items-center gap-1.5">
                            <Calendar size={14} />
                            {new Date(item.dateAdded).toLocaleDateString()}
                        </div>
                        <span className="group-hover:translate-x-1 transition-transform text-emerald-500 opacity-0 group-hover:opacity-100">
                            <ArrowRight size={16} />
                        </span>
                    </div>
                </div>
              </div>
            </div>
          ))}

          {filteredItems.length === 0 && (
             <div className="col-span-full flex flex-col items-center justify-center py-24 text-slate-500 border-2 border-dashed border-white/10 rounded-3xl bg-black/20">
                <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center shadow-sm mb-4">
                    <Search size={32} className="text-slate-600" />
                </div>
                <p className="text-lg font-medium text-slate-400">No data segments found.</p>
                <p className="text-sm mt-1 text-slate-600">Adjust query parameters or ingest new data.</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Registry;