# Scripts Directory

This directory contains utility scripts for managing and running Regis AI Studio.

## Python Scripts

### `start.py`
Main launcher with auto-debug and auto-restart functionality.

**Usage:**
```bash
python scripts/start.py           # Start backend with auto-debugging
python scripts/start.py --check   # Check environment only
python scripts/start.py --help    # Show help
```

**Features:**
- Automatic environment checking
- Auto-restart on failures
- Color-coded logging
- Health monitoring

### `self_repair.py`
Matrix-style diagnostics and automatic repair system.

**Usage:**
```bash
python scripts/self_repair.py
```

**Features:**
- Comprehensive system diagnostics
- Automatic dependency installation
- Configuration validation
- Matrix-themed UI

## Windows Scripts (`windows/`)

### `Regis-Start.bat`
Main launcher for Windows users.

### `Regis-Setup.bat`
Initial setup script for Windows.

### `Regis-App.bat` / `Regis-App-Edge.bat`
Application launchers for different browsers.

### `set-api-keys.bat`
Interactive script to configure API keys.

### `start-regis.bat` / `stop-regis.bat`
Start and stop the backend server.

## Notes

- All Python scripts should be run from the project root directory
- Windows scripts automatically handle path resolution
- Check `.env.example` for required environment variables
