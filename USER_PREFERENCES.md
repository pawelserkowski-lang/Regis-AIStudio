# 🎯 Preferencje Użytkownika – "Cyber Matrix Pro" v2.0

> **Ostatnia aktualizacja:** 2025-12-12  
> **Autor:** Konfiguracja AI Assistant  
> **Wersja:** 2.0

---

## 📋 Spis treści

1. [Bezpieczeństwo](#-bezpieczeństwo)
2. [AI Providers – Multi-Model Architecture](#-ai-providers--multi-model-architecture)
3. [Vercel Integration](#-vercel-integration)
4. [Architektura](#-architektura)
5. [UI – Motyw "Matrix Glass"](#-ui--motyw-matrix-glass)
6. [Proces Decyzyjny – 6 Kapeluszy de Bono](#-proces-decyzyjny--6-kapeluszy-de-bono)
7. [Pliki Specjalne](#-pliki-specjalne)
8. [Higiena Kodu](#-higiena-kodu)
9. [Edge Cases](#-edge-cases)
10. [Funkcje Bonusowe](#-funkcje-bonusowe)
11. [Health Dashboard](#-health-dashboard)

---

## 🔐 Bezpieczeństwo

| # | Zasada | Typ | Opis |
|---|--------|-----|------|
| 1 | **Klucze API ze zmiennych środowiskowych** | ✅ Wymagane | Wyłącznie przez `process.env` / `%ENV_VAR%` Windows |
| 2 | **Pełny dostęp do plików lokalnych** | ✅ Wymagane | Zapis i odczyt bez restrykcji |
| 3 | **Pełny dostęp do systemu** | ✅ Wymagane | Operacje systemowe dozwolone |
| 4 | **Pełny dostęp do internetu** | ✅ Wymagane | Bez restrykcji domen |
| 5 | **Audit Log** | 💡 Rekomendowane | Każda operacja logowana z timestampem |
| 6 | **CVE Scanning** | 💡 Rekomendowane | Automatyczne sprawdzanie zależności npm/pip |
| 7 | **Szyfrowanie AES-256** | 💡 Rekomendowane | Wrażliwe dane lokalne szyfrowane |
| 8 | **API Key Rotation** | 💡 Rekomendowane | Przypomnienia o rotacji co 90 dni |
| 9 | **Key Validation** | 💡 Rekomendowane | Weryfikacja klucza przed użyciem |
| 10 | **Vercel Secrets** | 💡 Rekomendowane | Klucze jako encrypted secrets |

### Przykład konfiguracji .env

```env
# ⚠️ NIGDY nie commituj tego pliku do repozytorium!
# Skopiuj do .env.local i uzupełnij wartości

# === PRIMARY AI PROVIDER ===
ANTHROPIC_API_KEY=sk-ant-...

# === SECONDARY PROVIDERS ===
OPENAI_API_KEY=sk-...
GOOGLE_AI_API_KEY=AIza...

# === OPTIONAL PROVIDERS ===
MISTRAL_API_KEY=
GROQ_API_KEY=gsk_...

# === ENTERPRISE ===
AZURE_OPENAI_API_KEY=
AZURE_OPENAI_ENDPOINT=https://xxx.openai.azure.com
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=

# === LOCAL ===
OLLAMA_BASE_URL=http://localhost:11434

# === PROVIDER SELECTION ===
AI_PRIMARY_PROVIDER=anthropic
AI_FALLBACK_PROVIDER=openai
```

---

## 🤖 AI Providers – Multi-Model Architecture

### Wspierani Providerzy

| Provider | Endpoint | Metoda listowania | Status |
|----------|----------|-------------------|--------|
| **Anthropic** | `api.anthropic.com` | `GET /v1/models` | 🟢 Primary |
| **OpenAI** | `api.openai.com` | `GET /v1/models` | 🟡 Secondary |
| **Google AI** | `generativelanguage.googleapis.com` | `GET /v1beta/models` | 🟡 Secondary |
| **Mistral** | `api.mistral.ai` | `GET /v1/models` | 🔵 Optional |
| **Groq** | `api.groq.com` | `GET /openai/v1/models` | 🔵 Optional |
| **Ollama** | `localhost:11434` | `GET /api/tags` | 🔵 Local |
| **Azure OpenAI** | `*.openai.azure.com` | Custom endpoint | 🔵 Enterprise |
| **AWS Bedrock** | `bedrock-runtime.*.amazonaws.com` | `ListFoundationModels` | 🔵 Enterprise |

### Interfejs TypeScript

```typescript
/**
 * Uniwersalny interfejs dla wszystkich providerów AI
 */
interface AIProvider {
  name: string;
  apiKeyEnvVar: string;
  baseUrl: string;
  listModels(): Promise<AIModel[]>;
  chat(messages: Message[], model: string): Promise<Response>;
  validateApiKey(): Promise<boolean>;
}

/**
 * Model AI z pełnymi metadanymi
 */
interface AIModel {
  id: string;
  name: string;
  provider: string;
  contextWindow: number;
  pricing: { 
    input: number;   // $ per 1M tokens
    output: number;  // $ per 1M tokens
  };
  capabilities: ('chat' | 'vision' | 'tools' | 'code')[];
  isAvailable: boolean;
}

/**
 * Konfiguracja fallback chain
 */
interface FallbackConfig {
  providers: string[];
  autoSwitch: boolean;
  maxRetries: number;
  retryDelay: number;
}
```

### Funkcje zarządzania modelami

| Funkcja | Opis |
|---------|------|
| **Auto-discovery** | Automatyczne pobieranie listy modeli po podaniu klucza API |
| **Capability filtering** | Filtrowanie modeli po możliwościach (vision, tools, etc.) |
| **Cost estimation** | Szacowanie kosztów przed wysłaniem requestu |
| **Fallback chain** | Automatyczne przełączanie na backup provider przy błędach |
| **Rate limit handling** | Inteligentne zarządzanie limitami API |
| **Model comparison** | Porównywarka modeli (cena/jakość/szybkość) |

### Model Selector UI (ASCII Preview)

```
╔═══════════════════════════════════════════════════════════════╗
║  🤖 WYBÓR MODELU AI                                           ║
╠═══════════════════════════════════════════════════════════════╣
║                                                               ║
║  Provider: [▼ Anthropic    ]  🔑 Klucz: ••••••••••XXXX ✅     ║
║                                                               ║
║  ┌─────────────────────────────────────────────────────────┐  ║
║  │ 📋 DOSTĘPNE MODELE (pobrano z API)                      │  ║
║  ├─────────────────────────────────────────────────────────┤  ║
║  │ ◉ claude-opus-4-5-20250514      │ 200K │ $15/$75  │ 🔥 │  ║
║  │ ○ claude-sonnet-4-5-20250514    │ 200K │ $3/$15   │    │  ║
║  │ ○ claude-haiku-4-5-20250514     │ 200K │ $0.25/$1 │ ⚡ │  ║
║  │ ○ claude-3-5-sonnet-20241022    │ 200K │ $3/$15   │    │  ║
║  └─────────────────────────────────────────────────────────┘  ║
║                                                               ║
║  ℹ️ Context: 200,000 tokenów | Vision: ✅ | Tools: ✅         ║
║                                                               ║
║  [🔄 Odśwież listę]  [⚙️ Ustawienia providera]  [💾 Zapisz]   ║
╚═══════════════════════════════════════════════════════════════╝
```

---

## 🚀 Vercel Integration

### Konfiguracja vercel.json

```json
{
  "version": 2,
  "framework": "vite",
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "regions": ["cdg1", "fra1"],
  "env": {
    "VITE_API_URL": "@api_url",
    "VITE_AI_PROVIDER": "@ai_provider"
  },
  "functions": {
    "api/**/*.ts": {
      "runtime": "edge",
      "memory": 1024,
      "maxDuration": 30
    }
  },
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "X-XSS-Protection", "value": "1; mode=block" }
      ]
    }
  ]
}
```

### Struktura Edge Functions

```
/api
├── /ai
│   ├── chat.ts          # Główny endpoint AI
│   ├── models.ts        # Listowanie modeli
│   └── validate-key.ts  # Walidacja kluczy API
├── /health
│   └── status.ts        # Health check
└── /proxy
    └── [...provider].ts # Proxy do różnych AI providerów
```

### Environment Variables w Vercel

| Zmienna | Target | Typ |
|---------|--------|-----|
| `ANTHROPIC_API_KEY` | Production, Preview | 🔒 Secret |
| `OPENAI_API_KEY` | Production, Preview | 🔒 Secret |
| `GOOGLE_AI_API_KEY` | Production | 🔒 Secret |
| `VITE_APP_VERSION` | All | System |
| `AI_PRIMARY_PROVIDER` | Production | Plain |

### Edge Function – AI Proxy

```typescript
// api/ai/chat.ts
export const runtime = 'edge';
export const preferredRegion = ['cdg1', 'fra1']; // Europa

export async function POST(request: Request) {
  const { provider, model, messages } = await request.json();
  
  const apiKey = process.env[`${provider.toUpperCase()}_API_KEY`];
  if (!apiKey) {
    return new Response(JSON.stringify({ 
      error: 'Brak klucza API dla wybranego providera',
      provider: provider 
    }), { 
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }
  
  // Provider-specific logic here...
  const providerConfig = getProviderConfig(provider);
  
  const response = await fetch(providerConfig.endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model,
      messages,
      stream: false
    })
  });
  
  return response;
}
```

### Edge Function – List Models

```typescript
// api/ai/models.ts
export const runtime = 'edge';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const provider = searchParams.get('provider') || 'anthropic';
  
  const apiKey = process.env[`${provider.toUpperCase()}_API_KEY`];
  if (!apiKey) {
    return new Response(JSON.stringify({ 
      error: 'Brak klucza API',
      models: [] 
    }), { status: 401 });
  }
  
  const models = await fetchModelsFromProvider(provider, apiKey);
  
  return new Response(JSON.stringify({ 
    provider,
    models,
    timestamp: new Date().toISOString()
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}
```

### CI/CD Pipeline

| Trigger | Akcja | Environment |
|---------|-------|-------------|
| Push to `main` | Auto deploy | Production |
| Push to `develop` | Auto deploy | Preview |
| Pull Request | Preview URL + komentarz | Preview |
| Tag `v*.*.*` | Release deployment | Production |

---

## 🏗️ Architektura

| # | Element | Status | Opis |
|---|---------|--------|------|
| 1 | **Vite + React 19** | ✅ Wymagane | Najnowsza wersja z pełnym HMR |
| 2 | **Tryb Offline/Online** | ✅ Wymagane | Service Worker + IndexedDB |
| 3 | **TanStack Query** | 💡 Rekomendowane | Inteligentne cachowanie API |
| 4 | **Zustand** | 💡 Rekomendowane | Lekki state manager |
| 5 | **Feature Flags** | 💡 Rekomendowane | Włączanie/wyłączanie bez redeployu |
| 6 | **Lazy Loading** | 💡 Rekomendowane | Dynamiczne ładowanie komponentów |
| 7 | **Vercel Edge Functions** | 💡 Rekomendowane | AI proxy na edge |
| 8 | **Multi-provider abstraction** | 💡 Rekomendowane | Warstwa abstrakcji AI |
| 9 | **Provider adapter pattern** | 💡 Rekomendowane | Łatwe dodawanie nowych AI |

### Diagram architektury

```
┌─────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Vite + React)                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐ │
│  │ UI Layer │  │ Zustand  │  │ TanStack │  │ Service Worker   │ │
│  │ (Matrix  │  │ (State)  │  │ Query    │  │ (Offline Cache)  │ │
│  │  Glass)  │  │          │  │ (Cache)  │  │                  │ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────────┬─────────┘ │
│       │             │             │                 │           │
│       └─────────────┴─────────────┴─────────────────┘           │
│                              │                                   │
└──────────────────────────────┼───────────────────────────────────┘
                               │ HTTPS
┌──────────────────────────────┼───────────────────────────────────┐
│                        VERCEL EDGE                               │
│  ┌───────────────────────────┴────────────────────────────────┐ │
│  │                    Edge Functions                           │ │
│  │  ┌─────────┐  ┌─────────────┐  ┌─────────────────────────┐ │ │
│  │  │ /ai/    │  │ /ai/models  │  │ /health/status          │ │ │
│  │  │ chat    │  │             │  │                         │ │ │
│  │  └────┬────┘  └──────┬──────┘  └─────────────────────────┘ │ │
│  └───────┼──────────────┼─────────────────────────────────────┘ │
└──────────┼──────────────┼───────────────────────────────────────┘
           │              │
┌──────────┼──────────────┼───────────────────────────────────────┐
│          │   AI PROVIDERS LAYER                                  │
│  ┌───────┴───────┐  ┌───┴────┐  ┌────────┐  ┌────────┐         │
│  │   Anthropic   │  │ OpenAI │  │ Google │  │ Ollama │  ...    │
│  │   (Primary)   │  │        │  │   AI   │  │(Local) │         │
│  └───────────────┘  └────────┘  └────────┘  └────────┘         │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🎨 UI – Motyw "Matrix Glass"

### Specyfikacja wizualna

| Element | Wartość | Opis |
|---------|---------|------|
| **Glassmorphism** | `backdrop-filter: blur(16px)` | Półprzezroczyste panele |
| **Tło** | `linear-gradient(135deg, #0a1f0a, #001a00)` | Ciemnozielony gradient |
| **Efekt Matrix** | Canvas/WebGL animation | Digital rain w tle |
| **Font** | `JetBrains Mono`, `Fira Code` | Monospace z ligaturami |
| **Akcent** | `#00ff41` | Neonowa zieleń |
| **Hover glow** | `box-shadow: 0 0 20px #00ff41` | Efekt świecenia |

### Lokalizacja

| Język | Kod | Status |
|-------|-----|--------|
| 🇵🇱 Polski | `pl-PL` | Domyślny |
| 🇬🇧 English | `en-US` | Dostępny |

### CSS Variables

```css
:root {
  /* Colors */
  --matrix-bg-primary: #0a1f0a;
  --matrix-bg-secondary: #001a00;
  --matrix-accent: #00ff41;
  --matrix-accent-dim: #00cc33;
  --matrix-text: #00ff41;
  --matrix-text-dim: #008f11;
  --matrix-glass-bg: rgba(0, 31, 0, 0.7);
  --matrix-glass-border: rgba(0, 255, 65, 0.2);
  
  /* Typography */
  --font-mono: 'JetBrains Mono', 'Fira Code', 'Consolas', monospace;
  
  /* Effects */
  --glass-blur: blur(16px);
  --glow-shadow: 0 0 20px var(--matrix-accent);
  --glow-shadow-intense: 0 0 40px var(--matrix-accent);
  
  /* Spacing */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;
  
  /* Border Radius */
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 16px;
  
  /* Transitions */
  --transition-fast: 150ms ease;
  --transition-normal: 300ms ease;
  --transition-slow: 500ms ease;
}
```

### 🔥 Matrix Progress Bar

Animowany pasek postępu w stylu Matrix dla **każdego procesu**.

#### Gdzie się pojawia

| Proces | Komunikat (PL) | Komunikat (EN) |
|--------|----------------|----------------|
| Ładowanie aplikacji | "Inicjalizacja Matrixa..." | "Initializing Matrix..." |
| Fetch API | "Przechwytywanie danych..." | "Intercepting data..." |
| Zapis pliku | "Zapisywanie do rzeczywistości..." | "Saving to reality..." |
| Instalacja pakietów | "Pobieranie czerwonej pigułki..." | "Downloading red pill..." |
| Build projektu | "Kompilowanie kodu źródłowego..." | "Compiling source code..." |
| Backup | "Tworzenie kopii zapasowej świadomości..." | "Backing up consciousness..." |
| AI Response | "Model myśli..." | "Model is thinking..." |
| Upload pliku | "Transmisja danych..." | "Data transmission..." |
| Download | "Dekodowanie pakietów..." | "Decoding packets..." |

#### Efekty wizualne

- ✅ Spływające znaki japońskie/hex w tle paska
- ✅ Glitch effect przy 100%
- ✅ Pulsująca poświata `#00ff41`
- ✅ Random "decoding" tekst: `01101001 → READY`
- ✅ Typing effect na komunikatach

#### Komponent React

```tsx
interface MatrixProgressProps {
  progress: number;        // 0-100
  message: string;         // Komunikat do wyświetlenia
  showRain?: boolean;      // Czy pokazać matrix rain
  glitchOnComplete?: boolean; // Glitch po zakończeniu
}

const MatrixProgress: React.FC<MatrixProgressProps> = ({
  progress,
  message,
  showRain = true,
  glitchOnComplete = true
}) => {
  // Implementation...
};
```

#### ASCII Preview

```
┌─────────────────────────────────────────────────────────┐
│  ░▒▓█ ŁADOWANIE DANYCH █▓▒░                             │
│  ╔══════════════════════════════════════════════════╗   │
│  ║ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░░░░░░░░ ║   │
│  ╚══════════════════════════════════════════════════╝   │
│  [64%] Dekodowanie rzeczywistości... 010110101          │
│  ┌──────────────────────────────────────────────────┐   │
│  │ ゴ ジ ラ マ ト リ ッ ク ス  (spływające znaki)    │   │
│  └──────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

---

## 🧠 Proces Decyzyjny – 6 Kapeluszy de Bono

Przed każdą nietrywialną decyzją symulujemy debatę:

| Kapelusz | Kolor | Perspektywa | Pytanie kluczowe |
|----------|-------|-------------|------------------|
| ⚪ **Biały** | Biały | Fakty i dane | "Jakie mamy twarde dane?" |
| 🔴 **Czerwony** | Czerwony | Emocje i intuicja | "Co mówi gut feeling?" |
| ⚫ **Czarny** | Czarny | Krytyka i ryzyka | "Co może pójść źle?" |
| 🟡 **Żółty** | Żółty | Optymizm i korzyści | "Jakie są plusy?" |
| 🟢 **Zielony** | Zielony | Kreatywność | "Jakie szalone alternatywy?" |
| 🔵 **Niebieski** | Niebieski | Metaperspektywa | "Jaki jest najlepszy proces?" |

### Proces decyzyjny

```
┌─────────────────────────────────────────────────────────────────┐
│                    PROBLEM / DECYZJA                            │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  1. ANALIZA 6 KAPELUSZY                                         │
│     ⚪ → 🔴 → ⚫ → 🟡 → 🟢 → 🔵                                  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  2. GENEROWANIE 6 ROZWIĄZAŃ                                     │
│     Każde z innej perspektywy kapelusza                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  3. MACIERZ SCORINGOWA                                          │
│     ┌──────────────┬───────┬──────────┬───────────┬──────────┐ │
│     │ Rozwiązanie  │ Bezp. │ Wydajn.  │ Czyteln.  │ Skalowa. │ │
│     ├──────────────┼───────┼──────────┼───────────┼──────────┤ │
│     │ Opcja 1      │ 8/10  │ 7/10     │ 9/10      │ 6/10     │ │
│     │ Opcja 2      │ 9/10  │ 6/10     │ 7/10      │ 8/10     │ │
│     │ ...          │ ...   │ ...      │ ...       │ ...      │ │
│     └──────────────┴───────┴──────────┴───────────┴──────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  4. TOP 2 DO GŁĘBSZEJ ANALIZY                                   │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  5. FINALNA REKOMENDACJA + UZASADNIENIE                         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  6. MINI-RETROSPEKTYWA (po implementacji)                       │
│     "Co zadziałało? Co bym zmienił?"                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📁 Pliki Specjalne

| Plik | Rola | Kiedy aktualizować |
|------|------|-------------------|
| `README.md` | Główna dokumentacja projektu | Przy każdej zmianie architektury |
| `ARCHITECTURE.md` | Diagramy i decyzje architektoniczne | Przy zmianach strukturalnych |
| `AGENTS.md` | Dokumentacja agentów AI/automatyzacji | Przy dodaniu/modyfikacji agentów |
| `CHANGELOG.md` | Historia zmian (Keep a Changelog) | Przy każdym renderze |
| `AI_PROVIDERS.md` | Dokumentacja providerów AI | Przy dodaniu nowego providera |
| `.env.example` | Template zmiennych środowiskowych | Przy dodaniu nowej zmiennej |
| `vercel.json` | Konfiguracja Vercel | Przy zmianie deploymentu |
| `*.desktop` | Pliki uruchomieniowe Linux | Przy zmianie ścieżek |
| `backups/` | Snapshoty kodu przed zmianami | Przed każdym refactoringiem |

### Struktura katalogów

```
project-root/
├── 📄 README.md
├── 📄 ARCHITECTURE.md
├── 📄 AGENTS.md
├── 📄 AI_PROVIDERS.md
├── 📄 CHANGELOG.md
├── 📄 .env.example
├── 📄 vercel.json
├── 📁 api/
│   ├── 📁 ai/
│   │   ├── 📄 chat.ts
│   │   ├── 📄 models.ts
│   │   └── 📄 validate-key.ts
│   ├── 📁 health/
│   │   └── 📄 status.ts
│   └── 📁 proxy/
│       └── 📄 [...provider].ts
├── 📁 src/
│   ├── 📁 components/
│   ├── 📁 hooks/
│   ├── 📁 providers/
│   ├── 📁 stores/
│   ├── 📁 utils/
│   └── 📁 i18n/
├── 📁 docs/
├── 📁 backups/
└── 📁 scripts/
    └── 📄 *.desktop
```

---

## 🧹 Higiena Kodu

| # | Zasada | Narzędzie | Opis |
|---|--------|-----------|------|
| 1 | **Scout Rule** | - | Zostawiamy kod czystszy niż zastaliśmy |
| 2 | **Auto-formatowanie** | ESLint + Prettier (JS/TS), Ruff (Python) | Przy każdym ustawieniu |
| 3 | **Pre-commit hooks** | Husky + lint-staged | Żaden brzydki kod nie przejdzie |
| 4 | **Testy** | Vitest (frontend), pytest (backend) | Przy każdej zmianie logiki |
| 5 | **Dokumentacja** | JSDoc / docstrings | Dla każdej publicznej funkcji |
| 6 | **Dead code removal** | - | Regularne czyszczenie |

### Konfiguracja ESLint

```json
{
  "extends": [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier"
  ],
  "rules": {
    "no-console": "warn",
    "no-unused-vars": "error",
    "prefer-const": "error",
    "react/react-in-jsx-scope": "off"
  }
}
```

### Konfiguracja Prettier

```json
{
  "semi": true,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100
}
```

### Pre-commit hooks (Husky)

```bash
#!/bin/sh
# .husky/pre-commit

npx lint-staged
npm run test:unit -- --passWithNoTests
```

---

## ⚠️ Edge Cases

| Scenariusz | Rozwiązanie | Priorytet |
|------------|-------------|-----------|
| **Brak internetu** | Graceful degradation → "Tryb Offline" + cache | 🔴 Krytyczny |
| **API timeout** | Retry z exponential backoff (3x: 1s → 2s → 4s) | 🔴 Krytyczny |
| **Błąd krytyczny UI** | React Error Boundary → przyjazny komunikat | 🔴 Krytyczny |
| **Przepełnienie pamięci** | Auto-cleanup starych wpisów IndexedDB | 🟡 Wysoki |
| **Rate limiting API** | Queue + throttling + info dla usera | 🟡 Wysoki |
| **Nieprawidłowe dane API** | Walidacja Zod/Yup + fallback values | 🟡 Wysoki |
| **Utrata sesji** | Auto-save drafts co 30s do localStorage | 🟡 Wysoki |
| **Wygasły klucz API** | Powiadomienie + fallback na inny provider | 🟡 Wysoki |
| **Provider niedostępny** | Automatyczne przełączenie na backup | 🟡 Wysoki |
| **Nowy model w API** | Auto-discovery przy odświeżeniu | 🟢 Normalny |
| **Vercel deployment fail** | Rollback do poprzedniej wersji | 🟢 Normalny |
| **Edge function timeout** | Graceful degradation + retry | 🟢 Normalny |

### Error Boundary Component

```tsx
class MatrixErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="matrix-error">
          <h1>⚠️ Wystąpił błąd w Matrixie</h1>
          <p>Coś poszło nie tak. Spróbuj odświeżyć stronę.</p>
          <button onClick={() => window.location.reload()}>
            🔄 Odśwież
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
```

---

## 🎁 Funkcje Bonusowe

| # | Funkcja | Skrót / Trigger | Opis |
|---|---------|-----------------|------|
| 1 | **Panic Button** | `Ctrl+Shift+X` | Natychmiastowe zatrzymanie wszystkich operacji |
| 2 | **Terminal Mode** | Konami Code | Ukryty tryb CLI wewnątrz aplikacji |
| 3 | **Easter Egg** | "follow the white rabbit" | Animacja z Matrix 🐇 |
| 4 | **Health Dashboard** | Menu / `Ctrl+H` | Panel statusu systemu |
| 5 | **Model Switcher** | `Ctrl+M` | Szybka zmiana modelu AI |
| 6 | **Theme Toggle** | `Ctrl+T` | Przełączanie motywu (jeśli dostępne) |

### Konami Code Implementation

```typescript
const KONAMI_CODE = [
  'ArrowUp', 'ArrowUp',
  'ArrowDown', 'ArrowDown',
  'ArrowLeft', 'ArrowRight',
  'ArrowLeft', 'ArrowRight',
  'KeyB', 'KeyA'
];

const useKonamiCode = (callback: () => void) => {
  const [index, setIndex] = useState(0);
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === KONAMI_CODE[index]) {
        if (index === KONAMI_CODE.length - 1) {
          callback();
          setIndex(0);
        } else {
          setIndex(i => i + 1);
        }
      } else {
        setIndex(0);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [index, callback]);
};
```

---

## 📊 Health Dashboard

### Pełny widok

```
╔═══════════════════════════════════════════════════════════════════════╗
║  🖥️  MATRIX HEALTH DASHBOARD v2.0                                     ║
╠═══════════════════════════════════════════════════════════════════════╣
║                                                                       ║
║  🤖 AKTYWNY MODEL AI                                                  ║
║  ╔═════════════════════════════════════════════════════════════════╗  ║
║  ║  Provider:    Anthropic                                         ║  ║
║  ║  Model:       claude-opus-4-5-20250514                         ║  ║
║  ║  Status:      🟢 ONLINE (142ms latency)                         ║  ║
║  ║  Context:     200,000 tokenów                                   ║  ║
║  ║  Capabilities: 💬 Chat  👁️ Vision  🔧 Tools  💻 Code            ║  ║
║  ║  Session:     12,847 / 200,000 tokenów (6.4%)                   ║  ║
║  ║  Est. Cost:   $0.47 (sesja)                                     ║  ║
║  ╚═════════════════════════════════════════════════════════════════╝  ║
║                                                                       ║
║  📋 DOSTĘPNE MODELE (live z API)                     [🔄 Odśwież]     ║
║  ┌─────────────────────────────────────────────────────────────────┐  ║
║  │ Provider     │ Model                    │ Status │ Latency     │  ║
║  ├─────────────────────────────────────────────────────────────────┤  ║
║  │ Anthropic    │ claude-opus-4-5          │ 🟢     │ 142ms       │  ║
║  │ Anthropic    │ claude-sonnet-4-5        │ 🟢     │ 98ms        │  ║
║  │ OpenAI       │ gpt-4o                   │ 🟢     │ 201ms       │  ║
║  │ OpenAI       │ gpt-4o-mini              │ 🟢     │ 87ms        │  ║
║  │ Google       │ gemini-1.5-pro           │ 🟡     │ 340ms       │  ║
║  │ Mistral      │ mistral-large            │ ⚪     │ N/A (no key)│  ║
║  │ Ollama       │ llama3.2:latest          │ 🔴     │ offline     │  ║
║  └─────────────────────────────────────────────────────────────────┘  ║
║                                                                       ║
║  🌐 VERCEL DEPLOYMENT                                                 ║
║  ┌─────────────────────────────────────────────────────────────────┐  ║
║  │ Environment: Production     │ Region: cdg1 (Paris)             │  ║
║  │ Last Deploy: 2025-12-12 14:32:01                                │  ║
║  │ Build Time:  47s            │ Status: 🟢 Ready                  │  ║
║  │ URL: https://cyber-matrix.vercel.app                            │  ║
║  └─────────────────────────────────────────────────────────────────┘  ║
║                                                                       ║
║  🔄 FALLBACK CHAIN                                                    ║
║  ┌─────────────────────────────────────────────────────────────────┐  ║
║  │ 1. Anthropic (primary) → 2. OpenAI → 3. Google → 4. Ollama     │  ║
║  │ Auto-switch: ✅ Enabled    │ Last fallback: nigdy              │  ║
║  └─────────────────────────────────────────────────────────────────┘  ║
║                                                                       ║
║  🌐 POŁĄCZENIE           💾 PAMIĘĆ          📦 CACHE                  ║
║  ┌───────────────┐      ┌────────────┐     ┌──────────┐              ║
║  │ API:    🟢    │      │ RAM: 64%   │     │ 2.4 MB   │              ║
║  │ WS:     🟢    │      │ Heap: 45%  │     │ 847 wpisów│             ║
║  │ CDN:    🟢    │      │ IndexDB:OK │     │ TTL: 24h │              ║
║  └───────────────┘      └────────────┘     └──────────┘              ║
║                                                                       ║
║  📈 OSTATNIE OPERACJE                                                 ║
║  ┌─────────────────────────────────────────────────────────────────┐  ║
║  │ 14:32:01 │ ✅ │ Fetch /api/data      │ 89ms                     │  ║
║  │ 14:31:58 │ ✅ │ AI Response          │ 1.2s                     │  ║
║  │ 14:31:45 │ ⚠️ │ Retry /api/status    │ timeout                  │  ║
║  └─────────────────────────────────────────────────────────────────┘  ║
║                                                                       ║
║  [⚙️ Zmień model]  [🔑 Zarządzaj kluczami]  [📊 Statystyki kosztów]   ║
╚═══════════════════════════════════════════════════════════════════════╝
```

### Wyświetlane informacje

| Sekcja | Dane |
|--------|------|
| **Model AI** | Nazwa, provider, status, latency, context, capabilities, zużycie tokenów, koszt |
| **Lista modeli** | Wszystkie dostępne modele z API, status połączenia, latency |
| **Vercel** | Environment, region, last deploy, build time, status, URL |
| **Fallback chain** | Kolejność providerów, auto-switch status, ostatni fallback |
| **Połączenie** | Status API, WebSocket, CDN |
| **Pamięć** | RAM, Heap, IndexedDB |
| **Cache** | Rozmiar, liczba wpisów, TTL |
| **Operacje** | Log ostatnich operacji z czasem i statusem |

---

## 📝 Historia wersji

| Wersja | Data | Zmiany |
|--------|------|--------|
| 2.0 | 2025-12-12 | Multi-provider AI, Vercel Integration, Health Dashboard v2 |
| 1.1 | 2025-12-12 | Matrix Progress Bar, Health Dashboard |
| 1.0 | 2025-12-12 | Initial release |

---

## 🤝 Wsparcie

W razie problemów:
1. Sprawdź Health Dashboard
2. Przejrzyj logi w konsoli
3. Zweryfikuj klucze API
4. Sprawdź status Vercel deployment

---

*Wygenerowano automatycznie przez AI Assistant*  
*"There is no spoon." – The Matrix (1999)* 🥄
