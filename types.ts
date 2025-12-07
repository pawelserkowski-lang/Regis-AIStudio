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

export interface Message {
  id: string;
  text: string;
  sender: Sender;
  timestamp: number;
  isStreaming?: boolean;
  attachments?: Attachment[];
  groundingMetadata?: any;
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
  STATS = 'stats'
}

export interface ChartData {
  name: string;
  value: number;
}