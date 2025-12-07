# EPS AI SOLUTIONS - REGIS SYSTEM

**Version:** 1.0.0  
**Status:** [ONLINE]  
**Codename:** Project Phoenix

## 1. System Overview

**Regis** is an advanced "Necro-Cyber" styled intelligent knowledge registry and assistant. It leverages the latest Google Gemini models to provide a multi-modal interface capable of real-time audio interaction, video generation, image synthesis, and persistent knowledge management.

The application is built as a client-side React application using ES Modules, requiring no build step in its current environment, and persists data via the browser's LocalStorage.

## 2. Technical Stack

*   **Core Framework:** React 19 (via ESM imports)
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS (CDN)
*   **AI SDK:** `@google/genai` (v1.31.0)
*   **Visualization:** Recharts
*   **Icons:** Lucide React
*   **Fonts:** Inter (UI), JetBrains Mono (Code/Headers)

## 3. AI Model Architecture

Regis utilizes a specific orchestration of Gemini models optimized for distinct tasks:

| Feature | Model ID | Description |
| :--- | :--- | :--- |
| **Cognitive Core (Chat)** | `gemini-3-pro-preview` | Handles complex reasoning, coding, and general conversation. Equipped with Google Search and Maps tools. |
| **Fast Logic / Titles** | `gemini-2.5-flash` | Used for rapid tasks like summarizing content for the Registry titles and transcription. |
| **Live Interaction** | `gemini-2.5-flash-native-audio-preview-09-2025` | Powering the "Live Mode" for low-latency, real-time bidirectional audio streaming. |
| **Image Generation** | `gemini-3-pro-image-preview` | High-fidelity image generation (1K resolution). |
| **Image Editing** | `gemini-2.5-flash-image` | Used when modifying existing images (multimodal input). |
| **Video Generation** | `veo-3.1-fast-generate-preview` | Generates 720p videos from text prompts (requires polling). |
| **Text-to-Speech** | `gemini-2.5-flash-preview-tts` | Converts system text responses into audio (Voice: 'Kore'). |

## 4. Key Features

### 4.1. The Chat Interface
*   **Streaming Responses:** Real-time text rendering.
*   **Multimodal Input:** Supports drag-and-drop or selection of Images, Audio, and Video files for analysis.
*   **Grounding:** Automatically detects and renders source citations from Google Search and Google Maps.
*   **Generative Tools:** Integrated "Sparkles" menu to trigger Image and Video generation flows.

### 4.2. Live Mode (Real-time Audio)
*   **Bi-directional Streaming:** Uses WebSockets (via the Live API) to stream PCM audio chunks.
*   **Visualizer:** A specialized overlay indicating the connection status.
*   **Audio Processing:** Custom `AudioContext` implementation to handle raw PCM 16kHz input and 24kHz output.

### 4.3. Knowledge Registry
*   **Persistence:** Chats and Notes are saved to `localStorage` (`regis_registry`), ensuring data survives browser refreshes.
*   **Auto-Categorization:** Content saved from chat is automatically titled using a lightweight Gemini Flash call.
*   **Search & Filter:** Real-time filtering by text, category, or tags.

### 4.4. System Analytics
*   **Data Visualization:** Uses Recharts to display:
    *   **Distribution Protocol:** Pie chart of knowledge categories.
    *   **Activity Log:** Bar chart of entry creation over time.

## 5. Project Structure

```
/
├── index.html              # Entry point, importmaps, global styles
├── index.tsx               # React root mounting
├── App.tsx                 # Main layout, State Management, Persistence Logic
├── types.ts                # TypeScript Interfaces (Message, RegistryItem, View)
├── metadata.json           # Application metadata and permissions
├── README.md               # System Documentation
│
├── components/
│   ├── Sidebar.tsx         # Navigation and Branding
│   ├── ChatArea.tsx        # Main interaction layer, Tool handling, Live Mode UI
│   ├── Registry.tsx        # Grid view of saved knowledge
│   └── Stats.tsx           # Analytics dashboard
│
└── services/
    └── geminiService.ts    # SINGLETON. Handles all API calls, Audio encoding/decoding, and Live API connection.
```

## 6. Setup & Configuration

### Prerequisites
*   A valid **Google Gemini API Key** with access to paid services (required for Veo and Gemini 3 Pro).

### Environment Variables
The application expects the API key to be injected via the environment:
*   `process.env.API_KEY`

### Running the System
Since this project uses ES Modules via CDN:
1.  Ensure `metadata.json` requests microphone permissions.
2.  Serve the root directory using a static server (or the provided AI Studio environment).
3.  The `index.html` will bootstrap React and load `index.tsx`.

## 7. Troubleshooting

*   **Live Mode Silence:** Ensure your browser has granted Microphone permissions. The Live API uses raw PCM data; if the network is slow, audio buffering might occur.
*   **Video Generation Delay:** Veo model generation is asynchronous and can take 10-60 seconds. The UI handles polling, but do not close the tab during generation.
*   **Persistence:** If data is not saving, check if your browser blocks `localStorage` or if you are in Incognito/Private mode.

---
*EPS AI SOLUTIONS // SYSTEM END OF FILE*
