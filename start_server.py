"""
Script to start the HTTP server and open it in a web browser.

"""

import os
import signal
import socket
import subprocess
import webbrowser


def find_open_port(min_port: int = 8000, max_port: int = 9000) -> int:
    """Find an open port in port range, fallback to system-assigned if needed."""

    # By default, only bind server to localhost IP
    ip_address = os.getenv("BIND_IP", "127.0.0.1")

    for port in range(min_port, max_port):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            try:
                s.bind((ip_address, port))
                return port
            except OSError:
                continue

    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.bind((ip_address, 0))
        return s.getsockname()[1]


def main():
    """Start the HTTP server and open it in a web browser."""
    port = find_open_port()
    print(f"Starting server on port {port}...")

    with subprocess.Popen(
        ["python3", "-m", "http.server", str(port)], start_new_session=True
    ) as process:
        try:
            webbrowser.open(f"http://localhost:{port}")

            process.wait()
        except KeyboardInterrupt:
            print("\nTerminating the server...")
            os.killpg(os.getpgid(process.pid), signal.SIGTERM)
            try:
                process.wait(timeout=5)
            except subprocess.TimeoutExpired:
                print("Server didn't terminate gracefully, forcing shutdown...")
                os.killpg(os.getpgid(process.pid), signal.SIGKILL)

    print("Server stopped.")


if __name__ == "__main__":
    main()
