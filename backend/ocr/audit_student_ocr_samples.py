"""Record reproducible PaddleOCR evidence for the representative Student dataset.

This is an audit utility, not a web endpoint. It deliberately preserves raw
engine output and records timing, page indexes, text, scores, and coordinates.
"""

from __future__ import annotations

import argparse
import json
import platform
import sys
import time
from pathlib import Path
from typing import Any


def serialise_result(result: Any) -> dict[str, Any]:
    value = result.json
    return json.loads(value) if isinstance(value, str) else value


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dataset", required=True, type=Path)
    parser.add_argument("--output", required=True, type=Path)
    parser.add_argument("--language", default="en")
    parser.add_argument("--orientation", action="store_true")
    args = parser.parse_args()

    import paddle
    import paddleocr
    from paddleocr import PaddleOCR

    extensions = {".jpg", ".jpeg", ".png", ".pdf"}
    samples = sorted(
        path for path in args.dataset.iterdir() if path.is_file() and path.suffix.lower() in extensions
    )
    if not samples:
        raise ValueError("No JPG, JPEG, PNG, or PDF files found in dataset directory.")

    started = time.perf_counter()
    ocr = PaddleOCR(
        lang=args.language,
        ocr_version="PP-OCRv5",
        device="cpu",
        use_doc_orientation_classify=args.orientation,
        use_doc_unwarping=False,
        use_textline_orientation=False,
    )
    initialization_seconds = round(time.perf_counter() - started, 3)
    records: list[dict[str, Any]] = []

    for source in samples:
        sample_started = time.perf_counter()
        try:
            pages = [serialise_result(result) for result in ocr.predict(str(source))]
            records.append(
                {
                    "file": source.name,
                    "bytes": source.stat().st_size,
                    "seconds": round(time.perf_counter() - sample_started, 3),
                    "outcome": "ok",
                    "page_count_returned": len(pages),
                    "pages": pages,
                }
            )
        except Exception as error:  # Audit must record failures rather than hide them.
            records.append(
                {
                    "file": source.name,
                    "bytes": source.stat().st_size,
                    "seconds": round(time.perf_counter() - sample_started, 3),
                    "outcome": "error",
                    "error_type": type(error).__name__,
                    "error": str(error),
                }
            )

    report = {
        "audit_contract_version": 1,
        "engine": "paddleocr",
        "python_version": platform.python_version(),
        "paddlepaddle_version": paddle.__version__,
        "paddleocr_version": paddleocr.__version__,
        "device": "cpu",
        "cuda_enabled": bool(paddle.is_compiled_with_cuda()),
        "language": args.language,
        "document_orientation_classification": args.orientation,
        "document_unwarping": False,
        "textline_orientation": False,
        "initialization_seconds": initialization_seconds,
        "samples": records,
    }
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding="utf-8")
    print(json.dumps({"output": str(args.output), "samples": len(records)}, separators=(",", ":")))
    return 0


if __name__ == "__main__":
    sys.exit(main())
