# DOCX → PDF через LibreOffice headless. Отдельный контейнер (не связан со
# speech-service). CPU-образ, без GPU.
FROM python:3.11-slim

# LibreOffice Writer + шрифты. Liberation Serif метрически совместим с Times New
# Roman, Carlito ~ Calibri, Caladea ~ Cambria — чтобы Word-шаблоны выглядели 1:1.
# DejaVu — полное покрытие кириллицы на случай нестандартных шрифтов.
RUN apt-get update && apt-get install -y --no-install-recommends \
    libreoffice-writer \
    libreoffice-core \
    fonts-liberation \
    fonts-liberation2 \
    fonts-crosextra-carlito \
    fonts-crosextra-caladea \
    fonts-dejavu \
    fontconfig \
    && fc-cache -f \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
COPY app.py .

ENV SOFFICE_BIN=soffice \
    CONVERT_TIMEOUT=120 \
    PORT=8001
EXPOSE 8001

# 2 воркера: конвертации изолированы по профилю, параллелятся без конфликтов.
CMD ["sh", "-c", "uvicorn app:app --host 0.0.0.0 --port ${PORT} --workers 2"]
