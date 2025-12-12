# Regis AI Studio - Auto Setup & Launch (Chrome App)

$Host.UI.RawUI.WindowTitle = "Regis AI Studio - Setup"

Write-Host ""
Write-Host "  ====================================================" -ForegroundColor Green
Write-Host "   REGIS AI STUDIO - Auto Setup" -ForegroundColor Green
Write-Host "  ====================================================" -ForegroundColor Green
Write-Host ""

# 1. Sprawdz Python
Write-Host "[1/7] Python..." -NoNewline
try {
    $pyVer = python --version 2>&1
    Write-Host " $pyVer" -ForegroundColor Green
} catch {
    Write-Host " NIE ZNALEZIONO" -ForegroundColor Red
    Write-Host "      Pobierz z: https://python.org" -ForegroundColor Yellow
    Read-Host "Nacisnij Enter"
    exit 1
}

# 2. Sprawdz Node.js
Write-Host "[2/7] Node.js..." -NoNewline
try {
    $nodeVer = node --version 2>&1
    Write-Host " $nodeVer" -ForegroundColor Green
} catch {
    Write-Host " NIE ZNALEZIONO" -ForegroundColor Red
    Write-Host "      Pobierz z: https://nodejs.org" -ForegroundColor Yellow
    Read-Host "Nacisnij Enter"
    exit 1
}

# 3. Sprawdz npm
Write-Host "[3/7] npm..." -NoNewline
$npmVer = npm --version 2>&1
Write-Host " v$npmVer" -ForegroundColor Green

# 4. Pakiety Python
Write-Host "[4/7] Pakiety Python..." -NoNewline
$packages = @("anthropic", "python-dotenv", "google-generativeai")
$missing = @()

foreach ($pkg in $packages) {
    $check = pip show $pkg 2>&1
    if ($LASTEXITCODE -ne 0) {
        $missing += $pkg
    }
}

if ($missing.Count -gt 0) {
    Write-Host " Instaluje: $($missing -join ', ')" -ForegroundColor Yellow
    pip install $missing --break-system-packages -q 2>$null
    if ($LASTEXITCODE -ne 0) {
        pip install $missing -q 2>$null
    }
    Write-Host "       OK" -ForegroundColor Green
} else {
    Write-Host " OK" -ForegroundColor Green
}

# 5. Pakiety Node.js
Write-Host "[5/7] node_modules..." -NoNewline
if (-not (Test-Path "node_modules")) {
    Write-Host " Instaluje..." -ForegroundColor Yellow
    npm install --silent 2>$null
    Write-Host "       OK" -ForegroundColor Green
} else {
    Write-Host " OK" -ForegroundColor Green
}

# 6. Sprawdz .env
Write-Host "[6/7] Plik .env..." -NoNewline
if (-not (Test-Path ".env")) {
    if (Test-Path ".env.example") {
        Copy-Item ".env.example" ".env"
        Write-Host " Utworzono" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "  [!] Edytuj .env i dodaj klucze API!" -ForegroundColor Red
        notepad .env
        Read-Host "Po edycji nacisnij Enter"
    }
} else {
    Write-Host " OK" -ForegroundColor Green
}

# 7. Znajdz Chrome/Edge
Write-Host "[7/7] Przegladarka..." -NoNewline
$chromePath = $null
$browserName = ""

# Szukaj Chrome
$chromePaths = @(
    "$env:ProgramFiles\Google\Chrome\Application\chrome.exe",
    "${env:ProgramFiles(x86)}\Google\Chrome\Application\chrome.exe",
    "$env:LocalAppData\Google\Chrome\Application\chrome.exe"
)
foreach ($path in $chromePaths) {
    if (Test-Path $path) {
        $chromePath = $path
        $browserName = "Chrome"
        break
    }
}

# Szukaj Edge jesli brak Chrome
if (-not $chromePath) {
    $edgePaths = @(
        "$env:ProgramFiles\Microsoft\Edge\Application\msedge.exe",
        "${env:ProgramFiles(x86)}\Microsoft\Edge\Application\msedge.exe"
    )
    foreach ($path in $edgePaths) {
        if (Test-Path $path) {
            $chromePath = $path
            $browserName = "Edge"
            break
        }
    }
}

if ($chromePath) {
    Write-Host " $browserName (App Mode)" -ForegroundColor Green
} else {
    Write-Host " Domyslna" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "  ====================================================" -ForegroundColor Green
Write-Host "   Uruchamiam serwery..." -ForegroundColor Green
Write-Host "  ====================================================" -ForegroundColor Green
Write-Host ""

# Uruchom Backend
Write-Host "  [*] Backend API..." -ForegroundColor Cyan
Start-Process cmd -ArgumentList "/c title REGIS-Backend && python api/index.py" -WindowStyle Minimized
Start-Sleep 2

# Uruchom Frontend
Write-Host "  [*] Frontend Vite..." -ForegroundColor Cyan
Start-Process cmd -ArgumentList "/c title REGIS-Frontend && npm run dev" -WindowStyle Minimized
Start-Sleep 4

Write-Host ""
Write-Host "  ====================================================" -ForegroundColor Green
Write-Host "   REGIS AI STUDIO URUCHOMIONY!" -ForegroundColor Green
Write-Host "  ====================================================" -ForegroundColor Green
Write-Host ""
Write-Host "   http://localhost:5173" -ForegroundColor Cyan
Write-Host ""

# Otworz jako Chrome App (bez paska adresu)
if ($chromePath) {
    Write-Host "  Otwieram jako aplikacja ($browserName)..." -ForegroundColor Green
    Start-Process $chromePath -ArgumentList "--app=http://localhost:5173", "--window-size=1400,900"
} else {
    Write-Host "  Otwieram w przegladarce..." -ForegroundColor Yellow
    Start-Process "http://localhost:5173"
}

Start-Sleep 3
exit
