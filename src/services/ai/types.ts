/**
 * Internal types for AI service modules
 */

export interface AIConfig {
  claudeKey: string | null;
  geminiKey: string | null;
  defaultProvider: "claude" | "gemini";
  hasClaudeKey: boolean;
  hasGeminiKey: boolean;
}

export interface StreamCallbacks {
  onToken: (token: string) => void;
  onComplete: (fullText: string) => void;
  onError: (error: Error) => void;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface LogEntry {
  timestamp: string;
  level: "INFO" | "WARN" | "ERROR" | "DEBUG";
  source: string;
  message: string;
  data?: unknown;
}
