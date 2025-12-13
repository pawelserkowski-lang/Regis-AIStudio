# 🤖 Regis AI Studio

**Dual-AI Chat Application** with system command execution capabilities and "God Mode" integration.

A modern, powerful AI assistant that combines Claude (Anthropic) and Gemini (Google) with the ability to execute system commands, analyze files, and provide an immersive chat experience.

---

## 🎯 Overview

Regis AI Studio is a sophisticated dual-AI chat application built with React 19 and Python, featuring:

- **Dual-AI Architecture**: Primary Claude AI with Gemini fallback
- **God Mode**: Execute system commands directly through AI
- **Chrome App Mode**: Run as a standalone application with hidden terminals
- **Streaming Responses**: Real-time token-by-token AI responses
- **File Support**: Upload and analyze images, documents
- **Session Management**: Unlimited chat history with search functionality
- **Multilingual**: Polish and English interface
- **Modern Stack**: React 19, TypeScript, Vite, Tailwind CSS

---

## ✨ Key Features

### 🎯 Performance Monitoring Dashboard
Real-time system and API performance tracking with comprehensive metrics:
- **API Monitoring**: Track total requests, success/failure rates, and error rates
- **Response Time Analysis**: Average response time with historical trends
- **Active Connections**: Monitor concurrent API calls
- **Memory Usage**: Real-time memory consumption tracking
- **Performance Charts**: Visual trends for response times, memory, and request rates
- **Cost Estimation**: Token usage and estimated API costs
- **Auto-Updates**: Metrics refresh every 5 seconds
- **Pause/Resume**: Control monitoring to reduce overhead

Access: Click **"Performance"** in the sidebar

### 💾 Conversation History Export
Export and share your conversations in multiple formats:
- **JSON Export**: Structured data with full metadata
- **Markdown Export**: Formatted text perfect for documentation
- **HTML Export**: Beautiful standalone webpage with dark theme
- **Bulk Export**: Export all conversations at once
- **Clipboard Copy**: Quick copy in Markdown format
- **Metadata Preservation**: Includes timestamps, models, and attachments

Access: History view → Click download icon on any session or use bulk export buttons

### 📚 Prompt Templates Library
Pre-built professional templates for common development tasks:
- **Code Review**: Comprehensive code analysis and suggestions
- **Debugging**: Structured approach to finding and fixing bugs
- **Documentation**: Generate complete documentation with examples
- **Unit Tests**: Create comprehensive test suites
- **Refactoring**: Improve code structure and quality
- **Code Explanation**: Step-by-step code breakdowns
- **API Design**: RESTful API planning and documentation
- **Performance Optimization**: Identify and resolve bottlenecks

**Categories**: Code, Debug, Documentation, Tests, Refactoring
**Languages**: Polish & English
**Access**: Chat input → Purple book icon 📘 or press `Ctrl+K`

### ⌨️ Keyboard Shortcuts
Speed up your workflow with powerful keyboard shortcuts:
- `Enter` - Send message
- `Shift+Enter` - New line in message
- `Ctrl+K` - Open prompt templates
- `Ctrl+/` - Show keyboard shortcuts help
- `↑/↓` - Navigate through prompt history
- `Esc` - Close dialogs and menus

### 🔄 Enhanced Error Handling
Robust retry logic with exponential backoff:
- **Automatic Retries**: Up to 3 retry attempts for failed API calls
- **Smart Detection**: Identifies retryable errors (rate limits, timeouts, network issues)
- **Exponential Backoff**: 1s, 2s, 4s delays between retries
- **Graceful Degradation**: Falls back to original prompt on failure
- **Detailed Logging**: All retry attempts logged for debugging

---

## 🏗️ Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Chrome App Mode                       │
│         (Standalone window - no browser UI)              │
└─────────────────────┬───────────────────────────────────┘
                      │
        ┌─────────────┴──────────────┐
        │                            │
┌───────▼────────┐         ┌─────────▼──────────┐
│  Frontend      │         │  Backend           │
│  (Vite/React)  │◄───────►│  (Python HTTP)     │
│  Port 3000     │  Proxy  │  Port 8000         │
└────────┬───────┘         └─────────┬──────────┘
         │                           │
    ┌────▼─────┐              ┌──────▼─────────┐
    │  React   │              │  AI Services   │
    │  19.0.0  │              │                │
    │  + TS    │              │  ┌──────────┐  │
    │  + Vite  │              │  │ Claude   │  │
    │  + Tail  │              │  │ Anthropic│  │
    └──────────┘              │  └──────────┘  │
                              │                │
                              │  ┌──────────┐  │
                              │  │ Gemini   │  │
                              │  │ Google   │  │
                              │  └──────────┘  │
                              └────────────────┘
```

### Component Architecture

```
App.tsx (Root)
├── Sidebar.tsx (Navigation)
│   ├── View Switcher
│   ├── Language Toggle
│   └── Session Controls
│
├── ChatArea.tsx (Main Interface)
│   ├── Message Display
│   ├── Streaming Handler
│   ├── File Attachments
│   ├── Command Execution
│   └── Suggestion Buttons
│
├── HistoryView.tsx (Session History)
│   ├── Search Functionality
│   ├── Session List
│   └── Message Preview
│
├── Registry.tsx (Content Registry)
├── LogsView.tsx (System Logs)
├── LivePreview.tsx (Code Preview)
└── ErrorBoundary.tsx (Error Handling)
```

### File Structure

```
regis-ai-studio/
│
├── api/                        # Backend Python Server
│   ├── index.py               # Main HTTP server (578 lines)
│   ├── local_server.py        # Alternative local server
│   └── requirements.txt       # Python dependencies
│
├── src/                        # Frontend React Application
│   ├── main.tsx               # Entry point (React DOM)
│   ├── App.tsx                # Root component (246 lines)
│   ├── types.ts               # TypeScript definitions
│   │
│   ├── components/            # React Components (13 files)
│   │   ├── ChatArea.tsx       # Main chat (24KB)
│   │   ├── Sidebar.tsx        # Navigation
│   │   ├── HistoryView.tsx    # Session history
│   │   ├── Registry.tsx       # Content registry
│   │   ├── ErrorBoundary.tsx  # Error handling
│   │   └── ...
│   │
│   └── services/              # Service Layer
│       ├── ai/                # Modular AI Service
│       │   ├── index.ts       # Public API (272 lines)
│       │   ├── config.ts      # Configuration
│       │   ├── logger.ts      # Logging
│       │   ├── types.ts       # Internal types
│       │   └── providers/
│       │       ├── claude.ts  # Claude provider
│       │       └── gemini.ts  # Gemini provider
│       │
│       ├── aiService.ts       # Legacy service
│       └── geminiService.ts   # Legacy Gemini
│
├── scripts/                    # Utility Scripts
│   ├── start.py               # Main launcher (280 lines)
│   ├── self_repair.py         # Diagnostics tool
│   └── windows/               # Windows batch files
│       ├── Regis-App.bat      # Chrome app launcher
│       ├── Regis-Start.bat    # Standard launcher
│       ├── Regis-Setup.bat    # Full setup
│       └── set-api-keys.bat   # API config
│
├── electron/                   # Electron Desktop Wrapper
│   ├── main.js                # Electron main process
│   └── package.json           # Electron config
│
├── public/                     # Static Assets
├── docs/                       # Documentation
├── tests/                      # Test Files
│
├── package.json               # Node.js dependencies
├── vite.config.ts            # Vite configuration
├── tsconfig.json             # TypeScript config
├── tailwind.config.js        # Tailwind CSS config
└── .env                      # Environment variables
```

---

## 🤖 AI Agents & Providers

### Dual-AI System

Regis AI Studio uses a **dual-provider architecture** for maximum reliability and capabilities:

#### Primary Provider: Claude (Anthropic)

**Available Models:**
- `claude-sonnet-4-20250514` ⭐ (Default, newest)
- `claude-3-5-sonnet-20241022`
- `claude-3-opus-20240229`
- `claude-3-haiku-20240307`

**Capabilities:**
- Advanced reasoning and analysis
- Long-form text generation
- Code generation and debugging
- Prompt improvement and optimization
- System command execution ("God Mode")
- Streaming responses

**Integration:**
- Backend integration via Anthropic SDK
- API calls routed through Python server
- Automatic retry with exponential backoff
- Context management (last 20 messages)

**System Prompt:**
```
REGIS - AI Assistant with God Mode access
- Polish language responses
- Cyber/hacker aesthetic
- System command execution capability
- Enhanced prompt optimization
```

#### Secondary Provider: Gemini (Google)

**Available Models:**
- `gemini-2.5-flash` ⭐ (Default)
- `gemini-3-pro-preview`
- `gemini-2.0-flash-exp`

**Capabilities:**
- Multimodal support (text, images, audio)
- Vision analysis
- Fast responses
- Streaming output
- Automatic fallback provider

**Integration:**
- Direct frontend integration via `@google/generative-ai`
- No backend required for basic chat
- Vision API for image analysis
- Automatic activation when Claude fails

### AI Service Architecture

```typescript
// services/ai/index.ts - Main AI Orchestrator

┌─────────────────────────────────────────┐
│     AI Service (Public API)             │
├─────────────────────────────────────────┤
│  • initializeProvider(provider)         │
│  • sendMessage(message, history)        │
│  • getCurrentProvider()                 │
│  • switchProvider(newProvider)          │
└──────────────┬──────────────────────────┘
               │
       ┌───────┴────────┐
       │                │
┌──────▼─────┐   ┌──────▼─────┐
│  Claude    │   │  Gemini    │
│  Provider  │   │  Provider  │
├────────────┤   ├────────────┤
│ • init()   │   │ • init()   │
│ • send()   │   │ • send()   │
│ • stream() │   │ • stream() │
└────────────┘   └────────────┘
```

**Features:**
- **Automatic Fallback**: Switches to Gemini if Claude fails
- **Provider Switching**: Change AI provider mid-conversation
- **Comprehensive Logging**: All operations logged to localStorage
- **Error Recovery**: Automatic retry with exponential backoff
- **Configuration Management**: Centralized config with validation

### AI Features

#### 1. Streaming Responses
Real-time token-by-token responses for both providers:
```typescript
// Streaming implementation
for await (const chunk of stream) {
  const text = extractText(chunk);
  updateMessage(text);
}
```

#### 2. Context Management
Maintains conversation history:
- Last 20 messages sent to AI
- Automatic context trimming
- Role-based message format (user/assistant)

#### 3. God Mode (Command Execution)
Claude can execute system commands:
```python
# Backend: api/index.py
def execute_command(cmd):
    # Safety validation
    if is_dangerous_command(cmd):
        return "Command blocked for safety"

    # Execute with timeout
    result = subprocess.run(cmd, timeout=30)
    return result.stdout
```

**Safety Features:**
- Blocks dangerous commands (rm -rf, format, etc.)
- 30-second timeout
- Command validation
- Error handling

#### 4. Prompt Improvement
Claude can optimize user prompts:
```
User: "make my prompt better"
→ Claude analyzes and rewrites for better AI responses
```

#### 5. Dynamic Suggestions
AI generates contextual action buttons:
- Quick actions based on conversation
- Code execution shortcuts
- File operation suggestions

---

## 🚀 Installation & Setup

### Prerequisites

- **Python 3.8+** - [Download](https://python.org)
- **Node.js 18+** - [Download](https://nodejs.org)
- **Google Chrome** or **Microsoft Edge** (for app mode)
- **API Keys**:
  - Anthropic Claude: [Get Key](https://console.anthropic.com/)
  - Google Gemini: [Get Key](https://aistudio.google.com/) (optional)

### Quick Setup

#### Windows (Automated Setup)

1. **First Time Setup:**
   ```batch
   Double-click: scripts\windows\Regis-Setup.bat
   ```

   This will automatically:
   - Check Python and Node.js installation
   - Install Python packages (anthropic, python-dotenv, google-generativeai)
   - Install npm packages
   - Create `.env` from `.env.example`
   - Launch backend and frontend
   - Open Chrome in app mode

2. **Set API Keys:**
   ```batch
   Double-click: scripts\windows\set-api-keys.bat
   ```

   Or manually edit `.env`:
   ```env
   ANTHROPIC_API_KEY=sk-ant-your-key-here
   GOOGLE_API_KEY=AIza-your-key-here
   DEFAULT_AI_PROVIDER=claude
   BACKEND_PORT=8000
   ```

3. **Subsequent Launches:**
   ```batch
   Double-click: scripts\windows\Regis-Start.bat
   ```

#### Linux/MacOS (Manual Setup)

1. **Clone and Navigate:**
   ```bash
   git clone <repository-url>
   cd regis-ai-studio
   ```

2. **Install Dependencies:**
   ```bash
   # Python packages
   pip install -r api/requirements.txt

   # Node packages
   npm install
   ```

3. **Configure Environment:**
   ```bash
   cp .env.example .env
   nano .env  # Edit with your API keys
   ```

4. **Launch Application:**
   ```bash
   # Terminal 1: Backend
   python3 scripts/start.py

   # Terminal 2: Frontend
   npm run dev
   ```

5. **Access Application:**
   - Web: `http://localhost:5173`
   - Chrome App: See Chrome App Mode section below

---

## 🎨 Chrome App Mode (Standalone Application)

### What is Chrome App Mode?

Chrome App Mode launches the application in a **standalone window without browser UI** (no address bar, tabs, or bookmarks), making it look and feel like a native desktop application.

### Windows: Automated Launch with Hidden Terminals

The `Regis-App.bat` script provides a seamless experience:

```batch
@echo off
cd /d "%~dp0"

echo Uruchamiam Regis AI Studio...

:: Launch backend in minimized terminal
start /min cmd /c "title REGIS-Backend && python api/index.py"
timeout /t 2 /nobreak >nul

:: Launch frontend in minimized terminal
start /min cmd /c "title REGIS-Frontend && npm run dev"
timeout /t 4 /nobreak >nul

:: Open Chrome as standalone app (no browser UI)
start "" "chrome.exe" --app=http://localhost:5173 --window-size=1400,900

exit
```

**What This Does:**

1. **Backend Launch** (`start /min`):
   - Starts Python server in a minimized terminal window
   - Terminal is hidden from view but runs in background
   - Window title: "REGIS-Backend"
   - Port: 8000

2. **Frontend Launch** (`start /min`):
   - Starts Vite dev server in a minimized terminal
   - Terminal is hidden from view but runs in background
   - Window title: "REGIS-Frontend"
   - Port: 5173 (or 3000 with proxy)

3. **Chrome App Launch** (`--app` flag):
   - Opens Chrome without browser UI
   - Window size: 1400x900 pixels
   - Connects to: `http://localhost:5173`
   - Looks like a native .exe application

4. **Script Exit**:
   - Batch script exits immediately
   - Servers continue running in background
   - Only the Chrome window is visible

**Usage:**
```batch
# From Windows Explorer
Double-click: scripts\windows\Regis-App.bat

# From Command Line
cd C:\path\to\regis-ai-studio
scripts\windows\Regis-App.bat
```

### Linux/MacOS: Chrome App Mode

#### Method 1: Bash Script (Recommended)

Create `launch-chrome-app.sh`:

```bash
#!/bin/bash

# Navigate to project directory
cd "$(dirname "$0")"

echo "🚀 Launching Regis AI Studio..."

# Launch backend in background
python3 scripts/start.py > /dev/null 2>&1 &
BACKEND_PID=$!
echo "✅ Backend started (PID: $BACKEND_PID)"

# Wait for backend to initialize
sleep 2

# Launch frontend in background
npm run dev > /dev/null 2>&1 &
FRONTEND_PID=$!
echo "✅ Frontend started (PID: $FRONTEND_PID)"

# Wait for frontend to initialize
sleep 4

# Launch Chrome in app mode
echo "🎨 Opening Chrome App..."
google-chrome --app=http://localhost:5173 \
              --window-size=1400,900 \
              --disable-features=TranslateUI \
              --no-first-run \
              --no-default-browser-check &

echo ""
echo "✨ Regis AI Studio is running!"
echo "Backend PID: $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo ""
echo "To stop: scripts/stop-servers.sh"
```

Make it executable:
```bash
chmod +x launch-chrome-app.sh
./launch-chrome-app.sh
```

#### Method 2: Terminal Multiplexer (tmux/screen)

**Using tmux:**

```bash
#!/bin/bash
# launch-tmux.sh

tmux new-session -d -s regis 'python3 scripts/start.py'
tmux split-window -v -t regis 'npm run dev'
tmux select-layout -t regis even-vertical

# Wait for servers
sleep 6

# Launch Chrome app
google-chrome --app=http://localhost:5173 --window-size=1400,900 &

echo "Servers running in tmux session 'regis'"
echo "Attach: tmux attach -t regis"
echo "Kill: tmux kill-session -t regis"
```

**Using screen:**

```bash
#!/bin/bash
# launch-screen.sh

screen -dmS regis-backend bash -c 'python3 scripts/start.py'
screen -dmS regis-frontend bash -c 'npm run dev'

sleep 6

google-chrome --app=http://localhost:5173 --window-size=1400,900 &

echo "Servers running in screen sessions"
echo "View backend: screen -r regis-backend"
echo "View frontend: screen -r regis-frontend"
echo "Kill all: screen -X -S regis-backend quit && screen -X -S regis-frontend quit"
```

#### Method 3: systemd Services (Production)

**Backend Service** (`/etc/systemd/system/regis-backend.service`):

```ini
[Unit]
Description=Regis AI Studio Backend
After=network.target

[Service]
Type=simple
User=your-username
WorkingDirectory=/home/your-username/regis-ai-studio
ExecStart=/usr/bin/python3 scripts/start.py
Restart=on-failure
RestartSec=10
Environment="PATH=/usr/bin:/usr/local/bin"

[Install]
WantedBy=multi-user.target
```

**Frontend Service** (`/etc/systemd/system/regis-frontend.service`):

```ini
[Unit]
Description=Regis AI Studio Frontend
After=regis-backend.service

[Service]
Type=simple
User=your-username
WorkingDirectory=/home/your-username/regis-ai-studio
ExecStart=/usr/bin/npm run dev
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

**Enable and Start:**

```bash
sudo systemctl daemon-reload
sudo systemctl enable regis-backend regis-frontend
sudo systemctl start regis-backend regis-frontend
sudo systemctl status regis-backend regis-frontend
```

**Desktop Launcher** (`~/.local/share/applications/regis-ai-studio.desktop`):

```ini
[Desktop Entry]
Version=1.0
Type=Application
Name=Regis AI Studio
Comment=Dual-AI Chat Application
Exec=google-chrome --app=http://localhost:5173 --window-size=1400,900
Icon=/home/your-username/regis-ai-studio/public/icon.png
Terminal=false
Categories=Development;AI;Chat;
```

### Chrome App Mode Options

**Essential Flags:**
```bash
--app=http://localhost:5173         # App mode (no browser UI)
--window-size=1400,900              # Window dimensions
--window-position=100,100           # Window position
--disable-features=TranslateUI      # Disable translate popup
--no-first-run                      # Skip first run prompts
--no-default-browser-check          # Skip default browser check
```

**Advanced Flags:**
```bash
--start-fullscreen                  # Launch fullscreen
--kiosk                            # Kiosk mode (full immersion)
--disable-extensions               # Disable Chrome extensions
--disable-sync                     # Disable Chrome sync
--user-data-dir=/path/to/profile   # Separate Chrome profile
--auto-open-devtools-for-tabs      # Open DevTools automatically
```

**Example with Custom Profile:**
```bash
google-chrome --app=http://localhost:5173 \
              --user-data-dir="$HOME/.config/regis-chrome" \
              --window-size=1600,1000 \
              --disable-features=TranslateUI \
              --no-first-run
```

### Stopping Servers

**Windows:**
```batch
# Double-click:
scripts\windows\stop-regis.bat

# Or manually:
taskkill /F /FI "WindowTitle eq REGIS-Backend*"
taskkill /F /FI "WindowTitle eq REGIS-Frontend*"
```

**Linux/MacOS:**

Create `scripts/stop-servers.sh`:
```bash
#!/bin/bash

# Kill by port
kill $(lsof -t -i:8000)  # Backend
kill $(lsof -t -i:5173)  # Frontend
kill $(lsof -t -i:3000)  # Alternative frontend port

echo "✅ Servers stopped"
```

Or using tmux:
```bash
tmux kill-session -t regis
```

Or using screen:
```bash
screen -X -S regis-backend quit
screen -X -S regis-frontend quit
```

Or using systemd:
```bash
sudo systemctl stop regis-backend regis-frontend
```

---

## 🎮 Usage

### Starting the Application

**Windows:**
```batch
scripts\windows\Regis-App.bat       # Chrome app mode (recommended)
scripts\windows\Regis-Start.bat     # Standard browser mode
```

**Linux/MacOS:**
```bash
./launch-chrome-app.sh              # Chrome app mode
python3 scripts/start.py && npm run dev  # Manual start
```

### Basic Operations

1. **Chat with AI:**
   - Type message in input box
   - Press Enter or click Send
   - AI responds with streaming output

2. **Switch AI Provider:**
   - Click provider button (Claude/Gemini)
   - Current conversation continues
   - Automatic fallback if provider fails

3. **Upload Files:**
   - Click attachment icon
   - Select image or document
   - AI analyzes file content

4. **Execute Commands (God Mode):**
   - Ask Claude to run system commands
   - Example: "Show me current directory"
   - Commands execute with safety validation

5. **View History:**
   - Click History view
   - Search past conversations
   - Load previous session

6. **Language Toggle:**
   - Switch between Polish and English
   - UI updates immediately

### Keyboard Shortcuts

- **Arrow Up/Down**: Navigate message history
- **Ctrl+Enter**: Send message
- **Esc**: Clear input
- **Ctrl+L**: Toggle language

---

## 🛠️ Development

### Tech Stack

**Frontend:**
- React 19.0.0 (latest with concurrent features)
- TypeScript 5.2.2 (full type safety)
- Vite 5.1.4 (fast HMR and build)
- Tailwind CSS 3.4.1 (utility-first styling)
- Lucide React 0.556 (icon library)

**Backend:**
- Python 3.8+ (HTTP server)
- Anthropic SDK (Claude integration)
- python-dotenv (environment management)

**AI SDKs:**
- `@google/generative-ai` 0.21.0 (Gemini)
- Anthropic Python SDK (Claude)

### Project Scripts

```bash
npm run dev              # Start Vite dev server (port 3000)
npm run build            # Build production bundle
npm run preview          # Preview production build
npm run test:frontend    # Run Vitest tests
npm run test:backend     # Run Python tests
npm run test:all         # Run all tests
npm run lint             # Lint TypeScript/React code
npm run start:backend    # Start Python backend
npm run self-repair      # Run diagnostics and repair
```

### Development Workflow

1. **Start Backend:**
   ```bash
   python3 scripts/start.py
   # Backend runs on http://localhost:8000
   ```

2. **Start Frontend:**
   ```bash
   npm run dev
   # Frontend runs on http://localhost:5173
   # Proxies /api requests to backend
   ```

3. **Access Application:**
   - Browser: `http://localhost:5173`
   - Vite HMR: Instant updates on file changes

### Adding New AI Provider

1. **Create Provider File:**
   ```typescript
   // src/services/ai/providers/newai.ts
   import { AIProvider } from '../types';

   export const newAIProvider: AIProvider = {
     async initialize() {
       // Initialize SDK
     },
     async sendMessage(message, history) {
       // Send message to API
       // Return response
     }
   };
   ```

2. **Register Provider:**
   ```typescript
   // src/services/ai/config.ts
   export const AI_PROVIDERS = {
     claude: claudeProvider,
     gemini: geminiProvider,
     newai: newAIProvider,  // Add here
   };
   ```

3. **Update UI:**
   ```tsx
   // src/components/ChatArea.tsx
   <button onClick={() => switchProvider('newai')}>
     New AI
   </button>
   ```

### Testing

**Frontend Tests:**
```bash
npm run test:frontend
# Uses Vitest + React Testing Library
```

**Backend Tests:**
```bash
npm run test:backend
# Uses Python unittest
```

**Manual Testing:**
```bash
# Check backend
python3 scripts/start.py --check

# Self-repair diagnostics
python3 scripts/self_repair.py
```

---

## 🔧 Configuration

### Environment Variables

**File: `.env`**

```env
# Google Gemini API Key (optional if using only Claude)
GOOGLE_API_KEY=your_gemini_api_key_here

# Anthropic Claude API Key (required for Claude)
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Default AI provider: "claude" or "gemini"
DEFAULT_AI_PROVIDER=claude

# Backend port (default 8000)
BACKEND_PORT=8000
```

### Vite Configuration

**File: `vite.config.ts`**

```typescript
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    strictPort: true,
    open: false,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      }
    }
  }
});
```

### API Endpoints

**Backend Routes (`api/index.py`):**

- `POST /api/chat` - Send message to Claude
- `POST /api/command` - Execute system command
- `GET /api/health` - Health check
- `GET /api/models` - List available models

---

## 📚 Documentation

- **Scripts README**: `scripts/README.md` - Detailed script documentation
- **API Documentation**: `docs/api.md` - Backend API reference
- **Component Docs**: `docs/components.md` - React component guide
- **Architecture**: `docs/architecture.md` - Detailed architecture

---

## 🐛 Troubleshooting

### Common Issues

**1. Backend won't start:**
```bash
# Check Python version
python3 --version  # Must be 3.8+

# Install dependencies
pip install -r api/requirements.txt

# Check diagnostics
python3 scripts/self_repair.py
```

**2. Frontend build errors:**
```bash
# Clear cache
rm -rf node_modules package-lock.json
npm install

# Check Node version
node --version  # Must be 18+
```

**3. API keys not working:**
```bash
# Verify .env file exists
cat .env

# Check key format
ANTHROPIC_API_KEY=sk-ant-...  # Must start with sk-ant-
GOOGLE_API_KEY=AIza...        # Must start with AIza
```

**4. Chrome app won't launch:**
```bash
# Check Chrome installation
which google-chrome

# Try with full path
/usr/bin/google-chrome --app=http://localhost:5173

# Verify servers are running
lsof -i:8000  # Backend
lsof -i:5173  # Frontend
```

**5. Port already in use:**
```bash
# Kill process on port
kill $(lsof -t -i:8000)
kill $(lsof -t -i:5173)

# Or change ports in .env and vite.config.ts
```

### Debug Mode

**Enable Detailed Logging:**
```typescript
// src/services/ai/logger.ts
export const AI_DEBUG = true;  // Change to true
```

View logs:
- Console: Browser DevTools
- LocalStorage: Application → Local Storage → ai_logs

### Self-Repair Tool

```bash
python3 scripts/self_repair.py
```

This will:
- Check Python/Node installation
- Verify dependencies
- Validate API keys
- Test backend endpoints
- Repair common issues
- Generate diagnostic report

---

## 📝 License

This project is private and proprietary.

---

## 🤝 Contributing

This is a private project. For authorized contributors:

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

---

## 📧 Support

For issues and questions:
- Create GitHub issue
- Check documentation in `/docs`
- Run `python3 scripts/self_repair.py` for diagnostics

---

## 🎯 Roadmap

- [ ] Add more AI providers (OpenAI, Mistral, etc.)
- [ ] Voice input/output
- [ ] Plugin system
- [ ] Mobile app (React Native)
- [ ] Cloud deployment
- [ ] Team collaboration features
- [ ] Advanced code execution sandbox

---

**Made with ❤️ using Claude AI and React**
