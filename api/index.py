from http.server import BaseHTTPRequestHandler
import os, json, subprocess, platform, datetime, sys

# SETUP LOGGING
LOG_FILE = "server_log.txt"
def log(msg):
    try:
        with open(LOG_FILE, "a", encoding="utf-8") as f:
            ts = datetime.datetime.now().strftime("%H:%M:%S")
            f.write(f"[{ts}] {msg}\n")
    except: pass

def translate_cmd(cmd):
    if platform.system() != "Windows": return cmd
    c = cmd.lower().strip()
    if c == "ls": return "dir"
    if c.startswith("ls "): return c.replace("ls ", "dir ", 1)
    if c.startswith("rm "): return c.replace("rm ", "del ")
    if c.startswith("cp "): return c.replace("cp ", "copy ")
    if c.startswith("mv "): return c.replace("mv ", "move ")
    if c == "clear": return "cls"
    if c == "pwd": return "cd"
    if "python3" in c: return cmd.replace("python3", "python")
    return cmd

class handler(BaseHTTPRequestHandler):
    def _send_json(self, code, data):
        try:
            self.send_response(code)
            self.send_header('Content-type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps(data).encode('utf-8'))
        except Exception as e:
            log(f"SEND ERROR: {e}")

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_GET(self):
        # Security Check (Enforced by tests)
        if not os.environ.get('GOOGLE_API_KEY'):
            self._send_json(500, {"error": "Missing Configuration: GOOGLE_API_KEY"})
            return

        log(f"GET {self.path}")
        if self.path == '/api' or self.path == '/':
            self._send_json(200, {
                "status": "Alive", 
                "version": "v17.0",
                "backend": "Python Serverless",
                "react_version_target": "19.0.0"
            })
        elif self.path == '/api/config':
            key = os.environ.get('GOOGLE_API_KEY', 'MISSING_KEY')
            self._send_json(200, {"envKey": key})
        else:
            self._send_json(404, {"error": "Not Found"})

    def do_POST(self):
        try:
            length = int(self.headers.get('Content-Length', 0))
            if length == 0:
                return self._send_json(400, {"error": "Empty body"})
            
            body = self.rfile.read(length).decode('utf-8')
            d = json.loads(body)
            act = d.get('action', 'unknown')
            cwd = d.get('cwd', os.getcwd())
            
            if not os.path.exists(cwd): cwd = os.getcwd()
            log(f"POST {act} in {cwd}")

            if act == 'command':
                raw = d.get('command', '')
                cmd = translate_cmd(raw)
                
                si = None
                if platform.system() == "Windows":
                    si = subprocess.STARTUPINFO()
                    si.dwFlags |= subprocess.STARTF_USESHOWWINDOW
                    si.wShowWindow = subprocess.SW_HIDE

                # Run command
                r = subprocess.run(
                    cmd, 
                    shell=True, 
                    capture_output=True, 
                    text=True, 
                    cwd=cwd, 
                    encoding='utf-8', 
                    errors='replace',
                    startupinfo=si
                )
                
                self._send_json(200, {
                    "stdout": r.stdout, 
                    "stderr": r.stderr, 
                    "code": r.returncode,
                    "cmd_executed": cmd
                })

            elif act == 'fs_list':
                items = []
                # Add Parent
                parent = os.path.dirname(os.path.abspath(cwd))
                if parent != os.path.abspath(cwd):
                    items.append({"name": "..", "is_dir": True, "is_parent": True})
                
                with os.scandir(cwd) as it:
                    for entry in it:
                        items.append({
                            "name": entry.name,
                            "is_dir": entry.is_dir(),
                            "size": 0 if entry.is_dir() else entry.stat().st_size
                        })
                
                items.sort(key=lambda x: (not x.get('is_parent'), not x['is_dir'], x['name'].lower()))
                self._send_json(200, {"files": items, "cwd": os.path.abspath(cwd)})

            elif act == 'shutdown':
                self._send_json(200, {"status": "dying"})
                log("SHUTDOWN COMMAND RECEIVED")
                # Delayed kill
                if platform.system() == "Windows":
                    os.system("taskkill /F /IM python.exe /T")
                else:
                    os.kill(os.getpid(), 9)

            elif act == 'restart':
                self._send_json(200, {"status": "restarting"})

            else:
                self._send_json(400, {"error": f"Unknown action: {act}"})

        except Exception as e:
            log(f"CRASH: {e}")
            self._send_json(500, {"error": str(e)})