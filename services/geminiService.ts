import { GoogleGenAI, Chat, GenerateContentResponse, Modality, LiveServerMessage } from "@google/genai";

// Initialize Gemini AI
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

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
    
    for await (const chunk of result) {
      const c = chunk as GenerateContentResponse;
      const text = c.text || "";
      fullText += text;
      
      // Extract grounding metadata if present
      const grounding = c.candidates?.[0]?.groundingMetadata;
      
      onChunk(text, grounding);
    }
  } catch (error) {
    console.error("Error sending message to Gemini:", error);
    throw error;
  }

  return fullText;
};

export const generateTitleForRegistry = async (content: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `Generate a short, concise title (max 5 words) for the following content, do not add quotes: ${content.substring(0, 500)}...`,
    });
    return response.text?.trim() || "Untitled Note";
  } catch (error) {
    console.error("Error generating title:", error);
    return "Untitled Note";
  }
};

// --- Specialized Generation Features ---

export const generateImage = async (
  prompt: string, 
  settings: { width?: string, height?: string, aspectRatio?: string, isEditing?: boolean, imageBase64?: string }
): Promise<string> => {
  try {
    // Editing Mode (Flash Image)
    if (settings.isEditing && settings.imageBase64) {
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
                return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
        }
        throw new Error("No image generated in edit mode");
    } 
    // Generation Mode (Pro Image)
    else {
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
                return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
        }
         throw new Error("No image generated");
    }
  } catch (error) {
    console.error("Image generation failed:", error);
    throw error;
  }
};

export const generateVideo = async (
    prompt: string,
    aspectRatio: '16:9' | '9:16'
): Promise<string> => {
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

        // Polling
        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 5000));
            operation = await ai.operations.getVideosOperation({ operation: operation });
        }

        const videoUri = operation.response?.generatedVideos?.[0]?.video?.uri;
        if (!videoUri) throw new Error("No video URI returned");
        
        // Fetch actual bytes
        const response = await fetch(`${videoUri}&key=${process.env.API_KEY}`);
        const blob = await response.blob();
        return URL.createObjectURL(blob);
    } catch (error) {
        console.error("Video generation failed:", error);
        throw error;
    }
}

export const generateSpeech = async (text: string): Promise<string> => {
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
        return `data:audio/wav;base64,${base64Audio}`; // Assuming format
    } catch (error) {
        console.error("TTS failed:", error);
        throw error;
    }
}

export const transcribeAudio = async (audioBase64: string): Promise<string> => {
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
        return response.text || "";
    } catch (error) {
        console.error("Transcription failed:", error);
        throw error;
    }
}


// --- Live API (Simplified Wrapper) ---

export const connectLiveSession = async (
    onAudioData: (base64: string) => void,
    onClose: () => void
) => {
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
                console.log("Live Session Open");
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
                    onAudioData(audioData);
                }
            },
            onclose: () => {
                console.log("Live Session Closed");
                stream.getTracks().forEach(t => t.stop());
                source.disconnect();
                processor.disconnect();
                onClose();
            },
            onerror: (err) => {
                console.error("Live Session Error", err);
                onClose();
            }
        }
    });

    return {
        close: async () => {
            const session = await sessionPromise;
            session.close();
            stream.getTracks().forEach(t => t.stop());
        }
    };
};


// --- System Operations Mocks ---

export const readFileContent = async (filePath: string): Promise<string> => {
  console.log(`[Regis Mock] Reading file: ${filePath}`);
  return `[Mock Content of ${filePath}]`;
};

export const writeFileContent = async (filePath: string, content: string): Promise<void> => {
  console.log(`[Regis Mock] Writing to file: ${filePath}`);
  console.log(content);
};

export const executeSystemCommand = async (command: string): Promise<string> => {
  console.warn('[Regis Mock] Executing system command:', command);
  return `Command executed (simulated): ${command}`;
};