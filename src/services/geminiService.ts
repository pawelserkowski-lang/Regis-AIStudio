import { GoogleGenerativeAI } from "@google/generative-ai";
import { DetectionBox, AIModelId } from "../types";

export interface LogEntry { id: string; timestamp: number; uptime: string; module: string; action: string; status: string; data?: any; }
const logHistory: LogEntry[] = [];
const SYSTEM_START = Date.now();

export const systemLog = (module: string, action: string, status: string, data?: any) => {
  const entry: LogEntry = { id: Math.random().toString(), timestamp: Date.now(), uptime: ((Date.now()-SYSTEM_START)/1000).toFixed(3), module, action, status, data };
  logHistory.unshift(entry);
  if(logHistory.length>500) logHistory.pop();
  return entry;
};
export const getLogs = () => logHistory;

export const executeSystemAction = async (action: string, payload: any = {}) => {
    systemLog('SYS', action, 'REQ');
    const res = await fetch('/api', { method: 'POST', body: JSON.stringify({ action, ...payload }) });
    return res.json();
};

let ai: GoogleGenerativeAI | null = null;
let chatSession: any = null;

const getAI = async () => {
    if(!ai) {
        const res = await fetch('/api/config');
        const { envKey } = await res.json();
        const key = envKey || (import.meta as any).env.VITE_API_KEY;
        if(!key) throw new Error("No API Key");
        ai = new GoogleGenerativeAI(key);
    }
    return ai;
};

let currentModel: AIModelId = 'gemini-3-pro-preview';

export const setChatModel = (id: AIModelId) => { currentModel = id; chatSession = null; };
export const getChatModel = () => currentModel;

export const sendMessageStream = async (msg: string, atts: any[], onChunk: (t: string, g?: any) => void) => {
    const client = await getAI();
    if(!chatSession) {
        const model = client.getGenerativeModel({ model: currentModel });
        chatSession = model.startChat();
    }
    const result = await chatSession.sendMessageStream(msg);
    for await (const chunk of result.stream) {
        const text = chunk.text();
        if(text) onChunk(text);
    }
};

export const generateTitleForRegistry = async (content: string) => {
    const client = await getAI();
    const model = client.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(`Title for: ${content.substring(0,100)}`);
    return result.response.text();
};

export const generateImage = async () => "https://placehold.co/600x400";
export const generateVideo = async () => "https://placehold.co/video.mp4";
export const generateSpeech = async () => "";
export const transcribeAudio = async () => "Audio Transcribed";
export const connectLiveSession = async () => ({ close: () => {} });
export const detectUIElements = async () => [{ label: "Btn", box_2d: [10,10,20,20] }];