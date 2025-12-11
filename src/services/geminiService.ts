import { GoogleGenerativeAI } from "@google/generative-ai";
import { DetectionBox, AIModelId } from "../types";

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
    // 1. Log Request
    systemLog('SYS', action, 'REQ', payload);
    
    try {
        // 2. Fetch
        const res = await fetch('/api', { method: 'POST', body: JSON.stringify({ action, ...payload }) });
        
        // 3. Parse
        const data = await res.json();
        
        // 4. Log Response
        systemLog('SYS', action, data.error ? 'ERR' : 'RES', data);
        
        if (data.error) throw new Error(data.error);
        return data;
    } catch (e: any) {
        // 5. Log Error
        systemLog('SYS', action, 'FAIL', e.message);
        console.error("System Action Failed:", e);
        throw e;
    }
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
        const model = client.getGenerativeModel({ 
            model: currentModel,
            systemInstruction: `You are Regis, an advanced AI system operating in 'God Mode'. 
            
            SYSTEM CONTEXT:
            - You are running on a **WINDOWS** host environment.
            - You have direct access to the local file system via the /cmd command (local Python backend).
            
            CRITICAL RULES:
            1. **Think in Windows:** When asked to execute system commands, ALWAYS generate Windows CMD compatible commands (e.g., 'dir' instead of 'ls', 'type' instead of 'cat', 'python' instead of 'python3', '&' instead of ';').
            2. **Do NOT Simulate:** You are not a chatbot; you are a system interface. Assume your commands WILL be executed immediately.
            3. **Formatting:** End every response with a JSON block of 6 follow-up suggestions in the format: \`\`\`json:SUGGESTIONS ["cmd 1", "cmd 2"...]\`\`\`.
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

export const autoCurateRegistry = async (text: string) => {
    try {
        const client = await getAI();
        const model = client.getGenerativeModel({ model: "gemini-2.5-flash" });
        const cleanText = text.replace(/```json:SUGGESTIONS[\s\S]*?```/, "");
        const prompt = `Analyze response for Knowledge Base. YES->JSON {title,content,tags}, NO->NULL. Text: """${cleanText.substring(0, 5000)}"""`;
        const result = await model.generateContent(prompt);
        const txt = result.response.text().trim();
        if (txt.includes("NULL") || !txt.startsWith("{")) return null;
        return JSON.parse(txt.replace(/```json/g, "").replace(/```/g, ""));
    } catch (e) { return null; }
};

export const generateTitleForRegistry = async (content: string) => {
    const client = await getAI();
    const model = client.getGenerativeModel({ model: "gemini-2.5-flash" });
    const result = await model.generateContent(`Title for: ${content.substring(0,100)}`);
    return result.response.text();
};

export const improvePrompt = async (text: string) => {
    const client = await getAI();
    const model = client.getGenerativeModel({ model: "gemini-2.5-flash" });
    const prompt = `Rewrite prompt to be better. Return ONLY text.\nOriginal: "${text}"`;
    const result = await model.generateContent(prompt);
    return result.response.text().trim();
};

export const generateImage = async () => "https://placehold.co/600x400";
export const generateVideo = async () => "https://placehold.co/video.mp4";
export const generateSpeech = async () => "";
export const transcribeAudio = async () => "Audio Transcribed";
export const connectLiveSession = async () => ({ close: () => {} });
export const detectUIElements = async () => [{ label: "Btn", box_2d: [10,10,20,20] }];