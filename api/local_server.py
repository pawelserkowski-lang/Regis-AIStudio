from http.server import HTTPServer
import os
import sys

def load_env():
    """Simple .env loader that looks for .env and .env.local in project root"""
    # Assuming this script is in api/local_server.py, root is one level up
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
                        # Remove quotes if present
                        if (value.startswith('"') and value.endswith('"')) or \
                           (value.startswith("'") and value.endswith("'")):
                            value = value[1:-1]
                        os.environ[key] = value

if __name__ == '__main__':
    load_env()

    # Add the directory containing index.py to the system path
    sys.path.append(os.path.dirname(os.path.abspath(__file__)))

    try:
        from index import handler
    except ImportError:
        # Fallback if run from a different location
        sys.path.append(os.path.join(os.getcwd(), 'api'))
        from index import handler

    # Default to 8000, consistent with proxy settings
    port = int(os.environ.get('PORT', 8000))
    print(f"Starting Python backend on http://localhost:{port}")

    # Check if GOOGLE_API_KEY is set, just as a friendly warning
    if not os.environ.get('GOOGLE_API_KEY'):
        print("Warning: GOOGLE_API_KEY is not set in environment variables.")

    server = HTTPServer(('localhost', port), handler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping backend...")
        server.server_close()
