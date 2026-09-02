# ES Speech Service — self-hosted STT + диаризация (Фаза 2)

Микросервис распознавания речи с **разделением спикеров на моно**:
**faster-whisper** (текст + слово-таймкоды) + **pyannote.audio** (кто-когда говорил).
Крутится на вашем сервере (CPU или GPU). Приложение на Vercel ходит в него по HTTP
через `TranscriptionProvider` (`TRANSCRIPTION_PROVIDER=selfhosted`).

«Менеджер/Клиент» проставляет уже само приложение (LLM roleSplit) — поверх верно
разделённых реплик, поэтому точно.

## Почему это, а не стерео
Стерео-запись у АТС стоит денег. pyannote отделяет голоса из **обычной моно-записи** —
диаризация без доплаты телефонии. Всё self-hosted, без обязательных платных API.

## Требования
- Linux-сервер. **CPU**: 8+ ядер, 16 ГБ RAM (модель `medium`, медленнее реального времени,
  но очередь разгребает фоном — ок для отдела продаж). **GPU** (опц.): 8–12 ГБ VRAM для
  `large-v3` быстро.
- Docker.
- Токен HuggingFace: принять условия моделей
  `pyannote/speaker-diarization-3.1` и `pyannote/segmentation-3.0` на huggingface.co,
  создать токен (Settings → Access Tokens) → это `HF_TOKEN`.

## Запуск (CPU)
```bash
cd speech-service
docker build -t es-speech .
docker run -d --name es-speech -p 8000:8000 \
  -e HF_TOKEN=hf_xxx \
  -e API_TOKEN=придумайте-секрет \
  -e WHISPER_MODEL=medium -e DEVICE=cpu -e COMPUTE_TYPE=int8 \
  -e EXPECTED_SPEAKERS=2 -e LANGUAGE=ru \
  es-speech
curl localhost:8000/health
```

## Запуск (GPU)
В `Dockerfile` заменить базовый образ на `nvidia/cuda:12.1.1-runtime-ubuntu22.04`
(+ установить python), а torch — на CUDA-колёса:
```dockerfile
RUN pip install torch==2.3.1 --index-url https://download.pytorch.org/whl/cu121
```
Запуск с `--gpus all -e DEVICE=cuda -e COMPUTE_TYPE=float16 -e WHISPER_MODEL=large-v3`.

## Проверка вручную
```bash
curl -X POST localhost:8000/v1/transcribe \
  -H "Authorization: Bearer <API_TOKEN>" -H "Content-Type: application/json" \
  -d '{"audio_url":"https://.../recording.mp3","language":"ru"}'
# -> {"job_id":"..."}
curl localhost:8000/v1/jobs/<job_id> -H "Authorization: Bearer <API_TOKEN>"
```

## Подключение к приложению (Vercel env)
```
TRANSCRIPTION_PROVIDER=selfhosted
SELFHOSTED_STT_URL=https://<адрес сервиса>        # публичный HTTPS (reverse-proxy)
SELFHOSTED_STT_TOKEN=<API_TOKEN>
SELFHOSTED_STT_LANG=ru
```
Сервис должен быть доступен из интернета по HTTPS (nginx/Caddy + сертификат), т.к.
Vercel ходит снаружи. Он же скачивает запись по `audio_url` (ссылка Bitrix disk),
поэтому должен доставать `oooecostroy.bitrix24.ru`.

## Замечания
- Задачи хранятся in-memory (один инстанс) — для MVP достаточно; для отказоустойчивости
  вынести в Redis.
- `EXPECTED_SPEAKERS=2` — для звонков всегда 2 стороны, это точнит и ускоряет диаризацию.
- Версионирование моделей: приложение хранит `provider`/`model` в `ai_transcripts` —
  при смене модели можно перетранскрибировать.
