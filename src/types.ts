export enum Sender { USER = 'user', BOT = 'bot' }
export interface Attachment { type: 'image' | 'video' | 'audio'; url: string; mimeType: string; data?: string; }
export interface DetectionBox { label: string; confidence?: number; box_2d: [number, number, number, number]; }
export interface Message { id: string; text: string; sender: Sender; timestamp: number; isStreaming?: boolean; attachments?: Attachment[]; groundingMetadata?: any; visualAnalysis?: DetectionBox[]; }
export interface RegistryItem { id: string; title: string; content: string; category: string; dateAdded: number; tags: string[]; }
export interface ChatSession { id: string; date: number; title: string; messages: Message[]; }
export enum View { CHAT = 'chat', HISTORY = 'history', REGISTRY = 'registry', LIVE = 'live', LOGS = 'logs' }
export type AIModelId = 'gemini-3-pro-preview' | 'gemini-2.5-flash';
export interface FileSystemHandle { kind: 'file' | 'directory'; name: string; }