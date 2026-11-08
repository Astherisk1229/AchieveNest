FROM composer:2 AS composer

FROM python:3.12-slim-bookworm AS ocr

WORKDIR /build
COPY ocr/requirements.lock ./requirements.lock
RUN python -m pip install \
    --disable-pip-version-check \
    --no-compile \
    --no-cache-dir \
    --target /opt/ocr-packages \
    --requirement requirements.lock

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
        git \
        libgl1 \
        libglib2.0-0 \
        libgomp1 \
        libsm6 \
        libxext6 \
        unzip \
    && rm -rf /var/lib/apt/lists/* \
    && install-php-extensions gd intl mysqli zip \
    && ldconfig

# FrankenPHP's image normally rewrites the PHP entrypoint to launch FrankenPHP.
# Railway's existing start command relies on that behavior.
RUN sed -i 's/php/frankenphp run/g' /usr/local/bin/docker-php-entrypoint

# Seed ClamAV definitions in the image so the existing startup command does
# not need to download the full database before the web server can start.
RUN freshclam --quiet

COPY --from=ocr /usr/local/bin/python3.12 /usr/local/bin/python3.12
COPY --from=ocr /usr/local/lib/python3.12 /usr/local/lib/python3.12
COPY --from=ocr /usr/local/lib/libpython3.12.so.1.0 /usr/local/lib/libpython3.12.so.1.0
COPY --from=ocr /opt/ocr-packages /app/.runtime/python-packages
RUN ln -s /usr/local/bin/python3.12 /usr/local/bin/python \
    && ldconfig

COPY --from=composer /usr/bin/composer /usr/local/bin/composer

COPY composer.json composer.lock ./
COPY app ./app
RUN composer install \
    --prefer-install=source \
    --no-dev \
    --no-interaction \
    --no-progress \
    --optimize-autoloader \
    && find vendor -type d -name .git -prune -exec rm -rf '{}' + \
    && apt-get purge -y git

COPY . /app

RUN mkdir -p "$OCR_PYTHON_PACKAGES_DIR" "$PADDLE_PDX_CACHE_HOME" \
    && python ocr/student_ocr_bridge.py --health

COPY Caddyfile /Caddyfile
COPY start-container.sh /start-container.sh
COPY php.ini /usr/local/etc/php/conf.d/99-achievenest.ini
RUN chmod 0755 /start-container.sh

CMD ["/start-container.sh"]
