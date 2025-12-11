import os

print(">>> ROZPOCZYNAM ODTWARZANIE SYSTEMU (WERSJA TOTALNA) <<<")

# ==================================================================================
# KROK 1: Frontend - Nadpisujemy 'geminiService.ts'
# Wymuszamy bezpośrednie połączenie http://127.0.0.1:8000 (bez proxy)
# ==================================================================================
GEMINI_SERVICE_CODE = r'''import { GoogleGenerativeAI } from "@google/generative-ai";
import { DetectionBox, AIModelId } from "../types";

// --- KONFIGURACJA SIECIOWA ---
// Omijamy proxy Vite, uderzamy bezpośrednio do Pythona
const API_URL = "http://127.0.0.1:8000"; 
// -----------------------------

export interface LogEntry { id: string; timestamp: number; uptime: string; module: string; action: string; status: string; data?: any; }

let logHistory: LogEntry[] = [];
try {
    const saved = localStorage.getItem('regis_system_logs');
    logHistory = saved ? JSON.parse(saved) : [];
} catch { logHistory = []; }

const SYSTEM_START = Date.now();

export const systemLog = (module: string, action: string, status: string, data?: any) => {
  const entry: LogEntry = { 
      id: Math.random().toString(), 
      timestamp: Date.now(), 
      uptime: ((Date.now()-SYSTEM_START)/1000).toFixed(3), 
      module, action, status, data 
  };
  
  logHistory.unshift(entry);
  if(logHistory.length > 200) logHistory.pop();
  try { localStorage.setItem('regis_system_logs', JSON.stringify(logHistory)); } catch {}
  return entry;
};

export const getLogs = () => logHistory;

export const executeSystemAction = async (action: string, payload: any = {}) => {
    systemLog('SYS', action, 'REQ', payload);
    try {
        // UŻYWAMY PEŁNEGO ADRESU URL
        const res = await fetch(`${API_URL}/api`, { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ action, ...payload }) 
        });
        const data = await res.json();
        systemLog('SYS', action, data.error ? 'ERR' : 'RES', data);
        if (data.error) throw new Error(data.error);
        return data;
    } catch (e: any) {
        systemLog('SYS', action, 'FAIL', e.message);
        console.error("System Action Failed:", e);
        throw e;
    }
};

let ai: GoogleGenerativeAI | null = null;
let chatSession: any = null;

const getAI = async () => {
    if(!ai) {
        // Pobieramy konfigurację z backendu
        try {
            const res = await fetch(`${API_URL}/api/config`);
            const { envKey } = await res.json();
            const key = envKey || (import.meta as any).env.VITE_API_KEY;
            if(!key) throw new Error("No API Key");
            ai = new GoogleGenerativeAI(key);
        } catch (e) {
            console.error("Failed to fetch config from backend", e);
            throw e;
        }
    }
    return ai;
};

let currentModel: AIModelId = 'gemini-3-pro-preview';

export const setChatModel = (id: AIModelId) => { currentModel = id; chatSession = null; };
export const getChatModel = () => currentModel;

export const sendMessageStream = async (msg: string, atts: any[], onChunk: (t: string, g?: any) => void) => {
    const client = await getAI();
    if(!chatSession) {
        const model = client.getGenerativeModel({ 
            model: currentModel,
            systemInstruction: `You are Regis, an advanced AI system operating in 'God Mode'. 
            SYSTEM CONTEXT: You are running on a **WINDOWS** host environment.
            You have direct access to the local file system via the /cmd command (local Python backend).
            CRITICAL RULES:
            1. Think in Windows: Use 'dir', 'type', 'del', 'copy'.
            2. Do NOT Simulate: You are a system interface.
            3. Formatting: End every response with a JSON block of 6 follow-up suggestions in the format: \`\`\`json:SUGGESTIONS ["cmd 1", "cmd 2"...]\`\`\`.
            `
        });
        chatSession = model.startChat();
    }
    const parts: any[] = [{ text: msg }];
    atts.forEach(a => {
        parts.push({ inlineData: { mimeType: a.mimeType, data: a.data } });
    });

    const result = await chatSession.sendMessageStream(parts);
    for await (const chunk of result.stream) {
        const text = chunk.text();
        if(text) onChunk(text);
    }
};

// Placeholder functions needed for compilation
export const autoCurateRegistry = async (text: string) => null;
export const generateTitleForRegistry = async (content: string) => "Title";
export const improvePrompt = async (text: string) => text;
export const generateImage = async () => "";
export const generateVideo = async () => "";
export const generateSpeech = async () => "";
export const transcribeAudio = async () => "";
export const connectLiveSession = async () => ({ close: () => {} });
export const detectUIElements = async () => [];
'''

with open(os.path.join("src", "services", "geminiService.ts"), "w", encoding="utf-8") as f:
    f.write(GEMINI_SERVICE_CODE)
print(" [SUKCES] Frontend naprawiony: geminiService.ts używa teraz sztywnego adresu HTTP.")


# ==================================================================================
# KROK 2: Backend - Nadpisujemy 'api/index.py'
# Wersja z pełnym CORS (niezbędne dla bezpośredniego połączenia) i loggingiem
# ==================================================================================
BACKEND_INDEX_CODE = r'''from http.server import BaseHTTPRequestHandler
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
'''

with open(os.path.join("api", "index.py"), "w", encoding="utf-8") as f:
    f.write(BACKEND_INDEX_CODE)
print(" [SUKCES] Backend naprawiony: index.py wgrany (CORS + Logs).")

print("\n>>> PROCES ZAKOŃCZONY. URUCHOM 'KILL_AND_RUN.bat' <<<")