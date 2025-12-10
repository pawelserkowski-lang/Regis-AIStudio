import os
import sys
import time
import subprocess
from http.server import HTTPServer
import threading

def load_env():
    """Simple .env loader that looks for .env and .env.local in project root"""
    root_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    env_files = ['.env', '.env.local']

    for env_file in env_files:
        path = os.path.join(root_dir, env_file)
        if os.path.exists(path):
            print(f"Loading environment from {env_file}...")
            with open(path, 'r') as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith('#') and '=' in line:
                        key, value = line.split('=', 1)
                        if (value.startswith('"') and value.endswith('"')) or \
                           (value.startswith("'") and value.endswith("'")):
                            value = value[1:-1]
                        os.environ[key] = value

def get_mtimes(directory):
    """Get modification times of all .py files in a directory."""
    mtimes = {}
    for root, dirs, files in os.walk(directory):
        if '__pycache__' in dirs:
            dirs.remove('__pycache__')
        for f in files:
            if f.endswith('.py'):
                path = os.path.join(root, f)
                try:
                    mtimes[path] = os.stat(path).st_mtime
                except OSError:
                    pass
    return mtimes

def run_server():
    """Import handler and run the server. Intended to be run in a separate process."""
    # Add the directory containing index.py to the system path
    sys.path.append(os.path.dirname(os.path.abspath(__file__)))

    try:
        from index import handler
    except ImportError:
        sys.path.append(os.path.join(os.getcwd(), 'api'))
        from index import handler

    port = int(os.environ.get('PORT', 8000))
    print(f"Starting Python backend on http://localhost:{port}")

    if not os.environ.get('GOOGLE_API_KEY'):
        print("Warning: GOOGLE_API_KEY is not set in environment variables.")

    server = HTTPServer(('localhost', port), handler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    except OSError as e:
        if e.errno == 98: # Address already in use
             print(f"Port {port} is busy, waiting...")
        else:
            raise

if __name__ == '__main__':
    # If run with a special flag, just run the server logic (child process)
    if os.environ.get('RUN_SERVER_WORKER') == 'true':
        load_env()
        run_server()
    else:
        # Main process: Supervisor
        print("Starting backend supervisor with auto-reload...")

        # Set flag for child
        env = os.environ.copy()
        env['RUN_SERVER_WORKER'] = 'true'

        api_dir = os.path.dirname(os.path.abspath(__file__))

        while True:
            # Start the server process
            process = subprocess.Popen([sys.executable, __file__], env=env)

            # Monitor files
            last_mtimes = get_mtimes(api_dir)

            try:
                while process.poll() is None:
                    time.sleep(1)
                    current_mtimes = get_mtimes(api_dir)
                    if current_mtimes != last_mtimes:
                        print("\nChange detected. Restarting backend...")
                        process.terminate()
                        process.wait()
                        break
            except KeyboardInterrupt:
                print("\nStopping supervisor...")
                process.terminate()
                sys.exit(0)
