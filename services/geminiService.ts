import { GoogleGenAI, Chat, GenerateContentResponse, Modality, LiveServerMessage } from "@google/genai";

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
      model: 'gemini-3-pro-preview', // Upgraded to Pro for complex tasks/chatbot
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
        thinkingConfig: { thinkingBudget: 32768 }, // Max thinking budget for complex queries
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
    const parts: any[] = [{ text: message }];
    
    // Add attachments (images/video for analysis)
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
    }); // Chat.sendMessageStream takes parts directly or a message string
    
    systemLog('CHAT_ENGINE', 'STREAM_START', 'INFO');

    for await (const chunk of result) {
      const c = chunk as GenerateContentResponse;
      const text = c.text || "";
      fullText += text;
      
      // Extract grounding metadata if present
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
    // Editing Mode (Flash Image)
    if (settings.isEditing && settings.imageBase64) {
        systemLog('IMG_GEN', 'MODE_SWITCH', 'INFO', 'Editing Mode (Gemini Flash Image)');
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [
                    { inlineData: { data: settings.imageBase64, mimeType: 'image/png' } }, // Assuming PNG/JPEG
                    { text: prompt }
                ]
            }
        });
        // Find image part
        const parts = response.candidates?.[0]?.content?.parts || [];
        for (const part of parts) {
            if (part.inlineData) {
                systemLog('IMG_GEN', 'COMPLETE', 'SUCCESS', 'Image Data Received');
                return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
        }
        throw new Error("No image generated in edit mode");
    } 
    // Generation Mode (Pro Image)
    else {
        systemLog('IMG_GEN', 'MODE_SWITCH', 'INFO', 'Creation Mode (Gemini 3 Pro)');
        // gemini-3-pro-image-preview
        const response = await ai.models.generateContent({
            model: 'gemini-3-pro-image-preview',
            contents: { parts: [{ text: prompt }] },
            config: {
                imageConfig: {
                    aspectRatio: settings.aspectRatio || "1:1",
                    imageSize: settings.width || "1K" // "1K", "2K", "4K"
                }
            }
        });
         const parts = response.candidates?.[0]?.content?.parts || [];
        for (const part of parts) {
            if (part.inlineData) {
                systemLog('IMG_GEN', 'COMPLETE', 'SUCCESS', 'Image Data Received');
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
        // Polling
        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 5000));
            operation = await ai.operations.getVideosOperation({ operation: operation });
            systemLog('VIDEO_GEN', 'POLLING', 'INFO', '...');
        }

        const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (!videoUri) throw new Error("No video URI returned");
        
        // Fetch actual bytes
        const response = await fetch(`${videoUri}&key=${process.env.API_KEY}`);
        const blob = await response.blob();
        systemLog('VIDEO_GEN', 'COMPLETE', 'SUCCESS', 'Video Blob Created');
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
        systemLog('TTS_ENGINE', 'SYNTHESIS', 'SUCCESS', 'Audio Buffer Ready');
        return `data:audio/wav;base64,${base64Audio}`; // Assuming format
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
                    { inlineData: { data: audioBase64, mimeType: 'audio/wav' } }, // Adjust mime type as needed
                    { text: "Transcribe this audio exactly." }
                ]
            }
        });
        const text = response.text || "";
        systemLog('AUDIO_PROC', 'TRANSCRIPT', 'SUCCESS', { textLength: text.length });
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
    
    // Connect to Live API
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
                // Start pumping audio
                processor.onaudioprocess = (e) => {
                    const inputData = e.inputBuffer.getChannelData(0);
                    // Convert Float32 to PCM Int16
                     const l = inputData.length;
                    const int16 = new Int16Array(l);
                    for (let i = 0; i < l; i++) {
                        int16[i] = inputData[i] * 32768;
                    }
                    
                    // Simple b64 encode for PCM (manual)
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
                    // systemLog('LIVE_LINK', 'RX', 'INFO', 'Audio Chunk Received'); // Too verbose for normal logs
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
        }
    };
};


// --- System Operations Mocks ---

export const readFileContent = async (filePath: string): Promise<string> => {
  systemLog('FS_LAYER', 'READ', 'INFO', filePath);
  return `[Mock Content of ${filePath}]`;
};

export const writeFileContent = async (filePath: string, content: string): Promise<void> => {
  systemLog('FS_LAYER', 'WRITE', 'WARN', `Write to ${filePath} intercepted (Simulation Mode)`);
};

export const executeSystemCommand = async (command: string): Promise<string> => {
  systemLog('KERNEL', 'EXEC', 'WARN', `Command: ${command}`);
  return `Command executed (simulated): ${command}`;
};