#!/bin/sh
set -eu

# This additional Railpack step runs after the PHP provider's normal Composer
# install. Keep Python packages under /app so they are included in the image.
OCR_PYTHON_PACKAGES_DIR="${OCR_PYTHON_PACKAGES_DIR:-/app/.runtime/python-packages}"
PADDLE_PDX_CACHE_HOME="${PADDLE_PDX_CACHE_HOME:-/app/.runtime/paddlex-cache}"
mkdir -p "$OCR_PYTHON_PACKAGES_DIR" "$PADDLE_PDX_CACHE_HOME"
python -m pip install --disable-pip-version-check --no-compile \
  --target "$OCR_PYTHON_PACKAGES_DIR" --requirement ocr/requirements.lock
PYTHONPATH="$OCR_PYTHON_PACKAGES_DIR${PYTHONPATH:+:$PYTHONPATH}" \
PADDLE_PDX_CACHE_HOME="$PADDLE_PDX_CACHE_HOME" \
PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK=True \
  python ocr/student_ocr_bridge.py --health
