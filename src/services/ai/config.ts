/**
 * Configuration management for AI services
 */

import type { AIConfig } from "./types";
import { log } from "./logger";

const BACKEND_URL = "http://127.0.0.1:8000";

let cachedConfig: AIConfig | null = null;

export async function fetchConfig(): Promise<AIConfig> {
  log("INFO", "Config", "Fetching AI configuration...");

  try {
    const response = await fetch(`${BACKEND_URL}/api/config`);

    if (!response.ok) {
      throw new Error(`Config fetch failed: ${response.status}`);
    }

    const data = await response.json();

    cachedConfig = {
      claudeKey: data.claudeKey || null,
      geminiKey: data.geminiKey || data.envKey || null,
      defaultProvider: data.defaultProvider || "claude",
      hasClaudeKey: data.hasClaudeKey || false,
      hasGeminiKey: data.hasGeminiKey || Boolean(data.geminiKey || data.envKey),
    };

    log("INFO", "Config", "Configuration loaded", {
      hasClaudeKey: cachedConfig.hasClaudeKey,
      hasGeminiKey: cachedConfig.hasGeminiKey,
      defaultProvider: cachedConfig.defaultProvider,
    });

    return cachedConfig;
  } catch (error) {
    log("ERROR", "Config", "Failed to fetch config", error);

    return {
      claudeKey: null,
      geminiKey: null,
      defaultProvider: "claude",
      hasClaudeKey: false,
      hasGeminiKey: false,
    };
  }
}

export function getConfig(): AIConfig | null {
  return cachedConfig;
}

export function getBackendUrl(): string {
  return BACKEND_URL;
}
