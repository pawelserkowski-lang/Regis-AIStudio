```markdown
# 🏗️ Architektura Systemu: Projekt Phoenix

**Status:** [NIESTABILNIE GENIALNY]
**Wersja:** 1.1.0

## 1. Filozofia "Hybrydowego Serverless"

Regis to hybryda. Udajemy architekturę Vercel Serverless na lokalnym maszynie, żeby deweloper miał "Cloud Experience" bez Clouda.

### Główne Filary:
1.  **Frontend Sovereignty (Suwerenność Frontu):** React 19 wykonuje 90% logiki. Streaming AI, obsługa narzędzi, WebRTC - to wszystko dzieje się w przeglądarce (`src/services/geminiService.ts`). Zmniejsza to latencję do zera.
2.  **Backend jako Lokaj:** Python (`api/index.py`) służy tylko do tego, czego przeglądarka nie może zrobić ze względów bezpieczeństwa (dostęp do plików, wykonywanie komend).
3.  **Cross-Platform Translator:** Backend posiada wbudowany translator komend (`ls` -> `dir`, `rm` -> `del`), dzięki czemu model AI myślący w Linuxie nie wykłada się na Windowsie.

## 2. Diagram Przepływu Danych

```mermaid
graph TD
    User[Użytkownik] -->|Input| ReactApp[React 19 Frontend]
    
    subgraph "Browser Land"
        ReactApp -->|Direct Stream| GoogleAI[Gemini 3 Pro API]
        ReactApp -->|Persist| LocalStorage[Baza Danych (JSON)]
        ReactApp -->|Audio Stream| WebRTC[WebRTC/AudioContext]
    end
    
    subgraph "Local Python Backend (Port 8000)"
        ReactApp -->|POST /api/command| PythonHandler[api/index.py]
        PythonHandler -->|subprocess.run| OS[System Operacyjny]
        PythonHandler -->|Read/Write| FileSystem[System Plików]
    end