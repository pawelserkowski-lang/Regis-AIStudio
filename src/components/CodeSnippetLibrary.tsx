import React, { useState, useEffect } from 'react';
import { Code, Copy, Trash2, Edit3, Save, X, FileCode, Search, Download, Plus } from 'lucide-react';

/**
 * Code Snippet Library Component
 * Allows users to save, organize, and retrieve code snippets from AI responses
 */

export interface CodeSnippet {
  id: string;
  title: string;
  code: string;
  language: string;
  description: string;
  tags: string[];
  timestamp: number;
  category: string;
}

interface Props {
  onClose: () => void;
  onInsert?: (code: string) => void;
  lang: 'PL' | 'EN';
}

const STORAGE_KEY = 'regis_code_snippets';
const LANGUAGES = ['javascript', 'typescript', 'python', 'java', 'cpp', 'go', 'rust', 'sql', 'html', 'css', 'bash', 'other'];
const CATEGORIES = ['function', 'class', 'component', 'hook', 'utility', 'algorithm', 'api', 'database', 'ui', 'other'];

const CodeSnippetLibrary: React.FC<Props> = ({ onClose, onInsert, lang }) => {
  const [snippets, setSnippets] = useState<CodeSnippet[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [editingSnippet, setEditingSnippet] = useState<CodeSnippet | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const t = lang === 'PL' ? {
    title: 'Biblioteka Kodu',
    add: 'Dodaj Nowy',
    search: 'Szukaj snippetów...',
    language: 'Język',
    category: 'Kategoria',
    all: 'Wszystkie',
    noSnippets: 'Brak zapisanych snippetów',
    addFirst: 'Dodaj pierwszy snippet, aby zacząć',
    snippetTitle: 'Tytuł',
    code: 'Kod',
    description: 'Opis',
    tags: 'Tagi (oddzielone przecinkami)',
    save: 'Zapisz',
    cancel: 'Anuluj',
    copy: 'Kopiuj',
    copied: 'Skopiowano!',
    edit: 'Edytuj',
    delete: 'Usuń',
    insert: 'Wstaw',
    export: 'Eksportuj',
    confirmDelete: 'Czy na pewno usunąć ten snippet?',
  } : {
    title: 'Code Library',
    add: 'Add New',
    search: 'Search snippets...',
    language: 'Language',
    category: 'Category',
    all: 'All',
    noSnippets: 'No saved snippets',
    addFirst: 'Add your first snippet to get started',
    snippetTitle: 'Title',
    code: 'Code',
    description: 'Description',
    tags: 'Tags (comma separated)',
    save: 'Save',
    cancel: 'Cancel',
    copy: 'Copy',
    copied: 'Copied!',
    edit: 'Edit',
    delete: 'Delete',
    insert: 'Insert',
    export: 'Export',
    confirmDelete: 'Are you sure you want to delete this snippet?',
  };

  // Load snippets from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setSnippets(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Failed to load snippets:', error);
    }
  }, []);

  // Save snippets to localStorage
  const saveSnippets = (updatedSnippets: CodeSnippet[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedSnippets));
      setSnippets(updatedSnippets);
    } catch (error) {
      console.error('Failed to save snippets:', error);
      alert(lang === 'PL' ? 'Błąd zapisu' : 'Save failed');
    }
  };

  const addSnippet = () => {
    const newSnippet: CodeSnippet = {
      id: Date.now().toString(),
      title: '',
      code: '',
      language: 'javascript',
      description: '',
      tags: [],
      category: 'other',
      timestamp: Date.now(),
    };
    setEditingSnippet(newSnippet);
    setIsAdding(true);
  };

  const saveSnippet = () => {
    if (!editingSnippet || !editingSnippet.title || !editingSnippet.code) {
      alert(lang === 'PL' ? 'Wypełnij tytuł i kod' : 'Fill in title and code');
      return;
    }

    if (isAdding) {
      saveSnippets([...snippets, editingSnippet]);
    } else {
      saveSnippets(snippets.map(s => s.id === editingSnippet.id ? editingSnippet : s));
    }
    setEditingSnippet(null);
    setIsAdding(false);
  };

  const deleteSnippet = (id: string) => {
    if (!confirm(t.confirmDelete)) return;
    saveSnippets(snippets.filter(s => s.id !== id));
  };

  const copyToClipboard = async (code: string, id: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (error) {
      console.error('Failed to copy:', error);
    }
  };

  const exportSnippets = () => {
    const dataStr = JSON.stringify(snippets, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `regis-snippets-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const filteredSnippets = snippets.filter(snippet => {
    const matchesSearch = !searchTerm ||
      snippet.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      snippet.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      snippet.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      snippet.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesLanguage = selectedLanguage === 'all' || snippet.language === selectedLanguage;
    const matchesCategory = selectedCategory === 'all' || snippet.category === selectedCategory;

    return matchesSearch && matchesLanguage && matchesCategory;
  });

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (editingSnippet) {
          setEditingSnippet(null);
          setIsAdding(false);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [editingSnippet, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-slate-900 to-slate-950 rounded-2xl border border-white/10 shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-blue-900/20 to-purple-900/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600/20 rounded-lg">
              <Code className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">{t.title}</h2>
              <p className="text-sm text-slate-400 mt-1">
                {snippets.length} {lang === 'PL' ? 'snippetów' : 'snippets'}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={exportSnippets}
              disabled={snippets.length === 0}
              className="px-4 py-2 bg-green-600/20 hover:bg-green-600/30 disabled:opacity-30 disabled:cursor-not-allowed text-green-400 rounded-xl flex items-center gap-2 transition-all"
            >
              <Download size={18} />
              {t.export}
            </button>
            <button
              onClick={addSnippet}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl flex items-center gap-2 transition-all"
            >
              <Plus size={18} />
              {t.add}
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Filters */}
        {!editingSnippet && (
          <div className="p-4 border-b border-white/5 bg-black/30">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder={t.search}
                  className="w-full pl-10 pr-4 py-2 bg-black/30 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50"
                />
              </div>
              <select
                value={selectedLanguage}
                onChange={e => setSelectedLanguage(e.target.value)}
                className="px-4 py-2 bg-black/30 border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-500/50"
              >
                <option value="all">{t.all} {t.language}</option>
                {LANGUAGES.map(lang => (
                  <option key={lang} value={lang}>{lang}</option>
                ))}
              </select>
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="px-4 py-2 bg-black/30 border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-500/50"
              >
                <option value="all">{t.all} {t.category}</option>
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {editingSnippet ? (
            // Edit Form
            <div className="max-w-4xl mx-auto space-y-4">
              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">{t.snippetTitle}</label>
                <input
                  type="text"
                  value={editingSnippet.title}
                  onChange={e => setEditingSnippet({ ...editingSnippet, title: e.target.value })}
                  className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50"
                  placeholder={lang === 'PL' ? 'np. React Custom Hook' : 'e.g. React Custom Hook'}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">{t.language}</label>
                  <select
                    value={editingSnippet.language}
                    onChange={e => setEditingSnippet({ ...editingSnippet, language: e.target.value })}
                    className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-500/50"
                  >
                    {LANGUAGES.map(lang => (
                      <option key={lang} value={lang}>{lang}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-300 mb-2">{t.category}</label>
                  <select
                    value={editingSnippet.category}
                    onChange={e => setEditingSnippet({ ...editingSnippet, category: e.target.value })}
                    className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white focus:outline-none focus:border-blue-500/50"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">{t.code}</label>
                <textarea
                  value={editingSnippet.code}
                  onChange={e => setEditingSnippet({ ...editingSnippet, code: e.target.value })}
                  className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 font-mono text-sm resize-none"
                  rows={12}
                  placeholder={lang === 'PL' ? 'Wklej kod tutaj...' : 'Paste your code here...'}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">{t.description}</label>
                <textarea
                  value={editingSnippet.description}
                  onChange={e => setEditingSnippet({ ...editingSnippet, description: e.target.value })}
                  className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50 resize-none"
                  rows={3}
                  placeholder={lang === 'PL' ? 'Opcjonalny opis...' : 'Optional description...'}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-slate-300 mb-2">{t.tags}</label>
                <input
                  type="text"
                  value={editingSnippet.tags.join(', ')}
                  onChange={e => setEditingSnippet({ ...editingSnippet, tags: e.target.value.split(',').map(t => t.trim()).filter(Boolean) })}
                  className="w-full px-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/50"
                  placeholder={lang === 'PL' ? 'react, hooks, custom' : 'react, hooks, custom'}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={saveSnippet}
                  className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl flex items-center justify-center gap-2 transition-all font-semibold"
                >
                  <Save size={18} />
                  {t.save}
                </button>
                <button
                  onClick={() => {
                    setEditingSnippet(null);
                    setIsAdding(false);
                  }}
                  className="flex-1 px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-xl flex items-center justify-center gap-2 transition-all font-semibold"
                >
                  <X size={18} />
                  {t.cancel}
                </button>
              </div>
            </div>
          ) : filteredSnippets.length === 0 ? (
            // Empty State
            <div className="text-center py-20">
              <div className="w-20 h-20 bg-blue-600/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileCode className="w-10 h-10 text-blue-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">{t.noSnippets}</h3>
              <p className="text-slate-400 mb-6">{t.addFirst}</p>
              <button
                onClick={addSnippet}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl flex items-center gap-2 transition-all mx-auto"
              >
                <Plus size={18} />
                {t.add}
              </button>
            </div>
          ) : (
            // Snippet Grid
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredSnippets.map(snippet => (
                <div
                  key={snippet.id}
                  className="bg-black/40 border border-white/5 rounded-xl p-4 hover:border-blue-500/30 transition-all group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="text-white font-semibold mb-1">{snippet.title}</h3>
                      <div className="flex gap-2 text-xs">
                        <span className="px-2 py-1 bg-blue-600/20 rounded text-blue-400">{snippet.language}</span>
                        <span className="px-2 py-1 bg-purple-600/20 rounded text-purple-400">{snippet.category}</span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => copyToClipboard(snippet.code, snippet.id)}
                        className="p-2 text-slate-400 hover:text-green-400 hover:bg-green-600/10 rounded-lg transition-all"
                        title={t.copy}
                      >
                        {copiedId === snippet.id ? (
                          <span className="text-xs text-green-400 font-bold">{t.copied}</span>
                        ) : (
                          <Copy size={16} />
                        )}
                      </button>
                      <button
                        onClick={() => setEditingSnippet(snippet)}
                        className="p-2 text-slate-400 hover:text-blue-400 hover:bg-blue-600/10 rounded-lg transition-all"
                        title={t.edit}
                      >
                        <Edit3 size={16} />
                      </button>
                      <button
                        onClick={() => deleteSnippet(snippet.id)}
                        className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-600/10 rounded-lg transition-all"
                        title={t.delete}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {snippet.description && (
                    <p className="text-sm text-slate-400 mb-3 line-clamp-2">{snippet.description}</p>
                  )}

                  <pre className="bg-black/50 p-3 rounded-lg text-xs text-slate-300 font-mono overflow-x-auto mb-3 max-h-40 overflow-y-auto border border-white/5">
                    <code>{snippet.code}</code>
                  </pre>

                  {snippet.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {snippet.tags.map((tag, idx) => (
                        <span
                          key={idx}
                          className="text-xs px-2 py-1 bg-white/5 rounded text-slate-500"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}

                  {onInsert && (
                    <button
                      onClick={() => {
                        onInsert(snippet.code);
                        onClose();
                      }}
                      className="w-full px-4 py-2 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 rounded-lg flex items-center justify-center gap-2 transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Code size={16} />
                      {t.insert}
                    </button>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CodeSnippetLibrary;
