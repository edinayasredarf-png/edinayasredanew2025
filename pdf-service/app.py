"""
Микросервис конвертации DOCX → PDF через LibreOffice (headless).

Отдельный контейнер (никак не связан со speech-service / речевой аналитикой).
Один endpoint: POST /v1/convert принимает тело .docx, возвращает application/pdf.
Авторизация — тем же способом, что и speech-service: заголовок
Authorization: Bearer <PDF_API_TOKEN>.
"""

import os
import shutil
import subprocess
import tempfile
import uuid
from typing import Optional

from fastapi import FastAPI, Header, HTTPException, Request
from fastapi.responses import Response

API_TOKEN = os.environ.get("PDF_API_TOKEN", "").strip()
SOFFICE = os.environ.get("SOFFICE_BIN", "soffice")
CONVERT_TIMEOUT = int(os.environ.get("CONVERT_TIMEOUT", "120"))
MAX_BYTES = int(os.environ.get("MAX_BYTES", str(30 * 1024 * 1024)))  # 30 МБ

app = FastAPI(title="kp-pdf-service", version="1.0")


def _check_auth(authorization: Optional[str]):
    if API_TOKEN and authorization != f"Bearer {API_TOKEN}":
        raise HTTPException(status_code=401, detail="unauthorized")


def _convert(docx: bytes) -> bytes:
    """Конвертирует .docx-байты в .pdf-байты. Изолированный профиль на запрос →
    несколько конвертаций могут идти параллельно, не мешая друг другу."""
    work = tempfile.mkdtemp(prefix="kp_")
    profile = os.path.join(work, "profile")
    src = os.path.join(work, "in.docx")
    try:
        with open(src, "wb") as f:
            f.write(docx)
        cmd = [
            SOFFICE,
            "--headless",
            "--norestore",
            "--nolockcheck",
            "--nodefault",
            f"-env:UserInstallation=file://{profile}",
            "--convert-to",
            "pdf:writer_pdf_Export",
            "--outdir",
            work,
            src,
        ]
        proc = subprocess.run(
            cmd, capture_output=True, timeout=CONVERT_TIMEOUT, check=False
        )
        out = os.path.join(work, "in.pdf")
        if not os.path.exists(out):
            raise HTTPException(
                status_code=500,
                detail=f"LibreOffice не выдал PDF: {proc.stderr.decode('utf-8', 'ignore')[:500]}",
            )
        with open(out, "rb") as f:
            return f.read()
    except subprocess.TimeoutExpired:
        raise HTTPException(status_code=504, detail="Таймаут конвертации")
    finally:
        shutil.rmtree(work, ignore_errors=True)


@app.post("/v1/convert")
async def convert(request: Request, authorization: Optional[str] = Header(default=None)):
    _check_auth(authorization)
    data = await request.body()
    if not data:
        raise HTTPException(status_code=400, detail="пустое тело (ожидается .docx)")
    if len(data) > MAX_BYTES:
        raise HTTPException(status_code=413, detail="файл слишком большой")
    pdf = _convert(data)
    filename = f"{uuid.uuid4().hex}.pdf"
    return Response(
        content=pdf,
        media_type="application/pdf",
        headers={"Content-Disposition": f'inline; filename="{filename}"'},
    )


@app.get("/health")
def health():
    ok = shutil.which(SOFFICE) is not None or os.path.exists(SOFFICE)
    return {"ok": ok, "service": "kp-pdf", "soffice": SOFFICE}
