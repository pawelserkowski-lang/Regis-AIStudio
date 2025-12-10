from http.server import BaseHTTPRequestHandler
import os, json, subprocess, platform, shlex, base64
from io import BytesIO

try:
    from PIL import ImageGrab
    import psutil
    EXT = True
except: EXT = False

class handler(BaseHTTPRequestHandler):
    def _set_headers(self, s=200):
        self.send_response(s)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
    def do_OPTIONS(self): self._set_headers()

    def do_GET(self):
        if self.path == '/api/config':
            k = os.environ.get('GOOGLE_API_KEY', '')
            self._set_headers(200)
            self.wfile.write(json.dumps({"envKey": k}).encode())
        elif self.path == '/' or self.path == '/api':
            api_key = os.environ.get('GOOGLE_API_KEY')
            if not api_key:
                self._set_headers(500)
                self.wfile.write(json.dumps({"error": "Missing Configuration"}).encode())
                return

            self._set_headers(200)
            self.wfile.write(json.dumps({
                "status": "Alive",
                "backend": "Python Serverless",
                "react_version_target": "19.2.1"
            }).encode())
        else:
            self._set_headers(404)

    def do_POST(self):
        try:
            sz = int(self.headers['Content-Length'])
            d = json.loads(self.rfile.read(sz))
            act = d.get('action', 'cmd'); cwd = d.get('cwd', os.getcwd())
            if not os.path.exists(cwd): cwd = os.getcwd()
            res = {}

            if act == 'screenshot':
                if EXT:
                    b = BytesIO(); ImageGrab.grab().save(b, format="JPEG", quality=50)
                    res = {"status":"ok", "img": base64.b64encode(b.getvalue()).decode()}
                else: res = {"error": "Install Pillow"}
            elif act == 'tree':
                ign = {'.git','node_modules','dist','build','.vscode','__pycache__'}
                tr = []
                for r, ds, fs in os.walk(cwd):
                    ds[:] = [x for x in ds if x not in ign]
                    lvl = r.replace(cwd, '').count(os.sep)
                    if lvl > 3:
                        ds[:] = []
                        continue
                    tr.append(f"{'  '*lvl}📂 {os.path.basename(r)}/")
                    for f in fs:
                        if len(tr)>300: break
                        tr.append(f"{'  '*(lvl+1)}📄 {f}")
                    if len(tr)>300: break
                res = {"tree": "\n".join(tr)}
            elif act == 'kill_port':
                if EXT:
                    p = int(d.get('port',0)); k=False
                    for proc in psutil.process_iter(['pid']):
                        try:
                            for c in proc.connections():
                                if c.laddr.port == p: proc.kill(); k=True
                        except: pass
                    res = {"status": "killed" if k else "not_found"}
                else: res = {"error": "Install psutil"}
            elif act == 'command':
                c = d.get('command'); bg = d.get('background', False)
                if bg:
                    if platform.system()=="Windows": subprocess.Popen(c, shell=True, cwd=cwd, creationflags=subprocess.CREATE_NEW_CONSOLE)
                    else: subprocess.Popen(shlex.split(c), cwd=cwd, start_new_session=True)
                    res = {"stdout": "Background started", "code": 0}
                else:
                    r = subprocess.run(c, shell=True, capture_output=True, text=True, cwd=cwd, encoding='utf-8', errors='replace', timeout=45)
                    res = {"stdout": r.stdout, "stderr": r.stderr, "code": r.returncode}
            
            self._set_headers(200)
            self.wfile.write(json.dumps(res).encode())
        except Exception as e:
            self._set_headers(500)
            self.wfile.write(json.dumps({"error": str(e)}).encode())
