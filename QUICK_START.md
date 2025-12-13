# 🚀 Quick Start Guide - Regis AI Studio v3.0

## Launch the App (3 Simple Steps)

### Step 1: Configure API Keys
Edit `.env` file:
```env
ANTHROPIC_API_KEY=sk-ant-your-key-here
GOOGLE_API_KEY=your-google-key-here
```

### Step 2: Launch
Double-click:
```
Regis-Launch.bat
```

### Step 3: Use the App!
- App opens automatically in browser
- System tray icon appears (near clock)
- All servers running in background

---

## What Happens Automatically?

✅ Checks Python, Node.js, npm
✅ Installs missing dependencies
✅ Starts backend (port 8000)
✅ Starts frontend (port 5173)
✅ Opens Chrome/Edge in app mode
✅ Adds system tray icon

---

## System Tray Control

**Right-click the tray icon:**
- 🌐 **Open App** - Opens the interface
- ❤️ **Health Check** - Verify backend is running
- 📋 **View Logs** - Opens logs folder
- 🔄 **Restart** - Restart all services
- ❌ **Quit** - Shut down everything

---

## View Logs

All logs are in the `logs/` folder:
- `startup.log` - Startup process
- `chat.log` - Your conversations
- `ai-commands.log` - Commands AI executed
- `debug.log` - Technical details

---

## Troubleshooting

**Problem:** Frontend doesn't load
**Fix:** Wait 30 seconds, check `logs/debug.log`

**Problem:** "API key not configured"
**Fix:** Edit `.env` file with your Claude API key

**Problem:** System tray icon missing
**Fix:** Check if PowerShell window closed, run `Regis-Launch.bat` again

---

## Full Documentation

- **Complete Guide:** `LAUNCHER_README.md`
- **What Changed:** `REORGANIZATION_SUMMARY.md`
- **Future Ideas:** `OPTIMIZATION_SUGGESTIONS.md`

---

**Enjoy Regis AI Studio! 🎉**
