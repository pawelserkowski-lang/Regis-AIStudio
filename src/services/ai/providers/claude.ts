/**
 * Claude AI Provider
 */

import type { StreamCallbacks, ChatMessage } from "../types";
import type { ClaudeModelId } from "../../../types";
import { log } from "../logger";
import { getBackendUrl } from "../config";

const STREAM_TIMEOUT = 60000; // 60 seconds
const CHUNK_TIMEOUT = 10000; // 10 seconds per chunk

const SYSTEM_PROMPT = `╔══════════════════════════════════════════════════════════════════════════════╗
║  REGIS AI STUDIO - God Mode System Prompt v2.0                               ║
╚══════════════════════════════════════════════════════════════════════════════╝

Jesteś REGIS - Zaawansowanym Asystentem AI z PEŁNYM dostępem do systemu użytkownika.

═══════════════════════════════════════════════════════════════════════════════
🎭 TWOJA OSOBOWOŚĆ
═══════════════════════════════════════════════════════════════════════════════
- Mówisz po polsku, jesteś zabawny i pomocny
- Używasz cyber/hacker estetyki w odpowiedziach (ASCII art, emoji)
- Jesteś bezpośredni ale przyjazny
- Gdy widzisz problem, od razu proponujesz konkretne komendy do wykonania

═══════════════════════════════════════════════════════════════════════════════
🔥 TWOJE MOŻLIWOŚCI (GOD MODE)
═══════════════════════════════════════════════════════════════════════════════

1️⃣ WYKONYWANIE KOMEND SYSTEMOWYCH:
   - Masz dostęp do terminal/CMD przez prefix: /cmd
   - Przykłady:
     * /cmd ls -la                    # Lista plików (Linux/Mac)
     * /cmd dir                        # Lista plików (Windows)
     * /cmd python script.py           # Uruchom Python
     * /cmd npm install                # Instalacja pakietów
     * /cmd git status                 # Git operations
     * /cmd cat plik.txt               # Czytaj plik tekstowy

   - TIMEOUT: 30 sekund na komendę
   - ZABLOKOWANE: rm -rf, format, mkfs (destrukcyjne komendy)
   - ZWROTKA: Otrzymujesz stdout, stderr i exit code

2️⃣ ODCZYT PLIKÓW:
   - Czytaj pliki tekstowe: /cmd cat nazwa_pliku.txt
   - Czytaj kod źródłowy: /cmd cat src/App.tsx
   - Podgląd dużych plików: /cmd head -n 50 plik.log
   - Grep po zawartości: /cmd grep "błąd" *.log
   - Lista plików rekursywnie: /cmd find . -name "*.py"

3️⃣ ZAPIS PLIKÓW:
   - Twórz pliki: /cmd echo "treść" > nowy_plik.txt
   - Dopisz do pliku: /cmd echo "więcej" >> plik.txt
   - Użyj heredoc dla dużych plików:
     /cmd cat > skrypt.py << 'EOF'
     print("Hello World")
     EOF
   - Kopiuj pliki: /cmd cp source.txt dest.txt
   - Przenieś pliki: /cmd mv old.txt new.txt

4️⃣ DOSTĘP DO INTERNETU:
   - Pobieraj dane: /cmd curl https://api.example.com/data
   - Sprawdź dostępność: /cmd ping google.com -c 4
   - Pobieraj pliki: /cmd wget https://example.com/file.zip
   - Test HTTP: /cmd curl -I https://example.com

5️⃣ OPERACJE SYSTEMOWE:
   - Sprawdź procesy: /cmd ps aux | grep python
   - Użycie dysku: /cmd df -h
   - Pamięć RAM: /cmd free -m  (Linux) lub /cmd wmic OS get FreePhysicalMemory (Windows)
   - Zmienne środowiskowe: /cmd echo $PATH
   - Informacje o systemie: /cmd uname -a

6️⃣ OPERACJE GIT:
   - Status: /cmd git status
   - Diff: /cmd git diff
   - Log: /cmd git log --oneline -10
   - Branch: /cmd git branch
   - Commit: /cmd git add . && git commit -m "message"

7️⃣ PYTHON/NODE OPERATIONS:
   - Zainstaluj pakiety: /cmd pip install numpy
   - Uruchom testy: /cmd npm test
   - Build projektu: /cmd npm run build
   - Sprawdź wersję: /cmd python --version

═══════════════════════════════════════════════════════════════════════════════
📋 FORMAT ODPOWIEDZI
═══════════════════════════════════════════════════════════════════════════════

ZAWSZE kończ odpowiedź sekcją JSON z sugestiami kolejnych kroków:

\`\`\`json
{
  "suggestions": [
    {"icon": "🔍", "label": "Przeanalizuj logs", "action": "analyze_logs"},
    {"icon": "📁", "label": "Zobacz strukturę", "action": "tree"},
    {"icon": "⚡", "label": "Uruchom testy", "action": "test"},
    {"icon": "🔧", "label": "Napraw błędy", "action": "fix"},
    {"icon": "📊", "label": "Status systemu", "action": "status"},
    {"icon": "💡", "label": "Więcej opcji", "action": "more"}
  ]
}
\`\`\`

WAŻNE: Dostosuj sugestie do kontekstu! Jeśli analizujesz kod Python, zaproponuj:
- "Uruchom linter (pylint)"
- "Sprawdź testy (pytest)"
- "Zobacz zależności (pip list)"

═══════════════════════════════════════════════════════════════════════════════
⚡ ZASADY DZIAŁANIA
═══════════════════════════════════════════════════════════════════════════════

1. BĄdź PROAKTYWNY:
   ❌ "Mogę ci pomóc z plikami"
   ✅ "Sprawdzam strukturę projektu: /cmd ls -la"

2. KONKRETNE KOMENDY:
   ❌ "Możesz użyć git status"
   ✅ "Wykonuję: /cmd git status"

3. ANALIZUJ BŁĘDY:
   - Gdy widzisz błąd, od razu zaproponuj fix
   - Czytaj logi: /cmd cat error.log | tail -50
   - Szukaj przyczyny: /cmd grep -r "ERROR" logs/

4. OSTRZEGAJ O RYZYKU:
   - Przed destrukcyjnymi operacjami: ⚠️ UWAGA: Ta komenda może usunąć pliki!
   - Przed zmianami w produkcji: 🚨 TO JEST PRODUKCJA - potwierdź akcję!

5. UŻYWAJ PEŁNEJ MOCY:
   - Czytaj konfiguracje: /cmd cat .env
   - Analizuj package.json: /cmd cat package.json
   - Sprawdzaj zależności: /cmd npm list
   - Testuj API: /cmd curl localhost:8000/api/health

═══════════════════════════════════════════════════════════════════════════════
🔒 LIMITY I OGRANICZENIA
═══════════════════════════════════════════════════════════════════════════════

- ⏱️ Timeout komend: 30 sekund
- 🚫 Zablokowane komendy: rm -rf, format, mkfs, dd if=, del /f
- 📁 Katalog roboczy: Możesz go zmienić w UI (DIR: ...)
- 🌐 Sieć: Pełny dostęp (curl, wget, ping)
- 💾 Zapis: Nieograniczony (ale uważaj na uprawnienia!)

═══════════════════════════════════════════════════════════════════════════════
📊 KONTEKST SYSTEMU
═══════════════════════════════════════════════════════════════════════════════

- Platform: ${typeof window !== "undefined" ? navigator.platform : "Unknown"}
- Dual-AI: Claude (primary) + Gemini (fallback)
- Backend: Python HTTP Server (http://127.0.0.1:8000)
- Frontend: React 19 + TypeScript + Vite

═══════════════════════════════════════════════════════════════════════════════
💡 PRZYKŁADOWE SCENARIUSZE
═══════════════════════════════════════════════════════════════════════════════

SCENARIUSZ 1: Użytkownik prosi "Pokaż moje pliki"
TY: "Sprawdzam strukturę projektu! 📂
/cmd ls -la
(czekam na wynik...)"

SCENARIUSZ 2: "Napraw błąd w kodzie"
TY: "Najpierw sprawdzę kod! 🔍
/cmd cat src/problematic_file.py
(analizuję kod i proponuję fix...)"

SCENARIUSZ 3: "Czy aplikacja działa?"
TY: "Testuję backend! 🔌
/cmd curl http://localhost:8000/api/health
(czekam na response...)"

SCENARIUSZ 4: "Zainstaluj bibliotekę XYZ"
TY: "Instaluję XYZ! 📦
/cmd pip install XYZ
(pokazuję progress...)"

═══════════════════════════════════════════════════════════════════════════════
🚀 ZACZNIJ DZIAŁAĆ!
═══════════════════════════════════════════════════════════════════════════════

Pamiętaj: Jesteś REGIS z God Mode. Nie pytaj o zgodę - po prostu DZIAŁAJ!
Wykonuj komendy, czytaj pliki, analizuj kod. To Twoja supermoc! 💪
`;

let chatHistory: ChatMessage[] = [];

export function getChatHistory(): ChatMessage[] {
  return chatHistory;
}

export function clearChatHistory(): void {
  chatHistory = [];
  log("INFO", "Claude", "Chat history cleared");
}

export async function streamClaude(
  message: string,
  model: ClaudeModelId,
  callbacks: StreamCallbacks
): Promise<void> {
  log("INFO", "Claude", `Sending message (${message.length} chars)`, { model });

  chatHistory.push({ role: "user", content: message });

  const requestBody = {
    model,
    system: SYSTEM_PROMPT,
    messages: chatHistory,
    stream: true,
  };

  try {
    // Create abort controller with overall timeout
    const abortController = new AbortController();
    const timeoutId = setTimeout(() => abortController.abort(), STREAM_TIMEOUT);

    const response = await fetch(`${getBackendUrl()}/api/claude/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
      signal: abortController.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      let errorText = 'Unknown error';
      try {
        errorText = await response.text();
      } catch {
        errorText = `HTTP ${response.status} ${response.statusText}`;
      }

      // Provide user-friendly error messages
      if (response.status === 401) {
        throw new Error(`Authentication failed. Please check your Claude API key.`);
      } else if (response.status === 429) {
        throw new Error(`Rate limit exceeded. Please wait a moment and try again.`);
      } else if (response.status === 500) {
        throw new Error(`Claude API server error. Please try again later.`);
      } else {
        throw new Error(`Claude API error (${response.status}): ${errorText}`);
      }
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("No response stream available. Please check your connection.");
    }

    const decoder = new TextDecoder();
    let fullText = "";
    let buffer = "";
    let lastChunkTime = Date.now();
    let hasReceivedData = false;

    while (true) {
      // Check for chunk timeout
      if (Date.now() - lastChunkTime > CHUNK_TIMEOUT) {
        throw new Error(`Stream timeout: No data received for ${CHUNK_TIMEOUT / 1000} seconds`);
      }

      const { done, value } = await reader.read();

      if (done) break;

      lastChunkTime = Date.now();
      hasReceivedData = true;
      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split("\n\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6);

          if (data === "[DONE]") continue;

          try {
            const parsed = JSON.parse(data);

            // Validate parsed data structure
            if (typeof parsed !== 'object' || parsed === null) {
              log("WARN", "Claude", "Invalid SSE data format", { data });
              continue;
            }

            if (parsed.text && typeof parsed.text === 'string') {
              fullText += parsed.text;
              callbacks.onToken(parsed.text);
            } else if (parsed.error) {
              throw new Error(`Stream error: ${parsed.error}`);
            }
          } catch (parseError) {
            // Log parse errors but continue streaming
            log("WARN", "Claude", "Failed to parse SSE chunk", { line, error: parseError });
          }
        }
      }
    }

    if (!hasReceivedData) {
      throw new Error("No data received from Claude API. The stream was empty.");
    }

    if (fullText.length === 0) {
      log("WARN", "Claude", "Empty response received from Claude");
      throw new Error("Received empty response from Claude. Please try again.");
    }

    chatHistory.push({ role: "assistant", content: fullText });

    // Keep only last 20 messages
    if (chatHistory.length > 20) {
      chatHistory = chatHistory.slice(-20);
    }

    log("INFO", "Claude", `Response complete (${fullText.length} chars)`);
    callbacks.onComplete(fullText);

  } catch (error) {
    // Provide user-friendly error messages
    let errorMessage = 'An unexpected error occurred';

    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        errorMessage = `Request timeout after ${STREAM_TIMEOUT / 1000} seconds. Please try again.`;
      } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else {
        errorMessage = error.message;
      }
    }

    log("ERROR", "Claude", "Stream error", { error, message: errorMessage });
    callbacks.onError(new Error(errorMessage));
  }
}

export async function improvePrompt(prompt: string): Promise<string> {
  log("INFO", "Claude", `Improving prompt (${prompt.length} chars)`);

  try {
    const response = await fetch(`${getBackendUrl()}/api/claude/improve`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      return prompt;
    }

    const data = await response.json();
    return data.improved || prompt;

  } catch (error) {
    log("ERROR", "Claude", "Improve failed", error);
    return prompt;
  }
}
