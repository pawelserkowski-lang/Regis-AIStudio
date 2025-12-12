/**
 * Gemini AI Provider
 */

import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import type { StreamCallbacks } from "../types";
import type { GeminiModelId } from "../../../types";
import { log } from "../logger";

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

8️⃣ ANALIZA OBRAZÓW (Gemini Feature):
   - Gemini ma specjalną zdolność analizy obrazów!
   - Gdy użytkownik wyśle zdjęcie, szczegółowo je opisz
   - Rozpoznawaj tekst (OCR), obiekty, kod w zrzutach ekranu

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

- Platform: Browser (Gemini fallback provider)
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

const SAFETY_SETTINGS = [
  { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_NONE },
  { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_NONE },
];

let geminiInstance: GoogleGenerativeAI | null = null;
let geminiChat: ReturnType<ReturnType<GoogleGenerativeAI["getGenerativeModel"]>["startChat"]> | null = null;

export function initializeGemini(apiKey: string): boolean {
  try {
    // Validate API key format
    if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length === 0) {
      throw new Error('Invalid API key: must be a non-empty string');
    }

    geminiInstance = new GoogleGenerativeAI(apiKey);
    log("INFO", "Gemini", "Initialized successfully");
    return true;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown initialization error';
    log("ERROR", "Gemini", "Initialization failed", { error: errorMessage });
    return false;
  }
}

export function clearGeminiChat(): void {
  geminiChat = null;
  log("INFO", "Gemini", "Chat session cleared");
}

export async function streamGemini(
  message: string,
  model: GeminiModelId,
  callbacks: StreamCallbacks,
  attachments?: Array<{ type: string; data: string; mimeType: string }>
): Promise<void> {
  log("INFO", "Gemini", `Sending message (${message.length} chars)`, { model });

  if (!geminiInstance) {
    const error = new Error("Gemini not initialized. Please check your API key configuration.");
    log("ERROR", "Gemini", "Instance not initialized", error);
    callbacks.onError(error);
    return;
  }

  // Timeout protection: 90 seconds max for streaming
  const STREAM_TIMEOUT = 90000;
  const timeoutPromise = new Promise<never>((_, reject) => {
    setTimeout(() => {
      reject(new Error("AI response timeout (90s). The request took too long to complete."));
    }, STREAM_TIMEOUT);
  });

  try {
    await Promise.race([
      (async () => {
        const generativeModel = geminiInstance.getGenerativeModel({
          model,
          safetySettings: SAFETY_SETTINGS,
          systemInstruction: SYSTEM_PROMPT,
        });

        if (!geminiChat) {
          geminiChat = generativeModel.startChat({
            history: [],
            generationConfig: {
              maxOutputTokens: 8192,
              temperature: 0.7,
            },
          });
        }

        const parts: Array<{ text: string } | { inlineData: { mimeType: string; data: string } }> = [
          { text: message }
        ];

        // Validate and process attachments
        if (attachments?.length) {
          for (const attachment of attachments) {
            if (attachment.type === "image" && attachment.data) {
              // Validate attachment data
              if (!attachment.mimeType || typeof attachment.data !== 'string') {
                log("WARN", "Gemini", "Invalid attachment format, skipping", { attachment });
                continue;
              }

              parts.push({
                inlineData: {
                  mimeType: attachment.mimeType,
                  data: attachment.data,
                },
              });
            }
          }
        }

        const result = await geminiChat.sendMessageStream(parts);
        let fullText = "";
        let hasReceivedData = false;
        let lastChunkTime = Date.now();
        const CHUNK_TIMEOUT = 30000; // 30s between chunks

        try {
          for await (const chunk of result.stream) {
            // Check if we've been waiting too long for a chunk
            const now = Date.now();
            if (now - lastChunkTime > CHUNK_TIMEOUT) {
              throw new Error("Stream stalled - no data received for 30 seconds");
            }
            lastChunkTime = now;

            const text = chunk.text();
            if (text && typeof text === 'string') {
              hasReceivedData = true;
              fullText += text;
              callbacks.onToken(text);
            }
          }
        } catch (streamError) {
          // Handle streaming errors
          if (fullText.length > 0) {
            // Partial response received - return what we have
            log("WARN", "Gemini", "Stream interrupted but partial response available", {
              receivedLength: fullText.length,
              error: streamError
            });
            callbacks.onComplete(fullText);
            return;
          }
          throw streamError;
        }

        if (!hasReceivedData) {
          throw new Error("No data received from Gemini API. The response was empty.");
        }

        if (fullText.length === 0) {
          log("WARN", "Gemini", "Empty response received from Gemini");
          throw new Error("Received empty response from Gemini. Please try again.");
        }

        log("INFO", "Gemini", `Response complete (${fullText.length} chars)`);
        callbacks.onComplete(fullText);
      })(),
      timeoutPromise
    ]);

  } catch (error) {
    // Provide user-friendly error messages
    let errorMessage = 'An unexpected error occurred with Gemini';

    if (error instanceof Error) {
      // Parse Google API specific errors
      if (error.message.includes('API key')) {
        errorMessage = 'Invalid Gemini API key. Please check your configuration.';
      } else if (error.message.includes('quota') || error.message.includes('RESOURCE_EXHAUSTED')) {
        errorMessage = 'Gemini API quota exceeded. Please try again later.';
      } else if (error.message.includes('safety') || error.message.includes('BLOCKED')) {
        errorMessage = 'Request blocked by Gemini safety filters. Please rephrase your message.';
      } else if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        errorMessage = 'Network error. Please check your internet connection and try again.';
      } else {
        errorMessage = error.message;
      }
    }

    log("ERROR", "Gemini", "Stream error", { error, message: errorMessage });
    callbacks.onError(new Error(errorMessage));
  }
}
