# Self-hosted STT+диаризация. По умолчанию — CPU-образ (дёшево, для отдела продаж).
# Для GPU: базовый образ nvidia/cuda + torch cu12 (см. README, раздел GPU).
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
# ("cannot enable executable stack as shared object requires"). Снимаем флаг через
# patchelf --clear-execstack (execstack из Debian удалён; patchelf 0.18+ есть в trixie).
RUN apt-get update && apt-get install -y --no-install-recommends patchelf \
    && find / -name 'libctranslate2*.so*' -exec patchelf --clear-execstack {} \; \
    && apt-get purge -y patchelf && apt-get autoremove -y && rm -rf /var/lib/apt/lists/*

COPY app.py .

# small — безопасно по RAM на 2 CPU / 4 GB рядом с n8n. Есть запас памяти — WHISPER_MODEL=medium (точнее текст).
ENV WHISPER_MODEL=small DEVICE=cpu COMPUTE_TYPE=int8 EXPECTED_SPEAKERS=2 LANGUAGE=ru
EXPOSE 8000

# 1 воркер: модели держатся в памяти одного процесса; параллелизм — через очередь приложения.
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1"]
