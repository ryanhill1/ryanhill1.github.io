"""
Script to start the HTTP server and open it in a web browser.

"""

import socket
import subprocess
import webbrowser


def find_open_port(min_port: int = 8000, max_port: int = 9000) -> int:
    """Find an open port in port range, fallback to system-assigned if needed."""
    for port in range(min_port, max_port):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            try:
                s.bind(("", port))
                return port
            except OSError:
                continue

    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind(("", 0))
        return s.getsockname()[1]


def main():
    """Start the HTTP server and open it in a web browser."""
    port = find_open_port()
    print(f"Starting server on port {port}...")

    with subprocess.Popen(["python3", "-m", "http.server", str(port)]):
        webbrowser.open(f"http://localhost:{port}")


if __name__ == "__main__":
    main()
