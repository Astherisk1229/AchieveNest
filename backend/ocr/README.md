# AchieveNest Student PaddleOCR Runtime

This directory defines the deployment-owned, CPU-only OCR runtime used by the
new canonical student achievement flow.

Pinned runtime:

- Python 3.12.10 (official Windows x64 embeddable distribution)
- PaddlePaddle 3.3.0 CPU
- PaddleOCR 3.7.0

Provision from PowerShell:

```powershell
pwsh -File .\ocr\setup-paddleocr.ps1
```

The generated interpreter and packages live under `backend/.runtime/python`
and are intentionally ignored by Git. The setup verifies the official Python
archive checksum, installs the pinned dependency lock, and executes the JSON
health contract.

The PHP integration must invoke `student_ocr_bridge.py` through an argument
array with shell bypass, never by concatenating filenames or user input into a
command string. Extraction is intentionally disabled until representative
student documents are available for the required language, page-policy,
layout, confidence, and performance audit.
