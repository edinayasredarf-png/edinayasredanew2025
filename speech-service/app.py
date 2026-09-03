"""
Self-hosted ДИАРИЗАЦИЯ для «Единая среда» (гибрид: текст — Yandex, спикеры — pyannote).

Только pyannote.audio (разделение говорящих на моно). Транскрипцию (текст) делает
Yandex SpeechKit в основном приложении; сюда приходит только аудио, обратно —
интервалы говорящих. Приложение сопоставляет реплики Yandex со спикерами по таймкодам,
затем LLM-roleSplit размечает Менеджер/Клиент.

Лёгкий по ресурсам: нет whisper/ctranslate2 — только pyannote. Влезает в 2 CPU / 4 ГБ.

Контракт (совпадает с src/lib/transcription/diarization.ts):
  POST /v1/diarize   { "audio_url": "<url>" } -> { "job_id": "..." }
  GET  /v1/jobs/{id} -> { "status": "queued|processing|done|error", "error": ...,
        "result": { "duration": 123.4, "turns": [{"start":0.4,"end":4.8,"speaker":"SPEAKER_0"}] } }

ENV:
  HF_TOKEN           токен HuggingFace (pyannote gated — принять условия моделей)
  MIN_SPEAKERS       1 (нижняя граница; на автоответчике/молчащей стороне бывает 1)
  MAX_SPEAKERS       2 (стороны звонка)
  API_TOKEN          если задан — требуется Authorization: Bearer <API_TOKEN>
  DEVICE             cpu | cuda
"""
import os
import uuid
import queue
import tempfile
import threading
import subprocess
from typing import Optional

import requests
from fastapi import FastAPI, HTTPException, Header
from pydantic import BaseModel

HF_TOKEN = os.getenv("HF_TOKEN", "")
DEVICE = os.getenv("DEVICE", "cpu")
MIN_SPEAKERS = int(os.getenv("MIN_SPEAKERS", "1"))
MAX_SPEAKERS = int(os.getenv("MAX_SPEAKERS", "2"))
API_TOKEN = os.getenv("API_TOKEN", "")

app = FastAPI(title="ES Diarization Service")

JOBS: dict[str, dict] = {}
JOBS_LOCK = threading.Lock()

# Очередь: диаризация считается ПО ОДНОЙ (2 CPU не перегружаются).
WORK_QUEUE: "queue.Queue[tuple[str, str]]" = queue.Queue()

_diarizer = None
_models_lock = threading.Lock()


def _load_diarizer():
    global _diarizer
    with _models_lock:
        if _diarizer is None:
            from pyannote.audio import Pipeline
            _diarizer = Pipeline.from_pretrained(
                "pyannote/speaker-diarization-3.1", use_auth_token=HF_TOKEN or True
            )
            try:
                import torch
                if DEVICE == "cuda" and torch.cuda.is_available():
                    _diarizer.to(torch.device("cuda"))
            except Exception:
                pass
    return _diarizer


def _download(url: str, dst: str):
    with requests.get(url, stream=True, timeout=120) as r:
        r.raise_for_status()
        with open(dst, "wb") as f:
            for chunk in r.iter_content(chunk_size=1 << 16):
                f.write(chunk)


def _to_wav16k_mono(src: str, dst: str):
    subprocess.run(
        ["ffmpeg", "-y", "-i", src, "-ac", "1", "-ar", "16000", "-f", "wav", dst],
        check=True, capture_output=True,
    )


def _process(job_id: str, audio_url: str):
    with JOBS_LOCK:
        JOBS[job_id]["status"] = "processing"
    tmp = tempfile.mkdtemp(prefix="es_diar_")
    try:
        diarizer = _load_diarizer()
        raw = os.path.join(tmp, "in")
        wav = os.path.join(tmp, "audio.wav")
        _download(audio_url, raw)
        _to_wav16k_mono(raw, wav)

        diarization = diarizer(wav, min_speakers=MIN_SPEAKERS, max_speakers=MAX_SPEAKERS)
        turns = [
            {"start": float(t.start), "end": float(t.end), "speaker": str(spk)}
            for t, _, spk in diarization.itertracks(yield_label=True)
        ]
        duration = max((t["end"] for t in turns), default=0.0)

        with JOBS_LOCK:
            JOBS[job_id]["status"] = "done"
            JOBS[job_id]["result"] = {"duration": duration, "turns": turns}
    except Exception as e:  # noqa: BLE001
        with JOBS_LOCK:
            JOBS[job_id]["status"] = "error"
            JOBS[job_id]["error"] = str(e)[:500]
    finally:
        try:
            import shutil
            shutil.rmtree(tmp, ignore_errors=True)
        except Exception:
            pass


class DiarizeIn(BaseModel):
    audio_url: str


def _check_auth(authorization: Optional[str]):
    if API_TOKEN and authorization != f"Bearer {API_TOKEN}":
        raise HTTPException(status_code=401, detail="unauthorized")


@app.post("/v1/diarize")
def diarize(body: DiarizeIn, authorization: Optional[str] = Header(default=None)):
    _check_auth(authorization)
    job_id = uuid.uuid4().hex
    with JOBS_LOCK:
        JOBS[job_id] = {"status": "queued"}
    WORK_QUEUE.put((job_id, body.audio_url))
    return {"job_id": job_id}


@app.get("/v1/jobs/{job_id}")
def job(job_id: str, authorization: Optional[str] = Header(default=None)):
    _check_auth(authorization)
    j = JOBS.get(job_id)
    if not j:
        raise HTTPException(status_code=404, detail="job not found")
    out = {"status": j["status"]}
    if j.get("error"):
        out["error"] = j["error"]
    if j.get("result"):
        out["result"] = j["result"]
    return out


@app.get("/health")
def health():
    return {"ok": True, "mode": "diarize", "device": DEVICE,
            "jobs": len(JOBS), "queued": WORK_QUEUE.qsize()}


def _worker():
    while True:
        job_id, audio_url = WORK_QUEUE.get()
        try:
            _process(job_id, audio_url)
        except Exception:  # noqa: BLE001 — статус ошибки уже проставлен
            pass
        finally:
            WORK_QUEUE.task_done()


threading.Thread(target=_worker, daemon=True).start()
