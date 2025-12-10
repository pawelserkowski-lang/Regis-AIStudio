import React from 'react';
import { File } from 'lucide-react';
import { Attachment } from '../types';
const FileListView: React.FC<{ items: Attachment[] }> = ({ items }) => (
    <div className="flex gap-3">{items.map((i, idx) => <div key={idx} className="p-3 bg-white/10 rounded-xl text-sm text-white flex items-center gap-2"><File size={16}/> File {idx+1}</div>)}</div>
);
export default FileListView;