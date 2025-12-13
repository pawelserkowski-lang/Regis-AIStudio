import React from 'react';
import { X, Keyboard } from 'lucide-react';

interface Props {
  lang: 'PL' | 'EN';
  onClose: () => void;
}

const KeyboardShortcutsHelp: React.FC<Props> = ({ lang, onClose }) => {
  // Handle Escape key to close
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const shortcuts = lang === 'PL' ? [
    { keys: ['Enter'], description: 'Wyślij wiadomość' },
    { keys: ['Shift', 'Enter'], description: 'Nowa linia' },
    { keys: ['Ctrl', 'K'], description: 'Otwórz szablony promptów' },
    { keys: ['Ctrl', '/'], description: 'Pokaż pomoc skrótów' },
    { keys: ['↑'], description: 'Historia: starsze prompty' },
    { keys: ['↓'], description: 'Historia: nowsze prompty' },
    { keys: ['Esc'], description: 'Zamknij okna/menu' },
  ] : [
    { keys: ['Enter'], description: 'Send message' },
    { keys: ['Shift', 'Enter'], description: 'New line' },
    { keys: ['Ctrl', 'K'], description: 'Open prompt templates' },
    { keys: ['Ctrl', '/'], description: 'Show keyboard shortcuts' },
    { keys: ['↑'], description: 'History: older prompts' },
    { keys: ['↓'], description: 'History: newer prompts' },
    { keys: ['Esc'], description: 'Close windows/menus' },
  ];

  const t = lang === 'PL' ? {
    title: 'Skróty Klawiszowe',
    subtitle: 'Przyspiesz swoją pracę',
  } : {
    title: 'Keyboard Shortcuts',
    subtitle: 'Speed up your workflow',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-slate-900 to-slate-950 rounded-2xl border border-white/10 shadow-2xl w-full max-w-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between bg-gradient-to-r from-purple-900/20 to-blue-900/20">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-purple-600/20 rounded-lg">
              <Keyboard className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">{t.title}</h2>
              <p className="text-sm text-slate-400">{t.subtitle}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white transition-colors rounded-lg hover:bg-white/10"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Shortcuts List */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          <div className="space-y-3">
            {shortcuts.map((shortcut, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-black/40 rounded-xl border border-white/5 hover:border-purple-500/30 transition-all group"
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex gap-2">
                    {shortcut.keys.map((key, i) => (
                      <React.Fragment key={i}>
                        <kbd className="px-3 py-2 bg-gradient-to-b from-slate-700 to-slate-800 border border-slate-600 rounded-lg text-sm font-mono text-white shadow-lg min-w-[3rem] text-center">
                          {key}
                        </kbd>
                        {i < shortcut.keys.length - 1 && (
                          <span className="text-slate-500 text-lg self-center">+</span>
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
                <p className="text-slate-300 text-sm flex-1 text-right">
                  {shortcut.description}
                </p>
              </div>
            ))}
          </div>

          {/* Additional Tips */}
          <div className="mt-6 p-4 bg-blue-900/20 border border-blue-500/30 rounded-xl">
            <h3 className="text-blue-400 font-semibold mb-2 flex items-center gap-2">
              💡 {lang === 'PL' ? 'Wskazówka' : 'Tip'}
            </h3>
            <p className="text-slate-300 text-sm">
              {lang === 'PL'
                ? 'Możesz nawigować po historii promptów używając strzałek góra/dół gdy pole tekstowe jest aktywne.'
                : 'You can navigate through prompt history using up/down arrows when the text field is active.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default KeyboardShortcutsHelp;
