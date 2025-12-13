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
  SNIPPETS = "snippets",
  LIVE = "live",
  LOGS = "logs",
  PERFORMANCE = "performance",
  TISSAIA = "tissaia",
}

// === AI PROVIDER TYPES ===

export type AIProvider = "claude" | "gemini" | "grok";

export type GeminiModelId =
  | "gemini-2.5-pro"
  | "gemini-2.5-flash"
  | "gemini-2.0-flash"
  | "gemini-2.0-flash-lite"
  | string; // Allow dynamic models

export type ClaudeModelId =
  | "claude-sonnet-4-20250514"
  | "claude-3-5-sonnet-20241022"
  | "claude-3-opus-20240229"
  | "claude-3-haiku-20240307"
  | string; // Allow dynamic models

export type GrokModelId =
  | "grok-3"
  | "grok-3-fast"
  | "grok-3-mini"
  | "grok-3-mini-fast"
  | "grok-2"
  | "grok-2-mini"
  | string; // Allow dynamic models

export type AIModelId = GeminiModelId | ClaudeModelId | GrokModelId;

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
    description: "Latest Claude model - fast and intelligent",
    maxTokens: 8192,
    supportsVision: true,
    supportsStreaming: true,
  },
  {
    id: "claude-3-5-sonnet-20241022",
    name: "Claude 3.5 Sonnet",
    provider: "claude",
    description: "Great balance between speed and quality",
    maxTokens: 8192,
    supportsVision: true,
    supportsStreaming: true,
  },
  {
    id: "claude-3-opus-20240229",
    name: "Claude 3 Opus",
    provider: "claude",
    description: "Most powerful - for complex tasks",
    maxTokens: 4096,
    supportsVision: true,
    supportsStreaming: true,
  },
  {
    id: "claude-3-haiku-20240307",
    name: "Claude 3 Haiku",
    provider: "claude",
    description: "Fastest - for simple tasks",
    maxTokens: 4096,
    supportsVision: true,
    supportsStreaming: true,
  },
  // Gemini Models 🔵
  {
    id: "gemini-2.5-pro",
    name: "Gemini 2.5 Pro",
    provider: "gemini",
    description: "Google's most capable model",
    maxTokens: 8192,
    supportsVision: true,
    supportsStreaming: true,
  },
  {
    id: "gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
    provider: "gemini",
    description: "Fast thinking model with great performance",
    maxTokens: 8192,
    supportsVision: true,
    supportsStreaming: true,
  },
  {
    id: "gemini-2.0-flash",
    name: "Gemini 2.0 Flash",
    provider: "gemini",
    description: "Fast multimodal model",
    maxTokens: 8192,
    supportsVision: true,
    supportsStreaming: true,
  },
  {
    id: "gemini-2.0-flash-lite",
    name: "Gemini 2.0 Flash Lite",
    provider: "gemini",
    description: "Lightweight and cost-efficient",
    maxTokens: 8192,
    supportsVision: true,
    supportsStreaming: true,
  },
  // Grok Models ⚡
  {
    id: "grok-3",
    name: "Grok 3",
    provider: "grok",
    description: "xAI's flagship model - most capable",
    maxTokens: 131072,
    supportsVision: true,
    supportsStreaming: true,
  },
  {
    id: "grok-3-fast",
    name: "Grok 3 Fast",
    provider: "grok",
    description: "Faster version of Grok 3",
    maxTokens: 131072,
    supportsVision: true,
    supportsStreaming: true,
  },
  {
    id: "grok-3-mini",
    name: "Grok 3 Mini",
    provider: "grok",
    description: "Lightweight thinking model",
    maxTokens: 131072,
    supportsVision: false,
    supportsStreaming: true,
  },
  {
    id: "grok-3-mini-fast",
    name: "Grok 3 Mini Fast",
    provider: "grok",
    description: "Fastest Grok model",
    maxTokens: 131072,
    supportsVision: false,
    supportsStreaming: true,
  },
];

// Utility Functions
export const getModelsByProvider = (provider: AIProvider, models?: AIModelConfig[]): AIModelConfig[] => {
  const modelList = models || AVAILABLE_MODELS;
  return modelList.filter((m) => m.provider === provider);
};

export const getModelConfig = (modelId: AIModelId | string, models?: AIModelConfig[]): AIModelConfig | undefined => {
  const modelList = models || AVAILABLE_MODELS;
  return modelList.find((m) => m.id === modelId);
};

// Interface for API-returned model info
export interface APIModelInfo {
  id: string;
  name: string;
  type?: string;
  created_at?: string;
}

// Convert API model to AIModelConfig with sensible defaults
export const apiModelToConfig = (apiModel: APIModelInfo, provider: AIProvider = 'claude'): AIModelConfig => {
  const id = apiModel.id;

  // Determine capabilities based on model name patterns
  const isOpus = id.includes('opus');
  const isHaiku = id.includes('haiku');
  const isGrokMini = id.includes('grok') && id.includes('mini');
  // Note: isGeminiLite reserved for future use when lite models need special handling

  // Sensible defaults based on model type
  let maxTokens = 8192;
  if (isOpus) maxTokens = 4096;
  if (isHaiku) maxTokens = 4096;
  if (provider === 'grok') maxTokens = 131072;

  // Vision support
  let supportsVision = true;
  if (isGrokMini) supportsVision = false;

  return {
    id: id as AIModelId,
    name: apiModel.name || id,
    provider,
    description: getModelDescription(id, provider),
    maxTokens,
    supportsVision,
    supportsStreaming: true,
  };
};

// Generate description based on model ID
const getModelDescription = (modelId: string, provider: AIProvider = 'claude'): string => {
  // Claude models
  if (modelId.includes('opus')) return 'Most powerful - for complex tasks';
  if (modelId.includes('sonnet-4')) return 'Latest Claude model - fast and intelligent';
  if (modelId.includes('sonnet')) return 'Great balance between speed and quality';
  if (modelId.includes('haiku')) return 'Fastest - for simple tasks';

  // Gemini models
  if (modelId.includes('gemini-2.5-pro')) return "Google's most capable model";
  if (modelId.includes('gemini-2.5-flash')) return 'Fast thinking model with great performance';
  if (modelId.includes('flash-lite')) return 'Lightweight and cost-efficient';
  if (modelId.includes('flash')) return 'Fast multimodal model';
  if (modelId.includes('gemini')) return 'Google Gemini model';

  // Grok models
  if (modelId.includes('grok-3-mini-fast')) return 'Fastest Grok model';
  if (modelId.includes('grok-3-mini')) return 'Lightweight thinking model';
  if (modelId.includes('grok-3-fast')) return 'Faster version of Grok 3';
  if (modelId.includes('grok-3')) return "xAI's flagship model - most capable";
  if (modelId.includes('grok-2-mini')) return 'Compact Grok 2 model';
  if (modelId.includes('grok-2')) return 'xAI Grok 2 model';
  if (modelId.includes('grok')) return 'xAI Grok model';

  // Default
  if (provider === 'gemini') return 'Google Gemini model';
  if (provider === 'grok') return 'xAI Grok model';
  return 'Claude AI model';
};

// Merge API models with fallback models (API models take priority)
export const mergeModels = (
  claudeApiModels: APIModelInfo[] = [],
  geminiApiModels: APIModelInfo[] = [],
  grokApiModels: APIModelInfo[] = []
): AIModelConfig[] => {
  const result: AIModelConfig[] = [];

  // Claude models: Use API if available, fallback to hardcoded
  if (claudeApiModels && claudeApiModels.length > 0) {
    const convertedClaude = claudeApiModels
      .filter(m => m.id && typeof m.id === 'string')
      .map(m => apiModelToConfig(m, 'claude'));
    result.push(...convertedClaude);
  } else {
    result.push(...AVAILABLE_MODELS.filter(m => m.provider === 'claude'));
  }

  // Gemini models: Use API if available, fallback to hardcoded
  if (geminiApiModels && geminiApiModels.length > 0) {
    const convertedGemini = geminiApiModels
      .filter(m => m.id && typeof m.id === 'string')
      .map(m => apiModelToConfig(m, 'gemini'));
    result.push(...convertedGemini);
  } else {
    result.push(...AVAILABLE_MODELS.filter(m => m.provider === 'gemini'));
  }

  // Grok models: Use API if available, fallback to hardcoded
  if (grokApiModels && grokApiModels.length > 0) {
    const convertedGrok = grokApiModels
      .filter(m => m.id && typeof m.id === 'string')
      .map(m => apiModelToConfig(m, 'grok'));
    result.push(...convertedGrok);
  } else {
    result.push(...AVAILABLE_MODELS.filter(m => m.provider === 'grok'));
  }

  return result;
};

// Legacy merge function for backward compatibility
export const mergeModelsLegacy = (apiModels: APIModelInfo[]): AIModelConfig[] => {
  return mergeModels(apiModels, [], []);
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
  grokKey?: string;
  envKey?: string;
  defaultProvider: AIProvider;
  hasClaudeKey: boolean;
  hasGeminiKey: boolean;
  hasGrokKey: boolean;
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
