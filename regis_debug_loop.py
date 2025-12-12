#!/usr/bin/env python3
"""
╔══════════════════════════════════════════════════════════════════════════════╗
║  REGIS AI STUDIO - Debug Loop & Permission Validator                        ║
║  ════════════════════════════════════════════════════════════════════════════║
║  Ten skrypt wykonuje pełną diagnostykę systemu w pętli, sprawdzając:        ║
║  - Uprawnienia do zapisu plików                                             ║
║  - Możliwość uruchamiania aplikacji                                         ║
║  - Dostęp do internetu                                                      ║
║  - Integralność konfiguracji AI (Claude + Gemini)                           ║
║  - Auto-naprawę z backup'em przy błędach                                    ║
╚══════════════════════════════════════════════════════════════════════════════╝
"""

import os
import sys
import json
import time
import shutil
import socket
import platform
import subprocess
import traceback
import urllib.request
import urllib.error
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass, field, asdict
from enum import Enum

# ============================================================================
# ANSI Colors for Terminal Output
# ============================================================================
class Colors:
    RESET = "\033[0m"
    BOLD = "\033[1m"
    DIM = "\033[2m"
    
    # Foreground
    RED = "\033[91m"
    GREEN = "\033[92m"
    YELLOW = "\033[93m"
    BLUE = "\033[94m"
    MAGENTA = "\033[95m"
    CYAN = "\033[96m"
    WHITE = "\033[97m"
    
    # Background
    BG_RED = "\033[41m"
    BG_GREEN = "\033[42m"
    BG_YELLOW = "\033[43m"
    BG_BLUE = "\033[44m"
    
    # Cyber Green Theme
    CYBER = "\033[38;5;46m"  # Bright green
    CYBER_DIM = "\033[38;5;22m"  # Dark green


def print_banner():
    """Wyświetla cyber-banner ASCII."""
    banner = f"""
{Colors.CYBER}╔══════════════════════════════════════════════════════════════════════════════╗
║{Colors.WHITE}  ██████╗ ███████╗ ██████╗ ██╗███████╗    ██████╗ ███████╗██████╗ ██╗   ██╗ ██████╗{Colors.CYBER} ║
║{Colors.WHITE}  ██╔══██╗██╔════╝██╔════╝ ██║██╔════╝    ██╔══██╗██╔════╝██╔══██╗██║   ██║██╔════╝{Colors.CYBER} ║
║{Colors.WHITE}  ██████╔╝█████╗  ██║  ███╗██║███████╗    ██║  ██║█████╗  ██████╔╝██║   ██║██║  ███╗{Colors.CYBER}║
║{Colors.WHITE}  ██╔══██╗██╔══╝  ██║   ██║██║╚════██║    ██║  ██║██╔══╝  ██╔══██╗██║   ██║██║   ██║{Colors.CYBER}║
║{Colors.WHITE}  ██║  ██║███████╗╚██████╔╝██║███████║    ██████╔╝███████╗██████╔╝╚██████╔╝╚██████╔╝{Colors.CYBER}║
║{Colors.WHITE}  ╚═╝  ╚═╝╚══════╝ ╚═════╝ ╚═╝╚══════╝    ╚═════╝ ╚══════╝╚═════╝  ╚═════╝  ╚═════╝{Colors.CYBER} ║
╠══════════════════════════════════════════════════════════════════════════════╣
║{Colors.WHITE}  🔄 DEBUG LOOP & PERMISSION VALIDATOR v2.0                                   {Colors.CYBER}║
║{Colors.WHITE}  🤖 Dual-AI: Claude (Anthropic) + Gemini (Google)                            {Colors.CYBER}║
╚══════════════════════════════════════════════════════════════════════════════╝{Colors.RESET}
"""
    print(banner)


# ============================================================================
# Data Structures
# ============================================================================
class TestStatus(Enum):
    PENDING = "⏳"
    RUNNING = "🔄"
    PASSED = "✅"
    FAILED = "❌"
    WARNING = "⚠️"
    SKIPPED = "⏭️"
    FIXED = "🔧"


@dataclass
class TestResult:
    name: str
    status: TestStatus
    message: str
    details: Optional[str] = None
    fix_attempted: bool = False
    fix_successful: bool = False
    duration_ms: float = 0.0


@dataclass
class DebugSession:
    session_id: str
    start_time: datetime
    end_time: Optional[datetime] = None
    iteration: int = 0
    results: List[TestResult] = field(default_factory=list)
    errors: List[str] = field(default_factory=list)
    fixes_applied: List[str] = field(default_factory=list)
    system_info: Dict[str, Any] = field(default_factory=dict)


# ============================================================================
# Memory/History System (jules_memory.json compatible)
# ============================================================================
MEMORY_FILE = ".jules_memory.json"


def load_memory() -> Dict[str, Any]:
    """Ładuje historię napraw z pliku pamięci."""
    if os.path.exists(MEMORY_FILE):
        try:
            with open(MEMORY_FILE, "r", encoding="utf-8") as f:
                return json.load(f)
        except (json.JSONDecodeError, IOError):
            return {"repairs": [], "sessions": [], "known_issues": {}}
    return {"repairs": [], "sessions": [], "known_issues": {}}


def save_memory(memory: Dict[str, Any]) -> None:
    """Zapisuje historię napraw do pliku pamięci."""
    try:
        with open(MEMORY_FILE, "w", encoding="utf-8") as f:
            json.dump(memory, f, indent=2, default=str, ensure_ascii=False)
    except IOError as e:
        print(f"{Colors.RED}[ERROR] Cannot save memory: {e}{Colors.RESET}")


def record_repair(error_signature: str, strategy: str, outcome: str, details: str = "") -> None:
    """Zapisuje próbę naprawy do historii."""
    memory = load_memory()
    memory["repairs"].append({
        "timestamp": datetime.now().isoformat(),
        "error_signature": error_signature,
        "strategy": strategy,
        "outcome": outcome,
        "details": details,
    })
    # Keep only last 100 repairs
    memory["repairs"] = memory["repairs"][-100:]
    save_memory(memory)


def was_fix_tried(error_signature: str, strategy: str) -> bool:
    """Sprawdza czy dana strategia naprawy była już próbowana."""
    memory = load_memory()
    for repair in memory["repairs"]:
        if repair["error_signature"] == error_signature and repair["strategy"] == strategy:
            if repair["outcome"] == "FAILED":
                return True
    return False


# ============================================================================
# Backup System
# ============================================================================
BACKUP_DIR = ".regis_backup"


def create_backup(files: List[str]) -> str:
    """Tworzy backup wskazanych plików."""
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_path = os.path.join(BACKUP_DIR, timestamp)
    os.makedirs(backup_path, exist_ok=True)
    
    backed_up = []
    for filepath in files:
        if os.path.exists(filepath):
            dest = os.path.join(backup_path, os.path.basename(filepath))
            shutil.copy2(filepath, dest)
            backed_up.append(filepath)
    
    # Save manifest
    manifest = {
        "timestamp": timestamp,
        "files": backed_up,
        "created_at": datetime.now().isoformat(),
    }
    with open(os.path.join(backup_path, "manifest.json"), "w") as f:
        json.dump(manifest, f, indent=2)
    
    return backup_path


def restore_backup(backup_path: str) -> bool:
    """Przywraca pliki z backup'u."""
    manifest_path = os.path.join(backup_path, "manifest.json")
    if not os.path.exists(manifest_path):
        return False
    
    with open(manifest_path, "r") as f:
        manifest = json.load(f)
    
    for filepath in manifest["files"]:
        backup_file = os.path.join(backup_path, os.path.basename(filepath))
        if os.path.exists(backup_file):
            shutil.copy2(backup_file, filepath)
    
    return True


def list_backups() -> List[Dict[str, Any]]:
    """Zwraca listę dostępnych backup'ów."""
    backups = []
    if os.path.exists(BACKUP_DIR):
        for entry in os.scandir(BACKUP_DIR):
            if entry.is_dir():
                manifest_path = os.path.join(entry.path, "manifest.json")
                if os.path.exists(manifest_path):
                    with open(manifest_path, "r") as f:
                        manifest = json.load(f)
                        manifest["path"] = entry.path
                        backups.append(manifest)
    return sorted(backups, key=lambda x: x["timestamp"], reverse=True)


# ============================================================================
# Permission Tests
# ============================================================================
class PermissionTester:
    """Tester uprawnień systemowych."""
    
    def __init__(self, base_dir: str = "."):
        self.base_dir = os.path.abspath(base_dir)
        self.test_dir = os.path.join(self.base_dir, ".regis_test")
    
    def test_file_write(self) -> TestResult:
        """Test uprawnień do zapisu plików."""
        start = time.time()
        test_file = os.path.join(self.test_dir, "write_test.txt")
        
        try:
            os.makedirs(self.test_dir, exist_ok=True)
            
            # Test write
            with open(test_file, "w", encoding="utf-8") as f:
                f.write("Regis permission test - " + datetime.now().isoformat())
            
            # Test read back
            with open(test_file, "r", encoding="utf-8") as f:
                content = f.read()
            
            # Test delete
            os.remove(test_file)
            
            return TestResult(
                name="File Write Permission",
                status=TestStatus.PASSED,
                message="Pełne uprawnienia do zapisu plików",
                details=f"Test location: {self.test_dir}",
                duration_ms=(time.time() - start) * 1000
            )
            
        except PermissionError as e:
            return TestResult(
                name="File Write Permission",
                status=TestStatus.FAILED,
                message="Brak uprawnień do zapisu!",
                details=str(e),
                duration_ms=(time.time() - start) * 1000
            )
        except Exception as e:
            return TestResult(
                name="File Write Permission",
                status=TestStatus.FAILED,
                message=f"Błąd: {type(e).__name__}",
                details=str(e),
                duration_ms=(time.time() - start) * 1000
            )
    
    def test_directory_create(self) -> TestResult:
        """Test tworzenia katalogów."""
        start = time.time()
        nested_dir = os.path.join(self.test_dir, "nested", "deep", "folder")
        
        try:
            os.makedirs(nested_dir, exist_ok=True)
            
            # Verify
            if os.path.isdir(nested_dir):
                shutil.rmtree(os.path.join(self.test_dir, "nested"))
                return TestResult(
                    name="Directory Creation",
                    status=TestStatus.PASSED,
                    message="Tworzenie katalogów działa poprawnie",
                    duration_ms=(time.time() - start) * 1000
                )
            else:
                return TestResult(
                    name="Directory Creation",
                    status=TestStatus.FAILED,
                    message="Katalog nie został utworzony",
                    duration_ms=(time.time() - start) * 1000
                )
                
        except Exception as e:
            return TestResult(
                name="Directory Creation",
                status=TestStatus.FAILED,
                message=str(e),
                duration_ms=(time.time() - start) * 1000
            )
    
    def test_executable_permission(self) -> TestResult:
        """Test uruchamiania aplikacji."""
        start = time.time()
        
        # Try to run a simple command
        if platform.system() == "Windows":
            cmd = ["cmd", "/c", "echo", "test"]
        else:
            cmd = ["echo", "test"]
        
        try:
            result = subprocess.run(
                cmd,
                capture_output=True,
                text=True,
                timeout=10
            )
            
            if result.returncode == 0:
                return TestResult(
                    name="Execute Permission",
                    status=TestStatus.PASSED,
                    message="Uruchamianie aplikacji dozwolone",
                    details=f"Test command: {' '.join(cmd)}",
                    duration_ms=(time.time() - start) * 1000
                )
            else:
                return TestResult(
                    name="Execute Permission",
                    status=TestStatus.WARNING,
                    message=f"Command returned code {result.returncode}",
                    details=result.stderr,
                    duration_ms=(time.time() - start) * 1000
                )
                
        except subprocess.TimeoutExpired:
            return TestResult(
                name="Execute Permission",
                status=TestStatus.WARNING,
                message="Command timed out",
                duration_ms=(time.time() - start) * 1000
            )
        except Exception as e:
            return TestResult(
                name="Execute Permission",
                status=TestStatus.FAILED,
                message=str(e),
                duration_ms=(time.time() - start) * 1000
            )
    
    def test_python_subprocess(self) -> TestResult:
        """Test uruchamiania Python subprocess."""
        start = time.time()
        
        try:
            result = subprocess.run(
                [sys.executable, "-c", "print('Regis subprocess test OK')"],
                capture_output=True,
                text=True,
                timeout=10
            )
            
            if "OK" in result.stdout:
                return TestResult(
                    name="Python Subprocess",
                    status=TestStatus.PASSED,
                    message="Python subprocess działa",
                    details=f"Python: {sys.executable}",
                    duration_ms=(time.time() - start) * 1000
                )
            else:
                return TestResult(
                    name="Python Subprocess",
                    status=TestStatus.FAILED,
                    message="Unexpected output",
                    details=result.stdout + result.stderr,
                    duration_ms=(time.time() - start) * 1000
                )
                
        except Exception as e:
            return TestResult(
                name="Python Subprocess",
                status=TestStatus.FAILED,
                message=str(e),
                duration_ms=(time.time() - start) * 1000
            )
    
    def cleanup(self) -> None:
        """Czyści pliki testowe."""
        if os.path.exists(self.test_dir):
            shutil.rmtree(self.test_dir, ignore_errors=True)


# ============================================================================
# Network Tests
# ============================================================================
class NetworkTester:
    """Tester połączeń sieciowych."""
    
    ENDPOINTS = {
        "Google DNS": ("8.8.8.8", 53),
        "Cloudflare DNS": ("1.1.1.1", 53),
        "Anthropic API": ("api.anthropic.com", 443),
        "Google AI": ("generativelanguage.googleapis.com", 443),
    }
    
    HTTP_ENDPOINTS = {
        "Anthropic": "https://api.anthropic.com/v1/messages",
        "Google AI": "https://generativelanguage.googleapis.com/",
        "GitHub": "https://api.github.com/",
    }
    
    def test_socket_connection(self, name: str, host: str, port: int, timeout: float = 5.0) -> TestResult:
        """Test połączenia socket."""
        start = time.time()
        
        try:
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            sock.settimeout(timeout)
            result = sock.connect_ex((host, port))
            sock.close()
            
            if result == 0:
                return TestResult(
                    name=f"Network: {name}",
                    status=TestStatus.PASSED,
                    message=f"Połączenie z {host}:{port} OK",
                    duration_ms=(time.time() - start) * 1000
                )
            else:
                return TestResult(
                    name=f"Network: {name}",
                    status=TestStatus.FAILED,
                    message=f"Nie można połączyć z {host}:{port}",
                    details=f"Error code: {result}",
                    duration_ms=(time.time() - start) * 1000
                )
                
        except socket.timeout:
            return TestResult(
                name=f"Network: {name}",
                status=TestStatus.FAILED,
                message="Connection timeout",
                duration_ms=(time.time() - start) * 1000
            )
        except socket.gaierror as e:
            return TestResult(
                name=f"Network: {name}",
                status=TestStatus.FAILED,
                message="DNS resolution failed",
                details=str(e),
                duration_ms=(time.time() - start) * 1000
            )
        except Exception as e:
            return TestResult(
                name=f"Network: {name}",
                status=TestStatus.FAILED,
                message=str(e),
                duration_ms=(time.time() - start) * 1000
            )
    
    def test_http_endpoint(self, name: str, url: str, timeout: float = 10.0) -> TestResult:
        """Test HTTP endpoint (bez autentykacji)."""
        start = time.time()
        
        try:
            req = urllib.request.Request(
                url,
                headers={"User-Agent": "Regis-AI-Studio/2.0"}
            )
            response = urllib.request.urlopen(req, timeout=timeout)
            status_code = response.getcode()
            
            # 401/403 is OK - means server is reachable but needs auth
            if status_code in [200, 401, 403, 404]:
                return TestResult(
                    name=f"HTTP: {name}",
                    status=TestStatus.PASSED,
                    message=f"Endpoint dostępny (HTTP {status_code})",
                    details=url,
                    duration_ms=(time.time() - start) * 1000
                )
            else:
                return TestResult(
                    name=f"HTTP: {name}",
                    status=TestStatus.WARNING,
                    message=f"Unexpected status: {status_code}",
                    details=url,
                    duration_ms=(time.time() - start) * 1000
                )
                
        except urllib.error.HTTPError as e:
            # 401/403/404 means server is reachable
            if e.code in [401, 403, 404, 405]:
                return TestResult(
                    name=f"HTTP: {name}",
                    status=TestStatus.PASSED,
                    message=f"Endpoint dostępny (wymaga auth/HTTP {e.code})",
                    details=url,
                    duration_ms=(time.time() - start) * 1000
                )
            return TestResult(
                name=f"HTTP: {name}",
                status=TestStatus.WARNING,
                message=f"HTTP Error {e.code}",
                details=str(e),
                duration_ms=(time.time() - start) * 1000
            )
        except urllib.error.URLError as e:
            return TestResult(
                name=f"HTTP: {name}",
                status=TestStatus.FAILED,
                message="Connection failed",
                details=str(e.reason),
                duration_ms=(time.time() - start) * 1000
            )
        except Exception as e:
            return TestResult(
                name=f"HTTP: {name}",
                status=TestStatus.FAILED,
                message=str(e),
                duration_ms=(time.time() - start) * 1000
            )
    
    def test_all(self) -> List[TestResult]:
        """Uruchamia wszystkie testy sieciowe."""
        results = []
        
        # Socket tests
        for name, (host, port) in self.ENDPOINTS.items():
            results.append(self.test_socket_connection(name, host, port))
        
        # HTTP tests
        for name, url in self.HTTP_ENDPOINTS.items():
            results.append(self.test_http_endpoint(name, url))
        
        return results


# ============================================================================
# Environment & Configuration Tests
# ============================================================================
class ConfigTester:
    """Tester konfiguracji środowiska."""
    
    def test_env_file(self) -> TestResult:
        """Test obecności pliku .env."""
        start = time.time()
        
        env_file = ".env"
        env_example = ".env.example"
        
        if os.path.exists(env_file):
            # Check if it has required keys
            with open(env_file, "r") as f:
                content = f.read()
            
            has_anthropic = "ANTHROPIC_API_KEY" in content
            has_google = "GOOGLE_API_KEY" in content
            
            if has_anthropic or has_google:
                return TestResult(
                    name="ENV File",
                    status=TestStatus.PASSED,
                    message=f".env istnieje (Claude: {'✓' if has_anthropic else '✗'}, Gemini: {'✓' if has_google else '✗'})",
                    duration_ms=(time.time() - start) * 1000
                )
            else:
                return TestResult(
                    name="ENV File",
                    status=TestStatus.WARNING,
                    message=".env istnieje ale brak kluczy API",
                    duration_ms=(time.time() - start) * 1000
                )
        else:
            return TestResult(
                name="ENV File",
                status=TestStatus.FAILED,
                message=".env nie istnieje!",
                details=f"Skopiuj {env_example} jako .env i uzupełnij klucze",
                duration_ms=(time.time() - start) * 1000
            )
    
    def test_anthropic_key(self) -> TestResult:
        """Test klucza API Anthropic."""
        start = time.time()
        
        # Try to load from .env first
        try:
            from dotenv import load_dotenv
            load_dotenv()
        except ImportError:
            pass
        
        key = os.environ.get("ANTHROPIC_API_KEY", "")
        
        if not key:
            return TestResult(
                name="Anthropic API Key",
                status=TestStatus.FAILED,
                message="ANTHROPIC_API_KEY nie ustawiony",
                details="Dodaj klucz do .env lub zmiennych środowiskowych Windows",
                duration_ms=(time.time() - start) * 1000
            )
        
        # Validate format (sk-ant-api03-...)
        if key.startswith("sk-ant-"):
            return TestResult(
                name="Anthropic API Key",
                status=TestStatus.PASSED,
                message=f"Klucz Claude OK (sk-ant-...{key[-4:]})",
                duration_ms=(time.time() - start) * 1000
            )
        else:
            return TestResult(
                name="Anthropic API Key",
                status=TestStatus.WARNING,
                message="Klucz ma nieoczekiwany format",
                details="Oczekiwano: sk-ant-api03-...",
                duration_ms=(time.time() - start) * 1000
            )
    
    def test_google_key(self) -> TestResult:
        """Test klucza API Google."""
        start = time.time()
        
        try:
            from dotenv import load_dotenv
            load_dotenv()
        except ImportError:
            pass
        
        key = os.environ.get("GOOGLE_API_KEY", "")
        
        if not key:
            return TestResult(
                name="Google API Key",
                status=TestStatus.WARNING,
                message="GOOGLE_API_KEY nie ustawiony (opcjonalne dla dual-AI)",
                duration_ms=(time.time() - start) * 1000
            )
        
        # Google keys are typically 39 chars, start with "AIza"
        if key.startswith("AIza") and len(key) >= 30:
            return TestResult(
                name="Google API Key",
                status=TestStatus.PASSED,
                message=f"Klucz Gemini OK (AIza...{key[-4:]})",
                duration_ms=(time.time() - start) * 1000
            )
        else:
            return TestResult(
                name="Google API Key",
                status=TestStatus.WARNING,
                message="Klucz ma nieoczekiwany format",
                duration_ms=(time.time() - start) * 1000
            )
    
    def test_python_dependencies(self) -> TestResult:
        """Test wymaganych zależności Python."""
        start = time.time()
        
        required = {
            "anthropic": "anthropic",
            "dotenv": "python-dotenv",
            "requests": "requests",
        }
        
        optional = {
            "google.generativeai": "google-generativeai",
        }
        
        missing_required = []
        missing_optional = []
        
        for module, package in required.items():
            try:
                __import__(module)
            except ImportError:
                missing_required.append(package)
        
        for module, package in optional.items():
            try:
                __import__(module)
            except ImportError:
                missing_optional.append(package)
        
        if missing_required:
            return TestResult(
                name="Python Dependencies",
                status=TestStatus.FAILED,
                message=f"Brakujące pakiety: {', '.join(missing_required)}",
                details=f"pip install {' '.join(missing_required)} --break-system-packages",
                duration_ms=(time.time() - start) * 1000
            )
        elif missing_optional:
            return TestResult(
                name="Python Dependencies",
                status=TestStatus.WARNING,
                message=f"Opcjonalne pakiety: {', '.join(missing_optional)}",
                duration_ms=(time.time() - start) * 1000
            )
        else:
            return TestResult(
                name="Python Dependencies",
                status=TestStatus.PASSED,
                message="Wszystkie zależności zainstalowane",
                duration_ms=(time.time() - start) * 1000
            )
    
    def test_backend_file(self) -> TestResult:
        """Test obecności pliku backend."""
        start = time.time()
        
        backend_paths = [
            "api/index.py",
            "backend/index.py",
            "server.py",
        ]
        
        for path in backend_paths:
            if os.path.exists(path):
                return TestResult(
                    name="Backend File",
                    status=TestStatus.PASSED,
                    message=f"Backend znaleziony: {path}",
                    duration_ms=(time.time() - start) * 1000
                )
        
        return TestResult(
            name="Backend File",
            status=TestStatus.FAILED,
            message="Nie znaleziono pliku backend!",
            details=f"Szukano: {', '.join(backend_paths)}",
            duration_ms=(time.time() - start) * 1000
        )
    
    def test_ports_available(self) -> TestResult:
        """Test dostępności wymaganych portów."""
        start = time.time()
        
        ports = {
            8000: "Backend API",
            5173: "Vite Dev Server",
            3000: "Alternative Frontend",
        }
        
        in_use = []
        available = []
        
        for port, name in ports.items():
            sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
            result = sock.connect_ex(("127.0.0.1", port))
            sock.close()
            
            if result == 0:
                in_use.append(f"{port} ({name})")
            else:
                available.append(port)
        
        if in_use:
            return TestResult(
                name="Port Availability",
                status=TestStatus.WARNING,
                message=f"Porty w użyciu: {', '.join(in_use)}",
                details="Może to oznaczać że serwery już działają",
                duration_ms=(time.time() - start) * 1000
            )
        else:
            return TestResult(
                name="Port Availability",
                status=TestStatus.PASSED,
                message="Wszystkie porty dostępne",
                duration_ms=(time.time() - start) * 1000
            )


# ============================================================================
# Auto-Fix System
# ============================================================================
class AutoFixer:
    """System automatycznych napraw."""
    
    def __init__(self):
        self.fixes_applied = []
    
    def fix_missing_env(self) -> Tuple[bool, str]:
        """Tworzy plik .env z template."""
        error_sig = "missing_env_file"
        strategy = "create_from_example"
        
        if was_fix_tried(error_sig, strategy):
            return False, "Ta naprawa już była próbowana i nie zadziałała"
        
        try:
            env_content = """# Regis AI Studio - Environment Configuration
# Skopiuj ten plik jako .env i uzupełnij kluczami API

# Google Gemini API Key (opcjonalne jeśli używasz tylko Claude)
GOOGLE_API_KEY=

# Anthropic Claude API Key (wymagane dla integracji Claude)
# Pobierz klucz z: https://console.anthropic.com/
ANTHROPIC_API_KEY=

# Domyślny model AI: "claude" lub "gemini"
DEFAULT_AI_PROVIDER=claude

# Port backendu (domyślnie 8000)
BACKEND_PORT=8000
"""
            with open(".env", "w", encoding="utf-8") as f:
                f.write(env_content)
            
            record_repair(error_sig, strategy, "SUCCESS", "Created .env file")
            self.fixes_applied.append("Created .env file from template")
            return True, "Utworzono plik .env - uzupełnij klucze API!"
            
        except Exception as e:
            record_repair(error_sig, strategy, "FAILED", str(e))
            return False, f"Nie udało się utworzyć .env: {e}"
    
    def fix_missing_dependencies(self) -> Tuple[bool, str]:
        """Instaluje brakujące zależności."""
        error_sig = "missing_python_deps"
        strategy = "pip_install"
        
        if was_fix_tried(error_sig, strategy):
            return False, "Instalacja już była próbowana"
        
        packages = ["python-dotenv", "anthropic", "requests"]
        
        try:
            cmd = [
                sys.executable, "-m", "pip", "install",
                *packages,
                "--break-system-packages",
                "--quiet"
            ]
            
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
            
            if result.returncode == 0:
                record_repair(error_sig, strategy, "SUCCESS", f"Installed: {packages}")
                self.fixes_applied.append(f"Installed: {', '.join(packages)}")
                return True, f"Zainstalowano: {', '.join(packages)}"
            else:
                record_repair(error_sig, strategy, "FAILED", result.stderr)
                return False, f"pip error: {result.stderr}"
                
        except Exception as e:
            record_repair(error_sig, strategy, "FAILED", str(e))
            return False, str(e)
    
    def fix_create_api_directory(self) -> Tuple[bool, str]:
        """Tworzy katalog api/ jeśli nie istnieje."""
        error_sig = "missing_api_dir"
        strategy = "create_directory"
        
        try:
            os.makedirs("api", exist_ok=True)
            record_repair(error_sig, strategy, "SUCCESS", "Created api/ directory")
            self.fixes_applied.append("Created api/ directory")
            return True, "Utworzono katalog api/"
        except Exception as e:
            record_repair(error_sig, strategy, "FAILED", str(e))
            return False, str(e)


# ============================================================================
# Main Debug Loop
# ============================================================================
class DebugLoop:
    """Główna pętla debugowania."""
    
    def __init__(self, max_iterations: int = 3, auto_fix: bool = True):
        self.max_iterations = max_iterations
        self.auto_fix = auto_fix
        self.session = DebugSession(
            session_id=datetime.now().strftime("%Y%m%d_%H%M%S"),
            start_time=datetime.now(),
            system_info=self._collect_system_info()
        )
        self.permission_tester = PermissionTester()
        self.network_tester = NetworkTester()
        self.config_tester = ConfigTester()
        self.auto_fixer = AutoFixer()
    
    def _collect_system_info(self) -> Dict[str, Any]:
        """Zbiera informacje o systemie."""
        return {
            "platform": platform.system(),
            "platform_release": platform.release(),
            "platform_version": platform.version(),
            "architecture": platform.machine(),
            "python_version": sys.version,
            "python_executable": sys.executable,
            "cwd": os.getcwd(),
            "user": os.environ.get("USER", os.environ.get("USERNAME", "unknown")),
        }
    
    def _print_result(self, result: TestResult) -> None:
        """Wyświetla wynik testu."""
        status_colors = {
            TestStatus.PASSED: Colors.GREEN,
            TestStatus.FAILED: Colors.RED,
            TestStatus.WARNING: Colors.YELLOW,
            TestStatus.SKIPPED: Colors.DIM,
            TestStatus.FIXED: Colors.CYAN,
        }
        
        color = status_colors.get(result.status, Colors.WHITE)
        
        print(f"  {result.status.value} {color}{result.name}{Colors.RESET}")
        print(f"     └─ {result.message}")
        if result.details:
            print(f"        {Colors.DIM}{result.details}{Colors.RESET}")
        if result.fix_attempted:
            fix_status = Colors.GREEN + "✓" if result.fix_successful else Colors.RED + "✗"
            print(f"        {fix_status} Auto-fix attempted{Colors.RESET}")
    
    def _run_tests(self) -> List[TestResult]:
        """Uruchamia wszystkie testy."""
        results = []
        
        print(f"\n{Colors.CYBER}╔═══════════════════════════════════════════════════════════════╗{Colors.RESET}")
        print(f"{Colors.CYBER}║{Colors.WHITE}  📋 PERMISSION TESTS                                          {Colors.CYBER}║{Colors.RESET}")
        print(f"{Colors.CYBER}╚═══════════════════════════════════════════════════════════════╝{Colors.RESET}\n")
        
        # Permission tests
        perm_tests = [
            self.permission_tester.test_file_write(),
            self.permission_tester.test_directory_create(),
            self.permission_tester.test_executable_permission(),
            self.permission_tester.test_python_subprocess(),
        ]
        for result in perm_tests:
            self._print_result(result)
            results.append(result)
        
        print(f"\n{Colors.CYBER}╔═══════════════════════════════════════════════════════════════╗{Colors.RESET}")
        print(f"{Colors.CYBER}║{Colors.WHITE}  🌐 NETWORK TESTS                                             {Colors.CYBER}║{Colors.RESET}")
        print(f"{Colors.CYBER}╚═══════════════════════════════════════════════════════════════╝{Colors.RESET}\n")
        
        # Network tests
        network_results = self.network_tester.test_all()
        for result in network_results:
            self._print_result(result)
            results.append(result)
        
        print(f"\n{Colors.CYBER}╔═══════════════════════════════════════════════════════════════╗{Colors.RESET}")
        print(f"{Colors.CYBER}║{Colors.WHITE}  ⚙️  CONFIGURATION TESTS                                       {Colors.CYBER}║{Colors.RESET}")
        print(f"{Colors.CYBER}╚═══════════════════════════════════════════════════════════════╝{Colors.RESET}\n")
        
        # Config tests
        config_tests = [
            self.config_tester.test_env_file(),
            self.config_tester.test_anthropic_key(),
            self.config_tester.test_google_key(),
            self.config_tester.test_python_dependencies(),
            self.config_tester.test_backend_file(),
            self.config_tester.test_ports_available(),
        ]
        for result in config_tests:
            self._print_result(result)
            results.append(result)
        
        return results
    
    def _attempt_fixes(self, results: List[TestResult]) -> List[TestResult]:
        """Próbuje naprawić błędy."""
        fixed_results = []
        
        for result in results:
            if result.status != TestStatus.FAILED:
                fixed_results.append(result)
                continue
            
            # Try to fix based on test name
            fix_success = False
            fix_message = ""
            
            if "ENV File" in result.name:
                fix_success, fix_message = self.auto_fixer.fix_missing_env()
            elif "Dependencies" in result.name:
                fix_success, fix_message = self.auto_fixer.fix_missing_dependencies()
            elif "Backend" in result.name:
                fix_success, fix_message = self.auto_fixer.fix_create_api_directory()
            
            if fix_success:
                result.fix_attempted = True
                result.fix_successful = True
                result.status = TestStatus.FIXED
                result.message = f"{result.message} → {fix_message}"
            elif fix_message:
                result.fix_attempted = True
                result.fix_successful = False
            
            fixed_results.append(result)
        
        return fixed_results
    
    def _print_summary(self, results: List[TestResult]) -> None:
        """Wyświetla podsumowanie."""
        passed = sum(1 for r in results if r.status == TestStatus.PASSED)
        failed = sum(1 for r in results if r.status == TestStatus.FAILED)
        warnings = sum(1 for r in results if r.status == TestStatus.WARNING)
        fixed = sum(1 for r in results if r.status == TestStatus.FIXED)
        
        print(f"\n{Colors.CYBER}╔═══════════════════════════════════════════════════════════════╗{Colors.RESET}")
        print(f"{Colors.CYBER}║{Colors.WHITE}  📊 PODSUMOWANIE                                              {Colors.CYBER}║{Colors.RESET}")
        print(f"{Colors.CYBER}╚═══════════════════════════════════════════════════════════════╝{Colors.RESET}\n")
        
        print(f"  {Colors.GREEN}✅ Passed:   {passed}{Colors.RESET}")
        print(f"  {Colors.RED}❌ Failed:   {failed}{Colors.RESET}")
        print(f"  {Colors.YELLOW}⚠️  Warnings: {warnings}{Colors.RESET}")
        print(f"  {Colors.CYAN}🔧 Fixed:    {fixed}{Colors.RESET}")
        print(f"  ─────────────────")
        print(f"  📋 Total:    {len(results)}")
        
        if self.auto_fixer.fixes_applied:
            print(f"\n  {Colors.CYAN}Auto-fixes applied:{Colors.RESET}")
            for fix in self.auto_fixer.fixes_applied:
                print(f"    • {fix}")
        
        # Overall status
        print()
        if failed == 0:
            print(f"  {Colors.BG_GREEN}{Colors.WHITE} 🎉 WSZYSTKIE TESTY ZALICZONE! {Colors.RESET}")
        elif fixed > 0 and failed == 0:
            print(f"  {Colors.BG_BLUE}{Colors.WHITE} 🔧 NAPRAWIONO BŁĘDY - URUCHOM PONOWNIE {Colors.RESET}")
        else:
            print(f"  {Colors.BG_RED}{Colors.WHITE} ❌ WYKRYTO PROBLEMY - SPRAWDŹ LOGI {Colors.RESET}")
    
    def run(self) -> int:
        """Uruchamia pętlę debugowania."""
        print_banner()
        
        print(f"\n{Colors.CYAN}System Info:{Colors.RESET}")
        print(f"  Platform: {self.session.system_info['platform']} {self.session.system_info['platform_release']}")
        print(f"  Python:   {sys.version.split()[0]}")
        print(f"  CWD:      {os.getcwd()}")
        
        all_passed = False
        
        for iteration in range(1, self.max_iterations + 1):
            self.session.iteration = iteration
            
            print(f"\n{Colors.MAGENTA}{'═' * 65}")
            print(f"  🔄 ITERACJA {iteration}/{self.max_iterations}")
            print(f"{'═' * 65}{Colors.RESET}")
            
            # Create backup before fixes
            if self.auto_fix and iteration > 1:
                backup_files = [".env", "api/index.py", ".jules_memory.json"]
                existing_files = [f for f in backup_files if os.path.exists(f)]
                if existing_files:
                    backup_path = create_backup(existing_files)
                    print(f"\n  {Colors.DIM}📦 Backup created: {backup_path}{Colors.RESET}")
            
            # Run tests
            results = self._run_tests()
            self.session.results = results
            
            # Count failures
            failures = [r for r in results if r.status == TestStatus.FAILED]
            
            if not failures:
                all_passed = True
                break
            
            # Attempt fixes if enabled
            if self.auto_fix and iteration < self.max_iterations:
                print(f"\n  {Colors.YELLOW}🔧 Próba automatycznej naprawy...{Colors.RESET}")
                results = self._attempt_fixes(results)
                self.session.results = results
                
                # Check if any fixes were successful
                fixed_count = sum(1 for r in results if r.status == TestStatus.FIXED)
                if fixed_count > 0:
                    print(f"  {Colors.GREEN}✓ Naprawiono {fixed_count} problem(ów){Colors.RESET}")
                    time.sleep(1)  # Brief pause before next iteration
                else:
                    print(f"  {Colors.RED}✗ Nie udało się naprawić automatycznie{Colors.RESET}")
                    break
            else:
                break
        
        # Final summary
        self._print_summary(self.session.results)
        
        # Cleanup
        self.permission_tester.cleanup()
        
        # Save session
        self.session.end_time = datetime.now()
        memory = load_memory()
        memory["sessions"].append({
            "session_id": self.session.session_id,
            "start_time": self.session.start_time.isoformat(),
            "end_time": self.session.end_time.isoformat(),
            "iterations": self.session.iteration,
            "passed": all_passed,
            "results_summary": {
                "passed": sum(1 for r in self.session.results if r.status == TestStatus.PASSED),
                "failed": sum(1 for r in self.session.results if r.status == TestStatus.FAILED),
                "warnings": sum(1 for r in self.session.results if r.status == TestStatus.WARNING),
                "fixed": sum(1 for r in self.session.results if r.status == TestStatus.FIXED),
            }
        })
        memory["sessions"] = memory["sessions"][-50:]  # Keep last 50 sessions
        save_memory(memory)
        
        return 0 if all_passed else 1


# ============================================================================
# Windows Environment Variables Helper
# ============================================================================
def print_windows_env_instructions():
    """Wyświetla instrukcje dla Windows Environment Variables."""
    print(f"""
{Colors.CYBER}╔══════════════════════════════════════════════════════════════════════════════╗
║{Colors.WHITE}  🪟 INSTRUKCJA: Dodawanie klucza API do Windows Environment Variables       {Colors.CYBER}║
╚══════════════════════════════════════════════════════════════════════════════╝{Colors.RESET}

{Colors.YELLOW}Metoda 1: GUI (Polecana){Colors.RESET}
  1. Naciśnij Win + R, wpisz: sysdm.cpl
  2. Zakładka "Zaawansowane" → "Zmienne środowiskowe"
  3. W sekcji "Zmienne użytkownika" kliknij "Nowa"
  4. Nazwa zmiennej:  ANTHROPIC_API_KEY
     Wartość zmiennej: <twój_klucz_z_console.anthropic.com>
  5. OK → OK → OK
  6. WAŻNE: Uruchom ponownie terminal/IDE!

{Colors.YELLOW}Metoda 2: PowerShell (Szybka){Colors.RESET}
  [Environment]::SetEnvironmentVariable("ANTHROPIC_API_KEY", "sk-ant-api03-xxx", "User")

{Colors.YELLOW}Metoda 3: CMD (Tymczasowa - tylko bieżąca sesja){Colors.RESET}
  set ANTHROPIC_API_KEY=sk-ant-api03-xxx

{Colors.CYAN}Gdzie zdobyć klucz API?{Colors.RESET}
  1. Wejdź na: https://console.anthropic.com/
  2. Zaloguj się lub załóż konto
  3. Przejdź do: API Keys → Create Key
  4. Skopiuj klucz (zaczyna się od sk-ant-)

{Colors.RED}⚠️  UWAGA: Nigdy nie udostępniaj swojego klucza API!{Colors.RESET}
""")


# ============================================================================
# Entry Point
# ============================================================================
def main():
    """Punkt wejścia programu."""
    import argparse
    
    parser = argparse.ArgumentParser(
        description="Regis AI Studio - Debug Loop & Permission Validator"
    )
    parser.add_argument(
        "--iterations", "-i",
        type=int,
        default=3,
        help="Maksymalna liczba iteracji (domyślnie: 3)"
    )
    parser.add_argument(
        "--no-fix",
        action="store_true",
        help="Wyłącz automatyczne naprawy"
    )
    parser.add_argument(
        "--env-help",
        action="store_true",
        help="Pokaż instrukcje dla Windows Environment Variables"
    )
    parser.add_argument(
        "--list-backups",
        action="store_true",
        help="Lista dostępnych backup'ów"
    )
    parser.add_argument(
        "--restore",
        type=str,
        metavar="BACKUP_ID",
        help="Przywróć backup o podanym ID"
    )
    
    args = parser.parse_args()
    
    if args.env_help:
        print_windows_env_instructions()
        return 0
    
    if args.list_backups:
        backups = list_backups()
        if backups:
            print(f"\n{Colors.CYAN}Dostępne backup'y:{Colors.RESET}\n")
            for b in backups:
                print(f"  📦 {b['timestamp']}")
                print(f"     Pliki: {', '.join(os.path.basename(f) for f in b['files'])}")
                print(f"     Ścieżka: {b['path']}")
                print()
        else:
            print(f"\n{Colors.YELLOW}Brak backup'ów.{Colors.RESET}\n")
        return 0
    
    if args.restore:
        backup_path = os.path.join(BACKUP_DIR, args.restore)
        if restore_backup(backup_path):
            print(f"{Colors.GREEN}✓ Przywrócono backup: {args.restore}{Colors.RESET}")
            return 0
        else:
            print(f"{Colors.RED}✗ Nie znaleziono backup'u: {args.restore}{Colors.RESET}")
            return 1
    
    # Run debug loop
    debug_loop = DebugLoop(
        max_iterations=args.iterations,
        auto_fix=not args.no_fix
    )
    
    try:
        return debug_loop.run()
    except KeyboardInterrupt:
        print(f"\n\n{Colors.YELLOW}Przerwano przez użytkownika (Ctrl+C){Colors.RESET}")
        return 130


if __name__ == "__main__":
    sys.exit(main())
