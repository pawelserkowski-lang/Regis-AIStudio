// Regis AI Studio - Type Definitions
// ===================================

export enum Sender {
  USER = "user",
  BOT = "bot",
}

export interface Attachment {
  type: "image" | "video" | "audio";
  url: string;
  mimeType: string;
  data?: string;
}

export interface DetectionBox {
  label: string;
  confidence?: number;
  box_2d: [number, number, number, number];
}

export interface Message {
  id: string;
  text: string;
  sender: Sender;
  timestamp: number;
  isStreaming?: boolean;
  attachments?: Attachment[];
  groundingMetadata?: any;
  visualAnalysis?: DetectionBox[];
  model?: string;
}

export interface RegistryItem {
  id: string;
  title: string;
  content: string;
  category: string;
  dateAdded: number;
  tags: string[];
}

export interface ChatSession {
  id: string;
  date: number;
  title: string;
  messages: Message[];
  provider?: AIProvider;
}

export enum View {
  CHAT = "chat",
  HISTORY = "history",
  REGISTRY = "registry",
  LIVE = "live",
  LOGS = "logs",
  PERFORMANCE = "performance",
}

// === AI PROVIDER TYPES ===

export type AIProvider = "claude" | "gemini";

export type GeminiModelId =
  | "gemini-3-pro-preview"
  | "gemini-2.5-flash"
  | "gemini-2.0-flash-exp";

export type ClaudeModelId =
  | "claude-sonnet-4-20250514"
  | "claude-3-5-sonnet-20241022"
  | "claude-3-opus-20240229"
  | "claude-3-haiku-20240307";

export type AIModelId = GeminiModelId | ClaudeModelId;

export interface AIModelConfig {
  id: AIModelId;
  name: string;
  provider: AIProvider;
  description: string;
  maxTokens: number;
  supportsVision: boolean;
  supportsStreaming: boolean;
}

export const AVAILABLE_MODELS: AIModelConfig[] = [
  // Claude Models 💜
  {
    id: "claude-sonnet-4-20250514",
    name: "Claude Sonnet 4",
    provider: "claude",
    description: "Najnowszy model Claude - szybki i inteligentny",
    maxTokens: 8192,
    supportsVision: true,
    supportsStreaming: true,
  },
  {
    id: "claude-3-5-sonnet-20241022",
    name: "Claude 3.5 Sonnet",
    provider: "claude",
    description: "Świetny balans między szybkością a jakością",
    maxTokens: 8192,
    supportsVision: true,
    supportsStreaming: true,
  },
  {
    id: "claude-3-opus-20240229",
    name: "Claude 3 Opus",
    provider: "claude",
    description: "Najpotężniejszy model - do złożonych zadań",
    maxTokens: 4096,
    supportsVision: true,
    supportsStreaming: true,
  },
  {
    id: "claude-3-haiku-20240307",
    name: "Claude 3 Haiku",
    provider: "claude",
    description: "Najszybszy - do prostych zadań",
    maxTokens: 4096,
    supportsVision: true,
    supportsStreaming: true,
  },
  // Gemini Models
  {
    id: "gemini-3-pro-preview",
    name: "Gemini 3 Pro",
    provider: "gemini",
    description: "Google's flagship model",
    maxTokens: 8192,
    supportsVision: true,
    supportsStreaming: true,
  },
  {
    id: "gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
    provider: "gemini",
    description: "Fast Gemini model",
    maxTokens: 8192,
    supportsVision: true,
    supportsStreaming: true,
  },
];

// Utility Functions
export const getModelsByProvider = (provider: AIProvider): AIModelConfig[] => {
  return AVAILABLE_MODELS.filter((m) => m.provider === provider);
};

export const getModelConfig = (modelId: AIModelId): AIModelConfig | undefined => {
  return AVAILABLE_MODELS.find((m) => m.id === modelId);
};

// File System Types (for file browser)
export interface FileSystemHandle {
  kind: "file" | "directory";
  name: string;
}

export interface FileEntry {
  name: string;
  is_dir: boolean;
  is_parent?: boolean;
  size?: number;
}

// API Response Types
export interface APIConfigResponse {
  claudeKey?: string;
  geminiKey?: string;
  envKey?: string;
  defaultProvider: AIProvider;
  hasClaudeKey: boolean;
  hasGeminiKey: boolean;
}

export interface CommandResponse {
  stdout: string;
  stderr: string;
  code: number;
  cmd_executed?: string;
}

export interface ClaudeChatResponse {
  content?: string;
  text?: string;
  error?: string;
  model?: string;
  usage?: {
    input_tokens: number;
    output_tokens: number;
  };
}
