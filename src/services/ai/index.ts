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
  const config = getConfigInternal();

  if (modelId.startsWith("claude")) {
    currentClaudeModel = modelId as ClaudeModelId;
    // ALWAYS switch provider to match model - let streamClaude handle missing key error
    currentProvider = "claude";
    if (config?.hasClaudeKey) {
      log("INFO", "Model", `Claude model set to: ${modelId}, provider switched to claude`);
    } else {
      log("WARN", "Model", `Claude model ${modelId} selected but no API key configured`);
    }
  } else if (modelId.startsWith("gemini")) {
    currentGeminiModel = modelId as GeminiModelId;
    clearGeminiChat();
    // ALWAYS switch provider to match model - let streamGemini handle missing key error
    currentProvider = "gemini";
    if (config?.hasGeminiKey) {
      log("INFO", "Model", `Gemini model set to: ${modelId}, provider switched to gemini`);
    } else {
      log("WARN", "Model", `Gemini model ${modelId} selected but no API key configured`);
    }
  } else if (modelId.startsWith("grok")) {
    // Handle Grok models - store in geminiModel as fallback for now
    // TODO: Add dedicated Grok provider support
    log("WARN", "Model", `Grok model ${modelId} selected - Grok provider not yet implemented`);
  } else {
    log("WARN", "Model", `Unknown model prefix for: ${modelId}`);
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

  log("INFO", "AI", `Routing message to ${currentProvider} (model: ${currentProvider === "claude" ? currentClaudeModel : currentGeminiModel})`);

  try {
    if (currentProvider === "claude") {
      await streamClaude(message, currentClaudeModel, callbacks);
    } else {
      await streamGemini(message, currentGeminiModel, callbacks, attachments);
    }
  } catch (error) {
    const primaryError = error instanceof Error ? error : new Error(String(error));
    const primaryProvider = currentProvider;

    log("ERROR", "AI", `${primaryProvider} failed: ${primaryError.message}`);

    // Check if this is a non-retryable error (don't fallback for config/init errors)
    const errorMessage = primaryError.message.toLowerCase();
    const isConfigError = errorMessage.includes('not initialized') ||
                          errorMessage.includes('api key') ||
                          errorMessage.includes('configuration');

    if (isConfigError) {
      // Don't fallback for configuration errors - show the actual error
      callbacks.onError(primaryError);
      return;
    }

    const fallbackProvider = currentProvider === "claude" ? "gemini" : "claude";
    const config = getConfigInternal();

    const canFallback =
      (fallbackProvider === "claude" && config?.hasClaudeKey) ||
      (fallbackProvider === "gemini" && config?.hasGeminiKey);

    if (canFallback) {
      log("WARN", "AI", `Primary (${primaryProvider}) failed, trying fallback: ${fallbackProvider}`);

      const originalProvider = currentProvider;
      currentProvider = fallbackProvider;

      try {
        if (fallbackProvider === "claude") {
          await streamClaude(message, currentClaudeModel, callbacks);
        } else {
          await streamGemini(message, currentGeminiModel, callbacks, attachments);
        }
        log("INFO", "AI", `Fallback to ${fallbackProvider} successful`);
      } catch (fallbackError) {
        currentProvider = originalProvider;
        // Show BOTH errors - primary error first
        const fallbackErrorMsg = fallbackError instanceof Error ? fallbackError.message : String(fallbackError);
        const combinedError = new Error(
          `${primaryProvider} error: ${primaryError.message}. ` +
          `Fallback to ${fallbackProvider} also failed: ${fallbackErrorMsg}`
        );
        log("ERROR", "AI", `Both providers failed: ${combinedError.message}`);
        callbacks.onError(combinedError);
      }
    } else {
      callbacks.onError(primaryError);
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
