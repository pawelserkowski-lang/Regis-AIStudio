#!/usr/bin/env python3
"""
╔══════════════════════════════════════════════════════════════════════════════╗
║  REGIS AI STUDIO - Self-Repair & Debug System                                ║
║  ════════════════════════════════════════════════════════════════════════════║
║  Matrix-style diagnostyka i automatyczna naprawa projektu                    ║
║  "There is no spoon" - ale są błędy do naprawienia! 🥄                       ║
╚══════════════════════════════════════════════════════════════════════════════╝
"""

import os
import sys
import json
import time
import subprocess
import traceback
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Tuple, Optional, Any
import re

# ============================================================================
# MATRIX STYLING
# ============================================================================

class Matrix:
    """Matrix-style terminal colors and effects."""
    RESET = "\033[0m"
    BOLD = "\033[1m"
    DIM = "\033[2m"
    BLINK = "\033[5m"
    
    # Colors
    BLACK = "\033[30m"
    RED = "\033[91m"
    GREEN = "\033[92m"
    YELLOW = "\033[93m"
    BLUE = "\033[94m"
    MAGENTA = "\033[95m"
    CYAN = "\033[96m"
    WHITE = "\033[97m"
    
    # Matrix special
    NEON = "\033[38;5;46m"      # #00ff41 approximation
    DARK_GREEN = "\033[38;5;22m"
    
    @staticmethod
    def progress_bar(progress: int, width: int = 40, msg: str = "") -> str:
        """Matrix-style progress bar."""
        filled = int(width * progress / 100)
        empty = width - filled
        chars = "░▒▓█"
        bar = Matrix.NEON + "█" * filled + Matrix.DIM + "░" * empty + Matrix.RESET
        return f"[{bar}] {progress:3d}% {Matrix.CYAN}{msg}{Matrix.RESET}"
    
    @staticmethod
    def header(text: str) -> str:
        """Matrix-style header."""
        line = "═" * (len(text) + 4)
        return f"""
{Matrix.NEON}╔{line}╗
║  {text}  ║
╚{line}╝{Matrix.RESET}"""

    @staticmethod
    def matrix_rain_line() -> str:
        """Single line of matrix rain effect."""
        import random
        chars = "ｱｲｳｴｵｶｷｸｹｺｻｼｽｾｿﾀﾁﾂﾃﾄﾅﾆﾇﾈﾉﾊﾋﾌﾍﾎﾏﾐﾑﾒﾓﾔﾕﾖﾗﾘﾙﾚﾛﾜﾝ0123456789"
        return "".join(random.choice(chars) for _ in range(60))


# ============================================================================
# DIAGNOSTIC SYSTEM
# ============================================================================

class DiagnosticResult:
    """Result of a diagnostic check."""
    def __init__(self, name: str, status: str, message: str, fix_available: bool = False, details: Any = None):
        self.name = name
        self.status = status  # "OK", "WARN", "ERROR", "FIXED"
        self.message = message
        self.fix_available = fix_available
        self.details = details
        self.timestamp = datetime.now()
    
    def __str__(self) -> str:
        icons = {"OK": "✅", "WARN": "⚠️ ", "ERROR": "❌", "FIXED": "🔧"}
        colors = {"OK": Matrix.GREEN, "WARN": Matrix.YELLOW, "ERROR": Matrix.RED, "FIXED": Matrix.CYAN}
        icon = icons.get(self.status, "❓")
        color = colors.get(self.status, Matrix.WHITE)
        return f"{icon} {color}[{self.status}]{Matrix.RESET} {self.name}: {self.message}"


class SelfRepairSystem:
    """Main self-repair and diagnostic system."""
    
    def __init__(self, project_root: str = "."):
        self.root = Path(project_root).resolve()
        self.results: List[DiagnosticResult] = []
        self.fixes_applied: List[str] = []
        self.start_time = time.time()
        
    def log(self, msg: str, level: str = "INFO") -> None:
        """Log with timestamp."""
        ts = datetime.now().strftime("%H:%M:%S.%f")[:-3]
        colors = {
            "INFO": Matrix.CYAN,
            "WARN": Matrix.YELLOW,
            "ERROR": Matrix.RED,
            "DEBUG": Matrix.DIM,
            "SUCCESS": Matrix.GREEN,
        }
        color = colors.get(level, Matrix.WHITE)
        print(f"{Matrix.DIM}[{ts}]{Matrix.RESET} {color}[{level}]{Matrix.RESET} {msg}")
    
    def add_result(self, result: DiagnosticResult) -> None:
        """Add diagnostic result."""
        self.results.append(result)
        print(f"  {result}")
    
    # ========================================================================
    # DIAGNOSTIC CHECKS
    # ========================================================================
    
    def check_project_structure(self) -> None:
        """Check if all required directories exist."""
        self.log("Sprawdzam strukturę projektu...", "INFO")
        
        required_dirs = [
            "src",
            "src/components",
            "src/services",
            "api",
            "tests",
            "docs",
            "docs/reports",  # Miejsce na raporty diagnostyczne
        ]
        
        for dir_path in required_dirs:
            full_path = self.root / dir_path
            if full_path.exists():
                self.add_result(DiagnosticResult(
                    f"Directory: {dir_path}",
                    "OK",
                    "Katalog istnieje"
                ))
            else:
                # Auto-fix: create directory
                full_path.mkdir(parents=True, exist_ok=True)
                self.fixes_applied.append(f"Created directory: {dir_path}")
                self.add_result(DiagnosticResult(
                    f"Directory: {dir_path}",
                    "FIXED",
                    "Katalog utworzony automatycznie",
                    fix_available=True
                ))
    
    def check_env_file(self) -> None:
        """Check .env configuration."""
        self.log("Sprawdzam konfigurację .env...", "INFO")
        
        env_path = self.root / ".env"
        env_example_path = self.root / ".env.example"
        
        if not env_path.exists():
            if env_example_path.exists():
                # Copy from example
                import shutil
                shutil.copy(env_example_path, env_path)
                self.fixes_applied.append("Created .env from .env.example")
                self.add_result(DiagnosticResult(
                    ".env file",
                    "FIXED",
                    "Skopiowano z .env.example"
                ))
            else:
                # Create default .env
                default_env = """# Regis AI Studio - Environment Configuration
# Skopiuj ten plik jako .env i uzupełnij kluczami API

# Google Gemini API Key (opcjonalne jeśli używasz tylko Claude)
GOOGLE_API_KEY=your_gemini_api_key_here

# Anthropic Claude API Key (wymagane dla integracji Claude)
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Domyślny model AI: "claude" lub "gemini"
DEFAULT_AI_PROVIDER=claude

# Port backendu (domyślnie 8000)
BACKEND_PORT=8000
"""
                env_path.write_text(default_env)
                self.fixes_applied.append("Created default .env file")
                self.add_result(DiagnosticResult(
                    ".env file",
                    "FIXED",
                    "Utworzono domyślny plik .env"
                ))
        else:
            # Check content
            content = env_path.read_text()
            issues = []
            
            if "ANTHROPIC_API_KEY" not in content:
                issues.append("Brak ANTHROPIC_API_KEY")
            if "GOOGLE_API_KEY" not in content:
                issues.append("Brak GOOGLE_API_KEY (opcjonalne)")
            
            if issues:
                self.add_result(DiagnosticResult(
                    ".env file",
                    "WARN",
                    f"Możliwe braki: {', '.join(issues)}"
                ))
            else:
                self.add_result(DiagnosticResult(
                    ".env file",
                    "OK",
                    "Konfiguracja kompletna"
                ))
    
    def check_python_dependencies(self) -> None:
        """Check Python dependencies."""
        self.log("Sprawdzam zależności Python...", "INFO")
        
        required_packages = [
            ("python-dotenv", "dotenv"),
            ("anthropic", "anthropic"),
        ]
        
        for package_name, import_name in required_packages:
            try:
                __import__(import_name)
                self.add_result(DiagnosticResult(
                    f"Python: {package_name}",
                    "OK",
                    "Zainstalowany"
                ))
            except ImportError:
                # Try to install
                self.log(f"Instaluję {package_name}...", "WARN")
                try:
                    result = subprocess.run(
                        [sys.executable, "-m", "pip", "install", package_name, 
                         "--break-system-packages", "-q"],
                        capture_output=True,
                        text=True,
                        timeout=60
                    )
                    if result.returncode == 0:
                        self.fixes_applied.append(f"Installed {package_name}")
                        self.add_result(DiagnosticResult(
                            f"Python: {package_name}",
                            "FIXED",
                            "Zainstalowano automatycznie"
                        ))
                    else:
                        self.add_result(DiagnosticResult(
                            f"Python: {package_name}",
                            "ERROR",
                            f"Błąd instalacji: {result.stderr[:100]}"
                        ))
                except Exception as e:
                    self.add_result(DiagnosticResult(
                        f"Python: {package_name}",
                        "ERROR",
                        f"Nie udało się zainstalować: {str(e)}"
                    ))
    
    def check_node_dependencies(self) -> None:
        """Check Node.js dependencies and auto-install if missing."""
        self.log("Sprawdzam zależności Node.js...", "INFO")
        
        package_json = self.root / "package.json"
        node_modules = self.root / "node_modules"
        package_lock = self.root / "package-lock.json"
        
        if not package_json.exists():
            self.add_result(DiagnosticResult(
                "package.json",
                "WARN",
                "Brak pliku - pominięto sprawdzanie npm"
            ))
            return
        
        if not node_modules.exists() or not any(node_modules.iterdir() if node_modules.exists() else []):
            self.log("Brak node_modules - uruchamiam npm install...", "WARN")
            
            # Check if npm is available
            npm_check = subprocess.run(
                ["npm", "--version"],
                capture_output=True,
                text=True
            )
            
            if npm_check.returncode != 0:
                self.add_result(DiagnosticResult(
                    "node_modules",
                    "ERROR",
                    "npm nie jest zainstalowany! Zainstaluj Node.js"
                ))
                return
            
            # Run npm install
            try:
                self.log("Instaluję zależności npm (może potrwać chwilę)...", "INFO")
                result = subprocess.run(
                    ["npm", "install"],
                    cwd=str(self.root),
                    capture_output=True,
                    text=True,
                    timeout=300  # 5 minut timeout
                )
                
                if result.returncode == 0:
                    self.fixes_applied.append("Installed npm dependencies (npm install)")
                    self.add_result(DiagnosticResult(
                        "node_modules",
                        "FIXED",
                        "Zależności zainstalowane automatycznie (npm install)"
                    ))
                    
                    # Check for vulnerabilities
                    audit_result = subprocess.run(
                        ["npm", "audit", "--json"],
                        cwd=str(self.root),
                        capture_output=True,
                        text=True,
                        timeout=60
                    )
                    
                    try:
                        audit_data = json.loads(audit_result.stdout)
                        vuln_count = audit_data.get("metadata", {}).get("vulnerabilities", {})
                        high_crit = vuln_count.get("high", 0) + vuln_count.get("critical", 0)
                        
                        if high_crit > 0:
                            self.add_result(DiagnosticResult(
                                "npm audit",
                                "WARN",
                                f"Znaleziono {high_crit} wysokich/krytycznych CVE! Uruchom 'npm audit fix'"
                            ))
                        else:
                            self.add_result(DiagnosticResult(
                                "npm audit",
                                "OK",
                                "Brak krytycznych podatności"
                            ))
                    except (json.JSONDecodeError, KeyError):
                        pass  # Ignore audit parsing errors
                        
                else:
                    self.add_result(DiagnosticResult(
                        "node_modules",
                        "ERROR",
                        f"npm install failed: {result.stderr[:200]}"
                    ))
                    
            except subprocess.TimeoutExpired:
                self.add_result(DiagnosticResult(
                    "node_modules",
                    "ERROR",
                    "npm install timeout (>5min)"
                ))
            except Exception as e:
                self.add_result(DiagnosticResult(
                    "node_modules",
                    "ERROR",
                    f"npm install error: {str(e)}"
                ))
        else:
            # node_modules exists - check if it's up to date
            self.add_result(DiagnosticResult(
                "node_modules",
                "OK",
                "Zależności zainstalowane"
            ))
            
            # Optional: Check for outdated packages
            try:
                outdated = subprocess.run(
                    ["npm", "outdated", "--json"],
                    cwd=str(self.root),
                    capture_output=True,
                    text=True,
                    timeout=30
                )
                if outdated.stdout.strip() and outdated.stdout.strip() != "{}":
                    outdated_data = json.loads(outdated.stdout)
                    if outdated_data:
                        self.add_result(DiagnosticResult(
                            "npm packages",
                            "WARN",
                            f"{len(outdated_data)} pakietów wymaga aktualizacji"
                        ))
            except:
                pass  # Ignore outdated check errors
    
    def check_typescript_config(self) -> None:
        """Check TypeScript configuration."""
        self.log("Sprawdzam konfigurację TypeScript...", "INFO")
        
        tsconfig = self.root / "tsconfig.json"
        
        if not tsconfig.exists():
            self.add_result(DiagnosticResult(
                "tsconfig.json",
                "WARN",
                "Brak pliku konfiguracji TypeScript"
            ))
            return
        
        try:
            content = json.loads(tsconfig.read_text())
            
            # Check important settings
            compiler_options = content.get("compilerOptions", {})
            
            checks = {
                "strict": compiler_options.get("strict") == True,
                "jsx": compiler_options.get("jsx") == "react-jsx",
                "moduleResolution": "moduleResolution" in compiler_options,
            }
            
            failed = [k for k, v in checks.items() if not v]
            
            if failed:
                self.add_result(DiagnosticResult(
                    "tsconfig.json",
                    "WARN",
                    f"Możliwe problemy: {', '.join(failed)}"
                ))
            else:
                self.add_result(DiagnosticResult(
                    "tsconfig.json",
                    "OK",
                    "Konfiguracja poprawna"
                ))
                
        except json.JSONDecodeError as e:
            self.add_result(DiagnosticResult(
                "tsconfig.json",
                "ERROR",
                f"Błąd parsowania JSON: {e}"
            ))
    
    def check_api_endpoints(self) -> None:
        """Check if API files are properly configured."""
        self.log("Sprawdzam endpointy API...", "INFO")
        
        api_index = self.root / "api" / "index.py"
        
        if not api_index.exists():
            self.add_result(DiagnosticResult(
                "API: index.py",
                "ERROR",
                "Brak głównego pliku API"
            ))
            return
        
        content = api_index.read_text()
        
        # Check for required endpoints
        endpoints = [
            ("/api/health", "Health check"),
            ("/api/config", "Configuration"),
            ("/api/claude/chat", "Claude chat"),
        ]
        
        for endpoint, desc in endpoints:
            if endpoint in content or endpoint.replace("/", "") in content:
                self.add_result(DiagnosticResult(
                    f"API: {endpoint}",
                    "OK",
                    desc
                ))
            else:
                self.add_result(DiagnosticResult(
                    f"API: {endpoint}",
                    "WARN",
                    f"Nie znaleziono: {desc}"
                ))
    
    def check_security(self) -> None:
        """Check for security issues."""
        self.log("Sprawdzam bezpieczeństwo...", "INFO")
        
        # Check for hardcoded API keys
        dangerous_patterns = [
            (r'sk-ant-[a-zA-Z0-9-_]{20,}', "Anthropic API Key"),
            (r'sk-[a-zA-Z0-9]{20,}', "OpenAI API Key"),
            (r'AIza[a-zA-Z0-9_-]{35}', "Google API Key"),
        ]
        
        files_to_check = list(self.root.glob("**/*.py")) + \
                         list(self.root.glob("**/*.ts")) + \
                         list(self.root.glob("**/*.tsx")) + \
                         list(self.root.glob("**/*.js"))
        
        # Exclude node_modules and other common dirs
        files_to_check = [f for f in files_to_check 
                         if "node_modules" not in str(f) 
                         and ".git" not in str(f)]
        
        issues_found = []
        
        for file_path in files_to_check:
            try:
                content = file_path.read_text(errors='ignore')
                for pattern, key_type in dangerous_patterns:
                    if re.search(pattern, content):
                        issues_found.append(f"{file_path.name}: możliwy {key_type}")
            except Exception:
                pass
        
        if issues_found:
            self.add_result(DiagnosticResult(
                "Security: Hardcoded keys",
                "ERROR",
                f"Znaleziono {len(issues_found)} potencjalnych wycieków!",
                details=issues_found
            ))
        else:
            self.add_result(DiagnosticResult(
                "Security: Hardcoded keys",
                "OK",
                "Nie znaleziono hardkodowanych kluczy"
            ))
        
        # Check .gitignore
        gitignore = self.root / ".gitignore"
        if gitignore.exists():
            content = gitignore.read_text()
            required_ignores = [".env", "node_modules", "__pycache__"]
            missing = [i for i in required_ignores if i not in content]
            
            if missing:
                # Auto-fix
                with open(gitignore, "a") as f:
                    f.write("\n# Auto-added by self-repair\n")
                    for item in missing:
                        f.write(f"{item}\n")
                self.fixes_applied.append(f"Added to .gitignore: {', '.join(missing)}")
                self.add_result(DiagnosticResult(
                    "Security: .gitignore",
                    "FIXED",
                    f"Dodano brakujące wpisy: {', '.join(missing)}"
                ))
            else:
                self.add_result(DiagnosticResult(
                    "Security: .gitignore",
                    "OK",
                    "Konfiguracja poprawna"
                ))
    
    def check_frontend_service(self) -> None:
        """Check frontend AI service configuration."""
        self.log("Sprawdzam serwis AI frontendu...", "INFO")
        
        service_files = [
            self.root / "src" / "services" / "geminiService.ts",
            self.root / "src" / "services" / "aiService.ts",
        ]
        
        for service_file in service_files:
            if service_file.exists():
                content = service_file.read_text()
                
                # Check for proper API URL configuration
                if "127.0.0.1:8000" in content or "localhost:8000" in content:
                    self.add_result(DiagnosticResult(
                        f"Frontend: {service_file.name}",
                        "OK",
                        "URL backendu skonfigurowany"
                    ))
                else:
                    self.add_result(DiagnosticResult(
                        f"Frontend: {service_file.name}",
                        "WARN",
                        "Sprawdź URL backendu"
                    ))
                
                # Check for error handling
                if "catch" in content and "try" in content:
                    self.add_result(DiagnosticResult(
                        f"Frontend: Error handling",
                        "OK",
                        "Obsługa błędów zaimplementowana"
                    ))
                else:
                    self.add_result(DiagnosticResult(
                        f"Frontend: Error handling",
                        "WARN",
                        "Brak pełnej obsługi błędów"
                    ))
    
    def check_types(self) -> None:
        """Check TypeScript type definitions."""
        self.log("Sprawdzam definicje typów...", "INFO")
        
        types_file = self.root / "src" / "types.ts"
        root_types = self.root / "types.ts"
        
        types_path = types_file if types_file.exists() else (root_types if root_types.exists() else None)
        
        if not types_path:
            self.add_result(DiagnosticResult(
                "Types: types.ts",
                "WARN",
                "Brak pliku z definicjami typów"
            ))
            return
        
        content = types_path.read_text()
        
        required_types = [
            "AIProvider",
            "Message",
            "Sender",
            "View",
        ]
        
        missing = [t for t in required_types if t not in content]
        
        if missing:
            self.add_result(DiagnosticResult(
                "Types: Definitions",
                "WARN",
                f"Brakujące typy: {', '.join(missing)}"
            ))
        else:
            self.add_result(DiagnosticResult(
                "Types: Definitions",
                "OK",
                "Wszystkie wymagane typy zdefiniowane"
            ))
    
    # ========================================================================
    # MAIN EXECUTION
    # ========================================================================
    
    def run_all_checks(self) -> None:
        """Run all diagnostic checks."""
        print(Matrix.header("REGIS SELF-REPAIR SYSTEM"))
        print(f"\n{Matrix.CYAN}🔍 Inicjalizacja skanowania...{Matrix.RESET}")
        print(f"{Matrix.DIM}{Matrix.matrix_rain_line()}{Matrix.RESET}\n")
        
        checks = [
            ("Struktura projektu", self.check_project_structure),
            ("Konfiguracja .env", self.check_env_file),
            ("Zależności Python", self.check_python_dependencies),
            ("Zależności Node.js", self.check_node_dependencies),
            ("TypeScript config", self.check_typescript_config),
            ("Endpointy API", self.check_api_endpoints),
            ("Bezpieczeństwo", self.check_security),
            ("Serwis frontendu", self.check_frontend_service),
            ("Definicje typów", self.check_types),
        ]
        
        total = len(checks)
        
        for i, (name, check_func) in enumerate(checks):
            progress = int((i / total) * 100)
            print(f"\n{Matrix.progress_bar(progress, msg=name)}")
            
            try:
                check_func()
            except Exception as e:
                self.add_result(DiagnosticResult(
                    name,
                    "ERROR",
                    f"Wyjątek: {str(e)}"
                ))
                self.log(f"Exception in {name}: {traceback.format_exc()}", "ERROR")
        
        print(f"\n{Matrix.progress_bar(100, msg='KOMPLETNE')}")
    
    def generate_report(self) -> str:
        """Generate diagnostic report."""
        elapsed = time.time() - self.start_time
        
        # Count by status
        counts = {"OK": 0, "WARN": 0, "ERROR": 0, "FIXED": 0}
        for r in self.results:
            counts[r.status] = counts.get(r.status, 0) + 1
        
        report = f"""
{Matrix.header("RAPORT DIAGNOSTYCZNY")}

{Matrix.CYAN}📊 PODSUMOWANIE{Matrix.RESET}
{'─' * 50}
  ✅ OK:      {counts['OK']}
  ⚠️  WARN:    {counts['WARN']}
  ❌ ERROR:   {counts['ERROR']}
  🔧 FIXED:   {counts['FIXED']}
{'─' * 50}
  ⏱️  Czas:    {elapsed:.2f}s
  📁 Root:    {self.root}
"""
        
        if self.fixes_applied:
            report += f"""
{Matrix.GREEN}🔧 AUTOMATYCZNE NAPRAWY{Matrix.RESET}
{'─' * 50}
"""
            for fix in self.fixes_applied:
                report += f"  • {fix}\n"
        
        # Health score
        total = len(self.results)
        score = int(((counts['OK'] + counts['FIXED']) / total) * 100) if total > 0 else 0
        
        if score >= 90:
            health = f"{Matrix.GREEN}ZDROWY 💚{Matrix.RESET}"
        elif score >= 70:
            health = f"{Matrix.YELLOW}STABILNY 💛{Matrix.RESET}"
        else:
            health = f"{Matrix.RED}KRYTYCZNY ❤️‍🩹{Matrix.RESET}"
        
        report += f"""
{Matrix.NEON}{'═' * 50}
  HEALTH SCORE: {score}% - {health}
{'═' * 50}{Matrix.RESET}
"""
        
        # Store for HTML generation
        self._health_score = score
        self._counts = counts
        self._elapsed = elapsed
        
        return report
    
    def generate_html_report(self) -> str:
        """Generate HTML diagnostic report."""
        counts = getattr(self, '_counts', {"OK": 0, "WARN": 0, "ERROR": 0, "FIXED": 0})
        score = getattr(self, '_health_score', 0)
        elapsed = getattr(self, '_elapsed', 0)
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        # Build results table rows
        results_html = ""
        for r in self.results:
            status_icon = {"OK": "✅", "WARN": "⚠️", "ERROR": "❌", "FIXED": "🔧"}.get(r.status, "❓")
            status_class = {"OK": "text-dim", "WARN": "text-yellow", "ERROR": "text-red", "FIXED": "text-cyan"}.get(r.status, "")
            results_html += f'<tr><td>{status_icon}</td><td>{r.name}</td><td class="{status_class}">{r.message}</td></tr>\n'
        
        # Build fixes list
        fixes_html = ""
        for fix in self.fixes_applied:
            fixes_html += f'<div class="fix-item"><span class="text-cyan">🔧</span><span>{fix}</span></div>\n'
        
        html = f'''<!DOCTYPE html>
<html lang="pl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>🔧 Regis Self-Repair Report - {timestamp}</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;700&display=swap');
        * {{ margin: 0; padding: 0; box-sizing: border-box; }}
        :root {{
            --matrix-bg: #0a1f0a; --matrix-bg-dark: #001a00; --matrix-neon: #00ff41;
            --matrix-glass: rgba(0, 31, 0, 0.7); --matrix-border: rgba(0, 255, 65, 0.2);
            --green-400: #4ade80; --green-600: #16a34a; --green-700: #15803d;
            --yellow-400: #facc15; --red-400: #f87171; --cyan-400: #22d3ee;
        }}
        body {{ font-family: 'JetBrains Mono', monospace; background: linear-gradient(135deg, var(--matrix-bg) 0%, var(--matrix-bg-dark) 100%); color: var(--matrix-neon); min-height: 100vh; line-height: 1.6; }}
        .matrix-rain {{ position: fixed; inset: 0; overflow: hidden; pointer-events: none; opacity: 0.15; z-index: 0; }}
        .matrix-rain span {{ position: absolute; top: -100px; font-size: 14px; color: var(--matrix-neon); animation: rain 8s linear infinite; }}
        @keyframes rain {{ 0% {{ transform: translateY(-100px); opacity: 1; }} 100% {{ transform: translateY(100vh); opacity: 0; }} }}
        .matrix-rain span:nth-child(1) {{ left: 5%; animation-delay: 0s; }}
        .matrix-rain span:nth-child(2) {{ left: 15%; animation-delay: 1s; }}
        .matrix-rain span:nth-child(3) {{ left: 25%; animation-delay: 2s; }}
        .matrix-rain span:nth-child(4) {{ left: 35%; animation-delay: 0.5s; }}
        .matrix-rain span:nth-child(5) {{ left: 45%; animation-delay: 1.5s; }}
        .matrix-rain span:nth-child(6) {{ left: 55%; animation-delay: 2.5s; }}
        .matrix-rain span:nth-child(7) {{ left: 65%; animation-delay: 0.8s; }}
        .matrix-rain span:nth-child(8) {{ left: 75%; animation-delay: 1.8s; }}
        .matrix-rain span:nth-child(9) {{ left: 85%; animation-delay: 2.8s; }}
        .matrix-rain span:nth-child(10) {{ left: 95%; animation-delay: 0.3s; }}
        .container {{ position: relative; z-index: 10; max-width: 1000px; margin: 0 auto; padding: 40px 24px; }}
        .glass {{ background: var(--matrix-glass); backdrop-filter: blur(16px); border: 1px solid var(--matrix-border); border-radius: 16px; }}
        .glow {{ text-shadow: 0 0 10px var(--matrix-neon), 0 0 20px var(--matrix-neon); }}
        header {{ text-align: center; margin-bottom: 48px; }}
        .header-box {{ display: inline-block; padding: 24px 32px; margin-bottom: 24px; }}
        h1 {{ font-size: 2rem; font-weight: 700; margin-bottom: 8px; }}
        .subtitle {{ color: var(--green-600); font-size: 0.875rem; }}
        .badges {{ display: flex; justify-content: center; gap: 16px; flex-wrap: wrap; }}
        .badge {{ padding: 8px 16px; border-radius: 9999px; font-size: 0.875rem; }}
        .summary-grid {{ display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 40px; }}
        @media (max-width: 640px) {{ .summary-grid {{ grid-template-columns: repeat(2, 1fr); }} }}
        .summary-card {{ padding: 24px; text-align: center; }}
        .summary-number {{ font-size: 2.5rem; font-weight: 700; }}
        .summary-label {{ font-size: 0.875rem; }}
        .text-green {{ color: var(--green-400); }} .text-yellow {{ color: var(--yellow-400); }}
        .text-red {{ color: var(--red-400); }} .text-cyan {{ color: var(--cyan-400); }} .text-dim {{ color: var(--green-600); }}
        section {{ margin-bottom: 40px; padding: 32px; }}
        h2 {{ font-size: 1.5rem; font-weight: 700; margin-bottom: 24px; display: flex; align-items: center; gap: 12px; }}
        .fix-list {{ display: flex; flex-direction: column; gap: 12px; }}
        .fix-item {{ display: flex; align-items: center; gap: 12px; background: rgba(0,0,0,0.3); padding: 16px; border-radius: 12px; }}
        code {{ background: rgba(0,0,0,0.5); padding: 4px 8px; border-radius: 4px; font-size: 0.875rem; }}
        table {{ width: 100%; font-size: 0.875rem; border-collapse: collapse; }}
        th {{ text-align: left; padding: 12px 16px; border-bottom: 1px solid var(--matrix-border); }}
        td {{ padding: 12px 16px; }} tr {{ border-bottom: 1px solid rgba(0,255,65,0.1); }} tr:hover {{ background: rgba(0,0,0,0.2); }}
        footer {{ text-align: center; color: var(--green-700); font-size: 0.875rem; padding-top: 24px; }}
        footer .tiny {{ font-size: 0.75rem; opacity: 0.5; margin-top: 16px; }}
    </style>
</head>
<body>
    <div class="matrix-rain">
        <span>ｱｲｳｴ01</span><span>10110ｶ</span><span>ｷｸｹｺ00</span><span>01ｻｼｽ1</span><span>ｾｿﾀ101</span>
        <span>00ﾁﾂﾃ0</span><span>ﾄﾅﾆ110</span><span>01ﾇﾈﾉ1</span><span>ﾊﾋﾌ010</span><span>11ﾍﾎﾏ0</span>
    </div>
    <div class="container">
        <header>
            <div class="glass header-box">
                <h1 class="glow">🔧 SELF-REPAIR COMPLETE</h1>
                <p class="subtitle">Regis AI Studio • Matrix Diagnostic Protocol v2.0</p>
            </div>
            <div class="badges">
                <span class="glass badge">📅 {timestamp}</span>
                <span class="glass badge">⏱️ {elapsed:.2f}s</span>
                <span class="glass badge">💚 {score}% Health</span>
            </div>
        </header>
        <div class="summary-grid">
            <div class="glass summary-card"><div class="summary-number text-green">{counts['OK']}</div><div class="summary-label text-dim">✅ OK</div></div>
            <div class="glass summary-card"><div class="summary-number text-yellow">{counts['WARN']}</div><div class="summary-label text-dim">⚠️ WARN</div></div>
            <div class="glass summary-card"><div class="summary-number text-red">{counts['ERROR']}</div><div class="summary-label text-dim">❌ ERROR</div></div>
            <div class="glass summary-card"><div class="summary-number text-cyan">{counts['FIXED']}</div><div class="summary-label text-dim">🔧 FIXED</div></div>
        </div>
        <section class="glass">
            <h2>🔧 Automatyczne Naprawy ({len(self.fixes_applied)})</h2>
            <div class="fix-list">
                {fixes_html if fixes_html else '<div class="fix-item"><span>Brak napraw - wszystko OK!</span></div>'}
            </div>
        </section>
        <section class="glass">
            <h2>📊 Wyniki Diagnostyki ({len(self.results)} testów)</h2>
            <table>
                <thead><tr><th>Status</th><th>Komponent</th><th>Wiadomość</th></tr></thead>
                <tbody>{results_html}</tbody>
            </table>
        </section>
        <footer>
            <p>"There is no spoon." – The Matrix (1999) 🥄</p>
            <p class="tiny">Generated by Regis Self-Repair System • {self.root}</p>
        </footer>
    </div>
</body>
</html>'''
        return html
    
    def save_html_report(self) -> Path:
        """Save HTML report to docs/reports directory."""
        reports_dir = self.root / "docs" / "reports"
        reports_dir.mkdir(parents=True, exist_ok=True)
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        report_path = reports_dir / f"diagnostic_report_{timestamp}.html"
        
        html_content = self.generate_html_report()
        report_path.write_text(html_content, encoding="utf-8")
        
        # Also save as latest
        latest_path = reports_dir / "LATEST_REPORT.html"
        latest_path.write_text(html_content, encoding="utf-8")
        
        self.log(f"Raport HTML zapisany: {report_path}", "SUCCESS")
        return report_path
    
    def run(self) -> int:
        """Main entry point."""
        print(f"""
{Matrix.NEON}
 ███████╗███████╗██╗     ███████╗    ██████╗ ███████╗██████╗  █████╗ ██╗██████╗ 
 ██╔════╝██╔════╝██║     ██╔════╝    ██╔══██╗██╔════╝██╔══██╗██╔══██╗██║██╔══██╗
 ███████╗█████╗  ██║     █████╗      ██████╔╝█████╗  ██████╔╝███████║██║██████╔╝
 ╚════██║██╔══╝  ██║     ██╔══╝      ██╔══██╗██╔══╝  ██╔═══╝ ██╔══██║██║██╔══██╗
 ███████║███████╗███████╗██║         ██║  ██║███████╗██║     ██║  ██║██║██║  ██║
 ╚══════╝╚══════╝╚══════╝╚═╝         ╚═╝  ╚═╝╚══════╝╚═╝     ╚═╝  ╚═╝╚═╝╚═╝  ╚═╝
{Matrix.RESET}
{Matrix.DIM}Dekodowanie rzeczywistości... follow the white rabbit 🐇{Matrix.RESET}
""")
        
        self.run_all_checks()
        print(self.generate_report())
        
        # Save HTML report
        try:
            report_path = self.save_html_report()
            print(f"\n{Matrix.GREEN}📄 Raport HTML zapisany:{Matrix.RESET}")
            print(f"   {Matrix.CYAN}{report_path}{Matrix.RESET}")
            print(f"   {Matrix.DIM}(oraz docs/reports/LATEST_REPORT.html){Matrix.RESET}\n")
        except Exception as e:
            print(f"\n{Matrix.YELLOW}⚠️  Nie udało się zapisać raportu HTML: {e}{Matrix.RESET}\n")
        
        # Return exit code based on errors
        error_count = sum(1 for r in self.results if r.status == "ERROR")
        return 1 if error_count > 0 else 0


# ============================================================================
# MAIN
# ============================================================================

if __name__ == "__main__":
    import argparse
    
    parser = argparse.ArgumentParser(description="Regis AI Studio Self-Repair System")
    parser.add_argument("--root", "-r", default=".", help="Project root directory")
    parser.add_argument("--fix", "-f", action="store_true", help="Apply automatic fixes")
    parser.add_argument("--verbose", "-v", action="store_true", help="Verbose output")
    
    args = parser.parse_args()
    
    system = SelfRepairSystem(args.root)
    exit_code = system.run()
    
    sys.exit(exit_code)
