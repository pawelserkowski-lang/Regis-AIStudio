# 🚀 Regis AI Studio - Unified Launcher Guide

## Overview

The **Regis-Launch.ps1** is an all-in-one launcher that handles everything you need to run Regis AI Studio:

- ✅ **Requirements checking** (Python, Node.js, npm)
- ✅ **Auto-installation** of dependencies
- ✅ **API key configuration**
- ✅ **Port cleanup** (3000, 5173, 8000)
- ✅ **Server startup** (Backend + Frontend)
- ✅ **System tray integration** with menu
- ✅ **Chrome app mode** launch
- ✅ **Comprehensive logging** (startup, debug, chat, AI commands)
- ✅ **Auto-restart** on failures

---

## 🎯 Quick Start

### Method 1: Double-click (Easiest)
```
Double-click: Regis-Launch.bat
```

### Method 2: PowerShell
```powershell
powershell -ExecutionPolicy Bypass -File Regis-Launch.ps1
```

### Method 3: From PowerShell
```powershell
.\Regis-Launch.ps1
```

---

## 📋 What It Does

### Step 1: Requirements Check
- Verifies Python is installed
- Verifies Node.js is installed
- Verifies npm is installed
- Checks for `api/index.py` backend file
- Creates `.env` from `.env.example` if needed

### Step 2: Dependency Installation
- Installs Python packages: `anthropic`, `python-dotenv`, `google-generativeai`
- Installs npm dependencies if `node_modules` is missing

### Step 3: API Key Configuration
- Reads `ANTHROPIC_API_KEY` and `GOOGLE_API_KEY` from environment
- Updates `.env` file automatically (or prompts you to edit manually)

### Step 4: Port Cleanup
- Frees ports: 3000, 5173, 8000
- Kills old Node.js and Python processes

### Step 5: Server Startup
- Launches **Backend** on port 8000 (hidden terminal)
- Launches **Frontend** on port 5173 (hidden terminal)
- Waits for frontend to be ready (max 30 seconds)

### Step 6: Browser Launch
- Opens Chrome/Edge in **app mode** (standalone window)
- Falls back to default browser if Chrome/Edge not found

### Step 7: System Tray
- Hides the PowerShell console
- Adds Regis AI Studio icon to system tray
- Provides right-click menu:
  - 🌐 **Open App** - Opens the app in browser
  - ❤️ **Health Check** - Opens backend health endpoint
  - 📋 **View Logs** - Opens logs folder
  - 🔄 **Restart** - Restarts backend and frontend
  - ❌ **Quit** - Shuts down everything

---

## 📊 Logging

All logs are stored in the `logs/` directory:

| Log File | Purpose | Content |
|----------|---------|---------|
| `startup.log` | Startup process | Tracks each step of the launcher |
| `debug.log` | Debug output | Backend and frontend console output |
| `chat.log` | Chat interactions | User messages and AI responses |
| `ai-commands.log` | AI command execution | Commands executed by AI with results |
| `server_log.txt` | Backend server | HTTP requests and server events |

### Example Log Entries

**startup.log:**
```
[2025-12-13 10:30:15] [SUCCESS] Python check: Python 3.11.0
[2025-12-13 10:30:16] [SUCCESS] Node.js check: v20.10.0
[2025-12-13 10:30:17] [INFO] Installing Python packages...
```

**chat.log:**
```
[2025-12-13 10:35:42] [USER] Write a function to calculate fibonacci numbers
[2025-12-13 10:35:45] [ASSISTANT] Here's a Python function to calculate Fibonacci numbers...
```

**ai-commands.log:**
```
[2025-12-13 10:40:12]
Command: ls -la
Exit Code: 0
Result: total 48
drwxr-xr-x 10 user user 4096 Dec 13 10:40 .
drwxr-xr-x  3 user user 4096 Dec 13 10:30 ..
================================================================================
```

---

## 🔧 Configuration

### API Keys

Edit `.env` file:
```env
ANTHROPIC_API_KEY=sk-ant-your-key-here
GOOGLE_API_KEY=your-google-key-here
DEFAULT_AI_PROVIDER=claude
```

Or set environment variables before running:
```powershell
$env:ANTHROPIC_API_KEY = "sk-ant-your-key-here"
$env:GOOGLE_API_KEY = "your-google-key-here"
.\Regis-Launch.ps1
```

### Backend Port

Set in `.env`:
```env
BACKEND_PORT=8000
```

---

## 🎨 System Tray Menu

Once launched, find the Regis AI Studio icon in your system tray (near the clock).

**Right-click for menu:**
- 🌐 **Open App** - Opens http://localhost:5173 in browser
- ❤️ **Health Check** - Opens http://localhost:8000/api/health
- 📋 **View Logs** - Opens the `logs/` folder
- 🔄 **Restart** - Restarts both backend and frontend servers
- ❌ **Quit** - Shuts down all processes and exits

**Double-click the tray icon:**
- Opens the app in your default browser

---

## 🐛 Troubleshooting

### Frontend doesn't start
1. Check `logs/debug.log` for errors
2. Check if port 5173 is blocked by firewall
3. Try running manually: `npm run dev`

### Backend doesn't start
1. Check `logs/debug.log` for errors
2. Verify Python is installed: `python --version`
3. Verify dependencies: `pip list | grep anthropic`
4. Check API keys in `.env`

### System tray icon doesn't appear
1. The launcher needs a few seconds to start servers
2. Check if PowerShell window closed too early
3. Run manually and check for errors

### Logs not appearing
1. Check if `logs/` directory exists
2. Verify write permissions
3. Check `logs/startup.log` for initialization errors

---

## 🚦 Health Monitoring

### Check Backend Status
Visit: http://localhost:8000/api/health

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-12-13T10:30:00.000000",
  "anthropic_available": true
}
```

### Check Frontend Status
Visit: http://localhost:5173

Should show the Regis AI Studio interface.

---

## 🔄 Restart Options

### From System Tray
Right-click tray icon → **Restart**

### Manual Restart
1. Close the app from tray
2. Run `Regis-Launch.bat` again

### Hard Restart (if stuck)
```powershell
# Kill all processes
Get-Process -Name "node" | Stop-Process -Force
Get-Process -Name "python" | Where-Object { $_.CommandLine -like "*api/index.py*" } | Stop-Process -Force

# Restart
.\Regis-Launch.bat
```

---

## 📦 What Changed from Old Scripts?

### Before (Multiple Scripts):
- `setup.ps1` - Setup and launch
- `start-tray.ps1` - System tray version
- `electron/Regis-Setup.bat` - Electron setup
- `electron/Regis-Start.bat` - Electron start
- `scripts/start.py` - Python launcher

### After (Single Script):
- **Regis-Launch.ps1** - Does everything!
- **Regis-Launch.bat** - Simple wrapper for double-click

### Benefits:
✅ Single entry point
✅ Comprehensive logging
✅ Better error handling
✅ System tray integration
✅ Auto-restart capabilities
✅ Chrome app mode by default
✅ Cleaner project structure

---

## 🗑️ Old Files (Can be removed)

These files are now redundant:
- `setup.ps1` ❌
- `start-tray.ps1` ❌
- `electron/setup.ps1` ❌
- `electron/Regis-Setup.bat` ❌
- `electron/Regis-Start.bat` ❌
- `electron/stop-regis.bat` ❌
- `scripts/windows/Regis-Setup.bat` ❌

**Keep these:**
- `scripts/start.py` ✅ (Can still be used standalone)
- `scripts/self_repair.py` ✅ (Useful for diagnostics)

---

## 📱 Running as a Chrome App

The launcher automatically opens the app in Chrome/Edge **app mode**, which:
- Removes browser UI (address bar, tabs)
- Creates a standalone window
- Feels like a native desktop app

If you want to disable this, edit `Regis-Launch.ps1` and change:
```powershell
Start-Process $BrowserPath -ArgumentList "--app=http://localhost:5173", "--window-size=1400,900"
```
to:
```powershell
Start-Process "http://localhost:5173"
```

---

## 🔐 Security Notes

1. **API Keys**: Never commit `.env` to git (already in `.gitignore`)
2. **Logs**: Chat logs may contain sensitive information
3. **Ports**: Only exposed to localhost (127.0.0.1)
4. **Processes**: All hidden from taskbar, running in background

---

## 📞 Support

If you encounter issues:
1. Check `logs/startup.log` for startup errors
2. Check `logs/debug.log` for runtime errors
3. Check `logs/chat.log` for chat interaction issues
4. Run health check: http://localhost:8000/api/health

---

## 🎉 Enjoy!

Your Regis AI Studio is now easier to launch and monitor than ever before!

**Quick Links:**
- Frontend: http://localhost:5173
- Backend Health: http://localhost:8000/api/health
- Logs: `logs/` directory
