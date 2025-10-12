#!/usr/bin/env python3
import http.server
import socketserver
import webbrowser
import os

PORT = 8080
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def end_headers(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

if __name__ == "__main__":
    with socketserver.TCPServer(("", PORT), Handler) as httpd:
        print(f"Serving Morphic Web at http://localhost:{PORT}")
        print(f"Open http://localhost:{PORT}/index-standalone.html in your browser")
        
        # Try to open browser automatically
        try:
            webbrowser.open(f'http://localhost:{PORT}/index-standalone.html')
        except:
            pass
            
        httpd.serve_forever()
