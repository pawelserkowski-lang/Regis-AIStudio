import subprocess, time, webbrowser, platform, sys
print(">>> STARTING REGIS (FINAL FIX) <<<")
print(" [1] Backend...")
if platform.system() == "Windows": subprocess.Popen("start cmd /k python api/local_server.py", shell=True)
else: subprocess.Popen([sys.executable, "api/local_server.py"])
time.sleep(2)
# UPEWNIAMY SIĘ ŻE OTWIERA SIĘ TYLKO RAZ
webbrowser.open("http://localhost:3000")
print(" [2] Frontend...")
try: subprocess.run("npm run launcher", shell=True)
except: pass