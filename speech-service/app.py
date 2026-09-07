"""
Self-hosted WhisperX для «Единая среда»: faster-whisper (large-v3-turbo — текст со
словами) + pyannote (диаризация) + пословное сопоставление. Отдаёт готовые реплики
со спикерами — как Voicee. Пунктуация сохраняется: whisper кладёт её прямо в токены
слов, поэтому пословная нарезка по спикерам не теряет знаки препинания (в отличие от
Yandex, где пунктуация только на уровне фразы).

Контракт (совпадает с src/lib/transcription/providers/selfHosted.ts):
  POST /v1/transcribe { "audio_url": "<url>", "language": "ru" } -> { "job_id": "..." }
  GET  /v1/jobs/{id}  -> { "status": "queued|processing|done|error", "error": ...,
        "result": { "language","duration",
          "segments":[{ "start":0.4,"end":4.8,"speaker":"SPEAKER_0","text":"..." }] } }

ENV:
  WHISPER_MODEL   large-v3-turbo (быстрый ~800M) | large-v3 | medium | small
  DEVICE          cpu | cuda
  COMPUTE_TYPE    int8 (CPU) | float16 (GPU)
  CPU_THREADS     число потоков whisper (== числу vCPU, напр. 4); 0 = авто
  HF_TOKEN        токен HuggingFace (pyannote gated — принять условия моделей)
  MIN_SPEAKERS/MAX_SPEAKERS  границы числа говорящих (1..2 для звонка)
  API_TOKEN       если задан — требуется Authorization: Bearer <API_TOKEN>
  LANGUAGE        ru
"""
import os
import re
import uuid
import queue
import tempfile
import threading
import subprocess
from typing import Optional

import requests
from fastapi import FastAPI, HTTPException, Header
from pydantic import BaseModel

WHISPER_MODEL = os.getenv("WHISPER_MODEL", "large-v3-turbo")
DEVICE = os.getenv("DEVICE", "cpu")
COMPUTE_TYPE = os.getenv("COMPUTE_TYPE", "int8" if DEVICE == "cpu" else "float16")
CPU_THREADS = int(os.getenv("CPU_THREADS", "0"))  # 0 = авто (по числу ядер)
HF_TOKEN = os.getenv("HF_TOKEN", "")
MIN_SPEAKERS = int(os.getenv("MIN_SPEAKERS", "1"))
MAX_SPEAKERS = int(os.getenv("MAX_SPEAKERS", "2"))
API_TOKEN = os.getenv("API_TOKEN", "")
LANGUAGE = os.getenv("LANGUAGE", "ru")
# GigaAM (Sber) — альтернативный ASR (движок выбирается в запросе engine=gigaam).
GIGAAM_MODEL = os.getenv("GIGAAM_MODEL", "v2_ctc")  # v2_ctc | v2_rnnt | ctc | rnnt
# GigaSTT — отдельный локальный сервер (Rust, быстрый) для engine=gigastt.
GIGASTT_URL = os.getenv("GIGASTT_URL", "http://127.0.0.1:9876")

app = FastAPI(title="ES Speech Service")

# In-memory задачи (MVP, один инстанс).
JOBS: dict[str, dict] = {}
JOBS_LOCK = threading.Lock()

# Очередь: звонки считаются ПО ОДНОМУ. Элемент: (job_id, audio_url, language, engine).
WORK_QUEUE: "queue.Queue[tuple[str, str, str, str]]" = queue.Queue()

_whisper = None
_gigaam = None
_diarizer = None
_models_lock = threading.Lock()


def _load_whisper():
    global _whisper
    with _models_lock:
        if _whisper is None:
            from faster_whisper import WhisperModel
            kw = {"device": DEVICE, "compute_type": COMPUTE_TYPE}
            if CPU_THREADS > 0:
                kw["cpu_threads"] = CPU_THREADS
            _whisper = WhisperModel(WHISPER_MODEL, **kw)
    return _whisper


def _load_gigaam():
    global _gigaam
    with _models_lock:
        if _gigaam is None:
            import gigaam
            _gigaam = gigaam.load_model(GIGAAM_MODEL)
    return _gigaam


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


# Типовые галлюцинации Whisper (обучен на ютуб-субтитрах): на тишине/шуме выдумывает
# фразы из субтитров, которых в звонке не было. Дропаем сегменты, целиком совпадающие.
_HALLUCINATION = re.compile(
    r"субтитр|редактор субтитров|корректор|продолжение следует|спасибо за просмотр|"
    r"спасибо за внимание|дубровск|подпишись|поставьте лайк|переводчик|"
    r"dimatorzok|amara\.org|подписывайтесь на канал|спасибо, что смотрели",
    re.IGNORECASE,
)


def _is_hallucination(text: str) -> bool:
    return bool(_HALLUCINATION.search(text or ""))


def _speaker_at(turns, t: float) -> Optional[str]:
    """Кто говорил в момент t (сек): по включению, иначе — ближайший интервал."""
    best = None
    best_gap = 1e9
    for (start, end, spk) in turns:
        if start <= t <= end:
            return spk
        gap = min(abs(t - start), abs(t - end))
        if gap < best_gap:
            best_gap, best = gap, spk
    return best


def _diarize(wav: str):
    diarizer = _load_diarizer()
    diarization = diarizer(wav, min_speakers=MIN_SPEAKERS, max_speakers=MAX_SPEAKERS)
    return [(float(t.start), float(t.end), str(spk)) for t, _, spk in diarization.itertracks(yield_label=True)]


def _asr_whisper(wav: str, language: str):
    """Whisper: слова с таймкодами (пунктуация в токенах)."""
    whisper = _load_whisper()
    seg_iter, info = whisper.transcribe(
        wav, language=language or LANGUAGE, word_timestamps=True,
        vad_filter=True, condition_on_previous_text=False,
        no_speech_threshold=0.6, log_prob_threshold=-1.0,
    )
    words = []
    for s in seg_iter:
        for w in (s.words or []):
            words.append((float(w.start), float(w.end), w.word))
    duration = float(getattr(info, "duration", 0.0)) or (words[-1][1] if words else 0.0)
    return words, duration


def _asr_gigaam(wav: str, language: str):
    """GigaAM: сегменты с границами (VAD внутри longform). Пословных таймкодов нет —
    спикера ставим на сегмент. Возвращает [(start, end, text)] и длительность."""
    model = _load_gigaam()
    recs = model.transcribe_longform(wav)
    segs = []
    for r in recs:
        text = str((r.get("transcription") if isinstance(r, dict) else getattr(r, "transcription", "")) or "").strip()
        b = (r.get("boundaries") if isinstance(r, dict) else getattr(r, "boundaries", None)) or {}
        start = float(b.get("start", 0.0)) if isinstance(b, dict) else float(getattr(b, "start", 0.0) or 0.0)
        end = float(b.get("end", start)) if isinstance(b, dict) else float(getattr(b, "end", start) or start)
        if text:
            segs.append((start, end, text))
    duration = segs[-1][1] if segs else 0.0
    return segs, duration


def _asr_gigastt(wav: str, language: str):
    """GigaSTT (локальный Rust-сервер): быстрый русский ASR. OpenAI-совместимый
    эндпоинт с response_format=verbose_json → сегменты {start,end,text}."""
    with open(wav, "rb") as f:
        resp = requests.post(
            f"{GIGASTT_URL.rstrip('/')}/v1/audio/transcriptions",
            files={"file": ("audio.wav", f, "audio/wav")},
            data={"response_format": "verbose_json", "language": language or LANGUAGE},
            timeout=600,
        )
    resp.raise_for_status()
    j = resp.json()
    segs = []
    for s in (j.get("segments") or []):
        text = str(s.get("text") or "").strip()
        if text:
            segs.append((float(s.get("start", 0.0) or 0.0), float(s.get("end", 0.0) or 0.0), text))
    if not segs and j.get("text"):
        segs = [(0.0, 0.0, str(j["text"]).strip())]
    duration = segs[-1][1] if segs else 0.0
    return segs, duration


def _process(job_id: str, audio_url: str, language: str, engine: str):
    with JOBS_LOCK:
        JOBS[job_id]["status"] = "processing"
    tmp = tempfile.mkdtemp(prefix="es_stt_")
    try:
        raw = os.path.join(tmp, "in")
        wav = os.path.join(tmp, "audio.wav")
        _download(audio_url, raw)
        _to_wav16k_mono(raw, wav)

        turns = _diarize(wav)

        if engine in ("gigaam", "gigastt"):
            # ASR сегментами (GigaAM / GigaSTT), спикер — по середине сегмента (pyannote).
            segs, duration = _asr_gigastt(wav, language) if engine == "gigastt" else _asr_gigaam(wav, language)
            segments = []
            for (s, e, text) in segs:
                spk = _speaker_at(turns, (s + e) / 2.0) or "SPEAKER_0"
                segments.append({"start": s, "end": e, "speaker": spk, "text": text})
        else:
            # ASR словами (Whisper), пословное сопоставление со спикерами.
            words, duration = _asr_whisper(wav, language)
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
                "engine": engine,
                "duration": duration,
                "segments": [s for s in segments if s["text"] and not _is_hallucination(s["text"])],
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
    engine: Optional[str] = None  # whisper (default) | gigaam


def _check_auth(authorization: Optional[str]):
    if API_TOKEN and authorization != f"Bearer {API_TOKEN}":
        raise HTTPException(status_code=401, detail="unauthorized")


@app.post("/v1/transcribe")
def transcribe(body: TranscribeIn, authorization: Optional[str] = Header(default=None)):
    _check_auth(authorization)
    job_id = uuid.uuid4().hex
    with JOBS_LOCK:
        JOBS[job_id] = {"status": "queued"}
    eng = (body.engine or "").lower()
    engine = eng if eng in ("gigaam", "gigastt") else "whisper"
    WORK_QUEUE.put((job_id, body.audio_url, body.language or LANGUAGE, engine))
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
    return {
        "ok": True, "mode": "whisper+gigaam+gigastt", "model": WHISPER_MODEL, "gigaam": GIGAAM_MODEL,
        "gigastt_url": GIGASTT_URL, "device": DEVICE, "jobs": len(JOBS), "queued": WORK_QUEUE.qsize(),
    }


def _worker():
    """Единственный воркер: звонки считаются по одному."""
    while True:
        job_id, audio_url, language, engine = WORK_QUEUE.get()
        try:
            _process(job_id, audio_url, language, engine)
        except Exception:  # noqa: BLE001 — статус ошибки уже проставлен в _process
            pass
        finally:
            WORK_QUEUE.task_done()


threading.Thread(target=_worker, daemon=True).start()
