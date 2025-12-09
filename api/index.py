from http.server import BaseHTTPRequestHandler
import os
import json

# STRICT SEPARATION: Python logic only.
# Security Agent: API Key remains server-side.

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        # Pobieranie klucza bezpiecznie po stronie serwera (Vercel ENV)
        api_key = os.environ.get('GOOGLE_API_KEY')

        if not api_key:
            self.send_response(500)
            self.end_headers()
            self.wfile.write('Missing Configuration'.encode())
            return

        # Tutaj logika backendu
        response_data = {
            "status": "Alive",
            "backend": "Python Serverless",
            "react_version_target": "19.2.1"
        }

        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps(response_data).encode())