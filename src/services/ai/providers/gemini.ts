/**
 * Gemini AI Provider
 */

import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";
import type { StreamCallbacks } from "../types";
import type { GeminiModelId } from "../../../types";
import { log } from "../logger";

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
    {"icon": "📁", "label": "Pokaż pliki", "action": "list"}
  ]
}
\`\`\`

KONTEKST SYSTEMU:
- Dual-AI: Claude (primary) + Gemini (fallback)
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
    geminiInstance = new GoogleGenerativeAI(apiKey);
    log("INFO", "Gemini", "Initialized successfully");
    return true;
  } catch (error) {
    log("ERROR", "Gemini", "Initialization failed", error);
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
    throw new Error("Gemini not initialized");
  }

  try {
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

    if (attachments?.length) {
      for (const attachment of attachments) {
        if (attachment.type === "image" && attachment.data) {
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

    for await (const chunk of result.stream) {
      const text = chunk.text();
      if (text) {
        fullText += text;
        callbacks.onToken(text);
      }
    }

    log("INFO", "Gemini", `Response complete (${fullText.length} chars)`);
    callbacks.onComplete(fullText);

  } catch (error) {
    log("ERROR", "Gemini", "Stream error", error);
    callbacks.onError(error instanceof Error ? error : new Error(String(error)));
  }
}
