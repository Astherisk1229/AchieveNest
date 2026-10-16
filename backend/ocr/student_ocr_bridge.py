"""Backend-controlled PaddleOCR process boundary for advisory evidence OCR.

Extraction uses the deployment-owned English PP-OCRv5 runtime. The bridge
returns recognized page text and explicitly labelled suggestions; category
selection and final field confirmation remain with the personnel or student.
"""

from __future__ import annotations

import argparse
import json
import platform
import os
from pathlib import Path
import re
import sys
import time
from typing import Any

SUGGESTION_LABELS = {
    "event": "event",
    "activity": "activity",
    "program": "program",
    "organizer": "organizer",
    "organizer / granting body": "granting_body",
    "granting body": "granting_body",
    "venue": "venue",
    "date": "date",
    "date awarded": "date_awarded",
    "service date": "service_date",
    "achievement": "achievement",
    "recognition": "recognition",
    "award": "award",
    "role": "role",
    "position": "position",
    "organization": "organization",
    "academic year": "academic_year",
}
FIELD_LABEL_NAMES = (
    "Event|Activity|Program|Organizer\\s*/\\s*Granting Body|Organizer|Granting Body|Venue|Date Awarded|"
    "Service Date|Date|Achievement|Recognition Year|Recognition|Award|Role|Position|Organization|"
    "Academic Year|Publication|Category|Type|Duration|Level|Service Location|Total Service Hours|Rank"
)
FIELD_LABEL_RE = re.compile(
    rf"^\s*({FIELD_LABEL_NAMES})\s*:\s*(.*)$",
    re.IGNORECASE,
)
EMBEDDED_LABEL_RE = re.compile(rf"\s+(?=(?:{FIELD_LABEL_NAMES})\s*:)", re.IGNORECASE)
NON_COLON_FIELD_START_RE = re.compile(
    # Only low-ambiguity standalone markers are treated as boundaries without
    # punctuation. Common words such as Program, Recognition, and Organization
    # also occur naturally inside certificate titles and values.
    r"^\s*(?:Organizer|Rank)\s*$",
    re.IGNORECASE,
)
EMBEDDED_STRUCTURAL_RE = re.compile(
    r"\s+(?=(?:this is|this certificate|has successfully|presented to|awarded to|given this|in recognition of|authorized signatory)\b)",
    re.IGNORECASE,
)
STRUCTURAL_BOUNDARY_RE = re.compile(
    r"^(?:this is\b|this certificate\b|has successfully\b|presented to\b|awarded to\b|given (?:to|this)\b|in recognition\b|authorized signatory\b|(?:dr|mr|mrs|ms)\.\s|sample\s*[—–-])",
    re.IGNORECASE,
)


def split_embedded_markers(text: str, marker: re.Pattern[str]) -> list[str]:
    """Split embedded fields while keeping compound labels intact."""
    parts: list[str] = []
    start = 0
    for match in marker.finditer(text):
        prefix = text[start:match.start()]
        suffix = text[match.end():]
        if re.match(r"Granting Body\s*:", suffix, re.IGNORECASE) and prefix.rstrip().lower().endswith("organizer /"):
            continue
        parts.append(prefix.strip())
        start = match.start() + len(match.group(0))
    parts.append(text[start:].strip())
    return [part for part in parts if part]


def field_label_at(texts: list[str], index: int) -> tuple[re.Match[str] | None, int]:
    match = FIELD_LABEL_RE.match(texts[index])
    if match is not None:
        return match, 1
    if index + 1 < len(texts) and not texts[index].rstrip().endswith(":"):
        # Some mobile-detector boxes split the printed label itself, e.g.
        # "Organizer / Granting" + "Body:". Match only a known full label.
        match = FIELD_LABEL_RE.match(f"{texts[index].strip()} {texts[index + 1].strip()}")
        if match is not None:
            return match, 2
    return None, 1


def normalize_labelled_lines(texts: list[str], scores: list[float]) -> tuple[list[str], dict[str, dict[str, Any]]]:
    """Join wrapped values only after an explicit field label; keep OCR rows aligned."""
    # The mobile detector sometimes places two printed fields in one OCR box.
    # Split only at known label or certificate-structure markers; duplicate
    # that box's confidence for each resulting text fragment.
    expanded_texts: list[str] = []
    expanded_scores: list[float] = []
    for index, source_line in enumerate(texts):
        pieces = [source_line]
        for marker in (EMBEDDED_LABEL_RE, EMBEDDED_STRUCTURAL_RE):
            pieces = [part for piece in pieces for part in split_embedded_markers(piece, marker)]
        expanded_texts.extend(piece.strip() for piece in pieces)
        if index < len(scores):
            expanded_scores.extend([float(scores[index])] * len(pieces))

    texts, scores = expanded_texts, expanded_scores
    normalized: list[str] = []
    suggestions: dict[str, dict[str, Any]] = {}
    index = 0
    while index < len(texts):
        line = texts[index]
        match, label_line_count = field_label_at(texts, index)
        if match is None:
            normalized.append(line)
            index += 1
            continue

        label = match.group(1).strip().lower()
        value_parts = [match.group(2).strip()] if match.group(2).strip() else []
        confidence_parts = [float(scores[index])] if value_parts and index < len(scores) else []
        next_index = index + label_line_count
        is_date = label in {"date", "date awarded", "service date"}
        max_parts = 3 if is_date else 6
        # An inline date is commonly complete on a certificate line. Avoid
        # absorbing the next unlabeled footer/signatory line as part of it.
        can_continue = not is_date or not value_parts
        # Wrapped text is joined only for known labels and never crosses the
        # next labelled field or common certificate/signatory boundary.
        if (label in SUGGESTION_LABELS or label in {"type", "duration", "level"}) and can_continue:
            while next_index < len(texts) and len(value_parts) < max_parts:
                following = texts[next_index].strip()
                following_match, _ = field_label_at(texts, next_index)
                if following_match or NON_COLON_FIELD_START_RE.match(following) or STRUCTURAL_BOUNDARY_RE.match(following):
                    break
                if following:
                    value_parts.append(following)
                    if next_index < len(scores):
                        confidence_parts.append(float(scores[next_index]))
                next_index += 1

        value = " ".join(value_parts).strip()
        normalized.append(f"{match.group(1).strip()}: {value}" if value else f"{match.group(1).strip()}:")
        source_label = SUGGESTION_LABELS.get(label)
        if source_label and value:
            suggestions[source_label] = {
                "value": value,
                "confidence": round(sum(confidence_parts) / max(1, len(confidence_parts)), 4),
                "source": "labelled_ocr",
            }
        index = max(index + 1, next_index)
    return normalized, suggestions


def health_payload() -> dict[str, Any]:
    import paddle
    import paddleocr
    started = time.perf_counter()
    engine = create_engine()  # Load the pinned models now so deployment fails during build, not first use.
    initialized = time.perf_counter()
    warmup_ms = warm_engine(engine)

    return {
        "ok": True,
        "contract_version": 2,
        "engine": "paddleocr",
        "python_version": platform.python_version(),
        "paddlepaddle_version": paddle.__version__,
        "paddleocr_version": paddleocr.__version__,
        "device": os.environ.get("PADDLE_OCR_DEVICE", "cpu"),
        "cuda_enabled": bool(paddle.is_compiled_with_cuda()),
        "extraction_enabled": True,
        "pdf_page_limit": 2,
        "model_initialization_ms": round((initialized - started) * 1000, 2),
        "model_warmup_ms": warmup_ms,
    }


def create_engine() -> Any:
    from paddleocr import PaddleOCR
    import paddle

    device = os.environ.get("PADDLE_OCR_DEVICE", "cpu").strip() or "cpu"
    if device.startswith("gpu") and not paddle.is_compiled_with_cuda():
        raise RuntimeError("OCR_GPU_RUNTIME_UNAVAILABLE")
    cpu_threads = max(1, min(8, int(os.environ.get("PADDLE_OCR_CPU_THREADS", "4")), os.cpu_count() or 1))
    options = {
        "device": device,
        "cpu_threads": cpu_threads,
        "enable_mkldnn": device == "cpu",
        "use_doc_orientation_classify": True,
        "use_doc_unwarping": False,
        "use_textline_orientation": False,
    }
    detector_model = os.environ.get("PADDLE_OCR_DETECTOR_MODEL", "PP-OCRv5_mobile_det").strip()
    # The mobile detector passed the current repository fixture audit with
    # identical or near-identical recognized content, at 5.5–10x lower warm
    # CPU latency than PaddleOCR's default server detector. Keep overrides
    # available for deployments whose documents need the larger detector.
    options["text_detection_model_name"] = detector_model
    options["text_recognition_model_name"] = os.environ.get(
        "PADDLE_OCR_RECOGNITION_MODEL", "en_PP-OCRv5_mobile_rec"
    ).strip()
    return PaddleOCR(**options)


def extract(source: str, mime: str, engine: Any | None = None) -> dict[str, Any]:
    request_started = time.perf_counter()
    validation_started = time.perf_counter()
    if mime not in {"image/jpeg", "image/png", "application/pdf"} or not Path(source).is_file():
        raise ValueError("OCR_INPUT_INVALID")
    if Path(source).stat().st_size > int(os.environ.get("PADDLE_OCR_MAX_BYTES", str(10 * 1024 * 1024))):
        raise ValueError("OCR_INPUT_TOO_LARGE")
    validation_ms = (time.perf_counter() - validation_started) * 1000
    pdf_preflight_ms = 0.0
    if mime == "application/pdf":
        pdf_started = time.perf_counter()
        import pypdfium2
        if len(pypdfium2.PdfDocument(source)) > 2: raise ValueError("OCR_PDF_PAGE_LIMIT_EXCEEDED")
        pdf_preflight_ms = (time.perf_counter() - pdf_started) * 1000
    if engine is None:
        engine = create_engine()
    predict_started = time.perf_counter()
    results = list(engine.predict(source))
    paddle_pipeline_ms = (time.perf_counter() - predict_started) * 1000
    fields_started = time.perf_counter()
    pages = []
    for result in results:
        value = json.loads(result.json) if isinstance(result.json, str) else result.json
        page = value.get("res", value)
        texts = [re.sub(r"\s+", " ", str(x)).strip() for x in page.get("rec_texts", [])]
        scores = [float(score) for score in page.get("rec_scores", [])]
        normalized_texts, suggestions = normalize_labelled_lines(texts, scores)
        pages.append({"page_index": page.get("page_index"), "text": texts, "normalized_text": normalized_texts, "confidence": page.get("rec_scores", []), "boxes": page.get("rec_boxes", []), "suggestions": suggestions})
    field_extraction_ms = (time.perf_counter() - fields_started) * 1000
    return {
        "ok": True,
        "contract_version": 1,
        "engine": "paddleocr",
        "advisory_only": True,
        "page_count": len(pages),
        "pages": pages,
        "timings_ms": {
            "input_validation": round(validation_ms, 2),
            "pdf_preflight": round(pdf_preflight_ms, 2),
            "paddle_pipeline": round(paddle_pipeline_ms, 2),
            "field_extraction": round(field_extraction_ms, 2),
            "worker_total": round((time.perf_counter() - request_started) * 1000, 2),
        },
    }


def warm_engine(engine: Any) -> float:
    """Run a tiny synthetic page once to move first-inference setup to startup."""
    import numpy as np

    started = time.perf_counter()
    engine.predict(np.full((320, 240, 3), 255, dtype=np.uint8))
    return round((time.perf_counter() - started) * 1000, 2)


def main() -> int:
    parser = argparse.ArgumentParser(add_help=False)
    parser.add_argument("--health", action="store_true")
    parser.add_argument("--extract", action="store_true")
    parser.add_argument("--input")
    parser.add_argument("--mime")
    parser.add_argument("--serve", action="store_true")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8765)
    args = parser.parse_args()

    os.environ.setdefault("PADDLE_PDX_CACHE_HOME", str(Path(__file__).resolve().parent.parent / ".runtime" / "paddlex-cache"))

    if args.serve:
        sys.path.insert(0, str(Path(__file__).resolve().parent))
        from paddle_ocr_worker import serve
        return serve(args.host, args.port)

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
