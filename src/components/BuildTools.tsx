import React, { useState } from 'react';
import { HardDrive, RefreshCw } from 'lucide-react';
import { executeSystemAction } from '../services/geminiService';
interface Props { lang: 'PL'|'EN'; }
const BuildTools: React.FC<Props> = ({ lang }) => {
    const [tree, setTree] = useState('');
    const [path, setPath] = useState('.');
    const t = lang === 'PL' ? { title: "ROOT ACCESS", desc: "Interfejs plików.", ph: "Ścieżka" } : { title: "ROOT ACCESS", desc: "File interface.", ph: "Path" };
    const fetchTree = async () => { try { const res = await executeSystemAction('tree', { cwd: path }); setTree(res.tree); } catch { setTree("Error"); } };
    return (
        <div className="h-full flex flex-col p-12 bg-black/20">
            <header className="mb-10 flex justify-between items-center">
                <div><h1 className="text-4xl font-bold text-white font-mono flex items-center gap-4"><HardDrive className="text-emerald-500" size={40} /> {t.title}</h1><p className="text-xl text-slate-400 mt-2">{t.desc}</p></div>
                <div className="flex gap-3"><input value={path} onChange={e => setPath(e.target.value)} className="bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-slate-200 font-mono text-base" placeholder={t.ph} /><button onClick={fetchTree} className="p-3 bg-white/5 hover:bg-white/10 rounded-xl text-white"><RefreshCw size={24}/></button></div>
            </header>
            <div className="flex-1 bg-black/80 border border-white/10 rounded-3xl p-6 overflow-auto font-mono text-sm text-slate-300"><pre>{tree}</pre></div>
        </div>
    );
};
export default BuildTools;