&lt;#
╔══════════════════════════════════════════════════════════════════════════════╗
║  REGIS AI STUDIO - Windows Environment Setup                                  ║
║  ════════════════════════════════════════════════════════════════════════════║
║  Ten skrypt konfiguruje zmienne środowiskowe dla Regis AI Studio             ║
║  Uruchom jako Administrator w PowerShell                                      ║
╚══════════════════════════════════════════════════════════════════════════════╝
#&gt;

param(
    [Parameter(Mandatory=$false)]
    [string]$AnthropicKey,
    
    [Parameter(Mandatory=$false)]
    [string]$GoogleKey,
    
    [Parameter(Mandatory=$false)]
    [switch]$Interactive,
    
    [Parameter(Mandatory=$false)]
    [switch]$ShowCurrent
)

# Kolory Cyber Green
$CyberGreen = "`e[38;5;46m"
$White = "`e[97m"
$Red = "`e[91m"
$Yellow = "`e[93m"
$Reset = "`e[0m"

function Write-Banner {
    Write-Host ""
    Write-Host "${CyberGreen}╔══════════════════════════════════════════════════════════════════════════════╗${Reset}"
    Write-Host "${CyberGreen}║${White}  ██████╗ ███████╗ ██████╗ ██╗███████╗    ███████╗███████╗████████╗██╗   ██╗██████╗ ${CyberGreen}║${Reset}"
    Write-Host "${CyberGreen}║${White}  ██╔══██╗██╔════╝██╔════╝ ██║██╔════╝    ██╔════╝██╔════╝╚══██╔══╝██║   ██║██╔══██╗${CyberGreen}║${Reset}"
    Write-Host "${CyberGreen}║${White}  ██████╔╝█████╗  ██║  ███╗██║███████╗    ███████╗█████╗     ██║   ██║   ██║██████╔╝${CyberGreen}║${Reset}"
    Write-Host "${CyberGreen}║${White}  ██╔══██╗██╔══╝  ██║   ██║██║╚════██║    ╚════██║██╔══╝     ██║   ██║   ██║██╔═══╝ ${CyberGreen}║${Reset}"
    Write-Host "${CyberGreen}║${White}  ██║  ██║███████╗╚██████╔╝██║███████║    ███████║███████╗   ██║   ╚██████╔╝██║     ${CyberGreen}║${Reset}"
    Write-Host "${CyberGreen}║${White}  ╚═╝  ╚═╝╚══════╝ ╚═════╝ ╚═╝╚══════╝    ╚══════╝╚══════╝   ╚═╝    ╚═════╝ ╚═╝     ${CyberGreen}║${Reset}"
    Write-Host "${CyberGreen}╠══════════════════════════════════════════════════════════════════════════════╣${Reset}"
    Write-Host "${CyberGreen}║${White}  🔧 Windows Environment Variables Setup                                       ${CyberGreen}║${Reset}"
    Write-Host "${CyberGreen}║${White}  🤖 Dual-AI: Claude (Anthropic) + Gemini (Google)                             ${CyberGreen}║${Reset}"
    Write-Host "${CyberGreen}╚══════════════════════════════════════════════════════════════════════════════╝${Reset}"
    Write-Host ""
}

function Show-CurrentConfig {
    Write-Host "${CyberGreen}📊 Aktualna konfiguracja:${Reset}"
    Write-Host ""
    
    $anthropicKey = [Environment]::GetEnvironmentVariable("ANTHROPIC_API_KEY", "User")
    $googleKey = [Environment]::GetEnvironmentVariable("GOOGLE_API_KEY", "User")
    $defaultProvider = [Environment]::GetEnvironmentVariable("DEFAULT_AI_PROVIDER", "User")
    
    if ($anthropicKey) {
        $masked = "sk-ant-***" + $anthropicKey.Substring([Math]::Max(0, $anthropicKey.Length - 4))
        Write-Host "  ${CyberGreen}✅ ANTHROPIC_API_KEY:${Reset} $masked"
    } else {
        Write-Host "  ${Red}❌ ANTHROPIC_API_KEY:${Reset} nie ustawiony"
    }
    
    if ($googleKey) {
        $masked = "AIza***" + $googleKey.Substring([Math]::Max(0, $googleKey.Length - 4))
        Write-Host "  ${CyberGreen}✅ GOOGLE_API_KEY:${Reset} $masked"
    } else {
        Write-Host "  ${Yellow}⚠️ GOOGLE_API_KEY:${Reset} nie ustawiony (opcjonalne)"
    }
    
    if ($defaultProvider) {
        Write-Host "  ${CyberGreen}✅ DEFAULT_AI_PROVIDER:${Reset} $defaultProvider"
    } else {
        Write-Host "  ${Yellow}⚠️ DEFAULT_AI_PROVIDER:${Reset} nie ustawiony (domyślnie: claude)"
    }
    
    Write-Host ""
}

function Set-APIKey {
    param(
        [string]$KeyName,
        [string]$KeyValue,
        [string]$Description
    )
    
    if ([string]::IsNullOrWhiteSpace($KeyValue)) {
        Write-Host "${Yellow}⏭️ Pomijam $KeyName (pusty)${Reset}"
        return $false
    }
    
    try {
        [Environment]::SetEnvironmentVariable($KeyName, $KeyValue, "User")
        Write-Host "${CyberGreen}✅ $KeyName ustawiony pomyślnie${Reset}"
        return $true
    }
    catch {
        Write-Host "${Red}❌ Błąd ustawiania $KeyName : $_${Reset}"
        return $false
    }
}

function Test-APIKey {
    param(
        [string]$KeyValue,
        [string]$Provider
    )
    
    if ($Provider -eq "anthropic") {
        # Anthropic keys start with "sk-ant-"
        if ($KeyValue -match "^sk-ant-") {
            return $true
        }
        Write-Host "${Yellow}⚠️ Klucz Anthropic powinien zaczynać się od 'sk-ant-'${Reset}"
        return $false
    }
    elseif ($Provider -eq "google") {
        # Google keys start with "AIza" and are ~39 chars
        if ($KeyValue -match "^AIza" -and $KeyValue.Length -ge 30) {
            return $true
        }
        Write-Host "${Yellow}⚠️ Klucz Google powinien zaczynać się od 'AIza'${Reset}"
        return $false
    }
    return $true
}

function Start-InteractiveSetup {
    Write-Host "${CyberGreen}🔐 Tryb interaktywny - wprowadź klucze API${Reset}"
    Write-Host ""
    Write-Host "Gdzie zdobyć klucze?"
    Write-Host "  🤖 Claude (Anthropic): ${CyberGreen}https://console.anthropic.com/${Reset}"
    Write-Host "  🔮 Gemini (Google):    ${CyberGreen}https://aistudio.google.com/apikey${Reset}"
    Write-Host ""
    
    # Anthropic Key
    Write-Host "${White}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${Reset}"
    $anthropicKey = Read-Host "Wprowadź ANTHROPIC_API_KEY (Enter aby pominąć)"
    
    if ($anthropicKey) {
        if (Test-APIKey -KeyValue $anthropicKey -Provider "anthropic") {
            Set-APIKey -KeyName "ANTHROPIC_API_KEY" -KeyValue $anthropicKey -Description "Claude API Key"
        }
    }
    
    Write-Host ""
    
    # Google Key (optional)
    Write-Host "${White}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${Reset}"
    $googleKey = Read-Host "Wprowadź GOOGLE_API_KEY (opcjonalne, Enter aby pominąć)"
    
    if ($googleKey) {
        if (Test-APIKey -KeyValue $googleKey -Provider "google") {
            Set-APIKey -KeyName "GOOGLE_API_KEY" -KeyValue $googleKey -Description "Gemini API Key"
        }
    }
    
    Write-Host ""
    
    # Default Provider
    Write-Host "${White}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${Reset}"
    $provider = Read-Host "Domyślny provider AI [claude/gemini] (Enter = claude)"
    
    if ([string]::IsNullOrWhiteSpace($provider)) {
        $provider = "claude"
    }
    
    Set-APIKey -KeyName "DEFAULT_AI_PROVIDER" -KeyValue $provider -Description "Default AI Provider"
}

function Update-EnvFile {
    param(
        [string]$EnvPath = ".\.env"
    )
    
    $anthropicKey = [Environment]::GetEnvironmentVariable("ANTHROPIC_API_KEY", "User")
    $googleKey = [Environment]::GetEnvironmentVariable("GOOGLE_API_KEY", "User")
    $defaultProvider = [Environment]::GetEnvironmentVariable("DEFAULT_AI_PROVIDER", "User")
    
    if (-not $defaultProvider) { $defaultProvider = "claude" }
    
    $envContent = @"
# Regis AI Studio - Environment Configuration
# Auto-generated by setup_windows_env.ps1

# Anthropic Claude API Key
ANTHROPIC_API_KEY=$anthropicKey

# Google Gemini API Key (opcjonalne)
GOOGLE_API_KEY=$googleKey

# Domyślny provider AI
DEFAULT_AI_PROVIDER=$defaultProvider

# Port backendu
BACKEND_PORT=8000
"@

    try {
        $envContent | Out-File -FilePath $EnvPath -Encoding UTF8 -Force
        Write-Host "${CyberGreen}✅ Zaktualizowano plik .env${Reset}"
        return $true
    }
    catch {
        Write-Host "${Red}❌ Błąd aktualizacji .env: $_${Reset}"
        return $false
    }
}

# ============================================================================
# MAIN
# ============================================================================

Write-Banner

if ($ShowCurrent) {
    Show-CurrentConfig
    exit 0
}

if ($Interactive) {
    Start-InteractiveSetup
    Write-Host ""
    Show-CurrentConfig
    
    # Optionally update .env file
    $updateEnv = Read-Host "Zaktualizować plik .env? [T/n]"
    if ($updateEnv -ne "n" -and $updateEnv -ne "N") {
        Update-EnvFile
    }
}
else {
    # Non-interactive mode with parameters
    if ($AnthropicKey) {
        if (Test-APIKey -KeyValue $AnthropicKey -Provider "anthropic") {
            Set-APIKey -KeyName "ANTHROPIC_API_KEY" -KeyValue $AnthropicKey -Description "Claude API Key"
        }
    }
    
    if ($GoogleKey) {
        if (Test-APIKey -KeyValue $GoogleKey -Provider "google") {
            Set-APIKey -KeyName "GOOGLE_API_KEY" -KeyValue $GoogleKey -Description "Gemini API Key"
        }
    }
    
    if (-not $AnthropicKey -and -not $GoogleKey) {
        Write-Host "${Yellow}Użycie:${Reset}"
        Write-Host "  .\setup_windows_env.ps1 -Interactive              # Tryb interaktywny"
        Write-Host "  .\setup_windows_env.ps1 -AnthropicKey 'sk-ant-...' # Ustaw klucz Claude"
        Write-Host "  .\setup_windows_env.ps1 -GoogleKey 'AIza...'       # Ustaw klucz Gemini"
        Write-Host "  .\setup_windows_env.ps1 -ShowCurrent               # Pokaż aktualną konfigurację"
        Write-Host ""
        Write-Host "${CyberGreen}Przykład:${Reset}"
        Write-Host '  .\setup_windows_env.ps1 -AnthropicKey "sk-ant-api03-xxxxx" -GoogleKey "AIzaSyxxxxx"'
    }
    else {
        Write-Host ""
        Show-CurrentConfig
    }
}

Write-Host ""
Write-Host "${CyberGreen}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${Reset}"
Write-Host "${Yellow}⚠️  WAŻNE: Uruchom ponownie terminal/IDE aby zmiany zadziałały!${Reset}"
Write-Host "${CyberGreen}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${Reset}"
Write-Host ""
