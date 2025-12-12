# 🔥 Regis AI Studio

> **Matrix-style AI Assistant z Self-Repair System**  
> Dual-AI Architecture: Claude (Anthropic) + Gemini (Google)

![Health Score](https://img.shields.io/badge/Health%20Score-100%25-00ff41?style=for-the-badge&logo=matrix)
![Version](https://img.shields.io/badge/Version-2.0.0-blue?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

```
███████╗███████╗██╗     ███████╗    ██████╗ ███████╗██████╗  █████╗ ██╗██████╗ 
██╔════╝██╔════╝██║     ██╔════╝    ██╔══██╗██╔════╝██╔══██╗██╔══██╗██║██╔══██╗
███████╗█████╗  ██║     █████╗      ██████╔╝█████╗  ██████╔╝███████║██║██████╔╝
╚════██║██╔══╝  ██║     ██╔══╝      ██╔══██╗██╔══╝  ██╔═══╝ ██╔══██║██║██╔══██╗
███████║███████╗███████╗██║         ██║  ██║███████╗██║     ██║  ██║██║██║  ██║
╚══════╝╚══════╝╚══════╝╚═╝         ╚═╝  ╚═╝╚══════╝╚═╝     ╚═╝  ╚═╝╚═╝╚═╝  ╚═╝
```

## ✨ Features

- 🤖 **Dual-AI Support** - Claude (Anthropic) + Gemini (Google) z automatycznym fallback
- 🔧 **Self-Repair System** - Automatyczna diagnostyka i naprawa projektu
- 🎨 **Matrix Glass UI** - Cyberpunk estetyka z glassmorphism
- 💬 **Streaming Chat** - Real-time odpowiedzi z AI
- 📊 **Health Dashboard** - Monitoring systemu w czasie rzeczywistym
- 🔐 **Secure by Design** - Klucze API tylko w zmiennych środowiskowych
- 📦 **Auto npm install** - Automatyczna instalacja zależności

## 🚀 Quick Start

```bash
# 1. Sklonuj repozytorium
git clone https://github.com/YOUR_USERNAME/regis-ai-studio.git
cd regis-ai-studio

# 2. Uruchom Self-Repair (automatycznie skonfiguruje wszystko!)
python self_repair.py

# 3. Uzupełnij klucze API
nano .env

# 4. Uruchom backend
python api/index.py

# 5. Uruchom frontend (nowy terminal)
npm run dev

# 6. Otwórz http://localhost:3000
```

## 🔑 Konfiguracja

Skopiuj `.env.example` jako `.env` i uzupełnij:

```env
# Wymagane (przynajmniej jeden)
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_API_KEY=AIza...

# Opcjonalne
DEFAULT_AI_PROVIDER=claude
BACKEND_PORT=8000
```

## 🔧 Self-Repair System

System automatycznie:
- ✅ Sprawdza strukturę projektu
- ✅ Instaluje brakujące zależności Python (`pip install`)
- ✅ Instaluje brakujące zależności Node.js (`npm install`)
- ✅ Tworzy brakujące katalogi
- ✅ Konfiguruje `.env` z `.env.example`
- ✅ Skanuje pod kątem hardkodowanych kluczy API
- ✅ Sprawdza CVE w zależnościach (`npm audit`)
- ✅ Generuje raport HTML w `docs/reports/`

```bash
python self_repair.py           # Pełna diagnostyka + naprawy
python self_repair.py --check   # Tylko sprawdzenie
python self_repair.py --help    # Pomoc
```

## 📁 Struktura Projektu

```
regis-ai-studio/
├── api/
│   └── index.py          # Backend Python (Claude + Gemini)
├── src/
│   ├── components/       # React components
│   ├── services/         # AI service layer
│   └── types.ts          # TypeScript definitions
├── docs/
│   └── reports/          # Raporty diagnostyczne
├── tests/                # Testy
├── self_repair.py        # 🔧 System samonaprawy
├── package.json          # Node.js dependencies
├── tsconfig.json         # TypeScript config
├── .env.example          # Template konfiguracji
└── .gitignore            # Git ignore rules
```

## 🎨 Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, TypeScript, Vite |
| Styling | Tailwind CSS, Glassmorphism |
| State | Zustand, TanStack Query |
| Backend | Python, HTTPServer |
| AI | Anthropic Claude, Google Gemini |
| Testing | Vitest, pytest |

## 🌐 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api` | GET | Status serwera |
| `/api/health` | GET | Health check |
| `/api/config` | GET | Konfiguracja AI |
| `/api/claude/chat` | POST | Chat z Claude (streaming) |
| `/api/claude/improve` | POST | Ulepszanie promptów |

## 🤖 Supported Models

### Claude (Anthropic)
- `claude-sonnet-4-20250514` ⭐ Default
- `claude-3-5-sonnet-20241022`
- `claude-3-opus-20240229`
- `claude-3-haiku-20240307`

### Gemini (Google)
- `gemini-2.5-flash`
- `gemini-3-pro-preview`

## 📊 Health Dashboard

System zawiera wbudowany dashboard do monitorowania:
- Status połączeń API
- Zużycie tokenów
- Latency
- Logi systemowe
- Model switcher

## 🔐 Security

- ✅ Klucze API tylko w `.env` (nigdy w kodzie!)
- ✅ `.gitignore` blokuje wrażliwe pliki
- ✅ Automatyczne skanowanie pod kątem wycieków
- ✅ CORS headers na backendzie
- ✅ CVE scanning zależności

## 📝 License

MIT License - see [LICENSE](LICENSE)

## 🙏 Credits

- [Anthropic Claude](https://anthropic.com)
- [Google Gemini](https://ai.google.dev)
- Matrix (1999) 🥄

---

<p align="center">
  <i>"There is no spoon." – The Matrix</i> 🐇
</p>
