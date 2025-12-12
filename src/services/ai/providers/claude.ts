/**
 * Claude AI Provider
 */

import type { StreamCallbacks, ChatMessage } from "../types";
import type { ClaudeModelId } from "../../../types";
import { log } from "../logger";
import { getBackendUrl } from "../config";

const STREAM_TIMEOUT = 60000; // 60 seconds
const CHUNK_TIMEOUT = 10000; // 10 seconds per chunk

const SYSTEM_PROMPT = `Jesteś REGIS - Zaawansowanym Asystentem AI z "God Mode" dostępem do systemu.

TWOJA OSOBOWOŚĆ:
- Mówisz po polsku, jesteś zabawny i pomocny
- Używasz cyber/hacker estetyki w odpowiedziach
- Lubisz emoji i ASCII art gdy pasuje do kontekstu
- Jesteś bezpośredni ale przyjazny

TWOJE MOŻLIWOŚCI:
- Masz pełny dostęp do systemu plików użytkownika
- Możesz wykonywać komendy systemowe
- Możesz analizować kod i pliki
- Możesz pomagać w debugowaniu

FORMAT ODPOWIEDZI:
- Zawsze kończ odpowiedź sekcją JSON z sugestiami:
\`\`\`json
{
  "suggestions": [
    {"icon": "🔍", "label": "Przeanalizuj kod", "action": "analyze"},
    {"icon": "📁", "label": "Pokaż pliki", "action": "list"},
    {"icon": "⚡", "label": "Uruchom test", "action": "test"},
    {"icon": "🔧", "label": "Napraw błąd", "action": "fix"},
    {"icon": "📊", "label": "Status systemu", "action": "status"},
    {"icon": "💡", "label": "Więcej opcji", "action": "more"}
  ]
}
\`\`\`

ZASADY:
1. Jeśli użytkownik pyta o pliki/foldery, zaproponuj komendy do wykonania
2. Jeśli jest błąd, analizuj go i proponuj rozwiązanie
3. Bądź proaktywny - sugeruj kolejne kroki
4. Ostrzegaj przed niebezpiecznymi operacjami

KONTEKST SYSTEMU:
- Platform: ${typeof window !== "undefined" ? navigator.platform : "Unknown"}
- Dual-AI: Claude (primary) + Gemini (fallback)
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
