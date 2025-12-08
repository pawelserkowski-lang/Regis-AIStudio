import { GoogleGenAI, Chat, GenerateContentResponse, Modality, LiveServerMessage, Part, Type } from "@google/genai";
import { DetectionBox } from "../types";

// --- System Logger ---
const SYSTEM_START = Date.now();

export const systemLog = (module: string, action: string, status: 'INFO' | 'WARN' | 'ERROR' | 'SUCCESS', data?: any) => {
  const uptime = ((Date.now() - SYSTEM_START) / 1000).toFixed(3);
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

// Initialize Gemini AI
systemLog('CORE', 'API_CLIENT', 'INFO', 'Initializing GoogleGenAI Client...');
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
systemLog('CORE', 'API_CLIENT', 'SUCCESS', 'Client Ready');

// --- Visual Analysis (GUI Detection) ---

export const detectUIElements = async (imageBase64: string): Promise<DetectionBox[]> => {
  systemLog('VISION_CORE', 'DETECT_UI', 'INFO', 'Starting Visual GUI Analysis...');
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview', // Strongest model for reasoning/vision
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

    const rawJSON = response.text || "[]";
    const detections: DetectionBox[] = JSON.parse(rawJSON);
    
    systemLog('VISION_CORE', 'DETECT_UI', 'SUCCESS', { count: detections.length });
    return detections;
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
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: this.sampleRate });
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
    // Ensure we don't schedule in the past
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

let chatSession: Chat | null = null;

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
    systemLog('CHAT_ENGINE', 'SESSION_INIT', 'INFO', 'Creating new Gemini 3 Pro session...');
    chatSession = ai.chats.create({
      model: 'gemini-3-pro-preview',
      config: {
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
        thinkingConfig: { thinkingBudget: 32768 },
        tools: [
          { googleSearch: {} },
          { googleMaps: {} }
        ]
      },
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
  const chat = getChatSession();
  let fullText = "";
  
  systemLog('CHAT_ENGINE', 'SEND_MESSAGE', 'INFO', { length: message.length, attachments: attachments.length });

  try {
    const parts: Part[] = [{ text: message }];
    
    // Add attachments
    attachments.forEach(att => {
        parts.push({
            inlineData: {
                data: att.data,
                mimeType: att.mimeType
            }
        });
    });

    const result = await chat.sendMessageStream({ 
        parts: parts 
    });
    
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
  } catch (error) {
    systemLog('CHAT_ENGINE', 'STREAM_ERROR', 'ERROR', error);
    throw error;
  }

  return fullText;
};

export const generateTitleForRegistry = async (content: string): Promise<string> => {
  systemLog('AUTO_TAGGER', 'GEN_TITLE', 'INFO', 'Analyzing content signature...');
  try {
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
        throw new Error("No image generated in edit mode");
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
         throw new Error("No image generated");
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
        
        const response = await fetch(`${videoUri}&key=${process.env.API_KEY}`);
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
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    
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
                stream.getTracks().forEach(t => t.stop());
                source.disconnect();
                processor.disconnect();
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
            stream.getTracks().forEach(t => t.stop());
            audioContext.close();
        }
    };
};