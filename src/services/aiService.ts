/**
 * ╔══════════════════════════════════════════════════════════════════════════════╗
 * ║  REGIS AI STUDIO - Unified AI Service                                        ║
 * ║  ════════════════════════════════════════════════════════════════════════════║
 * ║  Dual-AI Architecture: Claude (Anthropic) + Gemini (Google)                  ║
 * ╚══════════════════════════════════════════════════════════════════════════════╝
 */

import type { AIProvider, AIModelId, ClaudeModelId, GeminiModelId } from "../types";

// ============================================================================
// Types & Interfaces
// ============================================================================

interface AIConfig {
  claudeKey: string | null;
  geminiKey: string | null;
  defaultProvider: AIProvider;
  hasClaudeKey: boolean;
  hasGeminiKey: boolean;
}

interface StreamCallbacks {
  onToken: (token: string) => void;
  onComplete: (fullText: string) => void;
  onError: (error: Error) => void;
}

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface LogEntry {
  timestamp: string;
  level: "INFO" | "WARN" | "ERROR" | "DEBUG";
  source: string;
  message: string;
  data?: unknown;
}

// ============================================================================
// Constants
// ============================================================================

const BACKEND_URL = "http://127.0.0.1:8000";
const LOG_KEY = "regis_ai_logs";
const MAX_LOGS = 500;

const REGIS_SYSTEM_PROMPT = `Jesteś REGIS - Zaawansowanym Asystentem AI z "God Mode" dostępem do systemu.

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

// ============================================================================
// State Management
// ============================================================================

let currentProvider: AIProvider = "claude";
let currentClaudeModel: ClaudeModelId = "claude-sonnet-4-20250514";
let currentGeminiModel: GeminiModelId = "gemini-2.5-flash";
let claudeHistory: ChatMessage[] = [];
let isInitialized = false;
let cachedConfig: AIConfig | null = null;

// ============================================================================
// Logging System
// ============================================================================

function log(level: LogEntry["level"], source: string, message: string, data?: unknown): void {
  const entry: LogEntry = {
    timestamp: new Date().toISOString(),
    level,
    source,
    message,
    data,
  };

  const styles = {
    INFO: "color: #00ff00",
    WARN: "color: #ffff00",
    ERROR: "color: #ff0000",
    DEBUG: "color: #888888",
  };
  
  console.log(`%c[${level}] [${source}] ${message}`, styles[level], data ?? "");

  try {
    const logs: LogEntry[] = JSON.parse(localStorage.getItem(LOG_KEY) || "[]");
    logs.push(entry);
    while (logs.length > MAX_LOGS) logs.shift();
    localStorage.setItem(LOG_KEY, JSON.stringify(logs));
  } catch {
    // Ignore storage errors
  }
}

export function getLogs(): LogEntry[] {
  try {
    return JSON.parse(localStorage.getItem(LOG_KEY) || "[]");
  } catch {
    return [];
  }
}

export function clearLogs(): void {
  localStorage.removeItem(LOG_KEY);
}

// ============================================================================
// Configuration
// ============================================================================

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

// ============================================================================
// Initialization
// ============================================================================

export async function initializeAI(): Promise<boolean> {
  log("INFO", "Init", "Initializing AI services...");
  
  try {
    const config = await fetchConfig();
    
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
// Provider Management
// ============================================================================

export function getProvider(): AIProvider {
  return currentProvider;
}

export function setProvider(provider: AIProvider): boolean {
  const config = getConfig();
  
  if (provider === "claude" && !config?.hasClaudeKey) {
    log("ERROR", "Provider", "Cannot switch to Claude - no API key");
    return false;
  }
  
  if (provider === "gemini" && !config?.hasGeminiKey) {
    log("ERROR", "Provider", "Cannot switch to Gemini - no API key");
    return false;
  }
  
  currentProvider = provider;
  claudeHistory = [];
  
  log("INFO", "Provider", `Switched to ${provider}`);
  return true;
}

export function getAvailableProviders(): AIProvider[] {
  const config = getConfig();
  const providers: AIProvider[] = [];
  
  if (config?.hasClaudeKey) providers.push("claude");
  if (config?.hasGeminiKey) providers.push("gemini");
  
  return providers;
}

// ============================================================================
// Model Management
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
    log("INFO", "Model", `Gemini model set to: ${modelId}`);
  }
}

// ============================================================================
// Claude Streaming
// ============================================================================

async function streamClaude(
  message: string,
  callbacks: StreamCallbacks
): Promise<void> {
  log("INFO", "Claude", `Sending message (${message.length} chars)`, { model: currentClaudeModel });
  
  claudeHistory.push({ role: "user", content: message });
  
  const requestBody = {
    model: currentClaudeModel,
    system: REGIS_SYSTEM_PROMPT,
    messages: claudeHistory,
    stream: true,
  };
  
  try {
    const response = await fetch(`${BACKEND_URL}/api/claude/chat`, {
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
    
    claudeHistory.push({ role: "assistant", content: fullText });
    
    if (claudeHistory.length > 20) {
      claudeHistory = claudeHistory.slice(-20);
    }
    
    log("INFO", "Claude", `Response complete (${fullText.length} chars)`);
    callbacks.onComplete(fullText);
    
  } catch (error) {
    log("ERROR", "Claude", "Stream error", error);
    callbacks.onError(error instanceof Error ? error : new Error(String(error)));
  }
}

// ============================================================================
// Unified Streaming Interface
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
      await streamClaude(message, callbacks);
    } else {
      // Gemini fallback - would need GoogleGenerativeAI import
      callbacks.onError(new Error("Gemini not implemented in this version"));
    }
  } catch (error) {
    callbacks.onError(error instanceof Error ? error : new Error(String(error)));
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

export async function improvePrompt(prompt: string): Promise<string> {
  log("INFO", "Improve", `Improving prompt (${prompt.length} chars)`);
  
  try {
    const response = await fetch(`${BACKEND_URL}/api/claude/improve`, {
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
    log("ERROR", "Improve", "Improve failed", error);
    return prompt;
  }
}

export function clearHistory(): void {
  claudeHistory = [];
  log("INFO", "History", "Chat history cleared");
}

export function getHistoryLength(): number {
  return claudeHistory.length;
}

// ============================================================================
// Health Check
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
    const response = await fetch(`${BACKEND_URL}/api/health`);
    backendOk = response.ok;
  } catch {
    backendOk = false;
  }
  
  const config = getConfig();
  
  return {
    backend: backendOk,
    claude: config?.hasClaudeKey || false,
    gemini: config?.hasGeminiKey || false,
    provider: currentProvider,
    model: getModel(),
  };
}
