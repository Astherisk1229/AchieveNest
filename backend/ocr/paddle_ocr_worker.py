"""Single-model, loopback-only PaddleOCR worker used by the PHP API."""

from __future__ import annotations

import hmac
import ipaddress
import json
import os
from http.server import BaseHTTPRequestHandler, HTTPServer
from time import perf_counter
from typing import Any

from student_ocr_bridge import create_engine, extract, warm_engine


class BoundedOcrServer(HTTPServer):
    # A single model instance handles one prediction at a time. Keep the OS
    # connection backlog small so concurrent uploads cannot create an
    # unbounded queue of image tensors or Python worker threads.
    request_queue_size = 4
    allow_reuse_address = True

    def __init__(self, address: tuple[str, int], handler: type[BaseHTTPRequestHandler], engine: Any, ready_ms: dict[str, float]):
        self.engine = engine
        self.ready_ms = ready_ms
        self.token = os.environ.get("PADDLE_OCR_INTERNAL_TOKEN", "")
        if len(self.token) < 32:
            raise RuntimeError("OCR_WORKER_TOKEN_UNSET")
        super().__init__(address, handler)


class OcrHandler(BaseHTTPRequestHandler):
    server: BoundedOcrServer
    protocol_version = "HTTP/1.1"

    def do_GET(self) -> None:
        if self.path not in ("/health", "/ready"):
            self.send_error(404)
            return
        if self.path == "/ready":
            auth = self.headers.get("Authorization", "")
            supplied = auth[7:] if auth.startswith("Bearer ") else ""
            if not hmac.compare_digest(supplied, self.server.token):
                self._respond(401, {"ok": False, "error": {"code": "OCR_WORKER_UNAUTHORIZED"}})
                return
        self._respond(200, {"ok": True, "ready": True, "engine": "paddleocr", "startup_timings_ms": self.server.ready_ms})

    def do_POST(self) -> None:
        if self.path != "/extract":
            self.send_error(404)
            return
        auth = self.headers.get("Authorization", "")
        supplied = auth[7:] if auth.startswith("Bearer ") else ""
        if not hmac.compare_digest(supplied, self.server.token):
            self._respond(401, {"ok": False, "error": {"code": "OCR_WORKER_UNAUTHORIZED"}})
            return
        try:
            content_length = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            content_length = 0
        if content_length <= 0 or content_length > 16 * 1024:
            self._respond(413, {"ok": False, "error": {"code": "OCR_WORKER_REQUEST_TOO_LARGE"}})
            return
        try:
            request = json.loads(self.rfile.read(content_length))
            source = request.get("path")
            mime = request.get("mime")
            if not isinstance(source, str) or not isinstance(mime, str):
                raise ValueError("OCR_INPUT_INVALID")
            started = perf_counter()
            result = extract(source, mime, self.server.engine)
            result["timings_ms"]["worker_http_handler"] = round((perf_counter() - started) * 1000, 2)
            self._respond(200, result)
        except (ValueError, OSError, RuntimeError) as error:
            self._respond(422, {"ok": False, "error": {"code": str(error), "message": "OCR assistance was unavailable."}})
        except Exception:
            self._respond(500, {"ok": False, "error": {"code": "OCR_WORKER_FAILED", "message": "OCR assistance was unavailable."}})

    def _respond(self, status: int, payload: dict[str, Any]) -> None:
        body = json.dumps(payload, ensure_ascii=True, separators=(",", ":")).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Connection", "close")
        self.end_headers()
        self.wfile.write(body)

    def log_message(self, format: str, *args: Any) -> None:
        # Do not log local evidence paths or certificate contents.
        print(f"PaddleOCR worker: {args[1] if len(args) > 1 else 'request'}", flush=True)


def serve(host: str, port: int) -> int:
    address = ipaddress.ip_address(host)
    if not address.is_loopback:
        raise RuntimeError("OCR_WORKER_MUST_BIND_LOOPBACK")
    if port < 1 or port > 65535:
        raise RuntimeError("OCR_WORKER_PORT_INVALID")
    cache_home = os.environ.get("PADDLE_PDX_CACHE_HOME")
    if cache_home:
        os.makedirs(cache_home, exist_ok=True)
    started = perf_counter()
    engine = create_engine()
    initialized = perf_counter()
    warmup_ms = warm_engine(engine)
    ready_ms = {
        "model_initialization": round((initialized - started) * 1000, 2),
        "model_warmup": warmup_ms,
    }
    server = BoundedOcrServer((str(address), port), OcrHandler, engine, ready_ms)
    print(json.dumps({"event": "paddleocr_worker_ready", **ready_ms}), flush=True)
    try:
        server.serve_forever(poll_interval=0.5)
    finally:
        server.server_close()
    return 0
