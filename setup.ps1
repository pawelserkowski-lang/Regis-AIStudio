# Regis AI Studio - Auto Setup & Launch

$Host.UI.RawUI.WindowTitle = "Regis AI Studio - Setup"

Write-Host ""
Write-Host "  ====================================================" -ForegroundColor Green
Write-Host "   REGIS AI STUDIO - Auto Setup" -ForegroundColor Green
Write-Host "  ====================================================" -ForegroundColor Green
Write-Host ""

# 1. Python
Write-Host "[1/7] Python..." -NoNewline
try {
    $pyVer = python --version 2>&1
    Write-Host " $pyVer" -ForegroundColor Green
} catch {
    Write-Host " NIE ZNALEZIONO" -ForegroundColor Red
    Read-Host "Nacisnij Enter"
    exit 1
}

# 2. Node.js
Write-Host "[2/7] Node.js..." -NoNewline
try {
    $nodeVer = node --version 2>&1
    Write-Host " $nodeVer" -ForegroundColor Green
} catch {
    Write-Host " NIE ZNALEZIONO" -ForegroundColor Red
    Read-Host "Nacisnij Enter"
    exit 1
}

# 3. npm
Write-Host "[3/7] npm..." -NoNewline
$npmVer = npm --version 2>&1
Write-Host " v$npmVer" -ForegroundColor Green

# 4. Pakiety Python
Write-Host "[4/7] Pakiety Python..." -NoNewline
pip install anthropic python-dotenv google-generativeai --break-system-packages -q 2>$null
if ($LASTEXITCODE -ne 0) {
    pip install anthropic python-dotenv google-generativeai -q 2>$null
}
Write-Host " OK" -ForegroundColor Green

# 5. node_modules
Write-Host "[5/7] node_modules..." -NoNewline
if (-not (Test-Path "node_modules")) {
    Write-Host " Instaluje..." -ForegroundColor Yellow
    npm install 2>$null
}
Write-Host " OK" -ForegroundColor Green

# 6. Klucze API
Write-Host "[6/7] Klucze API..." -NoNewline
$anthropicKey = $env:ANTHROPIC_API_KEY
$googleKey = $env:GOOGLE_API_KEY

if (-not (Test-Path ".env")) {
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
    }
}

if ($anthropicKey -or $googleKey) {
    $envContent = Get-Content ".env" -Raw -ErrorAction SilentlyContinue
    if ($anthropicKey) {
        $envContent = $envContent -replace "ANTHROPIC_API_KEY=.*", "ANTHROPIC_API_KEY=$anthropicKey"
    }
    if ($googleKey) {
        $envContent = $envContent -replace "GOOGLE_API_KEY=.*", "GOOGLE_API_KEY=$googleKey"
    }
    $envContent | Set-Content ".env" -NoNewline
    Write-Host " OK" -ForegroundColor Green
} else {
    Write-Host " BRAK (edytuj .env)" -ForegroundColor Yellow
}

# 7. Czyszczenie portow
Write-Host "[7/7] Czyszcze porty..." -NoNewline

# Zabij procesy na portach 3000, 5173, 8000
$ports = @(3000, 5173, 8000)
foreach ($port in $ports) {
    $proc = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -ErrorAction SilentlyContinue
    if ($proc) {
        Stop-Process -Id $proc -Force -ErrorAction SilentlyContinue
    }
}

# Zabij stare procesy Node
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

Write-Host " OK" -ForegroundColor Green

# Znajdz przegladarke
$browserPath = $null
$chromePaths = @(
    "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
    "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
    "$env:LocalAppData\Google\Chrome\Application\chrome.exe"
)
foreach ($path in $chromePaths) {
    if (Test-Path $path) { $browserPath = $path; break }
}
if (-not $browserPath) {
    $edgePaths = @(
        "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe",
        "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe"
    )
    foreach ($path in $edgePaths) {
        if (Test-Path $path) { $browserPath = $path; break }
    }
}

Write-Host ""
Write-Host "  ====================================================" -ForegroundColor Green
Write-Host "   Uruchamiam serwery..." -ForegroundColor Green
Write-Host "  ====================================================" -ForegroundColor Green
Write-Host ""

# Uruchom Backend (port 8000)
Write-Host "  [1/2] Backend API (port 8000)..." -ForegroundColor Cyan
Start-Process cmd -ArgumentList "/c title REGIS-Backend && python api/index.py" -WindowStyle Minimized
Start-Sleep 3

# Uruchom Frontend (port 5173)
Write-Host "  [2/2] Frontend Vite (port 5173)..." -ForegroundColor Cyan
Start-Process cmd -ArgumentList "/c title REGIS-Frontend && npx vite --port 5173 --host" -WindowStyle Minimized

# Czekaj az frontend wystartuje
Write-Host ""
Write-Host "  Czekam na frontend" -NoNewline -ForegroundColor Yellow

$maxWait = 30
$waited = 0
$ready = $false

while ($waited -lt $maxWait) {
    Start-Sleep 1
    $waited++
    Write-Host "." -NoNewline -ForegroundColor Yellow
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:5173" -TimeoutSec 1 -ErrorAction SilentlyContinue
        if ($response.StatusCode -eq 200) {
            $ready = $true
            break
        }
    } catch {}
}

Write-Host ""

if ($ready) {
    Write-Host ""
    Write-Host "  ====================================================" -ForegroundColor Green
    Write-Host "   REGIS AI STUDIO URUCHOMIONY!" -ForegroundColor Green
    Write-Host "  ====================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "   Frontend: http://localhost:5173" -ForegroundColor Cyan
    Write-Host "   Backend:  http://localhost:8000" -ForegroundColor Cyan
    Write-Host ""
    
    if ($browserPath) {
        Start-Process $browserPath -ArgumentList "--app=http://localhost:5173", "--window-size=1400,900"
    } else {
        Start-Process "http://localhost:5173"
    }
} else {
    Write-Host ""
    Write-Host "  [!] Frontend nie wystartował!" -ForegroundColor Red
    Write-Host "  Sprawdz okno REGIS-Frontend" -ForegroundColor Yellow
    Write-Host ""
}

Write-Host ""
Write-Host "  Nacisnij Enter..." -ForegroundColor Gray
Read-Host
