Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

$projectPath = Split-Path -Parent $MyInvocation.MyCommand.Path

if (-not (Test-Path "$projectPath\api\index.py")) {
    [System.Windows.Forms.MessageBox]::Show("Nie znaleziono api\index.py!", "Blad", 0, 16) | Out-Null
    exit
}

$backend = Start-Process cmd -ArgumentList "/c cd /d `"$projectPath`" && python api/index.py" -WindowStyle Hidden -PassThru
Start-Sleep 2
$frontend = Start-Process cmd -ArgumentList "/c cd /d `"$projectPath`" && npm run dev" -WindowStyle Hidden -PassThru
Start-Sleep 3
Start-Process "http://localhost:5173"

$icon = New-Object System.Windows.Forms.NotifyIcon
$icon.Icon = [System.Drawing.SystemIcons]::Application
$icon.Text = "Regis AI Studio"
$icon.Visible = $true

$menu = New-Object System.Windows.Forms.ContextMenuStrip

$open = New-Object System.Windows.Forms.ToolStripMenuItem
$open.Text = "Otworz"
$open.Add_Click({ Start-Process "http://localhost:5173" })
$menu.Items.Add($open) | Out-Null

$health = New-Object System.Windows.Forms.ToolStripMenuItem
$health.Text = "Health"
$health.Add_Click({ Start-Process "http://localhost:8000/api/health" })
$menu.Items.Add($health) | Out-Null

$menu.Items.Add("-") | Out-Null

$restart = New-Object System.Windows.Forms.ToolStripMenuItem
$restart.Text = "Restart"
$restart.Add_Click({
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
    Start-Sleep 1
    Start-Process cmd -ArgumentList "/c cd /d `"$projectPath`" && python api/index.py" -WindowStyle Hidden
    Start-Sleep 2
    Start-Process cmd -ArgumentList "/c cd /d `"$projectPath`" && npm run dev" -WindowStyle Hidden
    Start-Sleep 2
    Start-Process "http://localhost:5173"
})
$menu.Items.Add($restart) | Out-Null

$menu.Items.Add("-") | Out-Null

$quit = New-Object System.Windows.Forms.ToolStripMenuItem
$quit.Text = "Zamknij"
$quit.Add_Click({
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
    $icon.Visible = $false
    $icon.Dispose()
    [System.Windows.Forms.Application]::Exit()
})
$menu.Items.Add($quit) | Out-Null

$icon.ContextMenuStrip = $menu
$icon.Add_DoubleClick({ Start-Process "http://localhost:5173" })

$icon.ShowBalloonTip(3000, "Regis AI Studio", "Uruchomiony! Prawy klik na ikone.", [System.Windows.Forms.ToolTipIcon]::Info)

# Ukryj okno PowerShell
Add-Type -Name W -Namespace N -MemberDefinition '[DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr h, int c); [DllImport("kernel32.dll")] public static extern IntPtr GetConsoleWindow();'
[N.W]::ShowWindow([N.W]::GetConsoleWindow(), 0) | Out-Null

[System.Windows.Forms.Application]::Run()
