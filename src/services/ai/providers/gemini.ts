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
