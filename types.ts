
export enum Sender {
  USER = 'user',
  BOT = 'bot'
}

export interface Attachment {
  type: 'image' | 'video' | 'audio';
  url: string;
  mimeType: string;
  data?: string; // base64
}

export interface DetectionBox {
  label: string;
  confidence?: number;
  box_2d: [number, number, number, number]; // [ymin, xmin, ymax, xmax] (0-1000)
}

export interface Message {
  id: string;
  text: string;
  sender: Sender;
  timestamp: number;
  isStreaming?: boolean;
  attachments?: Attachment[];
  groundingMetadata?: any;
  visualAnalysis?: DetectionBox[]; // New field for GUI Analysis
}

export interface RegistryItem {
  id: string;
  title: string;
  content: string;
  category: string;
  dateAdded: number;
  tags: string[];
}

export enum View {
  CHAT = 'chat',
  REGISTRY = 'registry',
  BUILD = 'build',
  LOGS = 'logs'
}

export type AIModelId = 'gemini-3-pro-preview' | 'gemini-2.5-flash';