import os

print(">>> TWARDY RESET SIECIOWY (LOCALHOST -> 127.0.0.1) <<<")

# 1. Wymuszenie IPv4 w Vite (Frontend)
vite_path = "vite.config.ts"
if os.path.exists(vite_path):
    with open(vite_path, "r", encoding="utf-8") as f:
        content = f.read()
    
    # Zamieniamy localhost na 127.0.0.1 w sekcji proxy
    new_content = content.replace("http://localhost:8000", "http://127.0.0.1:8000")
    
    if content != new_content:
        with open(vite_path, "w", encoding="utf-8") as f:
            f.write(new_content)
        print(" [NAPRAWIONO] vite.config.ts: Proxy ustawione sztywno na 127.0.0.1")
    else:
        print(" [OK] vite.config.ts już ma poprawny adres IP.")

# 2. Wymuszenie IPv4 w Serwerze Python (Backend)
server_path = "api/local_server.py"
if os.path.exists(server_path):
    with open(server_path, "r", encoding="utf-8") as f:
        content = f.read()
    
    # Zamieniamy bind 'localhost' na '127.0.0.1'
    new_content = content.replace("('localhost', port)", "('127.0.0.1', port)")
    
    if content != new_content:
        with open(server_path, "w", encoding="utf-8") as f:
            f.write(new_content)
        print(" [NAPRAWIONO] api/local_server.py: Serwer zmuszony do nasłuchu na 127.0.0.1")
    else:
        print(" [OK] api/local_server.py już ma poprawny adres IP.")

print("\n>>> ZAKOŃCZONO. Uruchom teraz 'KILL_AND_RUN.bat' <<<")