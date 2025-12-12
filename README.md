# REGIS AI STUDIO

```
██████╗ ███████╗ ██████╗ ██╗███████╗     █████╗ ██╗
██╔══██╗██╔════╝██╔════╝ ██║██╔════╝    ██╔══██╗██║
██████╔╝█████╗  ██║  ███╗██║███████╗    ███████║██║
██╔══██╗██╔══╝  ██║   ██║██║╚════██║    ██╔══██║██║
██║  ██║███████╗╚██████╔╝██║███████║    ██║  ██║██║
╚═╝  ╚═╝╚══════╝ ╚═════╝ ╚═╝╚══════╝    ╚═╝  ╚═╝╚═╝
```

**Dual-AI Chat Studio z systemem auto-naprawy i estetyka Matrix**

| Status | Link |
|--------|------|
| Health Score | 100% |
| Version | 2.0.0 |
| License | MIT |
| Live Demo | [regis-ai-studio.vercel.app](https://regis-ai-studio.vercel.app) |

---

## Funkcje

| Funkcja | Opis |
|---------|------|
| Dual-AI | Claude (Anthropic) + Gemini (Google) z automatycznym fallback |
| Self-Repair | 18 automatycznych diagnostyk z auto-naprawa |
| Matrix Glass UI | Glassmorphism + digital rain + neonowe akcenty |
| Streaming Chat | Real-time odpowiedzi przez SSE |
| Health Dashboard | Monitoring statusu, latencji i kosztow |
| Security First | Klucze API w .env, skanowanie bezpieczenstwa |
| Auto npm install | Automatyczna instalacja brakujacych pakietow |
| Tray Launcher | Uruchamianie w tle z ikona w zasobniku |

---

## Szybki Start

### 1. Klonowanie

```bash
git clone https://github.com/pawelserkowski-lang/Regis-AIStudio.git
cd Regis-AIStudio
npm install
```

### 2. Konfiguracja

```bash
cp .env.example .env
```

Edytuj `.env` i dodaj swoje klucze API:

```env
ANTHROPIC_API_KEY=sk-ant-twoj-klucz
GOOGLE_API_KEY=AIza-twoj-klucz
DEFAULT_AI_PROVIDER=claude
BACKEND_PORT=8000
```

### 3. Uruchomienie

**Opcja A - Skrot Windows (zalecane):**

Kliknij dwukrotnie `Regis-AI-Studio.bat` - serwery uruchomia sie w tle z ikona w zasobniku.

**Opcja B - Reczne uruchomienie:**

```bash
# Terminal 1 - Backend
python api/index.py

# Terminal 2 - Frontend
npm run dev
```

**Opcja C - Tylko diagnostyka:**

```bash
python self_repair.py
```

---

## Adresy

| Serwis | URL |
|--------|-----|
| Frontend | http://localhost:5173 |
| Backend API | http://localhost:8000 |
| Health Check | http://localhost:8000/api/health |
| Produkcja | https://regis-ai-studio.vercel.app |

---

## Struktura projektu

```
Regis-AIStudio/
├── api/
│   └── index.py              # Backend Python (dual-AI)
├── src/
│   ├── components/
│   │   └── HealthDashboard.tsx   # Dashboard monitoringu
│   ├── services/
│   │   └── aiService.ts      # Unified AI service
│   └── types.ts              # TypeScript definitions
├── docs/
│   └── reports/              # Raporty diagnostyczne HTML
├── tests/                    # Testy jednostkowe
├── .env.example              # Szablon konfiguracji
├── .gitignore                # Wykluczenia git
├── package.json              # Zaleznosci Node.js
├── tsconfig.json             # Konfiguracja TypeScript
├── self_repair.py            # System auto-naprawy
├── Regis-AI-Studio.bat       # Launcher Windows (tray)
├── start-regis-tray.ps1      # PowerShell tray script
└── stop-regis.bat            # Zatrzymaj serwery
```

---

## System Self-Repair

System automatycznej diagnostyki i naprawy uruchamiany przez `self_repair.py`:

### 18 Checkow diagnostycznych:

1. Struktura projektu
2. Konfiguracja .env
3. Zaleznosci Python
4. Zaleznosci Node.js
5. Walidacja TypeScript
6. Endpointy API
7. Skan bezpieczenstwa
8. Definicje typow
9. npm audit
10. ...i wiecej

### Auto-naprawa:

- Tworzy brakujace foldery
- Instaluje brakujace pakiety
- Kopiuje .env z .env.example
- Aktualizuje .gitignore

### Raporty HTML:

Generowane automatycznie do `docs/reports/` w stylu Matrix.

---

## Tech Stack

| Warstwa | Technologie |
|---------|-------------|
| Frontend | React 19, TypeScript, Vite |
| Styling | Tailwind CSS, Glassmorphism |
| State | Zustand, TanStack Query |
| Backend | Python, HTTPServer |
| AI | Anthropic Claude, Google Gemini |
| Testing | Vitest, pytest |
| Deploy | Vercel Edge Functions |

---

## API Endpoints

| Endpoint | Metoda | Opis |
|----------|--------|------|
| /api | GET | Info o API |
| /api/health | GET | Status zdrowia |
| /api/config | GET | Konfiguracja (bez kluczy) |
| /api/claude/chat | POST | Chat z AI |
| /api/claude/improve | POST | Ulepszenie tekstu |

---

## Modele AI

### Claude (Anthropic)
- claude-sonnet-4-20250514 (domyslny)
- claude-3-5-sonnet-20241022
- claude-opus
- claude-haiku

### Gemini (Google)
- gemini-2.5-flash
- gemini-3-pro-preview

---

## Launcher Windows

### Pliki:

| Plik | Opis |
|------|------|
| Regis-AI-Studio.bat | Glowny skrot - ikona w tray |
| start-regis-tray.ps1 | Skrypt PowerShell |
| stop-regis.bat | Zatrzymuje serwery |

### Uzycie:

1. Kliknij dwukrotnie `Regis-AI-Studio.bat`
2. Ikona pojawi sie w zasobniku (obok zegara)
3. Przegladarka otworzy sie automatycznie

### Menu w zasobniku (prawy klik):

- [>] Otworz aplikacje
- [i] Health Check
- [~] Restart serwerow
- [X] Zamknij Regis

---

## Bezpieczenstwo

- [x] Klucze API tylko w .env (nigdy w kodzie)
- [x] .env w .gitignore
- [x] Skanowanie wzorcow kluczy w kodzie
- [x] Maskowanie kluczy w /api/config
- [x] CORS wlaczony
- [x] Logowanie do server_log.txt

---

## Skrypty npm

```bash
npm run dev          # Uruchom frontend (Vite)
npm run build        # Zbuduj produkcje
npm run preview      # Podglad buildu
npm run lint         # ESLint
npm run test:frontend # Testy Vitest
npm run test:backend  # Testy pytest
npm run test:all      # Wszystkie testy
npm run self-repair   # Uruchom diagnostyke
```

---

## Wymagania

- Python 3.8+
- Node.js 18+
- npm 9+
- Windows 10/11 (dla launchera)

---

## Zmienne srodowiskowe

| Zmienna | Opis | Przyklad |
|---------|------|----------|
| ANTHROPIC_API_KEY | Klucz API Anthropic | sk-ant-... |
| GOOGLE_API_KEY | Klucz API Google | AIza... |
| DEFAULT_AI_PROVIDER | Domyslny provider | claude |
| BACKEND_PORT | Port backendu | 8000 |

---

## Rozwiazywanie problemow

**"python nie jest rozpoznawany"**
- Dodaj Python do PATH systemowego

**"npm nie jest rozpoznawany"**
- Zainstaluj Node.js i zrestartuj terminal

**PowerShell blokuje skrypt**
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

**Port 8000 zajety**
```bash
# Windows
netstat -ano | findstr :8000
taskkill /PID <numer> /F

# Lub zmien port w .env
BACKEND_PORT=8001
```

**Brak kluczy API**
- Sprawdz czy .env istnieje i zawiera klucze
- Uruchom `python self_repair.py` dla diagnostyki

---

## Licencja

MIT License - zobacz plik LICENSE

---

## Autor

Utworzono z pomoca Claude AI (Anthropic)

---

## Linki

- [GitHub Repository](https://github.com/pawelserkowski-lang/Regis-AIStudio)
- [Live Demo](https://regis-ai-studio.vercel.app)
- [Anthropic API](https://console.anthropic.com/)
- [Google AI Studio](https://aistudio.google.com/)

---

```
"Wake up, Neo... The Matrix has you."
```
