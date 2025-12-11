import os
import sys
import time
import subprocess
import traceback
from http.server import HTTPServer

def debug_log(msg):
    try:
        with open("debug_crash_log.txt", "a", encoding="utf-8") as f:
            f.write(f"[{time.strftime('%H:%M:%S')}] SERVER: {msg}\n")
    except: pass

def run_server():
    debug_log("Inicjalizacja local_server.py...")
    
    # Dodajemy ścieżki
    sys.path.append(os.path.dirname(os.path.abspath(__file__)))
    try:
        debug_log("Próba importu index.handler...")
        from index import handler
        debug_log("Import sukces!")
    except ImportError as e:
        debug_log(f"BŁĄD IMPORTU: {e}")
        # Fallback
        sys.path.append(os.path.join(os.getcwd(), 'api'))
        from index import handler

    port = int(os.environ.get('PORT', 8000))
    host = '127.0.0.1'
    
    print(f"Starting Python backend on http://{host}:{port}")
    debug_log(f"Start serwera na {host}:{port}")

    if not os.environ.get('GOOGLE_API_KEY'):
        print("[WARN] GOOGLE_API_KEY is not set in environment variables.")
        debug_log("Ostrzeżenie: Brak klucza API")

    try:
        server = HTTPServer((host, port), handler)
        debug_log("HTTPServer utworzony. Wchodzę w serve_forever()...")
        server.serve_forever()
    except KeyboardInterrupt:
        debug_log("Zatrzymano przez użytkownika (KeyboardInterrupt).")
    except Exception as e:
        err = traceback.format_exc()
        print(f"CRITICAL SERVER ERROR: {e}")
        debug_log(f"KRYTYCZNY BŁĄD SERWERA:\n{err}")
        # Zatrzymaj okno, żeby użytkownik widział błąd
        input("Naciśnij ENTER, aby zamknąć...")

if __name__ == '__main__':
    try:
        run_server()
    except Exception as e:
        with open("debug_crash_log.txt", "a") as f:
            f.write(f"FATAL STARTUP ERROR: {e}\n{traceback.format_exc()}\n")
        input("FATAL ERROR - Sprawdź debug_crash_log.txt")
