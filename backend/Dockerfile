FROM composer:2 AS composer

FROM dunglas/frankenphp:1-php8.4-bookworm

ENV APP_ENV=production \
    PADDLE_PDX_CACHE_HOME=/app/.runtime/paddlex-cache \
    PADDLE_PDX_DISABLE_MODEL_SOURCE_CHECK=True \
    OCR_PYTHON_PACKAGES_DIR=/app/.runtime/python-packages \
    PYTHONPATH=/app/.runtime/python-packages

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        clamav \
        libgl1 \
        libglib2.0-0 \
        libgomp1 \
        libsm6 \
        libxext6 \
        python3 \
        python3-pip \
        python3-venv \
    && rm -rf /var/lib/apt/lists/* \
    && install-php-extensions gd intl mysqli \
    && python3 -m venv /opt/ocr-venv \
    && ln -s /opt/ocr-venv/bin/python /usr/local/bin/python

COPY --from=composer /usr/bin/composer /usr/local/bin/composer

COPY composer.json composer.lock ./
COPY app ./app
RUN composer install \
    --no-dev \
    --no-interaction \
    --no-progress \
    --prefer-dist \
    --optimize-autoloader

COPY . /app

RUN mkdir -p "$OCR_PYTHON_PACKAGES_DIR" "$PADDLE_PDX_CACHE_HOME" \
    && python -m pip install \
        --disable-pip-version-check \
        --no-compile \
        --no-cache-dir \
        --target "$OCR_PYTHON_PACKAGES_DIR" \
        --requirement ocr/requirements.lock \
    && python ocr/student_ocr_bridge.py --health

COPY Caddyfile /Caddyfile
COPY start-container.sh /start-container.sh
RUN chmod 0755 /start-container.sh

CMD ["/start-container.sh"]
