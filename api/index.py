from http.server import BaseHTTPRequestHandler
import os, json, subprocess, platform, datetime, sys, traceback

LOG_FILE = "server_log.txt"
def log(msg):
    try:
        with open(LOG_FILE, "a", encoding="utf-8") as f:
            ts = datetime.datetime.now().strftime("%H:%M:%S")
            f.write(f"[{ts}] {msg}\n")
    except: pass

class handler(BaseHTTPRequestHandler):
    # Wyłączamy standardowe logowanie do stderr (zapobiega crashom bez konsoli)
    def log_message(self, format, *args):
        try:
            log(f"REQ: {self.client_address[0]} - {format%args}")
        except: pass

    def _send_cors(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')

    def _send_json(self, code, data):
        try:
            self.send_response(code)
            self.send_header('Content-type', 'application/json')
            self._send_cors()
            self.end_headers()
            self.wfile.write(json.dumps(data).encode('utf-8'))
        except Exception as e:
            log(f"SEND ERROR: {e}")

    def do_OPTIONS(self):
        self.send_response(200)
        self._send_cors()
        self.end_headers()

    def do_GET(self):
        log(f"GET {self.path}")
        if self.path == '/api':
            self._send_json(200, {"status": "Alive", "mode": "Direct Link"})
        elif self.path == '/api/config':
            key = os.environ.get('GOOGLE_API_KEY', 'MISSING_KEY')
            self._send_json(200, {"envKey": key})
        else:
            self._send_json(404, {"error": "Not Found"})

    def do_POST(self):
        try:
            length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(length).decode('utf-8')
            d = json.loads(body)
            act = d.get('action', '')
            cwd = d.get('cwd', os.getcwd())
            
            log(f"POST {act}")

            if act == 'command':
                cmd = d.get('command', '')
                if platform.system() == "Windows":
                    if cmd.strip() == "ls": cmd = "dir"
                    if cmd.startswith("ls "): cmd = cmd.replace("ls ", "dir ", 1)
                
                si = subprocess.STARTUPINFO()
                si.dwFlags |= subprocess.STARTF_USESHOWWINDOW
                si.wShowWindow = subprocess.SW_HIDE

                r = subprocess.run(
                    cmd, shell=True, capture_output=True, text=True, 
                    cwd=cwd, encoding='utf-8', errors='replace', startupinfo=si
                )
                self._send_json(200, {"stdout": r.stdout, "stderr": r.stderr, "code": r.returncode})

            elif act == 'fs_list':
                items = []
                parent = os.path.dirname(os.path.abspath(cwd))
                if parent != os.path.abspath(cwd):
                    items.append({"name": "..", "is_dir": True, "is_parent": True})
                
                if os.path.exists(cwd):
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
                self._send_json(200, {"status": "bye"})
                if platform.system() == "Windows":
                    os.system("taskkill /F /IM python.exe /T")
                else:
                    os.kill(os.getpid(), 9)
            else:
                self._send_json(400, {"error": "Unknown action"})

        except Exception as e:
            log(f"CRASH: {e}")
            self._send_json(500, {"error": str(e)})
