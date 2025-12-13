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
import time
from typing import Optional, Dict, Any, Callable, TypeVar, Any as AnyType

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

# Próba importu Google Generative AI SDK
GOOGLE_AI_AVAILABLE = False
try:
    import google.generativeai as genai
    GOOGLE_AI_AVAILABLE = True
    print("[OK] Google Generative AI SDK available")
except ImportError:
    print("[WARN] Google Generative AI SDK not installed.")
    print("[TIP] Run: pip install google-generativeai --break-system-packages")

# OpenAI SDK for Grok (xAI uses OpenAI-compatible API)
OPENAI_AVAILABLE = False
try:
    from openai import OpenAI
    OPENAI_AVAILABLE = True
    print("[OK] OpenAI SDK available (for Grok/xAI)")
except ImportError:
    print("[WARN] OpenAI SDK not installed (needed for Grok).")
    print("[TIP] Run: pip install openai --break-system-packages")

LOG_DIR = "logs"
LOG_FILE = os.path.join(LOG_DIR, "server_log.txt")
CHAT_LOG = os.path.join(LOG_DIR, "chat.log")
AI_COMMAND_LOG = os.path.join(LOG_DIR, "ai-commands.log")

# Ensure logs directory exists
os.makedirs(LOG_DIR, exist_ok=True)


def log(msg: str) -> None:
    """Zapisuje wiadomość do logu z timestampem (opcjonalne)."""
    if os.environ.get("ENABLE_LOGGING", "true").lower() != "true":
        return
    try:
        with open(LOG_FILE, "a", encoding="utf-8") as f:
            ts = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            f.write(f"[{ts}] {msg}\n")
    except Exception:
        pass


def log_chat(role: str, content: str) -> None:
    """Zapisuje interakcję czatu do pliku logu (opcjonalne)."""
    if os.environ.get("ENABLE_LOGGING", "true").lower() != "true":
        return
    try:
        with open(CHAT_LOG, "a", encoding="utf-8") as f:
            ts = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            f.write(f"[{ts}] [{role.upper()}] {content}\n")
    except Exception:
        pass


def log_ai_command(command: str, result: str, exit_code: int = 0) -> None:
    """Zapisuje komendy wykonywane przez AI (opcjonalne)."""
    if os.environ.get("ENABLE_LOGGING", "true").lower() != "true":
        return
    try:
        with open(AI_COMMAND_LOG, "a", encoding="utf-8") as f:
            ts = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
            f.write(f"[{ts}]\n")
            f.write(f"Command: {command}\n")
            f.write(f"Exit Code: {exit_code}\n")
            f.write(f"Result: {result}\n")
            f.write(f"{'='*80}\n\n")
    except Exception:
        pass


def validate_api_key(key: Optional[str], provider: str) -> tuple[bool, Optional[str]]:
    """
    Validates API key format and returns (is_valid, error_message).
    Relaxed validation - only checks if non-empty.

    Args:
        key: The API key to validate
        provider: Provider name ('claude' or 'gemini')

    Returns:
        Tuple of (is_valid, error_message)
    """
    if not key:
        return False, None

    if not isinstance(key, str):
        return False, f"{provider} API key must be a string"

    key = key.strip()

    if len(key) == 0:
        return False, f"{provider} API key is empty"

    # Relaxed validation - just check minimum length (no strict format checking)
    if len(key) < 10:
        return False, f"{provider} API key is too short (minimum 10 characters)"

    return True, None


def get_api_keys() -> Dict[str, Optional[str]]:
    """Pobiera i waliduje klucze API z zmiennych środowiskowych."""
    claude_key = os.environ.get("ANTHROPIC_API_KEY")
    gemini_key = os.environ.get("GOOGLE_API_KEY")
    grok_key = os.environ.get("XAI_API_KEY")

    # Validate keys if present
    if claude_key:
        is_valid, error = validate_api_key(claude_key, "claude")
        if not is_valid and error:
            log(f"WARNING: {error}")

    if gemini_key:
        is_valid, error = validate_api_key(gemini_key, "gemini")
        if not is_valid and error:
            log(f"WARNING: {error}")

    if grok_key:
        is_valid, error = validate_api_key(grok_key, "grok")
        if not is_valid and error:
            log(f"WARNING: {error}")

    return {
        "claude": claude_key.strip() if claude_key else None,
        "gemini": gemini_key.strip() if gemini_key else None,
        "grok": grok_key.strip() if grok_key else None,
        "default_provider": os.environ.get("DEFAULT_AI_PROVIDER", "claude").lower(),
    }


T = TypeVar('T')


def retry_with_backoff(
    func: Callable[[], T],
    max_retries: int = 3,
    initial_delay: float = 1.0,
    max_delay: float = 10.0,
    backoff_factor: float = 2.0,
    retryable_exceptions: tuple = (Exception,)
) -> T:
    """
    Retry a function with exponential backoff.

    Args:
        func: Function to retry
        max_retries: Maximum number of retry attempts
        initial_delay: Initial delay between retries (seconds)
        max_delay: Maximum delay between retries (seconds)
        backoff_factor: Multiplier for delay after each retry
        retryable_exceptions: Tuple of exceptions that should trigger a retry

    Returns:
        Result of the function call

    Raises:
        The last exception if all retries fail
    """
    delay = initial_delay
    last_exception = None

    for attempt in range(max_retries + 1):
        try:
            return func()
        except retryable_exceptions as e:
            last_exception = e

            # Don't retry on last attempt
            if attempt == max_retries:
                break

            # Check if it's a retryable error
            error_str = str(e).lower()
            is_retryable = any(keyword in error_str for keyword in [
                'rate limit',
                'timeout',
                'connection',
                'network',
                '429',
                '503',
                '504',
                'overloaded'
            ])

            if not is_retryable:
                # Non-retryable error, raise immediately
                raise

            log(f"RETRY: Attempt {attempt + 1}/{max_retries} failed: {str(e)[:100]}")
            log(f"RETRY: Waiting {delay:.1f}s before next attempt...")

            time.sleep(delay)
            delay = min(delay * backoff_factor, max_delay)

    # All retries exhausted
    log(f"RETRY: All {max_retries} retries exhausted")
    raise last_exception


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
                "grokKey": "***" if keys["grok"] else None,
                "envKey": keys["gemini"],  # Backwards compatibility
                "defaultProvider": keys["default_provider"],
                "hasClaudeKey": bool(keys["claude"]),
                "hasGeminiKey": bool(keys["gemini"]),
                "hasGrokKey": bool(keys["grok"]),
            })

        elif self.path == "/api/health":
            # Health check endpoint
            self._send_json(200, {
                "status": "healthy",
                "timestamp": datetime.datetime.now().isoformat(),
                "anthropic_available": ANTHROPIC_AVAILABLE,
            })

        elif self.path == "/api/models":
            # Fetch available models from Claude API
            self._handle_get_models()

        elif self.path == "/api/models/all":
            # Fetch available models from all providers
            self._handle_get_all_models()

        else:
            self._send_json(404, {"error": "Not Found"})

    def _handle_get_models(self) -> None:
        """Fetches available models from Claude API."""
        if not ANTHROPIC_AVAILABLE:
            self._send_json(500, {
                "error": "Anthropic SDK not installed",
                "type": "missing_dependency",
                "models": []
            })
            return

        api_key = os.environ.get("ANTHROPIC_API_KEY")
        if not api_key:
            self._send_json(401, {
                "error": "ANTHROPIC_API_KEY not configured",
                "type": "missing_api_key",
                "models": []
            })
            return

        try:
            client = anthropic.Anthropic(api_key=api_key)

            # Fetch models from Claude API
            models_response = client.models.list()

            # Convert to list of model info
            models = []
            for model in models_response.data:
                model_info = {
                    "id": model.id,
                    "name": model.display_name if hasattr(model, 'display_name') else model.id,
                    "type": model.type if hasattr(model, 'type') else "model",
                    "created_at": model.created_at if hasattr(model, 'created_at') else None,
                }
                models.append(model_info)

            log(f"MODELS: Fetched {len(models)} models from Claude API")

            self._send_json(200, {
                "models": models,
                "count": len(models),
                "provider": "claude"
            })

        except anthropic.APIError as e:
            log(f"MODELS API ERROR: {e}")
            error_str = str(e).lower()

            if "authentication" in error_str or "api key" in error_str:
                self._send_json(401, {
                    "error": "Authentication failed. Check your Claude API key.",
                    "type": "authentication_error",
                    "models": []
                })
            else:
                self._send_json(500, {
                    "error": f"Failed to fetch models: {str(e)}",
                    "type": "api_error",
                    "models": []
                })
        except Exception as e:
            log(f"MODELS UNEXPECTED ERROR: {e}\n{traceback.format_exc()}")
            self._send_json(500, {
                "error": f"Unexpected error: {str(e)}",
                "type": "internal_error",
                "models": []
            })

    def _fetch_claude_models(self) -> Dict[str, Any]:
        """Fetches available models from Claude API."""
        if not ANTHROPIC_AVAILABLE:
            return {"models": [], "error": "Anthropic SDK not installed"}

        api_key = os.environ.get("ANTHROPIC_API_KEY")
        if not api_key:
            return {"models": [], "error": "ANTHROPIC_API_KEY not configured"}

        try:
            client = anthropic.Anthropic(api_key=api_key)
            models_response = client.models.list()

            models = []
            for model in models_response.data:
                model_info = {
                    "id": model.id,
                    "name": model.display_name if hasattr(model, 'display_name') else model.id,
                    "type": model.type if hasattr(model, 'type') else "model",
                    "created_at": model.created_at if hasattr(model, 'created_at') else None,
                }
                models.append(model_info)

            log(f"CLAUDE MODELS: Fetched {len(models)} models")
            return {"models": models, "count": len(models)}

        except Exception as e:
            log(f"CLAUDE MODELS ERROR: {e}")
            return {"models": [], "error": str(e)}

    def _fetch_gemini_models(self) -> Dict[str, Any]:
        """Fetches available models from Google Gemini API."""
        if not GOOGLE_AI_AVAILABLE:
            return {"models": [], "error": "Google Generative AI SDK not installed"}

        api_key = os.environ.get("GOOGLE_API_KEY")
        if not api_key:
            return {"models": [], "error": "GOOGLE_API_KEY not configured"}

        try:
            genai.configure(api_key=api_key)

            models = []
            for model in genai.list_models():
                # Filter for generative models that support content generation
                if 'generateContent' in model.supported_generation_methods:
                    model_id = model.name.replace('models/', '')
                    model_info = {
                        "id": model_id,
                        "name": model.display_name if hasattr(model, 'display_name') else model_id,
                        "type": "model",
                    }
                    models.append(model_info)

            log(f"GEMINI MODELS: Fetched {len(models)} models")
            return {"models": models, "count": len(models)}

        except Exception as e:
            log(f"GEMINI MODELS ERROR: {e}")
            return {"models": [], "error": str(e)}

    def _fetch_grok_models(self) -> Dict[str, Any]:
        """Fetches available models from xAI Grok API."""
        if not OPENAI_AVAILABLE:
            return {"models": [], "error": "OpenAI SDK not installed (needed for Grok)"}

        api_key = os.environ.get("XAI_API_KEY")
        if not api_key:
            return {"models": [], "error": "XAI_API_KEY not configured"}

        try:
            client = OpenAI(
                api_key=api_key,
                base_url="https://api.x.ai/v1"
            )

            models_response = client.models.list()

            models = []
            for model in models_response.data:
                model_info = {
                    "id": model.id,
                    "name": model.id.replace('-', ' ').title(),
                    "type": "model",
                    "created_at": model.created if hasattr(model, 'created') else None,
                }
                models.append(model_info)

            log(f"GROK MODELS: Fetched {len(models)} models")
            return {"models": models, "count": len(models)}

        except Exception as e:
            log(f"GROK MODELS ERROR: {e}")
            return {"models": [], "error": str(e)}

    def _handle_get_all_models(self) -> None:
        """Fetches available models from all configured providers."""
        result = {
            "claude": self._fetch_claude_models(),
            "gemini": self._fetch_gemini_models(),
            "grok": self._fetch_grok_models(),
        }

        total_count = (
            len(result["claude"].get("models", [])) +
            len(result["gemini"].get("models", [])) +
            len(result["grok"].get("models", []))
        )

        log(f"ALL MODELS: Total {total_count} models fetched")

        self._send_json(200, result)

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
                "error": "Anthropic SDK not installed. Run: pip install anthropic --break-system-packages",
                "type": "missing_dependency"
            })
            return

        api_key = os.environ.get("ANTHROPIC_API_KEY")
        if not api_key:
            self._send_json(401, {
                "error": "ANTHROPIC_API_KEY not configured in .env file. Please add your API key.",
                "type": "missing_api_key"
            })
            return

        # Validate API key
        is_valid, error_msg = validate_api_key(api_key, "claude")
        if not is_valid:
            self._send_json(401, {
                "error": error_msg or "Invalid Claude API key format",
                "type": "invalid_api_key"
            })
            return

        # Validate request data
        messages = data.get("messages", [])
        if not isinstance(messages, list):
            self._send_json(400, {
                "error": "Invalid request: 'messages' must be an array",
                "type": "invalid_request"
            })
            return

        if len(messages) == 0:
            self._send_json(400, {
                "error": "Invalid request: 'messages' array is empty",
                "type": "invalid_request"
            })
            return

        model = data.get("model", "claude-sonnet-4-20250514")
        system_prompt = data.get("system", "You are a helpful assistant.")
        stream = data.get("stream", True)

        # Relaxed model validation - let the API handle unknown models
        if not isinstance(model, str):
            model = "claude-sonnet-4-20250514"  # Fallback to default

        log(f"CLAUDE CHAT: model={model}, messages={len(messages)}, stream={stream}")

        # Log user message
        if messages and len(messages) > 0:
            last_message = messages[-1]
            if isinstance(last_message, dict) and last_message.get("role") == "user":
                log_chat("user", last_message.get("content", "")[:500])  # Log first 500 chars

        try:
            client = anthropic.Anthropic(api_key=api_key)

            if stream:
                # Streaming response
                self.send_response(200)
                self.send_header("Content-Type", "text/event-stream")
                self.send_header("Cache-Control", "no-cache")
                self._send_cors()
                self.end_headers()

                full_response = ""
                with client.messages.stream(
                    model=model,
                    max_tokens=4096,
                    system=system_prompt,
                    messages=messages,
                ) as stream_response:
                    for text in stream_response.text_stream:
                        full_response += text
                        self._send_sse(json.dumps({"text": text}))

                # Log assistant response
                log_chat("assistant", full_response[:500])  # Log first 500 chars
                self._send_sse("[DONE]")

            else:
                # Non-streaming response with retry logic
                def make_api_call():
                    return client.messages.create(
                        model=model,
                        max_tokens=4096,
                        system=system_prompt,
                        messages=messages,
                    )

                # Retry API call with exponential backoff
                response = retry_with_backoff(
                    func=make_api_call,
                    max_retries=3,
                    initial_delay=1.0,
                    max_delay=10.0,
                    retryable_exceptions=(Exception,)
                )

                # Log assistant response
                assistant_content = response.content[0].text
                log_chat("assistant", assistant_content[:500])  # Log first 500 chars

                self._send_json(200, {
                    "content": assistant_content,
                    "model": response.model,
                    "usage": {
                        "input_tokens": response.usage.input_tokens,
                        "output_tokens": response.usage.output_tokens,
                    },
                })

        except anthropic.APIError as e:
            log(f"CLAUDE API ERROR: {e}")
            error_type = "api_error"
            status_code = 500

            # Provide specific error messages based on error type
            error_str = str(e)
            if "authentication" in error_str.lower() or "api key" in error_str.lower():
                error_type = "authentication_error"
                status_code = 401
                message = "Authentication failed. Please check your Claude API key."
            elif "rate limit" in error_str.lower() or "429" in error_str:
                error_type = "rate_limit_error"
                status_code = 429
                message = "Rate limit exceeded. Please wait a moment and try again."
            elif "quota" in error_str.lower():
                error_type = "quota_error"
                status_code = 429
                message = "API quota exceeded. Please check your account limits."
            else:
                message = f"Claude API error: {error_str}"

            self._send_json(status_code, {
                "error": message,
                "type": error_type,
                "details": error_str
            })
        except ValueError as e:
            log(f"CLAUDE VALIDATION ERROR: {e}")
            self._send_json(400, {
                "error": f"Invalid request data: {str(e)}",
                "type": "validation_error"
            })
        except Exception as e:
            log(f"CLAUDE UNEXPECTED ERROR: {e}\n{traceback.format_exc()}")
            self._send_json(500, {
                "error": "An unexpected error occurred. Please try again.",
                "type": "internal_error",
                "details": str(e)
            })

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

            def make_improve_call():
                return client.messages.create(
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

            # Retry with exponential backoff
            response = retry_with_backoff(
                func=make_improve_call,
                max_retries=2,  # Fewer retries for improve endpoint
                initial_delay=1.0,
                retryable_exceptions=(Exception,)
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

            # Validate command
            if not cmd or not isinstance(cmd, str):
                self._send_json(400, {
                    "error": "Invalid command: must be a non-empty string",
                    "type": "invalid_request"
                })
                return

            # Security: Optional safety check (disabled by default for power users)
            safe_mode = os.environ.get("SAFE_MODE", "false").lower() == "true"
            if safe_mode:
                dangerous_patterns = ["rm -rf", "del /f", "format ", "mkfs", "dd if="]
                if any(pattern in cmd.lower() for pattern in dangerous_patterns):
                    log(f"WARNING: Potentially dangerous command blocked: {cmd}")
                    self._send_json(403, {
                        "error": "Command blocked for safety reasons (SAFE_MODE=true)",
                        "type": "forbidden_command"
                    })
                    return
            else:
                # Log warning but allow execution
                dangerous_patterns = ["rm -rf", "del /f", "format ", "mkfs", "dd if="]
                if any(pattern in cmd.lower() for pattern in dangerous_patterns):
                    log(f"WARNING: Executing potentially dangerous command: {cmd}")

            # Windows command translation
            if platform.system() == "Windows":
                if cmd.strip() == "ls":
                    cmd = "dir"
                if cmd.startswith("ls "):
                    cmd = cmd.replace("ls ", "dir ", 1)

            try:
                # Hide window on Windows
                startupinfo = None
                if platform.system() == "Windows":
                    startupinfo = subprocess.STARTUPINFO()
                    startupinfo.dwFlags |= subprocess.STARTF_USESHOWWINDOW
                    startupinfo.wShowWindow = subprocess.SW_HIDE

                # Add timeout to prevent hanging (configurable via .env)
                command_timeout = int(os.environ.get("COMMAND_TIMEOUT", "300"))  # Default 5 minutes
                result = subprocess.run(
                    cmd,
                    shell=True,
                    capture_output=True,
                    text=True,
                    cwd=cwd,
                    encoding="utf-8",
                    errors="replace",
                    startupinfo=startupinfo,
                    timeout=command_timeout
                )

                # Log AI command execution
                output = result.stdout if result.stdout else result.stderr
                log_ai_command(cmd, output[:500], result.returncode)

                self._send_json(200, {
                    "stdout": result.stdout,
                    "stderr": result.stderr,
                    "code": result.returncode,
                    "cmd_executed": cmd,
                })
            except subprocess.TimeoutExpired:
                command_timeout = int(os.environ.get("COMMAND_TIMEOUT", "300"))
                log(f"COMMAND TIMEOUT: {cmd}")
                self._send_json(408, {
                    "error": f"Command execution timeout ({command_timeout}s)",
                    "type": "timeout_error",
                    "cmd_executed": cmd
                })
            except FileNotFoundError as e:
                log(f"COMMAND NOT FOUND: {cmd} - {e}")
                self._send_json(404, {
                    "error": f"Command not found: {str(e)}",
                    "type": "not_found_error"
                })
            except PermissionError as e:
                log(f"PERMISSION DENIED: {cmd} - {e}")
                self._send_json(403, {
                    "error": f"Permission denied: {str(e)}",
                    "type": "permission_error"
                })
            except Exception as e:
                log(f"COMMAND ERROR: {cmd} - {e}")
                self._send_json(500, {
                    "error": f"Command execution failed: {str(e)}",
                    "type": "execution_error"
                })

        elif action == "fs_list":
            try:
                # Validate cwd exists and is a directory
                if not os.path.exists(cwd):
                    self._send_json(404, {
                        "error": f"Directory not found: {cwd}",
                        "type": "not_found_error"
                    })
                    return

                if not os.path.isdir(cwd):
                    self._send_json(400, {
                        "error": f"Path is not a directory: {cwd}",
                        "type": "invalid_path_error"
                    })
                    return

                items = []
                parent = os.path.dirname(os.path.abspath(cwd))

                if parent != os.path.abspath(cwd):
                    items.append({"name": "..", "is_dir": True, "is_parent": True})

                with os.scandir(cwd) as it:
                    for entry in it:
                        try:
                            items.append({
                                "name": entry.name,
                                "is_dir": entry.is_dir(),
                                "size": 0 if entry.is_dir() else entry.stat().st_size,
                            })
                        except (PermissionError, OSError) as e:
                            log(f"SKIPPING FILE (permission denied): {entry.name}")
                            continue

                items.sort(
                    key=lambda x: (
                        not x.get("is_parent"),
                        not x["is_dir"],
                        x["name"].lower(),
                    )
                )

                self._send_json(200, {"files": items, "cwd": os.path.abspath(cwd)})
            except PermissionError as e:
                log(f"PERMISSION DENIED: {cwd} - {e}")
                self._send_json(403, {
                    "error": f"Permission denied: {cwd}",
                    "type": "permission_error"
                })
            except Exception as e:
                log(f"FS_LIST ERROR: {e}")
                self._send_json(500, {
                    "error": f"Failed to list directory: {str(e)}",
                    "type": "internal_error"
                })

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
    print(f"  🚀 REGIS AI STUDIO BACKEND v2.1.0")
    print(f"{'='*60}")
    print(f"  Server: http://{host}:{port}")
    print(f"  Anthropic SDK: {'✅ Available' if ANTHROPIC_AVAILABLE else '❌ Not installed'}")
    print(f"  Google AI SDK: {'✅ Available' if GOOGLE_AI_AVAILABLE else '❌ Not installed'}")
    print(f"  OpenAI SDK (Grok): {'✅ Available' if OPENAI_AVAILABLE else '❌ Not installed'}")

    keys = get_api_keys()
    print(f"  Claude API Key: {'✅ Configured' if keys['claude'] else '❌ Missing'}")
    print(f"  Gemini API Key: {'✅ Configured' if keys['gemini'] else '❌ Missing'}")
    print(f"  Grok API Key: {'✅ Configured' if keys['grok'] else '❌ Missing'}")
    print(f"  Default Provider: {keys['default_provider']}")
    print(f"{'='*60}\n")

    if not keys["claude"] and not keys["gemini"] and not keys["grok"]:
        print("⚠️  WARNING: No API keys configured!")
        print("   Create .env file with ANTHROPIC_API_KEY, GOOGLE_API_KEY, or XAI_API_KEY")
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
