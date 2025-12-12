/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║  REGIS AI STUDIO - Unified AI Service (Modular)                              ║
 * ║  ════════════════════════════════════════════════════════════════════════════║
 * ║  Dual-AI Architecture: Claude (Anthropic) + Gemini (Google)                  ║
 * ║  - Runtime provider switching                                                ║
 * ║  - Streaming support for both providers                                      ║
 * ║  - Automatic fallback                                                        ║
 * ║  - Comprehensive logging                                                     ║
 * ║  - Modular architecture                                                      ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import type { AIProvider, AIModelId, ClaudeModelId, GeminiModelId } from "../../types";
import type { StreamCallbacks } from "./types";
import { log, getLogs as getLogsInternal, clearLogs as clearLogsInternal } from "./logger";
import { fetchConfig as fetchConfigInternal, getConfig as getConfigInternal, getBackendUrl } from "./config";
import {
  streamClaude,
  improvePrompt as improvePromptClaude,
  clearChatHistory as clearClaudeHistory,
  getChatHistory as getClaudeHistory,
} from "./providers/claude";
import {
  streamGemini,
  initializeGemini,
  clearGeminiChat,
} from "./providers/gemini";

// ============================================================================
// State Management
// ============================================================================

let currentProvider: AIProvider = "claude";
let currentClaudeModel: ClaudeModelId = "claude-sonnet-4-20250514";
let currentGeminiModel: GeminiModelId = "gemini-2.5-flash";
let isInitialized = false;

// ============================================================================
// Public API - Configuration
// ============================================================================

export async function fetchConfig() {
  return fetchConfigInternal();
}

export function getConfig() {
  return getConfigInternal();
}

// ============================================================================
// Public API - Logging
// ============================================================================

export function getLogs() {
  return getLogsInternal();
}

export function clearLogs() {
  return clearLogsInternal();
}

// ============================================================================
// Public API - Initialization
// ============================================================================

export async function initializeAI(): Promise<boolean> {
  log("INFO", "Init", "Initializing AI services...");

  try {
    const config = await fetchConfigInternal();

    if (config.hasClaudeKey) {
      currentProvider = "claude";
      log("INFO", "Init", "Claude API available - set as primary");
    } else if (config.hasGeminiKey) {
      currentProvider = "gemini";
      log("WARN", "Init", "Claude not available, falling back to Gemini");
    } else {
      log("ERROR", "Init", "No API keys configured!");
      return false;
    }

    if (config.hasGeminiKey && config.geminiKey) {
      initializeGemini(config.geminiKey);
    }

    isInitialized = true;
    log("INFO", "Init", `AI initialized with provider: ${currentProvider}`);
    return true;

  } catch (error) {
    log("ERROR", "Init", "AI initialization failed", error);
    return false;
  }
}

export function isAIInitialized(): boolean {
  return isInitialized;
}

// ============================================================================
// Public API - Provider Management
// ============================================================================

export function getProvider(): AIProvider {
  return currentProvider;
}

export function setProvider(provider: AIProvider): boolean {
  const config = getConfigInternal();

  if (provider === "claude" && !config?.hasClaudeKey) {
    log("ERROR", "Provider", "Cannot switch to Claude - no API key");
    return false;
  }

  if (provider === "gemini" && !config?.hasGeminiKey) {
    log("ERROR", "Provider", "Cannot switch to Gemini - no API key");
    return false;
  }

  currentProvider = provider;
  clearHistory();

  log("INFO", "Provider", `Switched to ${provider}`);
  return true;
}

export function getAvailableProviders(): AIProvider[] {
  const config = getConfigInternal();
  const providers: AIProvider[] = [];

  if (config?.hasClaudeKey) providers.push("claude");
  if (config?.hasGeminiKey) providers.push("gemini");

  return providers;
}

// ============================================================================
// Public API - Model Management
// ============================================================================

export function getModel(): AIModelId {
  return currentProvider === "claude" ? currentClaudeModel : currentGeminiModel;
}

export function setModel(modelId: AIModelId): void {
  if (modelId.startsWith("claude")) {
    currentClaudeModel = modelId as ClaudeModelId;
    log("INFO", "Model", `Claude model set to: ${modelId}`);
  } else if (modelId.startsWith("gemini")) {
    currentGeminiModel = modelId as GeminiModelId;
    clearGeminiChat();
    log("INFO", "Model", `Gemini model set to: ${modelId}`);
  }
}

// ============================================================================
// Public API - Messaging
// ============================================================================

export async function sendMessageStream(
  message: string,
  callbacks: StreamCallbacks,
  attachments?: Array<{ type: string; data: string; mimeType: string }>
): Promise<void> {
  if (!isInitialized) {
    callbacks.onError(new Error("AI not initialized. Call initializeAI() first."));
    return;
  }

  log("INFO", "AI", `Routing message to ${currentProvider}`);

  try {
    if (currentProvider === "claude") {
      await streamClaude(message, currentClaudeModel, callbacks);
    } else {
      await streamGemini(message, currentGeminiModel, callbacks, attachments);
    }
  } catch (error) {
    const fallbackProvider = currentProvider === "claude" ? "gemini" : "claude";
    const config = getConfigInternal();

    const canFallback =
      (fallbackProvider === "claude" && config?.hasClaudeKey) ||
      (fallbackProvider === "gemini" && config?.hasGeminiKey);

    if (canFallback) {
      log("WARN", "AI", `Primary failed, trying fallback: ${fallbackProvider}`);

      const originalProvider = currentProvider;
      currentProvider = fallbackProvider;

      try {
        if (fallbackProvider === "claude") {
          await streamClaude(message, currentClaudeModel, callbacks);
        } else {
          await streamGemini(message, currentGeminiModel, callbacks, attachments);
        }
        log("INFO", "AI", `Fallback successful`);
      } catch (fallbackError) {
        currentProvider = originalProvider;
        callbacks.onError(fallbackError instanceof Error ? fallbackError : new Error(String(fallbackError)));
      }
    } else {
      callbacks.onError(error instanceof Error ? error : new Error(String(error)));
    }
  }
}

export async function improvePrompt(prompt: string): Promise<string> {
  return improvePromptClaude(prompt);
}

export function clearHistory(): void {
  clearClaudeHistory();
  clearGeminiChat();
  log("INFO", "History", "All chat history cleared");
}

export function getHistoryLength(): number {
  return currentProvider === "claude" ? getClaudeHistory().length : 0;
}

// ============================================================================
// Public API - Health Check
// ============================================================================

export async function healthCheck(): Promise<{
  backend: boolean;
  claude: boolean;
  gemini: boolean;
  provider: AIProvider;
  model: AIModelId;
}> {
  log("DEBUG", "Health", "Running health check...");

  let backendOk = false;

  try {
    const response = await fetch(`${getBackendUrl()}/api/health`);
    backendOk = response.ok;
  } catch {
    backendOk = false;
  }

  const config = getConfigInternal();

  return {
    backend: backendOk,
    claude: config?.hasClaudeKey || false,
    gemini: config?.hasGeminiKey || false,
    provider: currentProvider,
    model: getModel(),
  };
}

// ============================================================================
// Testing Exports
// ============================================================================

export const __testing = {
  getBackendUrl,
  getClaudeHistory,
  resetState: () => {
    currentProvider = "claude";
    clearHistory();
    isInitialized = false;
  },
};
