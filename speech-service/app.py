"""
Self-hosted STT + диаризация для «Единая среда AI Sales» (Фаза 2).

faster-whisper (ASR + слово-таймкоды) + pyannote.audio (разделение спикеров на моно).
Отдаёт сегменты {start, end, speaker, text}. «Менеджер/Клиент» доразмечает основное
приложение (LLM roleSplit) поверх уже правильно разделённых реплик.

Контракт (совпадает с src/lib/transcription/providers/selfHosted.ts):
  POST /v1/transcribe  { "audio_url": "<url>", "language": "ru" } -> { "job_id": "..." }
  GET  /v1/jobs/{id}   -> { "status": "queued|processing|done|error", "error": ...,
        "result": { "language","duration","segments":[{start,end,speaker,text}] } }

ENV:
  WHISPER_MODEL      medium (CPU) | large-v3 (GPU)         — размер модели ASR
  DEVICE             cpu | cuda
  COMPUTE_TYPE       int8 (CPU) | float16 (GPU)
  HF_TOKEN           токен HuggingFace (для pyannote, gated — принять условия модели)
  EXPECTED_SPEAKERS  2 (для звонков — всегда 2 стороны; ускоряет и точнит диаризацию)
  API_TOKEN          если задан — требуется Authorization: Bearer <API_TOKEN>
  LANGUAGE           ru
"""
import os
import uuid
import tempfile
import threading
import subprocess
from typing import Optional

import requests
from fastapi import FastAPI, HTTPException, Header
from pydantic import BaseModel

WHISPER_MODEL = os.getenv("WHISPER_MODEL", "medium")
DEVICE = os.getenv("DEVICE", "cpu")
COMPUTE_TYPE = os.getenv("COMPUTE_TYPE", "int8" if DEVICE == "cpu" else "float16")
HF_TOKEN = os.getenv("HF_TOKEN", "")
EXPECTED_SPEAKERS = int(os.getenv("EXPECTED_SPEAKERS", "2"))
API_TOKEN = os.getenv("API_TOKEN", "")
LANGUAGE = os.getenv("LANGUAGE", "ru")

app = FastAPI(title="ES Speech Service")

# Простое in-memory хранилище задач (MVP, один инстанс). Для масштаба — Redis/БД.
JOBS: dict[str, dict] = {}
JOBS_LOCK = threading.Lock()

# Модели грузим лениво при первом запросе (экономим память на старте).
_whisper = None
_diarizer = None
_models_lock = threading.Lock()


def _load_models():
    global _whisper, _diarizer
    with _models_lock:
        if _whisper is None:
            from faster_whisper import WhisperModel
            _whisper = WhisperModel(WHISPER_MODEL, device=DEVICE, compute_type=COMPUTE_TYPE)
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
    return _whisper, _diarizer


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


def _speaker_at(turns, t: float) -> Optional[str]:
    """Кто говорил в момент t (по диаризации)."""
    best = None
    best_gap = 1e9
    for (start, end, spk) in turns:
        if start <= t <= end:
            return spk
        gap = min(abs(t - start), abs(t - end))
        if gap < best_gap:
            best_gap, best = gap, spk
    return best


def _process(job_id: str, audio_url: str, language: str):
    with JOBS_LOCK:
        JOBS[job_id]["status"] = "processing"
    tmp = tempfile.mkdtemp(prefix="es_stt_")
    try:
        whisper, diarizer = _load_models()
        raw = os.path.join(tmp, "in")
        wav = os.path.join(tmp, "audio.wav")
        _download(audio_url, raw)
        _to_wav16k_mono(raw, wav)

        # 1) ASR со слово-таймкодами
        seg_iter, info = whisper.transcribe(
            wav, language=language or LANGUAGE, word_timestamps=True, vad_filter=True
        )
        words = []
        for s in seg_iter:
            for w in (s.words or []):
                words.append((float(w.start), float(w.end), w.word))
        duration = float(getattr(info, "duration", 0.0)) or (words[-1][1] if words else 0.0)

        # 2) Диаризация (разделение спикеров)
        diar_kwargs = {}
        if EXPECTED_SPEAKERS > 0:
            diar_kwargs["num_speakers"] = EXPECTED_SPEAKERS
        diarization = diarizer(wav, **diar_kwargs)
        turns = [(float(t.start), float(t.end), spk)
                 for t, _, spk in diarization.itertracks(yield_label=True)]

        # 3) Слить: каждому слову — спикер по середине; склеить подряд одинаковых
        segments = []
        cur = None
        for (ws, we, wtext) in words:
            spk = _speaker_at(turns, (ws + we) / 2.0) or "SPEAKER_0"
            if cur and cur["speaker"] == spk:
                cur["end"] = we
                cur["text"] += wtext
            else:
                if cur:
                    segments.append(cur)
                cur = {"start": ws, "end": we, "speaker": spk, "text": wtext}
        if cur:
            segments.append(cur)
        for s in segments:
            s["text"] = s["text"].strip()

        with JOBS_LOCK:
            JOBS[job_id]["status"] = "done"
            JOBS[job_id]["result"] = {
                "language": language or LANGUAGE,
                "duration": duration,
                "segments": [s for s in segments if s["text"]],
            }
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


class TranscribeIn(BaseModel):
    audio_url: str
    language: Optional[str] = None


def _check_auth(authorization: Optional[str]):
    if API_TOKEN and authorization != f"Bearer {API_TOKEN}":
        raise HTTPException(status_code=401, detail="unauthorized")


@app.post("/v1/transcribe")
def transcribe(body: TranscribeIn, authorization: Optional[str] = Header(default=None)):
    _check_auth(authorization)
    job_id = uuid.uuid4().hex
    with JOBS_LOCK:
        JOBS[job_id] = {"status": "queued"}
    threading.Thread(
        target=_process, args=(job_id, body.audio_url, body.language or LANGUAGE), daemon=True
    ).start()
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
    return {"ok": True, "model": WHISPER_MODEL, "device": DEVICE, "jobs": len(JOBS)}
