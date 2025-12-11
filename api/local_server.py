import os
import sys
import time
import subprocess
from http.server import HTTPServer

def run_server():
    sys.path.append(os.path.dirname(os.path.abspath(__file__)))
    try:
        from index import handler
    except ImportError:
        sys.path.append(os.path.join(os.getcwd(), 'api'))
        from index import handler

    port = int(os.environ.get('PORT', 8000))
    print(f"Starting Python backend on http://localhost:{port}")

    if not os.environ.get('GOOGLE_API_KEY'):
        print("[WARN] GOOGLE_API_KEY is not set in environment variables.")

    server = HTTPServer(('127.0.0.1', port), handler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass

if __name__ == '__main__':
    run_server()