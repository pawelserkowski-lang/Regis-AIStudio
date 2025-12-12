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
  {
    id: "claude-sonnet-4-20250514",
    name: "Claude Sonnet 4",
    provider: "claude",
    description: "Najnowszy model Claude",
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

export interface FileSystemHandle {
  kind: "file" | "directory";
  name: string;
}
