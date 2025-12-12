/**
 * Configuration management for AI services
 */

import type { AIConfig } from "./types";
import { log } from "./logger";

const BACKEND_URL = "http://127.0.0.1:8000";
const FETCH_TIMEOUT = 5000; // 5 seconds

let cachedConfig: AIConfig | null = null;

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

    cachedConfig = {
      claudeKey: typeof data.claudeKey === 'string' ? data.claudeKey : null,
      geminiKey: typeof data.geminiKey === 'string' ? data.geminiKey : (typeof data.envKey === 'string' ? data.envKey : null),
      defaultProvider: defaultProvider === "claude" || defaultProvider === "gemini" ? defaultProvider : "claude",
      hasClaudeKey,
      hasGeminiKey,
    };

    log("INFO", "Config", "Configuration loaded", {
      hasClaudeKey: cachedConfig.hasClaudeKey,
      hasGeminiKey: cachedConfig.hasGeminiKey,
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
      defaultProvider: "claude",
      hasClaudeKey: false,
      hasGeminiKey: false,
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
