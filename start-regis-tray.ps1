# Regis AI Studio - System Tray Launcher

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

# Sciezka do projektu
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
$projectPath = $scriptPath

# Sprawdz czy jestesmy w folderze projektu
if (-not (Test-Path (Join-Path $projectPath "api\index.py"))) {
    [System.Windows.Forms.MessageBox]::Show(
        "Nie znaleziono api/index.py!",
        "Regis AI Studio - Blad",
        [System.Windows.Forms.MessageBoxButtons]::OK,
        [System.Windows.Forms.MessageBoxIcon]::Error
    )
    exit
}

# Globalne zmienne dla procesow
$global:backendProcess = $null
$global:frontendProcess = $null

# Funkcja uruchamiania serwerow
function Start-Servers {
    $global:backendProcess = Start-Process -FilePath "cmd.exe" `
        -ArgumentList "/c cd /d `"$projectPath`" && python api/index.py" `
        -WindowStyle Hidden -PassThru

    Start-Sleep -Seconds 2

    $global:frontendProcess = Start-Process -FilePath "cmd.exe" `
        -ArgumentList "/c cd /d `"$projectPath`" && npm run dev" `
        -WindowStyle Hidden -PassThru

    Start-Sleep -Seconds 3

    Start-Process "http://localhost:5173"
}

# Funkcja zatrzymywania serwerow
function Stop-Servers {
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
    
    if ($global:backendProcess -and !$global:backendProcess.HasExited) {
        $global:backendProcess | Stop-Process -Force
    }
    if ($global:frontendProcess -and !$global:frontendProcess.HasExited) {
        $global:frontendProcess | Stop-Process -Force
    }
}

# Utworz ikone w zasobniku
$notifyIcon = New-Object System.Windows.Forms.NotifyIcon
$notifyIcon.Icon = [System.Drawing.SystemIcons]::Application
$notifyIcon.Text = "Regis AI Studio"
$notifyIcon.Visible = $true

# Menu kontekstowe
$contextMenu = New-Object System.Windows.Forms.ContextMenuStrip

$menuOpen = New-Object System.Windows.Forms.ToolStripMenuItem
$menuOpen.Text = "Otworz aplikacje"
$menuOpen.Add_Click({ Start-Process "http://localhost:5173" })
$contextMenu.Items.Add($menuOpen)

$menuStatus = New-Object System.Windows.Forms.ToolStripMenuItem
$menuStatus.Text = "Health Check"
$menuStatus.Add_Click({ Start-Process "http://localhost:8000/api/health" })
$contextMenu.Items.Add($menuStatus)

$contextMenu.Items.Add("-")

$menuRestart = New-Object System.Windows.Forms.ToolStripMenuItem
$menuRestart.Text = "Restart serwerow"
$menuRestart.Add_Click({
    Stop-Servers
    Start-Sleep -Seconds 2
    Start-Servers
    $notifyIcon.ShowBalloonTip(3000, "Regis AI Studio", "Serwery zrestartowane!", [System.Windows.Forms.ToolTipIcon]::Info)
})
$contextMenu.Items.Add($menuRestart)

$contextMenu.Items.Add("-")

$menuExit = New-Object System.Windows.Forms.ToolStripMenuItem
$menuExit.Text = "Zamknij Regis"
$menuExit.Add_Click({
    Stop-Servers
    $notifyIcon.Visible = $false
    $notifyIcon.Dispose()
    [System.Windows.Forms.Application]::Exit()
})
$contextMenu.Items.Add($menuExit)

$notifyIcon.ContextMenuStrip = $contextMenu

$notifyIcon.Add_DoubleClick({ Start-Process "http://localhost:5173" })

# Uruchom serwery
Start-Servers

# Powiadomienie
$notifyIcon.ShowBalloonTip(
    5000,
    "Regis AI Studio",
    "Uruchomiony! Frontend: localhost:5173",
    [System.Windows.Forms.ToolTipIcon]::Info
)

# Ukryj okno PowerShell
$windowCode = @"
[DllImport("user32.dll")]
public static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
[DllImport("kernel32.dll")]
public static extern IntPtr GetConsoleWindow();
"@
$win = Add-Type -MemberDefinition $windowCode -Name "Win32" -Namespace "Native" -PassThru
$win::ShowWindow($win::GetConsoleWindow(), 0) | Out-Null

[System.Windows.Forms.Application]::Run()
