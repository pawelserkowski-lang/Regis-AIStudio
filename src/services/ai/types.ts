/**
 * Internal types for AI service modules
 */

export interface AIConfig {
  claudeKey: string | null;
  geminiKey: string | null;
  grokKey: string | null;
  defaultProvider: "claude" | "gemini" | "grok";
  hasClaudeKey: boolean;
  hasGeminiKey: boolean;
  hasGrokKey: boolean;
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
