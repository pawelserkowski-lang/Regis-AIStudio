#!/usr/bin/env powershell
<#
.SYNOPSIS
    Regis AI Studio - Unified All-in-One Launcher
.DESCRIPTION
    Complete launcher with:
    - Requirements checking
    - Auto-installation of dependencies
    - Comprehensive logging (startup, debug, chat, AI commands)
    - System tray integration
    - Chrome app mode
    - Process monitoring
.NOTES
    Version: 3.0.0
    Author: Regis AI Studio Team
#>

#Requires -Version 5.1

# ============================================================================
# CONFIGURATION
# ============================================================================
$ErrorActionPreference = "Continue"
$ProjectRoot = $PSScriptRoot
$LogDir = Join-Path $ProjectRoot "logs"
$StartupLog = Join-Path $LogDir "startup.log"
$ChatLog = Join-Path $LogDir "chat.log"
$AICommandLog = Join-Path $LogDir "ai-commands.log"
$DebugLog = Join-Path $LogDir "debug.log"

# Ensure log directory exists
if (-not (Test-Path $LogDir)) {
    New-Item -ItemType Directory -Path $LogDir -Force | Out-Null
}

# ============================================================================
# LOGGING FUNCTIONS
# ============================================================================
function Write-Log {
    param(
        [string]$Message,
        [string]$Type = "INFO",
        [string]$LogFile = $StartupLog
    )
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $LogMessage = "[$Timestamp] [$Type] $Message"
    Add-Content -Path $LogFile -Value $LogMessage -Encoding UTF8

    # Also write to console with color
    $Color = switch ($Type) {
        "ERROR" { "Red" }
        "WARN"  { "Yellow" }
        "SUCCESS" { "Green" }
        "INFO"  { "Cyan" }
        default { "White" }
    }
    Write-Host $LogMessage -ForegroundColor $Color
}

function Write-ChatLog {
    param(
        [string]$Role,
        [string]$Message
    )
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $LogMessage = "[$Timestamp] [$Role] $Message"
    Add-Content -Path $ChatLog -Value $LogMessage -Encoding UTF8
}

function Write-AICommandLog {
    param(
        [string]$Command,
        [string]$Result
    )
    $Timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $LogMessage = @"
[$Timestamp]
Command: $Command
Result: $Result
---
"@
    Add-Content -Path $AICommandLog -Value $LogMessage -Encoding UTF8
}

# ============================================================================
# BANNER
# ============================================================================
function Show-Banner {
    Clear-Host
    Write-Host ""
    Write-Host "  ╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "  ║                                                            ║" -ForegroundColor Cyan
    Write-Host "  ║            🚀 REGIS AI STUDIO v3.0.0 🚀                   ║" -ForegroundColor Green
    Write-Host "  ║                                                            ║" -ForegroundColor Cyan
    Write-Host "  ║        All-in-One Launcher with System Tray               ║" -ForegroundColor Yellow
    Write-Host "  ║                                                            ║" -ForegroundColor Cyan
    Write-Host "  ╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host ""
}

# ============================================================================
# REQUIREMENTS CHECKING
# ============================================================================
function Test-Requirements {
    Write-Host ""
    Write-Host "  ═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "   STEP 1: Checking Requirements" -ForegroundColor Green
    Write-Host "  ═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""

    $AllOK = $true

    # Check Python
    Write-Host "  [1/5] Checking Python..." -NoNewline
    try {
        $PyVersion = python --version 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host " ✅ $PyVersion" -ForegroundColor Green
            Write-Log "Python check: $PyVersion" "SUCCESS"
        } else {
            throw "Python not found"
        }
    } catch {
        Write-Host " ❌ NOT FOUND" -ForegroundColor Red
        Write-Log "Python not found" "ERROR"
        $AllOK = $false
    }

    # Check Node.js
    Write-Host "  [2/5] Checking Node.js..." -NoNewline
    try {
        $NodeVersion = node --version 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host " ✅ $NodeVersion" -ForegroundColor Green
            Write-Log "Node.js check: $NodeVersion" "SUCCESS"
        } else {
            throw "Node.js not found"
        }
    } catch {
        Write-Host " ❌ NOT FOUND" -ForegroundColor Red
        Write-Log "Node.js not found" "ERROR"
        $AllOK = $false
    }

    # Check npm
    Write-Host "  [3/5] Checking npm..." -NoNewline
    try {
        $NpmVersion = npm --version 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host " ✅ v$NpmVersion" -ForegroundColor Green
            Write-Log "npm check: v$NpmVersion" "SUCCESS"
        } else {
            throw "npm not found"
        }
    } catch {
        Write-Host " ❌ NOT FOUND" -ForegroundColor Red
        Write-Log "npm not found" "ERROR"
        $AllOK = $false
    }

    # Check Backend File
    Write-Host "  [4/5] Checking Backend..." -NoNewline
    if (Test-Path "api/index.py") {
        Write-Host " ✅ Found" -ForegroundColor Green
        Write-Log "Backend file found: api/index.py" "SUCCESS"
    } else {
        Write-Host " ❌ NOT FOUND (api/index.py)" -ForegroundColor Red
        Write-Log "Backend file not found: api/index.py" "ERROR"
        $AllOK = $false
    }

    # Check .env file
    Write-Host "  [5/5] Checking .env file..." -NoNewline
    if (-not (Test-Path ".env")) {
        if (Test-Path ".env.example") {
            Copy-Item ".env.example" ".env"
            Write-Host " ⚠️  Created from .env.example" -ForegroundColor Yellow
            Write-Log "Created .env from .env.example" "WARN"
        } else {
            Write-Host " ❌ NOT FOUND" -ForegroundColor Red
            Write-Log ".env file not found" "ERROR"
            $AllOK = $false
        }
    } else {
        Write-Host " ✅ Found" -ForegroundColor Green
        Write-Log ".env file exists" "SUCCESS"
    }

    Write-Host ""
    return $AllOK
}

# ============================================================================
# DEPENDENCY INSTALLATION
# ============================================================================
function Install-Dependencies {
    Write-Host ""
    Write-Host "  ═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "   STEP 2: Installing Dependencies" -ForegroundColor Green
    Write-Host "  ═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""

    # Install Python packages
    Write-Host "  [1/2] Installing Python packages..." -ForegroundColor Cyan
    Write-Log "Installing Python packages: anthropic, python-dotenv, google-generativeai" "INFO"

    # Try with --break-system-packages first (for system Python)
    $null = pip install anthropic python-dotenv google-generativeai --break-system-packages -q 2>&1
    if ($LASTEXITCODE -ne 0) {
        # Fallback without --break-system-packages
        $null = pip install anthropic python-dotenv google-generativeai -q 2>&1
    }
    Write-Host "        ✅ Python packages installed" -ForegroundColor Green
    Write-Log "Python packages installed successfully" "SUCCESS"

    # Install Node modules
    Write-Host "  [2/2] Checking node_modules..." -ForegroundColor Cyan
    if (-not (Test-Path "node_modules")) {
        Write-Host "        Installing npm dependencies..." -ForegroundColor Yellow
        Write-Log "Installing npm dependencies" "INFO"
        $null = npm install 2>&1
        Write-Host "        ✅ npm dependencies installed" -ForegroundColor Green
        Write-Log "npm dependencies installed successfully" "SUCCESS"
    } else {
        Write-Host "        ✅ node_modules exists" -ForegroundColor Green
        Write-Log "node_modules already exists" "INFO"
    }

    Write-Host ""
}

# ============================================================================
# API KEY CONFIGURATION
# ============================================================================
function Set-APIKeys {
    Write-Host ""
    Write-Host "  ═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "   STEP 3: Checking API Keys" -ForegroundColor Green
    Write-Host "  ═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""

    $AnthropicKey = $env:ANTHROPIC_API_KEY
    $GoogleKey = $env:GOOGLE_API_KEY

    # Update .env file if environment variables are set
    if ($AnthropicKey -or $GoogleKey) {
        $EnvContent = Get-Content ".env" -Raw -ErrorAction SilentlyContinue

        if ($AnthropicKey) {
            $EnvContent = $EnvContent -replace "ANTHROPIC_API_KEY=.*", "ANTHROPIC_API_KEY=$AnthropicKey"
            Write-Host "  ✅ ANTHROPIC_API_KEY configured" -ForegroundColor Green
            Write-Log "ANTHROPIC_API_KEY configured from environment" "SUCCESS"
        }

        if ($GoogleKey) {
            $EnvContent = $EnvContent -replace "GOOGLE_API_KEY=.*", "GOOGLE_API_KEY=$GoogleKey"
            Write-Host "  ✅ GOOGLE_API_KEY configured" -ForegroundColor Green
            Write-Log "GOOGLE_API_KEY configured from environment" "SUCCESS"
        }

        $EnvContent | Set-Content ".env" -NoNewline
    } else {
        Write-Host "  ⚠️  No API keys in environment variables" -ForegroundColor Yellow
        Write-Host "     Please edit .env file manually" -ForegroundColor Yellow
        Write-Log "No API keys found in environment, user needs to configure .env manually" "WARN"
    }

    Write-Host ""
}

# ============================================================================
# PORT CLEANUP
# ============================================================================
function Clear-Ports {
    Write-Host ""
    Write-Host "  ═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "   STEP 4: Cleaning Up Ports" -ForegroundColor Green
    Write-Host "  ═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""

    Write-Log "Cleaning up ports: 3000, 5173, 8000" "INFO"

    $Ports = @(3000, 5173, 8000)
    foreach ($Port in $Ports) {
        $Connections = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue
        if ($Connections) {
            foreach ($Conn in $Connections) {
                Stop-Process -Id $Conn.OwningProcess -Force -ErrorAction SilentlyContinue
                Write-Host "  ✅ Freed port $Port" -ForegroundColor Green
                Write-Log "Freed port $Port (PID: $($Conn.OwningProcess))" "SUCCESS"
            }
        }
    }

    # Kill old Node processes
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue
    Get-Process -Name "python" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*api/index.py*" } | Stop-Process -Force -ErrorAction SilentlyContinue

    Write-Host "  ✅ Ports cleaned" -ForegroundColor Green
    Write-Host ""
}

# ============================================================================
# FIND BROWSER
# ============================================================================
function Find-Browser {
    Write-Log "Searching for browser (Chrome/Edge)" "INFO"

    # Chrome paths
    $ChromePaths = @(
        "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
        "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
        "$env:LocalAppData\Google\Chrome\Application\chrome.exe"
    )

    foreach ($Path in $ChromePaths) {
        if (Test-Path $Path) {
            Write-Log "Found Chrome: $Path" "SUCCESS"
            return $Path
        }
    }

    # Edge paths
    $EdgePaths = @(
        "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe",
        "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe"
    )

    foreach ($Path in $EdgePaths) {
        if (Test-Path $Path) {
            Write-Log "Found Edge: $Path" "SUCCESS"
            return $Path
        }
    }

    Write-Log "No Chrome or Edge found, will use default browser" "WARN"
    return $null
}

# ============================================================================
# START SERVERS
# ============================================================================
function Start-Servers {
    Write-Host ""
    Write-Host "  ═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "   STEP 5: Starting Servers" -ForegroundColor Green
    Write-Host "  ═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""

    # Start Backend (port 8000)
    Write-Host "  [1/2] Starting Backend API (port 8000)..." -ForegroundColor Cyan
    Write-Log "Starting Backend on port 8000" "INFO"

    $BackendArgs = "/c title REGIS-Backend && cd /d `"$ProjectRoot`" && python api/index.py 2>&1 | tee -Append `"$DebugLog`""
    $global:BackendProcess = Start-Process cmd -ArgumentList $BackendArgs -WindowStyle Hidden -PassThru

    Write-Host "        ✅ Backend started (PID: $($global:BackendProcess.Id))" -ForegroundColor Green
    Write-Log "Backend started with PID: $($global:BackendProcess.Id)" "SUCCESS"
    Start-Sleep -Seconds 3

    # Start Frontend (port 5173)
    Write-Host "  [2/2] Starting Frontend Vite (port 5173)..." -ForegroundColor Cyan
    Write-Log "Starting Frontend on port 5173" "INFO"

    $FrontendArgs = "/c title REGIS-Frontend && cd /d `"$ProjectRoot`" && npm run dev 2>&1 | tee -Append `"$DebugLog`""
    $global:FrontendProcess = Start-Process cmd -ArgumentList $FrontendArgs -WindowStyle Hidden -PassThru

    Write-Host "        ✅ Frontend started (PID: $($global:FrontendProcess.Id))" -ForegroundColor Green
    Write-Log "Frontend started with PID: $($global:FrontendProcess.Id)" "SUCCESS"

    # Wait for frontend to be ready
    Write-Host ""
    Write-Host "  Waiting for frontend to be ready" -NoNewline -ForegroundColor Yellow

    $MaxWait = 30
    $Waited = 0
    $Ready = $false

    while ($Waited -lt $MaxWait) {
        Start-Sleep -Seconds 1
        $Waited++
        Write-Host "." -NoNewline -ForegroundColor Yellow

        try {
            $Response = Invoke-WebRequest -Uri "http://localhost:5173" -TimeoutSec 1 -ErrorAction SilentlyContinue
            if ($Response.StatusCode -eq 200) {
                $Ready = $true
                break
            }
        } catch {
            # Continue waiting
        }
    }

    Write-Host ""
    Write-Host ""

    if ($Ready) {
        Write-Host "  ✅ Frontend is ready!" -ForegroundColor Green
        Write-Log "Frontend is ready and responding" "SUCCESS"
        return $true
    } else {
        Write-Host "  ⚠️  Frontend did not respond within ${MaxWait}s" -ForegroundColor Yellow
        Write-Host "     Check the REGIS-Frontend window for errors" -ForegroundColor Yellow
        Write-Log "Frontend did not respond within ${MaxWait}s" "WARN"
        return $false
    }
}

# ============================================================================
# SYSTEM TRAY SETUP
# ============================================================================
function Start-SystemTray {
    Add-Type -AssemblyName System.Windows.Forms
    Add-Type -AssemblyName System.Drawing

    Write-Log "Setting up system tray icon" "INFO"

    # Create icon
    $global:TrayIcon = New-Object System.Windows.Forms.NotifyIcon
    $global:TrayIcon.Icon = [System.Drawing.SystemIcons]::Application
    $global:TrayIcon.Text = "Regis AI Studio v3.0"
    $global:TrayIcon.Visible = $true

    # Create context menu
    $ContextMenu = New-Object System.Windows.Forms.ContextMenuStrip

    # Open menu item
    $OpenItem = New-Object System.Windows.Forms.ToolStripMenuItem
    $OpenItem.Text = "🌐 Open App"
    $OpenItem.Add_Click({
        $BrowserPath = Find-Browser
        if ($BrowserPath) {
            Start-Process $BrowserPath -ArgumentList "--app=http://localhost:5173"
        } else {
            Start-Process "http://localhost:5173"
        }
    })
    $ContextMenu.Items.Add($OpenItem) | Out-Null

    # Health check menu item
    $HealthItem = New-Object System.Windows.Forms.ToolStripMenuItem
    $HealthItem.Text = "❤️ Health Check"
    $HealthItem.Add_Click({
        Start-Process "http://localhost:8000/api/health"
    })
    $ContextMenu.Items.Add($HealthItem) | Out-Null

    # View logs menu item
    $LogsItem = New-Object System.Windows.Forms.ToolStripMenuItem
    $LogsItem.Text = "📋 View Logs"
    $LogsItem.Add_Click({
        Start-Process "explorer.exe" -ArgumentList $LogDir
    })
    $ContextMenu.Items.Add($LogsItem) | Out-Null

    $ContextMenu.Items.Add("-") | Out-Null

    # Restart menu item
    $RestartItem = New-Object System.Windows.Forms.ToolStripMenuItem
    $RestartItem.Text = "🔄 Restart"
    $RestartItem.Add_Click({
        Write-Log "Restarting via system tray" "INFO"

        # Kill processes
        if ($global:BackendProcess -and -not $global:BackendProcess.HasExited) {
            $global:BackendProcess.Kill()
        }
        if ($global:FrontendProcess -and -not $global:FrontendProcess.HasExited) {
            $global:FrontendProcess.Kill()
        }

        Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force

        Start-Sleep -Seconds 2

        # Restart
        Start-Servers
    })
    $ContextMenu.Items.Add($RestartItem) | Out-Null

    $ContextMenu.Items.Add("-") | Out-Null

    # Quit menu item
    $QuitItem = New-Object System.Windows.Forms.ToolStripMenuItem
    $QuitItem.Text = "❌ Quit"
    $QuitItem.Add_Click({
        Write-Log "Shutting down via system tray" "INFO"

        # Kill processes
        if ($global:BackendProcess -and -not $global:BackendProcess.HasExited) {
            $global:BackendProcess.Kill()
        }
        if ($global:FrontendProcess -and -not $global:FrontendProcess.HasExited) {
            $global:FrontendProcess.Kill()
        }

        Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force

        # Clean up tray icon
        $global:TrayIcon.Visible = $false
        $global:TrayIcon.Dispose()

        Write-Log "Regis AI Studio shut down" "INFO"
        [System.Windows.Forms.Application]::Exit()
    })
    $ContextMenu.Items.Add($QuitItem) | Out-Null

    $global:TrayIcon.ContextMenuStrip = $ContextMenu

    # Double-click to open
    $global:TrayIcon.Add_DoubleClick({
        $BrowserPath = Find-Browser
        if ($BrowserPath) {
            Start-Process $BrowserPath -ArgumentList "--app=http://localhost:5173"
        } else {
            Start-Process "http://localhost:5173"
        }
    })

    # Show notification
    $global:TrayIcon.ShowBalloonTip(
        3000,
        "Regis AI Studio",
        "Running! Right-click the icon for options.",
        [System.Windows.Forms.ToolTipIcon]::Info
    )

    Write-Log "System tray icon created" "SUCCESS"
}

# ============================================================================
# LAUNCH BROWSER
# ============================================================================
function Start-Browser {
    Write-Host ""
    Write-Host "  ═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "   STEP 6: Launching Browser" -ForegroundColor Green
    Write-Host "  ═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host ""

    $BrowserPath = Find-Browser

    if ($BrowserPath) {
        Write-Host "  🌐 Opening in Chrome/Edge app mode..." -ForegroundColor Cyan
        Write-Log "Launching browser in app mode: $BrowserPath" "INFO"
        Start-Process $BrowserPath -ArgumentList "--app=http://localhost:5173", "--window-size=1400,900"
    } else {
        Write-Host "  🌐 Opening in default browser..." -ForegroundColor Cyan
        Write-Log "Launching default browser" "INFO"
        Start-Process "http://localhost:5173"
    }

    Write-Host ""
}

# ============================================================================
# HIDE CONSOLE WINDOW
# ============================================================================
function Hide-Console {
    Add-Type -Name Window -Namespace Native -MemberDefinition @'
[DllImport("user32.dll")]
public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
[DllImport("kernel32.dll")]
public static extern IntPtr GetConsoleWindow();
'@

    $ConsoleWindow = [Native.Window]::GetConsoleWindow()
    [Native.Window]::ShowWindow($ConsoleWindow, 0) | Out-Null

    Write-Log "Console window hidden" "INFO"
}

# ============================================================================
# MAIN EXECUTION
# ============================================================================
function Main {
    Show-Banner

    Write-Log "=== Regis AI Studio v3.0.0 Starting ===" "INFO"

    # Step 1: Check requirements
    if (-not (Test-Requirements)) {
        Write-Host "  ❌ Requirements check failed. Please fix the issues above." -ForegroundColor Red
        Write-Log "Requirements check failed, aborting" "ERROR"
        Read-Host "Press Enter to exit"
        exit 1
    }

    # Step 2: Install dependencies
    Install-Dependencies

    # Step 3: Configure API keys
    Set-APIKeys

    # Step 4: Clean ports
    Clear-Ports

    # Step 5: Start servers
    if (-not (Start-Servers)) {
        Write-Host "  ⚠️  Servers started but frontend may have issues" -ForegroundColor Yellow
        Write-Log "Servers started with warnings" "WARN"
    }

    # Step 6: Launch browser
    Start-Browser

    # Success message
    Write-Host ""
    Write-Host "  ╔════════════════════════════════════════════════════════════╗" -ForegroundColor Green
    Write-Host "  ║                                                            ║" -ForegroundColor Green
    Write-Host "  ║          ✅ REGIS AI STUDIO IS RUNNING! ✅                ║" -ForegroundColor Green
    Write-Host "  ║                                                            ║" -ForegroundColor Green
    Write-Host "  ╚════════════════════════════════════════════════════════════╝" -ForegroundColor Green
    Write-Host ""
    Write-Host "  📊 Frontend:  http://localhost:5173" -ForegroundColor Cyan
    Write-Host "  📊 Backend:   http://localhost:8000" -ForegroundColor Cyan
    Write-Host "  📋 Logs:      $LogDir" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  💡 The app is now in your system tray!" -ForegroundColor Yellow
    Write-Host "     Right-click the tray icon for options." -ForegroundColor Yellow
    Write-Host ""

    Write-Log "=== Regis AI Studio v3.0.0 Started Successfully ===" "SUCCESS"

    # Setup system tray
    Start-SystemTray

    # Hide console
    Start-Sleep -Seconds 2
    Hide-Console

    # Keep script running
    [System.Windows.Forms.Application]::Run()
}

# ============================================================================
# RUN
# ============================================================================
Main
