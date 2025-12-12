# Regis AI Studio - Auto Setup

## Uzycie

### Pierwsze uruchomienie:
```
Dwuklik na: Regis-Setup.bat
```

Skrypt automatycznie:
1. Sprawdzi Python i Node.js
2. Zainstaluje pakiety Python (anthropic, python-dotenv, google-generativeai)
3. Zainstaluje pakiety npm (npm install)
4. Utworzy .env z .env.example
5. Uruchomi backend i frontend
6. Otworzy przegladarke

### Kolejne uruchomienia:
```
Dwuklik na: Regis-Start.bat
```

### Zatrzymanie:
```
Dwuklik na: stop-regis.bat
```

## Pliki

| Plik | Opis |
|------|------|
| Regis-Setup.bat | Pelny setup + uruchomienie (PowerShell) |
| Regis-Start.bat | Szybki start z auto-instalacja (CMD) |
| setup.ps1 | Skrypt PowerShell |
| stop-regis.bat | Zatrzymuje serwery |

## Wymagania

- Python 3.8+ (https://python.org)
- Node.js 18+ (https://nodejs.org)
- Klucze API (Anthropic i/lub Google)

## Klucze API

Edytuj plik .env:

```
ANTHROPIC_API_KEY=sk-ant-twoj-klucz
GOOGLE_API_KEY=AIza-twoj-klucz
```

Gdzie je wziac:
- Anthropic: https://console.anthropic.com/
- Google: https://aistudio.google.com/
