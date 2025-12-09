# EPS AI SOLUTIONS - REGIS SYSTEM

**Version:** 1.0.1
**Status:** [ONLINE]  
**Codename:** Project Phoenix

## 1. System Overview

**Regis** is an advanced "Necro-Cyber" styled intelligent knowledge registry and assistant. It leverages the latest Google Gemini models to provide a multi-modal interface capable of real-time audio interaction, video generation, image synthesis, and persistent knowledge management.

The application is built as a client-side React application using ES Modules, requiring no build step in its current environment, and persists data via the browser's LocalStorage.

For a deep dive into the technical design, see [ARCHITECTURE.md](./ARCHITECTURE.md).

## 2. Technical Stack

*   **Core Framework:** React 19 (via ESM imports)
*   **Language:** TypeScript
*   **Styling:** Tailwind CSS (CDN)
*   **AI SDK:** `@google/genai` (v1.31.0)
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
*   **Data Visualization:** Uses Recharts to display knowledge distribution and activity logs (Note: This feature is currently in maintenance mode in the Lite version).

## 5. Setup & Configuration

### Prerequisites
1.  **Node.js**: You must have Node.js installed on your computer. [Download Here](https://nodejs.org/).
2.  **API Key**: You will need a Google Gemini API Key. You can enter this directly in the App Launcher UI.

### 🚀 Quick Start

**Option A: One-Click (Windows)**
*   Double-click the `START_REGIS.cmd` file in the project folder.

**Option B: Manual Terminal**
Open your terminal in the project folder and run:

```bash
# This handles installation and startup automatically
npm run launcher
```

This will automatically open the application in your default browser.

---
*EPS AI SOLUTIONS // SYSTEM END OF FILE*