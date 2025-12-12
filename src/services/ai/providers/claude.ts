/**
 * Claude AI Provider
 */

import type { StreamCallbacks, ChatMessage } from "../types";
import type { ClaudeModelId } from "../../../types";
import { log } from "../logger";
import { getBackendUrl } from "../config";

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
    const response = await fetch(`${getBackendUrl()}/api/claude/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Claude API error: ${response.status} - ${errorText}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error("No response body");
    }

    const decoder = new TextDecoder();
    let fullText = "";
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();

      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      const lines = buffer.split("\n\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        if (line.startsWith("data: ")) {
          const data = line.slice(6);

          if (data === "[DONE]") continue;

          try {
            const parsed = JSON.parse(data);
            if (parsed.text) {
              fullText += parsed.text;
              callbacks.onToken(parsed.text);
            }
          } catch {
            // Ignore parse errors
          }
        }
      }
    }

    chatHistory.push({ role: "assistant", content: fullText });

    // Keep only last 20 messages
    if (chatHistory.length > 20) {
      chatHistory = chatHistory.slice(-20);
    }

    log("INFO", "Claude", `Response complete (${fullText.length} chars)`);
    callbacks.onComplete(fullText);

  } catch (error) {
    log("ERROR", "Claude", "Stream error", error);
    callbacks.onError(error instanceof Error ? error : new Error(String(error)));
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
