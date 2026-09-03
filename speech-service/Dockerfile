# Self-hosted диаризация (pyannote-only). Лёгкий CPU-образ: без whisper/ctranslate2.
FROM python:3.11-slim

# ffmpeg — нормализация аудио; libsndfile — для pyannote/torchaudio.
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg libsndfile1 git \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# torch + torchaudio строго CPU-сборки (иначе pyannote тянет CUDA-torchaudio).
RUN pip install --no-cache-dir torch==2.3.1 torchaudio==2.3.1 --index-url https://download.pytorch.org/whl/cpu

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app.py .

ENV DEVICE=cpu MIN_SPEAKERS=1 MAX_SPEAKERS=2
EXPOSE 8000

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
