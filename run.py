import subprocess, time, webbrowser, platform, sys, os

print(">>> STARTING REGIS PHOENIX (v14.0) <<<")
print("    - Mode: GOD MODE")
print("    - Windows: DETACHED STEALTH MODE")

if platform.system() == "Windows":
    # CREATE_NO_WINDOW = 0x08000000
    # DETACHED_PROCESS = 0x00000008
    flags = 0x08000000 | 0x00000008
    
    print(" [1] Launching Backend (Detached)...")
    subprocess.Popen([sys.executable, "api/local_server.py"], creationflags=flags)
    
    print(" [2] Launching Frontend (Detached)...")
    # Using 'cmd /c' with detached flag to prevent any window inheritance
    subprocess.Popen(["cmd", "/c", "npm run dev"], creationflags=flags)
else:
    subprocess.Popen([sys.executable, "api/local_server.py"])
    subprocess.Popen(["npm", "run", "dev"])

print(" [3] Services are running in the void.")
print(" [!] Use 'Shutdown System' in the app to stop them.")
time.sleep(5) 

print(" [4] Opening Portal...")
webbrowser.open("http://localhost:3000")