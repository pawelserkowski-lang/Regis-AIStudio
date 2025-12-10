# Regis AI Studio

**Version:** 1.0.1
**Engine:** React 19 + Python Serverless
**Powered By:** Google Gemini 3 Pro & 2.5 Flash

Regis is an advanced "Zero-Build" Single Page Application (SPA) designed for intelligent knowledge management. It combines a client-side React frontend with a serverless Python backend to orchestrate AI interactions, voice processing, and data persistence.

## 🌟 Key Features

*   **Multimodal Chat:** Interact with text, images, and audio using Gemini 3 Pro.
*   **Live Mode:** Real-time bi-directional voice conversation using WebRTC and WebSocket streaming.
*   **Knowledge Registry:** Save, tag, and organize insights locally (persisted via LocalStorage).
*   **Hybrid Architecture:**
    *   **Frontend:** React 19 (Vite) for responsive UI and direct AI streaming.
    *   **Backend:** Python Serverless (Vercel/Local) for configuration, security, and extended orchestration.
*   **Auto-Reloading:** Robust local development environment with hot-reloading for both frontend (HMR) and backend (Supervisor).

## 🚀 Quick Start

### Prerequisites
*   **Node.js** (v18+)
*   **Python 3.9+**
*   **Google Gemini API Key** (Set in `.env` or provided via UI)

### Launching Locally

We provide "All-in-One" launchers that set up dependencies and start both the frontend and backend services concurrently.

**Linux / macOS:**
```bash
./run_linux.sh
```

**Windows:**
```cmd
run_windows.bat
```

*The launcher will:*
1.  Check for Node.js and Python.
2.  Install NPM dependencies (`package.json`).
3.  Install Python dependencies (`api/requirements.txt`).
4.  Start the Python Backend (Port 8000).
5.  Start the Vite Frontend (Port 3000) and open your browser.

## 🛠️ Manual Setup & Development

If you prefer to run services manually:

1.  **Environment Setup**
    Create a `.env` file in the root directory:
    ```ini
    GOOGLE_API_KEY=your_api_key_here
    VITE_API_KEY=your_api_key_here
    ```

2.  **Backend (Python)**
    The backend runs as a local supervisor to mimic Vercel functions.
    ```bash
    # Install libs
    pip install -r api/requirements.txt

    # Run Supervisor (Auto-reloads on file change)
    python api/local_server.py
    ```
    *Runs on http://localhost:8000*

3.  **Frontend (React/Vite)**
    ```bash
    npm install
    npm run dev
    ```
    *Runs on http://localhost:3000 (Proxies /api to Backend)*

## 🏗️ Architecture

Regis uses a **Hybrid Serverless** architecture tailored for Vercel.

*   **Frontend Sovereignty:** Most AI logic (streaming, tool calling) happens directly in the browser via the `@google/genai` SDK to minimize latency.
*   **Serverless Backend:** The `api/` directory contains Python handlers (e.g., `index.py`) that are deployed as Vercel Serverless Functions. Locally, `api/local_server.py` wraps these handlers to provide a consistent dev experience.
*   **State Management:** Ephemeral chat state is in-memory; persistent registry data is stored in `localStorage`.

## 📦 Deployment (Vercel)

This project is configured for immediate Vercel deployment.

1.  **Install Vercel CLI:** `npm i -g vercel`
2.  **Pull Config:** `vercel env pull .env.local`
3.  **Deploy:** `vercel deploy`

The `vercel.json` configuration ensures that `api/*.py` files are treated as Serverless Functions and routed correctly.

## 🤖 Agent Protocols

This repository includes an `AGENTS.md` file defining the workflow for AI contributors:
*   **Automatic Submission:** Changes are verified and submitted automatically.
*   **Hot Reloading:** Code modifications must preserve the auto-reload capabilities of the dev environment.

---
*Built with ❤️ for the Gemini Developer Competition.*
