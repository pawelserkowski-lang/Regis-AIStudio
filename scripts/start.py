#!/usr/bin/env python3
"""
╔══════════════════════════════════════════════════════════════════════════════╗
║  REGIS AI STUDIO - Main Launcher with Debug Loop                             ║
║  ════════════════════════════════════════════════════════════════════════════║
║  Uruchamia backend z automatycznym debugowaniem i auto-restartem             ║
╚══════════════════════════════════════════════════════════════════════════════╝
"""

import os
import sys
import time
import signal
import subprocess
import threading
from datetime import datetime
from pathlib import Path

# ANSI Colors
class C:
    RESET = "\033[0m"
    BOLD = "\033[1m"
    RED = "\033[91m"
    GREEN = "\033[92m"
    YELLOW = "\033[93m"
    BLUE = "\033[94m"
    MAGENTA = "\033[95m"
    CYAN = "\033[96m"
    CYBER = "\033[38;5;46m"

# Globalne flagi
running = True
backend_process = None
restart_count = 0
max_restarts = 5

def signal_handler(sig, frame):
    """Obsługuje sygnały przerwania."""
    global running, backend_process
    print(f"\n{C.YELLOW}⚠️  Otrzymano sygnał zamknięcia...{C.RESET}")
    running = False
    if backend_process:
        backend_process.terminate()
    sys.exit(0)

signal.signal(signal.SIGINT, signal_handler)
signal.signal(signal.SIGTERM, signal_handler)


def print_banner():
    """Wyświetla banner startowy."""
    print(f"""
{C.CYBER}╔══════════════════════════════════════════════════════════════════════════════╗
║{C.CYAN}  ██████╗ ███████╗ ██████╗ ██╗███████╗     █████╗ ██╗    ███████╗████████╗██╗   ██╗██████╗ ██╗ ██████╗{C.CYBER} ║
║{C.CYAN}  ██╔══██╗██╔════╝██╔════╝ ██║██╔════╝    ██╔══██╗██║    ██╔════╝╚══██╔══╝██║   ██║██╔══██╗██║██╔═══██╗{C.CYBER}║
║{C.CYAN}  ██████╔╝█████╗  ██║  ███╗██║███████╗    ███████║██║    ███████╗   ██║   ██║   ██║██║  ██║██║██║   ██║{C.CYBER}║
║{C.CYAN}  ██╔══██╗██╔══╝  ██║   ██║██║╚════██║    ██╔══██║██║    ╚════██║   ██║   ██║   ██║██║  ██║██║██║   ██║{C.CYBER}║
║{C.CYAN}  ██║  ██║███████╗╚██████╔╝██║███████║    ██║  ██║██║    ███████║   ██║   ╚██████╔╝██████╔╝██║╚██████╔╝{C.CYBER}║
║{C.CYAN}  ╚═╝  ╚═╝╚══════╝ ╚═════╝ ╚═╝╚══════╝    ╚═╝  ╚═╝╚═╝    ╚══════╝   ╚═╝    ╚═════╝ ╚═════╝ ╚═╝ ╚═════╝{C.CYBER} ║
╠══════════════════════════════════════════════════════════════════════════════╣
║{C.CYAN}  🚀 LAUNCHER v2.0 with Auto-Debug                                            {C.CYBER}║
║{C.CYAN}  🤖 Dual-AI: Claude (Anthropic) + Gemini (Google)                            {C.CYBER}║
╚══════════════════════════════════════════════════════════════════════════════╝{C.RESET}
""")


def check_environment():
    """Sprawdza środowisko przed uruchomieniem."""
    print(f"\n{C.CYAN}🔍 Sprawdzam środowisko...{C.RESET}\n")
    
    issues = []
    warnings = []
    
    # Check .env file
    if not os.path.exists(".env"):
        if os.path.exists(".env.example"):
            print(f"  {C.YELLOW}⚠️  Brak .env - tworzę z .env.example{C.RESET}")
            import shutil
            shutil.copy(".env.example", ".env")
        else:
            issues.append("Brak pliku .env")
    else:
        print(f"  {C.GREEN}✅ Plik .env istnieje{C.RESET}")
    
    # Load dotenv
    try:
        from dotenv import load_dotenv
        load_dotenv()
        print(f"  {C.GREEN}✅ python-dotenv załadowany{C.RESET}")
    except ImportError:
        warnings.append("python-dotenv nie zainstalowany")
        print(f"  {C.YELLOW}⚠️  python-dotenv nie zainstalowany{C.RESET}")
    
    # Check API keys
    anthropic_key = os.environ.get("ANTHROPIC_API_KEY", "")
    google_key = os.environ.get("GOOGLE_API_KEY", "")
    
    if anthropic_key and anthropic_key != "your_anthropic_api_key_here":
        print(f"  {C.GREEN}✅ ANTHROPIC_API_KEY skonfigurowany{C.RESET}")
    else:
        issues.append("ANTHROPIC_API_KEY nie ustawiony")
        print(f"  {C.RED}❌ ANTHROPIC_API_KEY nie ustawiony{C.RESET}")
    
    if google_key and google_key != "your_gemini_api_key_here":
        print(f"  {C.GREEN}✅ GOOGLE_API_KEY skonfigurowany{C.RESET}")
    else:
        print(f"  {C.YELLOW}⚠️  GOOGLE_API_KEY nie ustawiony (opcjonalne){C.RESET}")
    
    # Check backend file
    backend_path = "api/index.py"
    if os.path.exists(backend_path):
        print(f"  {C.GREEN}✅ Backend: {backend_path}{C.RESET}")
    else:
        issues.append(f"Brak pliku {backend_path}")
        print(f"  {C.RED}❌ Brak pliku {backend_path}{C.RESET}")
    
    # Check anthropic module
    try:
        import anthropic
        print(f"  {C.GREEN}✅ Anthropic SDK dostępny{C.RESET}")
    except ImportError:
        issues.append("Anthropic SDK nie zainstalowany")
        print(f"  {C.RED}❌ Anthropic SDK nie zainstalowany{C.RESET}")
        print(f"      {C.CYAN}pip install anthropic --break-system-packages{C.RESET}")
    
    print()
    
    if issues:
        print(f"{C.RED}❌ Wykryto problemy:{C.RESET}")
        for issue in issues:
            print(f"   • {issue}")
        print()
        return False
    
    if warnings:
        print(f"{C.YELLOW}⚠️  Ostrzeżenia (nie blokują uruchomienia):{C.RESET}")
        for warning in warnings:
            print(f"   • {warning}")
        print()
    
    print(f"{C.GREEN}✅ Środowisko OK - uruchamiam backend!{C.RESET}\n")
    return True


def run_backend():
    """Uruchamia backend server."""
    global backend_process, restart_count
    
    backend_path = "api/index.py"
    port = os.environ.get("BACKEND_PORT", "8000")
    
    print(f"{C.CYAN}🚀 Uruchamiam backend na porcie {port}...{C.RESET}")
    print(f"{C.CYAN}   Endpoint: http://127.0.0.1:{port}/api{C.RESET}")
    print(f"{C.CYAN}   Health:   http://127.0.0.1:{port}/api/health{C.RESET}")
    print()
    
    try:
        backend_process = subprocess.Popen(
            [sys.executable, backend_path],
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            bufsize=1,
            universal_newlines=True
        )
        
        # Stream output
        while running and backend_process.poll() is None:
            line = backend_process.stdout.readline()
            if line:
                # Colorize output
                if "[OK]" in line or "✅" in line:
                    print(f"{C.GREEN}{line.rstrip()}{C.RESET}")
                elif "[WARN]" in line or "⚠️" in line:
                    print(f"{C.YELLOW}{line.rstrip()}{C.RESET}")
                elif "[ERROR]" in line or "❌" in line or "Traceback" in line:
                    print(f"{C.RED}{line.rstrip()}{C.RESET}")
                elif "REQ:" in line or "POST" in line or "GET" in line:
                    print(f"{C.CYAN}{line.rstrip()}{C.RESET}")
                else:
                    print(line.rstrip())
        
        return_code = backend_process.poll()
        
        if return_code != 0 and running:
            print(f"\n{C.RED}❌ Backend zakończył się z kodem {return_code}{C.RESET}")
            return False
        
        return True
        
    except FileNotFoundError:
        print(f"{C.RED}❌ Nie znaleziono pliku {backend_path}{C.RESET}")
        return False
    except Exception as e:
        print(f"{C.RED}❌ Błąd uruchamiania backendu: {e}{C.RESET}")
        return False


def main_loop():
    """Główna pętla z auto-restartem."""
    global restart_count, running
    
    while running and restart_count < max_restarts:
        success = run_backend()
        
        if not running:
            break
        
        if not success:
            restart_count += 1
            
            if restart_count < max_restarts:
                wait_time = min(5 * restart_count, 30)  # Exponential backoff, max 30s
                print(f"\n{C.YELLOW}🔄 Auto-restart za {wait_time}s (próba {restart_count}/{max_restarts})...{C.RESET}")
                print(f"{C.YELLOW}   Naciśnij Ctrl+C aby przerwać{C.RESET}\n")
                
                time.sleep(wait_time)
                
                # Re-check environment before restart
                print(f"\n{C.CYAN}🔍 Sprawdzam środowisko przed restartem...{C.RESET}")
                if not check_environment():
                    print(f"{C.RED}❌ Środowisko nadal ma problemy. Przerywam.{C.RESET}")
                    break
            else:
                print(f"\n{C.RED}❌ Osiągnięto limit restartów ({max_restarts}). Przerywam.{C.RESET}")
                print(f"{C.YELLOW}   Sprawdź logi i napraw problemy ręcznie.{C.RESET}")
                break
        else:
            # Clean exit
            break
    
    print(f"\n{C.CYAN}👋 Regis AI Studio zakończył działanie.{C.RESET}\n")


def main():
    """Punkt wejścia."""
    print_banner()
    
    # Check for help
    if "--help" in sys.argv or "-h" in sys.argv:
        print(f"""
{C.CYAN}Użycie:{C.RESET}
  python start.py           # Uruchom backend z auto-debugowaniem
  python start.py --check   # Tylko sprawdź środowisko
  python start.py --help    # Pokaż pomoc

{C.CYAN}Zmienne środowiskowe:{C.RESET}
  ANTHROPIC_API_KEY    Klucz API Claude (wymagany)
  GOOGLE_API_KEY       Klucz API Gemini (opcjonalny)
  DEFAULT_AI_PROVIDER  Domyślny provider: 'claude' lub 'gemini'
  BACKEND_PORT         Port backendu (domyślnie: 8000)

{C.CYAN}Konfiguracja:{C.RESET}
  1. Skopiuj .env.example jako .env
  2. Uzupełnij klucze API
  3. Uruchom: python start.py
""")
        return 0
    
    # Check only mode
    if "--check" in sys.argv:
        if check_environment():
            print(f"{C.GREEN}✅ Środowisko gotowe do uruchomienia!{C.RESET}")
            return 0
        else:
            return 1
    
    # Normal startup
    if not check_environment():
        print(f"{C.RED}❌ Napraw problemy przed uruchomieniem.{C.RESET}")
        print(f"{C.YELLOW}   Wskazówka: Uruchom 'python regis_debug_loop.py' dla szczegółowej diagnostyki{C.RESET}")
        return 1
    
    main_loop()
    return 0


if __name__ == "__main__":
    sys.exit(main())
