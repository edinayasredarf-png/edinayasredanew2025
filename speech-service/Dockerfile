# Self-hosted WhisperX: faster-whisper (large-v3-turbo) + pyannote. CPU-образ.
FROM python:3.11-slim

# ffmpeg — нормализация аудио; libsndfile — для pyannote/torchaudio.
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg libsndfile1 git \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# torch + torchaudio строго CPU-сборки (иначе pyannote тянет CUDA-torchaudio → libcudart).
RUN pip install --no-cache-dir torch==2.3.1 torchaudio==2.3.1 --index-url https://download.pytorch.org/whl/cpu

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# CTranslate2 .so помечена «нужен исполняемый стек» — новые ядра/glibc это запрещают
# ("cannot enable executable stack"). Снимаем флаг (execstack из Debian удалён → patchelf 0.18+).
RUN apt-get update && apt-get install -y --no-install-recommends patchelf \
    && find / -name 'libctranslate2*.so*' -exec patchelf --clear-execstack {} \; \
    && apt-get purge -y patchelf && apt-get autoremove -y && rm -rf /var/lib/apt/lists/*

COPY app.py .

# large-v3-turbo — быстрый (~800M) и качественный текст; CPU_THREADS под число vCPU.
ENV WHISPER_MODEL=large-v3-turbo DEVICE=cpu COMPUTE_TYPE=int8 CPU_THREADS=4 \
    MIN_SPEAKERS=1 MAX_SPEAKERS=2 LANGUAGE=ru
EXPOSE 8000

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
