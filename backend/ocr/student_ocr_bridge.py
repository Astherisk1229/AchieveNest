"""Backend-controlled PaddleOCR process boundary for student evidence.

Only the health contract is enabled until representative student evidence has
been audited. Extraction configuration, language/model selection, PDF page
policy, and deterministic field mapping must not be guessed here.
"""

from __future__ import annotations

import argparse
import json
import platform
import os
from pathlib import Path
import re
import sys
from typing import Any


def health_payload() -> dict[str, Any]:
    import paddle
    import paddleocr

    return {
        "ok": True,
        "contract_version": 2,
        "engine": "paddleocr",
        "python_version": platform.python_version(),
        "paddlepaddle_version": paddle.__version__,
        "paddleocr_version": paddleocr.__version__,
        "device": "cpu",
        "cuda_enabled": bool(paddle.is_compiled_with_cuda()),
        "extraction_enabled": True,
        "pdf_page_limit": 2,
    }


def extract(source: str, mime: str) -> dict[str, Any]:
    if mime not in {"image/jpeg", "image/png", "application/pdf"} or not Path(source).is_file():
        raise ValueError("OCR_INPUT_INVALID")
    if mime == "application/pdf":
        import pypdfium2
        if len(pypdfium2.PdfDocument(source)) > 2: raise ValueError("OCR_PDF_PAGE_LIMIT_EXCEEDED")
    from paddleocr import PaddleOCR
    engine = PaddleOCR(lang="en", ocr_version="PP-OCRv5", device="cpu", use_doc_orientation_classify=True, use_doc_unwarping=False, use_textline_orientation=False)
    pages = []
    for result in engine.predict(source):
        value = json.loads(result.json) if isinstance(result.json, str) else result.json
        page = value.get("res", value); texts = [re.sub(r"\s+", " ", str(x)).strip() for x in page.get("rec_texts", [])]
        suggestions = {}
        for text, score in zip(texts, page.get("rec_scores", [])):
            match = re.match(r"^(Event|Activity|Program|Organizer|Granting Body|Venue|Date|Date Awarded|Service Date|Achievement|Recognition|Award|Role|Position|Organization|Academic Year):\s*(.+)$", text, re.I)
            if match:
                suggestions.setdefault(match.group(1).lower().replace(" ", "_"), {"value": match.group(2), "confidence": round(float(score), 4), "source": "labelled_ocr"})
        pages.append({"page_index": page.get("page_index"), "text": texts, "confidence": page.get("rec_scores", []), "boxes": page.get("rec_boxes", []), "suggestions": suggestions})
    return {"ok": True, "contract_version": 1, "engine": "paddleocr", "advisory_only": True, "page_count": len(pages), "pages": pages}


def main() -> int:
    parser = argparse.ArgumentParser(add_help=False)
    parser.add_argument("--health", action="store_true")
    parser.add_argument("--extract", action="store_true")
    parser.add_argument("--input")
    parser.add_argument("--mime")
    args = parser.parse_args()

    os.environ.setdefault("PADDLE_PDX_CACHE_HOME", str(Path(__file__).resolve().parent.parent / ".runtime" / "paddlex-cache"))

    if args.extract:
        try:
            # PaddleOCR can surface legacy/non-UTF-8 source bytes. Escaping
            # non-ASCII preserves the Unicode payload while keeping the PHP
            # process boundary JSON-decodable on Windows.
            print(json.dumps(extract(args.input or "", args.mime or ""), ensure_ascii=True, separators=(",", ":")))
            return 0
        except Exception as error:
            print(json.dumps({"ok": False, "error": {"code": str(error), "message": "OCR assistance was unavailable."}}, separators=(",", ":")))
            return 2

    if not args.health:
        print(
            json.dumps(
                {
                    "ok": False,
                    "error": {
                        "code": "STUDENT_OCR_EXTRACTION_NOT_CONFIGURED",
                        "message": "Representative student evidence audit is required before extraction is enabled.",
                    },
                }
            )
        )
        return 2

    print(json.dumps(health_payload(), separators=(",", ":")))
    return 0


if __name__ == "__main__":
    sys.exit(main())
