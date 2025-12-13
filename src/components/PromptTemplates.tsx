import React, { useState } from 'react';
import { FileCode, Bug, BookOpen, FlaskConical, RefreshCw, Sparkles, Code, Database, X } from 'lucide-react';

/**
 * Prompt Templates Component
 * Pre-built prompts for common development tasks
 */

interface PromptTemplate {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  category: 'code' | 'debug' | 'docs' | 'test' | 'refactor' | 'other';
  prompt: string;
  placeholders?: string[];
}

interface Props {
  onSelectTemplate: (prompt: string) => void;
  lang: 'PL' | 'EN';
  onClose: () => void;
}

const TEMPLATES_PL: PromptTemplate[] = [
  {
    id: 'code-review',
    title: 'Przegląd Kodu',
    description: 'Dogłębna analiza kodu pod kątem jakości i bezpieczeństwa',
    icon: <FileCode className="w-5 h-5" />,
    category: 'code',
    prompt: `Przeprowadź szczegółowy przegląd tego kodu:

[WKLEJ TUTAJ KOD]

Proszę sprawdź:
- Bezpieczeństwo i potencjalne luki
- Wydajność i optymalizacje
- Czystość kodu i czytelność
- Najlepsze praktyki
- Możliwe błędy logiczne

Podaj konkretne sugestie ulepszeń.`,
    placeholders: ['kod'],
  },
  {
    id: 'debugging',
    title: 'Debugowanie',
    description: 'Pomoc w znalezieniu i naprawieniu błędów',
    icon: <Bug className="w-5 h-5" />,
    category: 'debug',
    prompt: `Mam problem z tym kodem:

[OPISZ PROBLEM]

Kod:
[WKLEJ TUTAJ KOD]

Błąd:
[WKLEJ KOMUNIKAT BŁĘDU]

Co może być przyczyną i jak to naprawić?`,
    placeholders: ['opis problemu', 'kod', 'błąd'],
  },
  {
    id: 'documentation',
    title: 'Dokumentacja',
    description: 'Wygeneruj dokumentację dla kodu',
    icon: <BookOpen className="w-5 h-5" />,
    category: 'docs',
    prompt: `Wygeneruj kompletną dokumentację dla tego kodu:

[WKLEJ TUTAJ KOD]

Uwzględnij:
- Opis funkcjonalności
- Parametry i typy zwracane
- Przykłady użycia
- Uwagi i ostrzeżenia
- JSDoc/PyDoc komentarze`,
    placeholders: ['kod'],
  },
  {
    id: 'testing',
    title: 'Testy Jednostkowe',
    description: 'Wygeneruj testy dla kodu',
    icon: <FlaskConical className="w-5 h-5" />,
    category: 'test',
    prompt: `Napisz kompleksowe testy jednostkowe dla tego kodu:

[WKLEJ TUTAJ KOD]

Proszę o:
- Testy pozytywne (happy path)
- Testy negatywne (edge cases)
- Testy błędów
- Mockowanie zależności
- Kod w [FRAMEWORK: Jest/Vitest/pytest]`,
    placeholders: ['kod', 'framework'],
  },
  {
    id: 'refactoring',
    title: 'Refaktoryzacja',
    description: 'Popraw strukturę i jakość kodu',
    icon: <RefreshCw className="w-5 h-5" />,
    category: 'refactor',
    prompt: `Zrefaktoryzuj ten kod, aby był:
- Bardziej czytelny
- Bardziej wydajny
- Zgodny z najlepszymi praktykami
- Łatwiejszy w utrzymaniu

Kod:
[WKLEJ TUTAJ KOD]

Wyjaśnij wprowadzone zmiany.`,
    placeholders: ['kod'],
  },
  {
    id: 'explain-code',
    title: 'Wyjaśnij Kod',
    description: 'Szczegółowe wyjaśnienie działania kodu',
    icon: <Sparkles className="w-5 h-5" />,
    category: 'code',
    prompt: `Wyjaśnij mi ten kod krok po kroku:

[WKLEJ TUTAJ KOD]

Proszę o:
- Ogólny opis działania
- Wyjaśnienie każdej sekcji
- Złożoność algorytmiczna (jeśli dotyczy)
- Potencjalne pułapki i problemy
- Przykłady użycia`,
    placeholders: ['kod'],
  },
  {
    id: 'api-design',
    title: 'Projektowanie API',
    description: 'Zaprojektuj RESTful API',
    icon: <Database className="w-5 h-5" />,
    category: 'code',
    prompt: `Zaprojektuj RESTful API dla:

[OPISZ FUNKCJONALNOŚĆ]

Wymagania:
- Endpointy i metody HTTP
- Struktura request/response
- Kody statusu HTTP
- Autentykacja i autoryzacja
- Paginacja i filtrowanie
- Dokumentacja OpenAPI/Swagger

Framework: [Express/FastAPI/Django/inne]`,
    placeholders: ['funkcjonalność', 'framework'],
  },
  {
    id: 'optimization',
    title: 'Optymalizacja Wydajności',
    description: 'Popraw wydajność aplikacji',
    icon: <Code className="w-5 h-5" />,
    category: 'refactor',
    prompt: `Pomóż mi zoptymalizować ten kod pod kątem wydajności:

[WKLEJ TUTAJ KOD]

Kontekst:
[OPISZ JAK KOD JEST UŻYWANY I GDZIE WYSTĘPUJĄ PROBLEMY]

Proszę o:
- Analizę wąskich gardeł
- Konkretne optymalizacje
- Alternatywne podejścia
- Kompromisy między wydajnością a czytelnością`,
    placeholders: ['kod', 'kontekst'],
  },
];

const TEMPLATES_EN: PromptTemplate[] = [
  {
    id: 'code-review',
    title: 'Code Review',
    description: 'In-depth code analysis for quality and security',
    icon: <FileCode className="w-5 h-5" />,
    category: 'code',
    prompt: `Perform a detailed code review of this code:

[PASTE CODE HERE]

Please check:
- Security and potential vulnerabilities
- Performance and optimizations
- Code cleanliness and readability
- Best practices
- Possible logic errors

Provide specific improvement suggestions.`,
    placeholders: ['code'],
  },
  {
    id: 'debugging',
    title: 'Debugging',
    description: 'Help finding and fixing bugs',
    icon: <Bug className="w-5 h-5" />,
    category: 'debug',
    prompt: `I have a problem with this code:

[DESCRIBE PROBLEM]

Code:
[PASTE CODE HERE]

Error:
[PASTE ERROR MESSAGE]

What could be the cause and how to fix it?`,
    placeholders: ['problem description', 'code', 'error'],
  },
  {
    id: 'documentation',
    title: 'Documentation',
    description: 'Generate documentation for code',
    icon: <BookOpen className="w-5 h-5" />,
    category: 'docs',
    prompt: `Generate complete documentation for this code:

[PASTE CODE HERE]

Include:
- Functionality description
- Parameters and return types
- Usage examples
- Notes and warnings
- JSDoc/PyDoc comments`,
    placeholders: ['code'],
  },
  {
    id: 'testing',
    title: 'Unit Tests',
    description: 'Generate tests for code',
    icon: <FlaskConical className="w-5 h-5" />,
    category: 'test',
    prompt: `Write comprehensive unit tests for this code:

[PASTE CODE HERE]

Please provide:
- Positive tests (happy path)
- Negative tests (edge cases)
- Error tests
- Mocking dependencies
- Code in [FRAMEWORK: Jest/Vitest/pytest]`,
    placeholders: ['code', 'framework'],
  },
  {
    id: 'refactoring',
    title: 'Refactoring',
    description: 'Improve code structure and quality',
    icon: <RefreshCw className="w-5 h-5" />,
    category: 'refactor',
    prompt: `Refactor this code to be:
- More readable
- More efficient
- Following best practices
- Easier to maintain

Code:
[PASTE CODE HERE]

Explain the changes made.`,
    placeholders: ['code'],
  },
  {
    id: 'explain-code',
    title: 'Explain Code',
    description: 'Detailed explanation of how code works',
    icon: <Sparkles className="w-5 h-5" />,
    category: 'code',
    prompt: `Explain this code to me step by step:

[PASTE CODE HERE]

Please provide:
- General description of operation
- Explanation of each section
- Algorithmic complexity (if applicable)
- Potential pitfalls and problems
- Usage examples`,
    placeholders: ['code'],
  },
  {
    id: 'api-design',
    title: 'API Design',
    description: 'Design RESTful API',
    icon: <Database className="w-5 h-5" />,
    category: 'code',
    prompt: `Design a RESTful API for:

[DESCRIBE FUNCTIONALITY]

Requirements:
- Endpoints and HTTP methods
- Request/response structure
- HTTP status codes
- Authentication and authorization
- Pagination and filtering
- OpenAPI/Swagger documentation

Framework: [Express/FastAPI/Django/other]`,
    placeholders: ['functionality', 'framework'],
  },
  {
    id: 'optimization',
    title: 'Performance Optimization',
    description: 'Improve application performance',
    icon: <Code className="w-5 h-5" />,
    category: 'refactor',
    prompt: `Help me optimize this code for performance:

[PASTE CODE HERE]

Context:
[DESCRIBE HOW THE CODE IS USED AND WHERE PROBLEMS OCCUR]

Please provide:
- Bottleneck analysis
- Specific optimizations
- Alternative approaches
- Trade-offs between performance and readability`,
    placeholders: ['code', 'context'],
  },
];

const PromptTemplates: React.FC<Props> = ({ onSelectTemplate, lang, onClose }) => {
  const templates = lang === 'PL' ? TEMPLATES_PL : TEMPLATES_EN;
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

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

  const t = lang === 'PL'
    ? {
        title: 'Szablony Promptów',
        search: 'Szukaj szablonów...',
        all: 'Wszystkie',
        code: 'Kod',
        debug: 'Debug',
        docs: 'Dokumentacja',
        test: 'Testy',
        refactor: 'Refaktoryzacja',
        other: 'Inne',
        use: 'Użyj',
      }
    : {
        title: 'Prompt Templates',
        search: 'Search templates...',
        all: 'All',
        code: 'Code',
        debug: 'Debug',
        docs: 'Docs',
        test: 'Tests',
        refactor: 'Refactor',
        other: 'Other',
        use: 'Use',
      };

  const categories = [
    { id: 'all', label: t.all },
    { id: 'code', label: t.code },
    { id: 'debug', label: t.debug },
    { id: 'docs', label: t.docs },
    { id: 'test', label: t.test },
    { id: 'refactor', label: t.refactor },
  ];

  const filteredTemplates = templates.filter(template => {
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory;
    const matchesSearch =
      !searchTerm ||
      template.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      template.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-slate-900 to-slate-950 rounded-2xl border border-white/10 shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">{t.title}</h2>
            <p className="text-sm text-slate-400 mt-1">
              {lang === 'PL' ? 'Wybierz szablon lub dostosuj do swoich potrzeb' : 'Select a template or customize to your needs'}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-white/5">
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder={t.search}
            className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50"
          />
        </div>

        {/* Categories */}
        <div className="p-4 border-b border-white/5 flex gap-2 overflow-x-auto">
          {categories.map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap ${
                selectedCategory === cat.id
                  ? 'bg-emerald-600 text-white'
                  : 'bg-black/30 text-slate-400 hover:bg-black/50'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Templates Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTemplates.map(template => (
              <div
                key={template.id}
                className="bg-black/40 border border-white/5 rounded-xl p-4 hover:border-emerald-500/30 transition-all group cursor-pointer"
                onClick={() => {
                  onSelectTemplate(template.prompt);
                  onClose();
                }}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-emerald-600/20 rounded-lg text-emerald-400 group-hover:bg-emerald-600 group-hover:text-white transition-all">
                    {template.icon}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-white font-semibold mb-1">{template.title}</h3>
                    <p className="text-sm text-slate-400 line-clamp-2">{template.description}</p>
                    {template.placeholders && (
                      <div className="mt-2 flex flex-wrap gap-1">
                        {template.placeholders.map(ph => (
                          <span
                            key={ph}
                            className="text-xs px-2 py-1 bg-white/5 rounded text-slate-500"
                          >
                            {ph}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredTemplates.length === 0 && (
            <div className="text-center text-slate-500 py-12">
              {lang === 'PL' ? 'Nie znaleziono szablonów' : 'No templates found'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PromptTemplates;
