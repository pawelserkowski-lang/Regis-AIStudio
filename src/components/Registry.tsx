import React, { useState } from 'react';
import { Search, Trash2 } from 'lucide-react';
import { RegistryItem } from '../types';
interface RegistryProps { items: RegistryItem[]; onDeleteItem: (id: string) => void; lang: 'PL'|'EN'; }
const Registry: React.FC<RegistryProps> = ({ items, onDeleteItem, lang }) => {
  const [term, setTerm] = useState('');
  const filtered = items.filter(i => i.title.toLowerCase().includes(term.toLowerCase()));
  const t = lang === 'PL' ? { title: "Rejestr", desc: "Magazyn danych.", search: "Szukaj...", noData: "Brak danych." } : { title: "Registry", desc: "Encrypted storage.", search: "Search...", noData: "No data found." };
  return (
    <div className="h-full overflow-y-auto p-12">
      <header className="mb-12"><h1 className="text-5xl font-bold text-white mb-4 font-mono">{t.title}</h1><p className="text-xl text-slate-400">{t.desc}</p></header>
      <div className="bg-black/40 backdrop-blur-md p-4 rounded-3xl border border-white/10 mb-10 flex items-center"><Search className="ml-4 text-slate-500" size={24} /><input value={term} onChange={e => setTerm(e.target.value)} className="w-full bg-transparent border-none p-4 text-xl text-slate-200 outline-none" placeholder={t.search} /></div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filtered.map(item => (
            <div key={item.id} className="bg-black/40 p-6 rounded-3xl border border-white/5 hover:border-emerald-500/50 transition-all h-80 flex flex-col">
                <h3 className="text-2xl font-bold text-slate-200 mb-3">{item.title}</h3>
                <p className="text-slate-400 text-base line-clamp-4 flex-1">{item.content}</p>
                <div className="mt-auto flex justify-between text-sm text-slate-500"><span>{new Date(item.dateAdded).toLocaleDateString()}</span><button onClick={() => onDeleteItem(item.id)} className="hover:text-red-400"><Trash2 size={18} /></button></div>
            </div>
        ))}
      </div>
    </div>
  );
};
export default Registry;