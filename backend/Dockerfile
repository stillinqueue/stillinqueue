# Pinned to Debian 12: Playwright's "install --with-deps" supports bookworm (the plain -slim tag moved to Debian 13).
FROM python:3.12-slim-bookworm

WORKDIR /app

ENV PYTHONUNBUFFERED=1

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt \
    # Headless Chromium prints Job Radar CVs/cover letters in the candidate's own HTML design.
    && python -m playwright install --with-deps chromium \
    && rm -rf /var/lib/apt/lists/*

COPY *.py ./

EXPOSE 8000

CMD ["sh", "-c", "uvicorn app:app --host 0.0.0.0 --port ${PORT:-8000}"]
