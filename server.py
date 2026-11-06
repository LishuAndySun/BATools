#!/usr/bin/env python3
"""Local-network static server for the Blue Archive toolbox."""

from __future__ import annotations

import argparse
import functools
import http.server
import socket
import socketserver
from pathlib import Path


class ReusableThreadingHTTPServer(socketserver.ThreadingMixIn, http.server.HTTPServer):
    allow_reuse_address = True
    daemon_threads = True


def local_ip() -> str:
    """Best-effort LAN address discovery without sending application data."""
    probe = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
    try:
        probe.connect(("192.0.2.1", 80))
        return probe.getsockname()[0]
    except OSError:
        return "127.0.0.1"
    finally:
        probe.close()


def main() -> None:
    parser = argparse.ArgumentParser(description="Serve the Blue Archive toolbox on the LAN.")
    parser.add_argument("--host", default="0.0.0.0", help="Bind address (default: 0.0.0.0)")
    parser.add_argument("--port", type=int, default=8765, help="Port (default: 8765)")
    args = parser.parse_args()

    web_root = Path(__file__).parent / "static"
    handler = functools.partial(http.server.SimpleHTTPRequestHandler, directory=str(web_root))

    with ReusableThreadingHTTPServer((args.host, args.port), handler) as server:
        actual_port = server.server_address[1]
        print(f"蔚蓝档案工具箱已启动")
        print(f"本机访问: http://127.0.0.1:{actual_port}")
        print(f"局域网访问: http://{local_ip()}:{actual_port}")
        print("按 Ctrl+C 停止服务")
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            print("\n服务已停止")


if __name__ == "__main__":
    main()
