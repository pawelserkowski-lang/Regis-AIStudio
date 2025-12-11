import { GoogleGenerativeAI } from "@google/generative-ai";
import { DetectionBox, AIModelId } from "../types";

// --- KONFIGURACJA SIECIOWA ---
// Omijamy proxy Vite, uderzamy bezpośrednio do Pythona
const API_URL = "http://127.0.0.1:8000"; 
// -----------------------------

export interface LogEntry { id: string; timestamp: number; uptime: string; module: string; action: string; status: string; data?: any; }

let logHistory: LogEntry[] = [];
try {
    const saved = localStorage.getItem('regis_system_logs');
    logHistory = saved ? JSON.parse(saved) : [];
} catch { logHistory = []; }

const SYSTEM_START = Date.now();

export const systemLog = (module: string, action: string, status: string, data?: any) => {
  const entry: LogEntry = { 
      id: Math.random().toString(), 
      timestamp: Date.now(), 
      uptime: ((Date.now()-SYSTEM_START)/1000).toFixed(3), 
      module, action, status, data 
  };
  
  logHistory.unshift(entry);
  if(logHistory.length > 200) logHistory.pop();
  try { localStorage.setItem('regis_system_logs', JSON.stringify(logHistory)); } catch {}
  return entry;
};

export const getLogs = () => logHistory;

export const executeSystemAction = async (action: string, payload: any = {}) => {
    systemLog('SYS', action, 'REQ', payload);
    try {
        // UŻYWAMY PEŁNEGO ADRESU URL
        const res = await fetch(`${API_URL}/api`, { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action, ...payload }) 
        });
        const data = await res.json();
        systemLog('SYS', action, data.error ? 'ERR' : 'RES', data);
        if (data.error) throw new Error(data.error);
        return data;
    } catch (e: any) {
        systemLog('SYS', action, 'FAIL', e.message);
        console.error("System Action Failed:", e);
        throw e;
    }
};

let ai: GoogleGenerativeAI | null = null;
let chatSession: any = null;

const getAI = async () => {
    if(!ai) {
        // Pobieramy konfigurację z backendu
        try {
            const res = await fetch(`${API_URL}/api/config`);
            const { envKey } = await res.json();
            const key = envKey || (import.meta as any).env.VITE_API_KEY;
            if(!key) throw new Error("No API Key");
            ai = new GoogleGenerativeAI(key);
        } catch (e) {
            console.error("Failed to fetch config from backend", e);
            throw e;
        }
    }
    return ai;
};

let currentModel: AIModelId = 'gemini-3-pro-preview';

export const setChatModel = (id: AIModelId) => { currentModel = id; chatSession = null; };
export const getChatModel = () => currentModel;

export const sendMessageStream = async (msg: string, atts: any[], onChunk: (t: string, g?: any) => void) => {
    const client = await getAI();
    if(!chatSession) {
        const model = client.getGenerativeModel({ 
            model: currentModel,
            systemInstruction: `You are Regis, an advanced AI system operating in 'God Mode'. 
            SYSTEM CONTEXT: You are running on a **WINDOWS** host environment.
            You have direct access to the local file system via the /cmd command (local Python backend).
            CRITICAL RULES:
            1. Think in Windows: Use 'dir', 'type', 'del', 'copy'.
            2. Do NOT Simulate: You are a system interface.
            3. Formatting: End every response with a JSON block of 6 follow-up suggestions in the format: \`\`\`json:SUGGESTIONS ["cmd 1", "cmd 2"...]\`\`\`.
            `
        });
        chatSession = model.startChat();
    }
    const parts: any[] = [{ text: msg }];
    atts.forEach(a => {
        parts.push({ inlineData: { mimeType: a.mimeType, data: a.data } });
    });

    const result = await chatSession.sendMessageStream(parts);
    for await (const chunk of result.stream) {
        const text = chunk.text();
        if(text) onChunk(text);
    }
};

// Placeholder functions needed for compilation
export const autoCurateRegistry = async (text: string) => null;
export const generateTitleForRegistry = async (content: string) => "Title";
export const improvePrompt = async (text: string) => text;
export const generateImage = async () => "";
export const generateVideo = async () => "";
export const generateSpeech = async () => "";
export const transcribeAudio = async () => "";
export const connectLiveSession = async () => ({ close: () => {} });
export const detectUIElements = async () => [];
