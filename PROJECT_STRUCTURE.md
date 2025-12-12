# Project Structure

## Overview

Regis AI Studio follows a clean, modular architecture with clear separation of concerns.

```
Regis-AIStudio/
├── api/                          # Backend API
│   ├── index.py                  # Main HTTP server
│   └── local_server.py          # Alternative local server
│
├── src/                          # Frontend source
│   ├── components/              # React components
│   │   ├── ChatArea.tsx
│   │   ├── Sidebar.tsx
│   │   ├── Registry.tsx
│   │   └── ...
│   │
│   ├── services/                # Service layer
│   │   ├── ai/                  # Modular AI service
│   │   │   ├── index.ts         # Main AI service API
│   │   │   ├── config.ts        # Configuration management
│   │   │   ├── logger.ts        # Logging system
│   │   │   ├── types.ts         # Internal types
│   │   │   └── providers/       # AI providers
│   │   │       ├── claude.ts    # Claude (Anthropic)
│   │   │       └── gemini.ts    # Gemini (Google)
│   │   │
│   │   └── geminiService.ts     # Legacy Gemini service
│   │
│   ├── types.ts                 # Shared TypeScript types
│   ├── App.tsx                  # Main application
│   └── main.tsx                 # Entry point
│
├── scripts/                      # Utility scripts
│   ├── start.py                 # Main launcher
│   ├── self_repair.py           # Diagnostics & repair
│   ├── windows/                 # Windows batch scripts
│   │   ├── Regis-Start.bat
│   │   ├── set-api-keys.bat
│   │   └── ...
│   └── README.md                # Scripts documentation
│
├── public/                       # Static assets
├── docs/                         # Documentation
├── tests/                        # Test files
├── electron/                     # Electron configuration
│
├── .env.example                 # Environment template
├── package.json                 # Node dependencies
├── tsconfig.json                # TypeScript config
├── vite.config.ts               # Vite configuration
└── tailwind.config.js           # Tailwind CSS config
```

## Architecture Principles

### 1. Modular AI Service
The AI service (`src/services/ai/`) is split into focused modules:
- **config.ts**: Manages API configuration and backend communication
- **logger.ts**: Centralized logging system with localStorage persistence
- **providers/**: Individual modules for each AI provider
- **index.ts**: Public API that orchestrates all modules

### 2. Separation of Concerns
- **Backend** (`api/`): Python HTTP server handling API requests
- **Frontend** (`src/`): React SPA with TypeScript
- **Scripts** (`scripts/`): Development and deployment utilities

### 3. Type Safety
- Shared types in `src/types.ts`
- Internal types in `src/services/ai/types.ts`
- Full TypeScript coverage

### 4. Provider Pattern
Each AI provider is self-contained:
- Independent initialization
- Provider-specific configuration
- Isolated error handling
- Easy to add new providers

## Key Features

### Dual-AI Support
- **Claude (Anthropic)**: Primary provider with streaming
- **Gemini (Google)**: Secondary provider with vision support
- **Automatic Fallback**: Switches providers on failure

### Streaming Support
Both providers support real-time streaming responses with token-by-token delivery.

### Comprehensive Logging
All operations are logged with:
- Timestamp
- Log level (INFO, WARN, ERROR, DEBUG)
- Source module
- Contextual data

### Configuration Management
- Environment-based configuration (`.env`)
- Runtime provider switching
- Model selection per provider

## Usage

### Starting the Application

```bash
# Development mode
npm run dev

# With Python backend
python scripts/start.py
```

### Building for Production

```bash
npm run build
```

### Running Tests

```bash
npm run test:all
```

## Migration Guide

If upgrading from the old monolithic structure:

1. **AI Service**: Import from `src/services/ai` instead of `src/services/aiService`
   ```typescript
   // Old
   import { initializeAI } from './services/aiService';

   // New
   import { initializeAI } from './services/ai';
   ```

2. **Scripts**: Use scripts from `scripts/` directory
   ```bash
   # Old
   python start.py

   # New
   python scripts/start.py
   ```

3. **Batch Files**: Located in `scripts/windows/`
   ```cmd
   REM Old
   Regis-Start.bat

   REM New
   scripts\windows\Regis-Start.bat
   ```

## Development Workflow

1. **Frontend Development**: `npm run dev`
2. **Backend Development**: `python scripts/start.py`
3. **Type Checking**: `npm run build` (includes tsc)
4. **Linting**: `npm run lint`

## Contributing

When adding new features:
1. Keep modules small and focused
2. Add types for all public APIs
3. Include error handling
4. Add logging for operations
5. Update this documentation
