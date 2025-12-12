"""
Regis AI Studio - Backend Server
================================
Obsługuje zarówno Claude (Anthropic) jak i Gemini (Google) API.
API keys są ładowane z pliku .env - NIGDY nie hardkodujemy! 🔐
"""

from http.server import BaseHTTPRequestHandler, HTTPServer
import os
import json
import subprocess
import platform
import datetime
import sys
import traceback
from typing import Optional, Dict, Any

# Próba importu python-dotenv
try:
    from dotenv import load_dotenv
    load_dotenv()
    print("[OK] python-dotenv loaded successfully")
except ImportError:
    print("[WARN] python-dotenv not installed. Using os.environ only.")
    print("[TIP] Run: pip install python-dotenv --break-system-packages")

# Próba importu anthropic SDK
ANTHROPIC_AVAILABLE = False
try:
    import anthropic
    ANTHROPIC_AVAILABLE = True
    print("[OK] Anthropic SDK available")
except ImportError:
    print("[WARN] Anthropic SDK not installed.")
    print("[TIP] Run: pip install anthropic --break-system-packages")

LOG_FILE = "server_log.txt"


def log(msg: str) -> None:
    """Zapisuje wiadomość do logu z timestampem."""
    try:
        with open(LOG_FILE, "a", encoding="utf-8") as f:
            ts = datetime.datetime.now().strftime("%H:%M:%S")
            f.write(f"[{ts}] {msg}\n")
    except Exception:
        pass


def get_api_keys() -> Dict[str, Optional[str]]:
    """Pobiera klucze API z zmiennych środowiskowych."""
    return {
        "claude": os.environ.get("ANTHROPIC_API_KEY"),
        "gemini": os.environ.get("GOOGLE_API_KEY"),
        "default_provider": os.environ.get("DEFAULT_AI_PROVIDER", "claude"),
    }


class RegisAPIHandler(BaseHTTPRequestHandler):
    """Handler dla API Regis AI Studio."""

    def log_message(self, format: str, *args) -> None:
        """Override logowania - zapisuje do pliku zamiast stderr."""
        try:
            log(f"REQ: {format % args}")
        except Exception:
            pass

    def _send_cors(self) -> None:
        """Dodaje nagłówki CORS."""
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")

    def _send_json(self, code: int, data: Dict[str, Any]) -> None:
        """Wysyła odpowiedź JSON."""
        try:
            self.send_response(code)
            self.send_header("Content-type", "application/json")
            self._send_cors()
            self.end_headers()
            self.wfile.write(json.dumps(data, ensure_ascii=False).encode("utf-8"))
        except Exception as e:
            log(f"SEND ERROR: {e}")

    def _send_sse(self, data: str) -> None:
        """Wysyła chunk Server-Sent Event."""
        try:
            self.wfile.write(f"data: {data}\n\n".encode("utf-8"))
            self.wfile.flush()
        except Exception as e:
            log(f"SSE ERROR: {e}")

    def do_OPTIONS(self) -> None:
        """Obsługuje preflight CORS requests."""
        self.send_response(200)
        self._send_cors()
        self.end_headers()

    def do_GET(self) -> None:
        """Obsługuje GET requests."""
        log(f"GET {self.path}")

        if self.path == "/api":
            self._send_json(200, {
                "status": "Alive",
                "mode": "Claude + Gemini Hybrid",
                "version": "2.0.0-claude",
                "anthropic_sdk": ANTHROPIC_AVAILABLE,
            })

        elif self.path == "/api/config":
            keys = get_api_keys()
            # Nie wysyłamy pełnych kluczy - tylko info czy są dostępne
            self._send_json(200, {
                "claudeKey": "***" if keys["claude"] else None,
                "geminiKey": keys["gemini"],  # Legacy - Gemini może być w frontend
                "envKey": keys["gemini"],  # Backwards compatibility
                "defaultProvider": keys["default_provider"],
                "hasClaudeKey": bool(keys["claude"]),
                "hasGeminiKey": bool(keys["gemini"]),
            })

        elif self.path == "/api/health":
            # Health check endpoint
            self._send_json(200, {
                "status": "healthy",
                "timestamp": datetime.datetime.now().isoformat(),
                "anthropic_available": ANTHROPIC_AVAILABLE,
            })

        else:
            self._send_json(404, {"error": "Not Found"})

    def do_POST(self) -> None:
        """Obsługuje POST requests."""
        try:
            length = int(self.headers.get("Content-Length", 0))
            body = self.rfile.read(length).decode("utf-8")
            data = json.loads(body) if body else {}

            log(f"POST {self.path}")

            # === CLAUDE CHAT ENDPOINT ===
            if self.path == "/api/claude/chat":
                self._handle_claude_chat(data)

            # === CLAUDE IMPROVE PROMPT ===
            elif self.path == "/api/claude/improve":
                self._handle_claude_improve(data)

            # === LEGACY API ENDPOINT ===
            elif self.path == "/api":
                self._handle_legacy_api(data)

            else:
                self._send_json(404, {"error": "Endpoint not found"})

        except json.JSONDecodeError as e:
            log(f"JSON PARSE ERROR: {e}")
            self._send_json(400, {"error": "Invalid JSON"})
        except Exception as e:
            log(f"CRASH: {e}\n{traceback.format_exc()}")
            self._send_json(500, {"error": str(e)})

    def _handle_claude_chat(self, data: Dict[str, Any]) -> None:
        """Obsługuje chat z Claude API ze streamingiem."""
        if not ANTHROPIC_AVAILABLE:
            self._send_json(500, {
                "error": "Anthropic SDK not installed. Run: pip install anthropic"
            })
            return

        api_key = os.environ.get("ANTHROPIC_API_KEY")
        if not api_key:
            self._send_json(401, {
                "error": "ANTHROPIC_API_KEY not configured in .env"
            })
            return

        messages = data.get("messages", [])
        model = data.get("model", "claude-sonnet-4-20250514")
        system_prompt = data.get("system", "You are a helpful assistant.")
        stream = data.get("stream", True)

        log(f"CLAUDE CHAT: model={model}, messages={len(messages)}, stream={stream}")

        try:
            client = anthropic.Anthropic(api_key=api_key)

            if stream:
                # Streaming response
                self.send_response(200)
                self.send_header("Content-Type", "text/event-stream")
                self.send_header("Cache-Control", "no-cache")
                self._send_cors()
                self.end_headers()

                with client.messages.stream(
                    model=model,
                    max_tokens=4096,
                    system=system_prompt,
                    messages=messages,
                ) as stream_response:
                    for text in stream_response.text_stream:
                        self._send_sse(json.dumps({"text": text}))

                self._send_sse("[DONE]")

            else:
                # Non-streaming response
                response = client.messages.create(
                    model=model,
                    max_tokens=4096,
                    system=system_prompt,
                    messages=messages,
                )
                self._send_json(200, {
                    "content": response.content[0].text,
                    "model": response.model,
                    "usage": {
                        "input_tokens": response.usage.input_tokens,
                        "output_tokens": response.usage.output_tokens,
                    },
                })

        except anthropic.APIError as e:
            log(f"CLAUDE API ERROR: {e}")
            self._send_json(500, {"error": f"Claude API error: {str(e)}"})
        except Exception as e:
            log(f"CLAUDE ERROR: {e}")
            self._send_json(500, {"error": str(e)})

    def _handle_claude_improve(self, data: Dict[str, Any]) -> None:
        """Ulepsza prompt używając Claude."""
        if not ANTHROPIC_AVAILABLE:
            self._send_json(200, {"improved": data.get("prompt", "")})
            return

        api_key = os.environ.get("ANTHROPIC_API_KEY")
        if not api_key:
            self._send_json(200, {"improved": data.get("prompt", "")})
            return

        original_prompt = data.get("prompt", "")
        if not original_prompt:
            self._send_json(400, {"error": "No prompt provided"})
            return

        try:
            client = anthropic.Anthropic(api_key=api_key)
            response = client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=1024,
                system="""Jesteś ekspertem od prompt engineering. 
Otrzymujesz prompt użytkownika i musisz go ulepszyć, aby był:
- Bardziej precyzyjny
- Lepiej sformułowany
- Zawierał kontekst jeśli brakuje
Odpowiedz TYLKO ulepszonym promptem, bez wyjaśnień.""",
                messages=[
                    {"role": "user", "content": f"Ulepsz ten prompt:\n\n{original_prompt}"}
                ],
            )
            improved = response.content[0].text
            self._send_json(200, {"improved": improved})

        except Exception as e:
            log(f"IMPROVE ERROR: {e}")
            self._send_json(200, {"improved": original_prompt})

    def _handle_legacy_api(self, data: Dict[str, Any]) -> None:
        """Obsługuje legacy API dla kompatybilności wstecznej."""
        action = data.get("action", "")
        cwd = data.get("cwd", os.getcwd())

        log(f"LEGACY API: action={action}")

        if action == "command":
            cmd = data.get("command", "")

            # Windows command translation
            if platform.system() == "Windows":
                if cmd.strip() == "ls":
                    cmd = "dir"
                if cmd.startswith("ls "):
                    cmd = cmd.replace("ls ", "dir ", 1)

            # Hide window on Windows
            startupinfo = None
            if platform.system() == "Windows":
                startupinfo = subprocess.STARTUPINFO()
                startupinfo.dwFlags |= subprocess.STARTF_USESHOWWINDOW
                startupinfo.wShowWindow = subprocess.SW_HIDE

            result = subprocess.run(
                cmd,
                shell=True,
                capture_output=True,
                text=True,
                cwd=cwd,
                encoding="utf-8",
                errors="replace",
                startupinfo=startupinfo,
            )

            self._send_json(200, {
                "stdout": result.stdout,
                "stderr": result.stderr,
                "code": result.returncode,
                "cmd_executed": cmd,
            })

        elif action == "fs_list":
            items = []
            parent = os.path.dirname(os.path.abspath(cwd))

            if parent != os.path.abspath(cwd):
                items.append({"name": "..", "is_dir": True, "is_parent": True})

            if os.path.exists(cwd):
                with os.scandir(cwd) as it:
                    for entry in it:
                        try:
                            items.append({
                                "name": entry.name,
                                "is_dir": entry.is_dir(),
                                "size": 0 if entry.is_dir() else entry.stat().st_size,
                            })
                        except (PermissionError, OSError):
                            continue

                items.sort(
                    key=lambda x: (
                        not x.get("is_parent"),
                        not x["is_dir"],
                        x["name"].lower(),
                    )
                )

            self._send_json(200, {"files": items, "cwd": os.path.abspath(cwd)})

        elif action == "shutdown":
            log("SHUTDOWN COMMAND RECEIVED")
            self._send_json(200, {"status": "bye"})
            if platform.system() == "Windows":
                os.system("taskkill /F /IM python.exe /T")
            else:
                os.kill(os.getpid(), 9)

        else:
            self._send_json(400, {"error": f"Unknown action: {action}"})


def run_server(port: int = 8000, host: str = "127.0.0.1") -> None:
    """Uruchamia serwer HTTP."""
    print(f"\n{'='*60}")
    print(f"  🚀 REGIS AI STUDIO BACKEND v2.0.0-claude")
    print(f"{'='*60}")
    print(f"  Server: http://{host}:{port}")
    print(f"  Anthropic SDK: {'✅ Available' if ANTHROPIC_AVAILABLE else '❌ Not installed'}")

    keys = get_api_keys()
    print(f"  Claude API Key: {'✅ Configured' if keys['claude'] else '❌ Missing'}")
    print(f"  Gemini API Key: {'✅ Configured' if keys['gemini'] else '❌ Missing'}")
    print(f"  Default Provider: {keys['default_provider']}")
    print(f"{'='*60}\n")

    if not keys["claude"] and not keys["gemini"]:
        print("⚠️  WARNING: No API keys configured!")
        print("   Create .env file with ANTHROPIC_API_KEY or GOOGLE_API_KEY")
        print()

    server = HTTPServer((host, port), RegisAPIHandler)
    log(f"Server started on {host}:{port}")

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        log("Server stopped by user")
        print("\n[INFO] Server stopped.")


if __name__ == "__main__":
    port = int(os.environ.get("BACKEND_PORT", 8000))
    run_server(port=port)
