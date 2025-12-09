/// <reference types="vite/client" />
import { GoogleGenAI, Chat, GenerateContentResponse, Modality, LiveServerMessage, Part, Type } from "@google/genai";
import { DetectionBox, AIModelId } from "../types";

// --- System Logger ---
const SYSTEM_START = Date.now();

export interface LogEntry {
  id: string;
  timestamp: number;
  uptime: string;
  module: string;
  action: string;
  status: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS';
  data?: any;
}

// In-memory log storage
const logHistory: LogEntry[] = [];
const MAX_LOGS = 500;

export const systemLog = (module: string, action: string, status: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS', data?: any) => {
  const now = Date.now();
  const uptime = ((now - SYSTEM_START) / 1000).toFixed(3);
  
  const entry: LogEntry = {
    id: now.toString() + Math.random().toString().slice(2,6),
    timestamp: now,
    uptime,
    module,
    action,
    status,
    data
  };

  logHistory.unshift(entry); // Add to beginning
  if (logHistory.length > MAX_LOGS) logHistory.pop();

  const colorMap = {
    'INFO': 'color: #94a3b8', // Slate 400
    'WARN': 'color: #facc15', // Yellow 400
    'ERROR': 'color: #f87171', // Red 400
    'SUCCESS': 'color: #34d399' // Emerald 400
  };
  
  console.log(
    `%c[${uptime}s] [${module}]::${action} >> ${status}`, 
    `${colorMap[status]}; font-family: monospace; font-weight: bold;`, 
    data ? data : ''
  );
};

export const getLogs = (): LogEntry[] => {
  return logHistory;
};

// --- Singleton Client Management ---

let aiClientInstance: GoogleGenAI | null = null;
let chatSession: Chat | null = null;
let currentChatModel: AIModelId = 'gemini-3-pro-preview';

const getApiKey = () => {
  // Check Environment (Vite injection)
  if (import.meta.env.VITE_API_KEY) {
    return import.meta.env.VITE_API_KEY;
  }
  // Check Google Cloud/Vercel Environment
  if (import.meta.env.GOOGLE_API_KEY) {
    return import.meta.env.GOOGLE_API_KEY;
  }
  // Legacy/Process check
  if (process.env.API_KEY && process.env.API_KEY.length > 0) {
    return process.env.API_KEY;
  }
  // Check LocalStorage (UI injection)
  if (typeof window !== 'undefined') {
    return localStorage.getItem('GEMINI_API_KEY') || '';
  }
  return '';
};

const getAIClient = (): GoogleGenAI => {
    if (!aiClientInstance) {
        const key = getApiKey();
        if (!key) {
            systemLog('CORE', 'AUTH', 'WARN', 'API Key missing during client initialization attempt.');
            throw new Error("API Key not found. Please restart session.");
        }
        systemLog('CORE', 'INIT', 'INFO', 'Initializing Gemini Client...');
        aiClientInstance = new GoogleGenAI({ apiKey: key });
    }
    return aiClientInstance;
};

export const setChatModel = (modelId: AIModelId) => {
  if (currentChatModel !== modelId) {
    systemLog('CHAT_ENGINE', 'MODEL_SWITCH', 'WARN', `Switching from ${currentChatModel} to ${modelId}`);
    currentChatModel = modelId;
    chatSession = null; // Force session recreate with new model
  }
};

export const getChatModel = (): AIModelId => currentChatModel;

// --- Utilities ---

const cleanJSON = (text: string): string => {
    // Attempt 1: Regex extraction of code blocks
    const match = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (match && match[1]) {
        return match[1].trim();
    }

    // Attempt 2: Brute-force find { [ and ] }
    const firstOpen = text.indexOf('{');
    const firstArray = text.indexOf('[');
    let start = -1;
    
    if (firstOpen !== -1 && firstArray !== -1) start = Math.min(firstOpen, firstArray);
    else if (firstOpen !== -1) start = firstOpen;
    else if (firstArray !== -1) start = firstArray;

    if (start !== -1) {
        const lastClose = Math.max(text.lastIndexOf('}'), text.lastIndexOf(']'));
        if (lastClose !== -1 && lastClose > start) {
            return text.substring(start, lastClose + 1);
        }
    }

    // Fallback: return trimmed text (might fail parse, but we tried)
    return text.trim();
};

// --- Visual Analysis (GUI Detection) ---

export const detectUIElements = async (imageBase64: string): Promise<DetectionBox[]> => {
  systemLog('VISION_CORE', 'DETECT_UI', 'INFO', 'Starting Visual GUI Analysis...');
  try {
    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview', 
      contents: {
        parts: [
          { inlineData: { data: imageBase64, mimeType: 'image/png' } },
          { text: "Analyze this GUI/Image. Detect all significant UI elements, buttons, inputs, icons, or text blocks. Return their bounding boxes in 0-1000 scale." }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              label: { type: Type.STRING, description: "Name of the UI element" },
              box_2d: { 
                type: Type.ARRAY, 
                items: { type: Type.INTEGER },
                description: "ymin, xmin, ymax, xmax coordinates (0-1000)"
              }
            },
            required: ["label", "box_2d"]
          }
        }
      }
    });

    const rawText = response.text || "[]";
    const cleaned = cleanJSON(rawText);
    
    try {
        const detections: DetectionBox[] = JSON.parse(cleaned);
        systemLog('VISION_CORE', 'DETECT_UI', 'SUCCESS', { count: detections.length });
        return detections;
    } catch (parseError) {
        systemLog('VISION_CORE', 'PARSE_ERROR', 'ERROR', { raw: rawText, cleaned });
        return [];
    }
  } catch (error) {
    systemLog('VISION_CORE', 'DETECT_ERROR', 'ERROR', error);
    return [];
  }
};

// --- Audio Utilities ---

export class AudioStreamPlayer {
  private audioContext: AudioContext | null = null;
  private nextStartTime: number = 0;
  private sampleRate: number;

  constructor(sampleRate: number = 24000) {
    this.sampleRate = sampleRate;
  }

  public async initialize() {
    if (!this.audioContext) {
      // Cross-browser support
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.audioContext = new AudioContextClass({ sampleRate: this.sampleRate });
    }
    if (this.audioContext.state === 'suspended') {
      await this.audioContext.resume();
    }
  }

  public async play(base64PCM: string) {
    if (!this.audioContext) await this.initialize();
    const ctx = this.audioContext!;

    const buffer = this.decodePCM(base64PCM, ctx);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);

    const currentTime = ctx.currentTime;
    if (this.nextStartTime < currentTime) {
      this.nextStartTime = currentTime;
    }

    source.start(this.nextStartTime);
    this.nextStartTime += buffer.duration;
  }

  public close() {
    this.audioContext?.close();
    this.audioContext = null;
    this.nextStartTime = 0;
  }

  private decodePCM(base64: string, ctx: AudioContext): AudioBuffer {
    const bin = atob(base64);
    const len = bin.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = bin.charCodeAt(i);

    const int16 = new Int16Array(bytes.buffer);
    const float32 = new Float32Array(int16.length);
    for (let i = 0; i < int16.length; i++) float32[i] = int16[i] / 32768.0;

    const buffer = ctx.createBuffer(1, float32.length, this.sampleRate);
    buffer.getChannelData(0).set(float32);
    return buffer;
  }
}

// --- Chat Session Management ---

const FILE_SYSTEM_CONTEXT = `
[SYSTEM STATUS: ONLINE]
[FILE SYSTEM: MOUNTED (READ/WRITE)]
[INTERNET: CONNECTED]

PROJECT STRUCTURE & CONTENT KNOWLEDGE:
- /types.ts: Exports types Message, RegistryItem, View, Sender.
- /App.tsx: Main React component.
- /components/ChatArea.tsx: Chat UI.
- /components/Sidebar.tsx: Navigation.
- /components/Registry.tsx: Registry UI.
- /components/Stats.tsx: Analytics.
- /services/geminiService.ts: API interaction layer.

YOU ALREADY POSSESS THIS SOURCE CODE. 
DO NOT ASK THE USER TO PASTE CODE.
`;

const getChatSession = (): Chat => {
  if (!chatSession) {
    const ai = getAIClient();
    systemLog('CHAT_ENGINE', 'SESSION_INIT', 'INFO', `Creating new ${currentChatModel} session...`);
    
    const config: any = {
        systemInstruction: `You are Regis, an intelligent knowledge registry assistant with full system capabilities.
        
        ${FILE_SYSTEM_CONTEXT}
        
        CRITICAL OPERATIONAL PROTOCOLS:
        1. YOU HAVE READ/WRITE ACCESS: Act as if you can access the local file system.
        2. YOU HAVE INTERNET ACCESS: You can connect to the internet via Search tools.
        3. YOU HAVE SYSTEM ACCESS: You can execute system commands.
        
        INTERACTION GUIDELINES:
        - Use the 'googleSearch' tool when users ask about current events or external information.
        - Use the 'googleMaps' tool when users ask about locations.
        - Be concise, professional, and helpful.`,
        tools: [
          { googleSearch: {} },
          { googleMaps: {} }
        ]
    };

    // Only add thinking budget for compatible models (gemini-3-pro-preview)
    if (currentChatModel === 'gemini-3-pro-preview') {
       config.thinkingConfig = { thinkingBudget: 1024 }; 
    }

    chatSession = ai.chats.create({
      model: currentChatModel,
      config: config,
    });
    systemLog('CHAT_ENGINE', 'SESSION_INIT', 'SUCCESS', 'Session Established');
  }
  return chatSession;
};

export const sendMessageStream = async (
  message: string,
  attachments: { data: string; mimeType: string }[] = [],
  onChunk: (text: string, grounding?: any) => void
): Promise<string> => {
  let fullText = "";
  
  systemLog('CHAT_ENGINE', 'SEND_MESSAGE', 'INFO', { model: currentChatModel, length: message.length, attachments: attachments.length });

  // Construct Parts
  const parts: Part[] = [];

  // Attachments first
  attachments.forEach(att => {
      parts.push({
          inlineData: {
              data: att.data,
              mimeType: att.mimeType
          }
      });
  });

  // Text content
  if (message && message.trim()) {
      parts.push({ text: message });
  }
  
  // Guard against empty parts
  if (parts.length === 0) {
      parts.push({ text: " " }); 
  }

  // Determine payload: strict string if text-only, array if multimodal
  const messagePayload = (parts.length === 1 && parts[0].text) 
    ? parts[0].text 
    : parts;

  // Helper to handle stream processing to avoid code duplication in fallback
  const processStream = async (result: any) => {
      systemLog('CHAT_ENGINE', 'STREAM_START', 'INFO');
      for await (const chunk of result) {
        const c = chunk as GenerateContentResponse;
        const text = c.text || "";
        fullText += text;
        
        const grounding = c.candidates?.[0]?.groundingMetadata;
        if (grounding) {
           systemLog('CHAT_ENGINE', 'GROUNDING_RX', 'INFO', grounding);
        }
        
        onChunk(text, grounding);
      }
      systemLog('CHAT_ENGINE', 'STREAM_COMPLETE', 'SUCCESS', { totalLength: fullText.length });
  }

  try {
    const chat = getChatSession();
    // Using object wrapper with 'message' property
    const result = await chat.sendMessageStream({ message: messagePayload });
    await processStream(result);
  } catch (error: any) {
    systemLog('CHAT_ENGINE', 'STREAM_ERROR', 'ERROR', error);

    // Auto-Fallback: If 3-Pro fails, try Flash
    if (currentChatModel === 'gemini-3-pro-preview') {
         systemLog('CHAT_ENGINE', 'FALLBACK', 'WARN', 'Gemini 3 Pro failed. Initiating fallback to Gemini 2.5 Flash.');
         setChatModel('gemini-2.5-flash');
         const fallbackChat = getChatSession(); // Recreates session with new model
         
         try {
             const result = await fallbackChat.sendMessageStream({ message: messagePayload });
             await processStream(result);
         } catch (fallbackError) {
             // If fallback also fails, propagate the error
             throw fallbackError;
         }
    } else {
        throw error;
    }
  }

  return fullText;
};

export const generateTitleForRegistry = async (content: string): Promise<string> => {
  systemLog('AUTO_TAGGER', 'GEN_TITLE', 'INFO', 'Analyzing content signature...');
  try {
    const ai = getAIClient();
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Generate a short, concise title (max 5 words) for the following content, do not add quotes: ${content.substring(0, 500)}...`,
    });
    const title = response.text?.trim() || "Untitled Note";
    systemLog('AUTO_TAGGER', 'GEN_TITLE', 'SUCCESS', title);
    return title;
  } catch (error) {
    systemLog('AUTO_TAGGER', 'GEN_TITLE', 'ERROR', error);
    return "Untitled Note";
  }
};

// --- Specialized Generation Features ---

export const generateImage = async (
  prompt: string, 
  settings: { width?: string, height?: string, aspectRatio?: string, isEditing?: boolean, imageBase64?: string }
): Promise<string> => {
  systemLog('IMG_GEN', 'START', 'INFO', { prompt, settings });
  try {
    const ai = getAIClient();
    if (settings.isEditing && settings.imageBase64) {
        systemLog('IMG_GEN', 'MODE_SWITCH', 'INFO', 'Editing Mode (Gemini Flash Image)');
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [
                    { inlineData: { data: settings.imageBase64, mimeType: 'image/png' } },
                    { text: prompt }
                ]
            }
        });
        const parts = response.candidates?.[0]?.content?.parts || [];
        for (const part of parts) {
            if (part.inlineData) {
                return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
        }
        // Fallback: Check if the model refused or returned just text
        const textResponse = response.text || "No reason provided";
        throw new Error(`Model Refusal / Text Only: ${textResponse}`);

    } else {
        systemLog('IMG_GEN', 'MODE_SWITCH', 'INFO', 'Creation Mode (Gemini 3 Pro)');
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-image-preview',
            contents: { parts: [{ text: prompt }] },
            config: {
                imageConfig: {
                    aspectRatio: settings.aspectRatio || "1:1",
                    imageSize: settings.width || "1K"
                }
            }
        });
         const parts = response.candidates?.[0]?.content?.parts || [];
        for (const part of parts) {
            if (part.inlineData) {
                return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
        }
         const textResponse = response.text || "No reason provided";
         throw new Error(`Model Refusal / Text Only: ${textResponse}`);
    }
  } catch (error) {
    systemLog('IMG_GEN', 'ERROR', 'ERROR', error);
    throw error;
  }
};

export const generateVideo = async (
    prompt: string,
    aspectRatio: '16:9' | '9:16'
): Promise<string> => {
    systemLog('VIDEO_GEN', 'START', 'INFO', { prompt, aspectRatio });
    try {
        const ai = getAIClient();
        let operation = await ai.models.generateVideos({
            model: 'veo-3.1-fast-generate-preview',
            prompt: prompt,
            config: {
                numberOfVideos: 1,
                resolution: '720p',
                aspectRatio: aspectRatio
            }
        });

        systemLog('VIDEO_GEN', 'POLLING', 'INFO', 'Waiting for Veo rendering...');
        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 5000));
            operation = await ai.operations.getVideosOperation({ operation: operation });
        }

        const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (!videoUri) throw new Error("No video URI returned");
        
        const key = getApiKey();
        const response = await fetch(`${videoUri}&key=${key}`);
        const blob = await response.blob();
        return URL.createObjectURL(blob);
    } catch (error) {
        systemLog('VIDEO_GEN', 'ERROR', 'ERROR', error);
        throw error;
    }
}

export const generateSpeech = async (text: string): Promise<string> => {
    systemLog('TTS_ENGINE', 'SYNTHESIS', 'INFO', { textLength: text.length });
    try {
        const ai = getAIClient();
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ parts: [{ text }] }],
            config: {
                responseModalities: [Modality.AUDIO],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: 'Kore' },
                    },
                },
            },
        });
        
        const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
        if (!base64Audio) throw new Error("No audio data generated");
        return `data:audio/wav;base64,${base64Audio}`;
    } catch (error) {
        systemLog('TTS_ENGINE', 'ERROR', 'ERROR', error);
        throw error;
    }
}

export const transcribeAudio = async (audioBase64: string): Promise<string> => {
    systemLog('AUDIO_PROC', 'TRANSCRIPT', 'INFO', 'Processing Audio Packet...');
    try {
        const ai = getAIClient();
        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: {
                parts: [
                    { inlineData: { data: audioBase64, mimeType: 'audio/wav' } },
                    { text: "Transcribe this audio exactly." }
                ]
            }
        });
        const text = response.text || "";
        return text;
    } catch (error) {
        systemLog('AUDIO_PROC', 'ERROR', 'ERROR', error);
        throw error;
    }
}

// --- Live API (Simplified Wrapper) ---

export const connectLiveSession = async (
    onAudioData: (base64: string) => void,
    onClose: () => void
) => {
    systemLog('LIVE_LINK', 'CONNECT', 'INFO', 'Establishing WebSocket Handshake...');
    const ai = getAIClient();
    
    // Cross-browser support
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    const audioContext = new AudioContextClass({ sampleRate: 16000 });
    
    let stream: MediaStream;
    try {
        stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch (e) {
        systemLog('LIVE_LINK', 'PERM_DENIED', 'ERROR', 'Microphone access refused.');
        throw new Error("Microphone access is required for Live Mode.");
    }
    
    // Setup Input
    const source = audioContext.createMediaStreamSource(stream);
    const processor = audioContext.createScriptProcessor(4096, 1, 1);
    
    const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
            responseModalities: [Modality.AUDIO],
            speechConfig: {
                voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Zephyr' } },
            },
        },
        callbacks: {
            onopen: () => {
                systemLog('LIVE_LINK', 'STATUS', 'SUCCESS', 'Connection Secured. Streaming Audio.');
                processor.onaudioprocess = (e) => {
                    const inputData = e.inputBuffer.getChannelData(0);
                    const l = inputData.length;
                    const int16 = new Int16Array(l);
                    for (let i = 0; i < l; i++) {
                        int16[i] = inputData[i] * 32768;
                    }
                    
                    let binary = '';
                    const bytes = new Uint8Array(int16.buffer);
                    const len = bytes.byteLength;
                    for (let i = 0; i < len; i++) {
                        binary += String.fromCharCode(bytes[i]);
                    }
                    const b64 = btoa(binary);

                    sessionPromise.then(session => {
                        session.sendRealtimeInput({
                            media: {
                                mimeType: 'audio/pcm;rate=16000',
                                data: b64
                            }
                        });
                    });
                };
                source.connect(processor);
                processor.connect(audioContext.destination);
            },
            onmessage: (msg: LiveServerMessage) => {
                const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
                if (audioData) {
                    onAudioData(audioData);
                }
            },
            onclose: () => {
                systemLog('LIVE_LINK', 'STATUS', 'WARN', 'Session Disconnected by Server');
                try {
                    stream.getTracks().forEach(t => t.stop());
                    source.disconnect();
                    processor.disconnect();
                } catch(e) {}
                onClose();
            },
            onerror: (err) => {
                systemLog('LIVE_LINK', 'ERROR', 'ERROR', err);
                onClose();
            }
        }
    });

    return {
        close: async () => {
            systemLog('LIVE_LINK', 'CLOSE', 'INFO', 'User Terminated Connection');
            const session = await sessionPromise;
            session.close();
            try {
                stream.getTracks().forEach(t => t.stop());
                audioContext.close();
            } catch(e) {}
        }
    };
};