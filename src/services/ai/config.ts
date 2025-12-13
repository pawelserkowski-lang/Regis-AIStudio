/**
 * Configuration management for AI services
 */

import type { AIConfig } from "./types";
import { log } from "./logger";

const BACKEND_URL = "http://127.0.0.1:8000";
const FETCH_TIMEOUT = 5000; // 5 seconds

let cachedConfig: AIConfig | null = null;

// Cache for API-fetched models
export interface APIModel {
  id: string;
  name: string;
  type?: string;
  created_at?: string;
}

export interface AllModelsCache {
  claude: APIModel[];
  gemini: APIModel[];
  grok: APIModel[];
}

let cachedModels: AllModelsCache = { claude: [], gemini: [], grok: [] };
let modelsFetchPromise: Promise<AllModelsCache> | null = null;

/**
 * Validates the structure of the config response
 */
function validateConfigResponse(data: unknown): data is Record<string, unknown> {
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid config response: not an object');
  }
  return true;
}

/**
 * Creates an AbortController with timeout
 */
function createFetchWithTimeout(url: string, timeout: number): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  return fetch(url, { signal: controller.signal })
    .finally(() => clearTimeout(timeoutId));
}

export async function fetchConfig(): Promise<AIConfig> {
  log("INFO", "Config", "Fetching AI configuration...");

  try {
    const response = await createFetchWithTimeout(`${BACKEND_URL}/api/config`, FETCH_TIMEOUT);

    if (!response.ok) {
      throw new Error(`Config fetch failed: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Validate response structure
    if (!validateConfigResponse(data)) {
      throw new Error('Invalid config response structure');
    }

    // Build config with validation
    const defaultProvider = typeof data.defaultProvider === 'string' ? data.defaultProvider : "claude";
    const hasClaudeKey = typeof data.hasClaudeKey === 'boolean' ? data.hasClaudeKey : false;
    const hasGeminiKey = typeof data.hasGeminiKey === 'boolean' ? data.hasGeminiKey : Boolean(data.geminiKey || data.envKey);
    const hasGrokKey = typeof data.hasGrokKey === 'boolean' ? data.hasGrokKey : false;

    cachedConfig = {
      claudeKey: typeof data.claudeKey === 'string' ? data.claudeKey : null,
      geminiKey: typeof data.geminiKey === 'string' ? data.geminiKey : (typeof data.envKey === 'string' ? data.envKey : null),
      grokKey: typeof data.grokKey === 'string' ? data.grokKey : null,
      defaultProvider: defaultProvider === "claude" || defaultProvider === "gemini" || defaultProvider === "grok" ? defaultProvider : "claude",
      hasClaudeKey,
      hasGeminiKey,
      hasGrokKey,
    };

    log("INFO", "Config", "Configuration loaded", {
      hasClaudeKey: cachedConfig.hasClaudeKey,
      hasGeminiKey: cachedConfig.hasGeminiKey,
      hasGrokKey: cachedConfig.hasGrokKey,
      defaultProvider: cachedConfig.defaultProvider,
    });

    return cachedConfig;
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    if (error instanceof Error && error.name === 'AbortError') {
      log("ERROR", "Config", "Config fetch timed out after 5s", error);
    } else {
      log("ERROR", "Config", `Failed to fetch config: ${errorMessage}`, error);
    }

    // Return fallback config
    const fallbackConfig: AIConfig = {
      claudeKey: null,
      geminiKey: null,
      grokKey: null,
      defaultProvider: "claude",
      hasClaudeKey: false,
      hasGeminiKey: false,
      hasGrokKey: false,
    };

    return fallbackConfig;
  }
}

export function getConfig(): AIConfig | null {
  return cachedConfig;
}

export function getBackendUrl(): string {
  return BACKEND_URL;
}

/**
 * Fetches available models from all providers via backend
 * Returns cached models if available, otherwise fetches from API
 */
export async function fetchAllModels(): Promise<AllModelsCache> {
  // Return cached models if any are available
  if (cachedModels.claude.length > 0 || cachedModels.gemini.length > 0 || cachedModels.grok.length > 0) {
    return cachedModels;
  }

  // If a fetch is already in progress, wait for it
  if (modelsFetchPromise !== null) {
    return modelsFetchPromise;
  }

  log("INFO", "Config", "Fetching available models from all providers...");

  modelsFetchPromise = (async () => {
    try {
      const response = await createFetchWithTimeout(`${BACKEND_URL}/api/models/all`, FETCH_TIMEOUT);

      if (!response.ok) {
        throw new Error(`Models fetch failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      cachedModels = {
        claude: data.claude?.models || [],
        gemini: data.gemini?.models || [],
        grok: data.grok?.models || [],
      };

      const totalCount = cachedModels.claude.length + cachedModels.gemini.length + cachedModels.grok.length;
      log("INFO", "Config", `Fetched ${totalCount} models (Claude: ${cachedModels.claude.length}, Gemini: ${cachedModels.gemini.length}, Grok: ${cachedModels.grok.length})`);

      return cachedModels;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Unknown error";

      if (error instanceof Error && error.name === "AbortError") {
        log("ERROR", "Config", "Models fetch timed out after 5s", error);
      } else {
        log("ERROR", "Config", `Failed to fetch models: ${errorMessage}`, error);
      }

      // Return empty cache on error - fallback to hardcoded models will be handled by caller
      return cachedModels;
    } finally {
      modelsFetchPromise = null;
    }
  })();

  return modelsFetchPromise;
}

/**
 * Legacy function for backward compatibility - fetches Claude models only
 */
export async function fetchModels(): Promise<APIModel[]> {
  const allModels = await fetchAllModels();
  return allModels.claude;
}

/**
 * Returns cached models for all providers
 */
export function getCachedModels(): AllModelsCache {
  return cachedModels;
}

/**
 * Clears the models cache to force a re-fetch
 */
export function clearModelsCache(): void {
  cachedModels = { claude: [], gemini: [], grok: [] };
  modelsFetchPromise = null;
}
