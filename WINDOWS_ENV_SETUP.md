# Windows Environment Variables Setup Guide

This guide explains how to set up API keys using Windows system environment variables instead of (or in addition to) the `.env` file.

## Why Use System Environment Variables?

- **Security**: Keys are stored in Windows security system, not in files
- **Persistence**: Available across all terminal sessions and applications
- **Centralization**: One place to manage all API keys for multiple projects

## Required API Keys

- `ANTHROPIC_API_KEY` - For Claude AI (required)
- `GOOGLE_API_KEY` - For Google Gemini AI (optional)

## Setting Environment Variables on Windows

### Option 1: GUI Method (Permanent)

1. **Open System Properties:**
   - Press `Win + R`
   - Type `sysdm.cpl` and press Enter
   - Or right-click "This PC" → Properties → Advanced system settings

2. **Access Environment Variables:**
   - Click "Advanced" tab
   - Click "Environment Variables" button at the bottom

3. **Add User Variables** (recommended) or System Variables:
   - Click "New" under "User variables"
   - Variable name: `ANTHROPIC_API_KEY`
   - Variable value: `sk-ant-your-actual-key-here`
   - Click OK

   - Repeat for `GOOGLE_API_KEY` if using Gemini

4. **Apply Changes:**
   - Click OK on all dialogs
   - **Restart any open terminals/PowerShell windows** for changes to take effect

### Option 2: PowerShell Command (Session Only)

For temporary session-only variables:

```powershell
# Set for current PowerShell session
$env:ANTHROPIC_API_KEY = "sk-ant-your-actual-key-here"
$env:GOOGLE_API_KEY = "your-gemini-key-here"
```

### Option 3: PowerShell Command (Permanent - User Level)

```powershell
# Run PowerShell as Administrator
[System.Environment]::SetEnvironmentVariable('ANTHROPIC_API_KEY', 'sk-ant-your-actual-key-here', 'User')
[System.Environment]::SetEnvironmentVariable('GOOGLE_API_KEY', 'your-gemini-key-here', 'User')

# Restart PowerShell to load new variables
```

### Option 4: PowerShell Command (Permanent - System Level)

```powershell
# Run PowerShell as Administrator
[System.Environment]::SetEnvironmentVariable('ANTHROPIC_API_KEY', 'sk-ant-your-actual-key-here', 'Machine')
[System.Environment]::SetEnvironmentVariable('GOOGLE_API_KEY', 'your-gemini-key-here', 'Machine')

# Restart PowerShell to load new variables
```

## Verifying Environment Variables

### Check if variables are set:

```powershell
# View specific variable
echo $env:ANTHROPIC_API_KEY
echo $env:GOOGLE_API_KEY

# List all environment variables
Get-ChildItem Env: | Where-Object { $_.Name -like "*API_KEY*" }
```

### Expected output:
```
sk-ant-your-actual-key-here  (first 20-30 chars shown)
```

If you see the actual key value, it's configured correctly!

## Priority Order

The application loads API keys in this order:

1. **System/User Environment Variables** (highest priority)
2. **`.env` file** in project root
3. **`.env.example`** (template only, not used for actual keys)

If a key exists in both places, the **environment variable takes precedence**.

## Security Best Practices

### ✅ DO:
- Use User-level variables (not System-level) unless needed by all users
- Keep your API keys private and never commit them to Git
- Regenerate keys if accidentally exposed
- Use `.env` for local development, system variables for production

### ❌ DON'T:
- Don't share your `.env` file or environment variables
- Don't commit `.env` to version control (already in `.gitignore`)
- Don't store keys in plain text files in shared locations
- Don't use the same keys across multiple projects/environments

## Testing Your Setup

After setting environment variables, test the application:

```powershell
# Launch the application
.\Regis-Launch.ps1

# Or test with Python directly
python -c "import os; print('Anthropic:', bool(os.getenv('ANTHROPIC_API_KEY'))); print('Google:', bool(os.getenv('GOOGLE_API_KEY')))"
```

Expected output:
```
Anthropic: True
Google: True  (or False if not using Gemini)
```

## Troubleshooting

### "API key not found" error

1. **Restart your terminal** - Environment variables require new sessions
2. **Check variable name** - Must be exactly `ANTHROPIC_API_KEY` (case-sensitive on some systems)
3. **Verify value** - Run `echo $env:ANTHROPIC_API_KEY` to see if it's set
4. **Check .env file** - Ensure no typos in variable names

### Variables not persisting

- Use the GUI method or `[System.Environment]::SetEnvironmentVariable()` for persistence
- `$env:VAR = "value"` only works for the current session

### Permission errors

- Run PowerShell as Administrator for System-level variables
- User-level variables don't require admin rights

## Alternative: Docker Environment Variables

If using Docker, you can pass environment variables in `docker-compose.yml`:

```yaml
services:
  regis-backend:
    environment:
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - GOOGLE_API_KEY=${GOOGLE_API_KEY}
```

This will read from your Windows environment variables automatically.

## Additional Configuration

Optional environment variables:

```powershell
$env:DEFAULT_AI_PROVIDER = "claude"    # or "gemini"
$env:BACKEND_PORT = "8000"
$env:SAFE_MODE = "false"
$env:COMMAND_TIMEOUT = "300"
$env:ENABLE_LOGGING = "true"
```

## Getting API Keys

### Anthropic Claude API Key
1. Visit: https://console.anthropic.com/
2. Sign up or log in
3. Navigate to API Keys section
4. Create a new key
5. Format: `sk-ant-api03-...` (starts with `sk-ant-`)

### Google Gemini API Key
1. Visit: https://makersuite.google.com/app/apikey
2. Sign in with Google account
3. Click "Create API Key"
4. Copy the generated key
5. Format: 39-character alphanumeric string

## Summary

**Recommended approach:**
- **Local Development**: Use `.env` file (easier to manage per-project)
- **Production/Shared**: Use Windows system environment variables (more secure)
- **Docker**: Use docker-compose environment configuration

The application supports all three methods, giving you flexibility based on your deployment scenario!
