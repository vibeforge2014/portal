from __future__ import annotations

import asyncio
import hashlib
import logging
import os
import re
import secrets
import shutil
import subprocess
import sys
import time
import zipfile
from contextlib import asynccontextmanager
from dataclasses import dataclass, field
from pathlib import Path
from typing import Literal

import fitz
import httpx
from fastapi import FastAPI, File, Form, Header, HTTPException, UploadFile
from fastapi.responses import FileResponse, JSONResponse, Response
from starlette.background import BackgroundTask

Operation = Literal["pdf-to-word", "word-to-pdf"]
JobStatus = Literal["queued", "analyzing", "ocr", "converting", "ready", "failed", "expired"]

JOB_ROOT = Path(os.environ.get("JOB_ROOT", "/data/jobs"))
GOTENBERG_URL = os.environ.get("GOTENBERG_URL", "http://gotenberg:3000").rstrip("/")
MAX_FILE_BYTES = 10 * 1024 * 1024
MAX_OUTPUT_BYTES = 50 * 1024 * 1024
MAX_PDF_PAGES = 60
MAX_DOCX_EXPANDED_BYTES = 100 * 1024 * 1024
MAX_DOCX_ENTRIES = 5000
JOB_TTL_SECONDS = 15 * 60
CONVERSION_TIMEOUT_SECONDS = 5 * 60
QUEUE_CAPACITY = 8

logging.basicConfig(level=logging.INFO, format="%(message)s")
logger = logging.getLogger("pdf-converter")


@dataclass
class Job:
    job_id: str
    token_hash: bytes
    operation: Operation
    locale: str
    input_path: Path
    output_path: Path
    output_name: str
    output_mime: str
    input_size: int
    created_at: float = field(default_factory=time.time)
    expires_at: float = field(default_factory=lambda: time.time() + JOB_TTL_SECONDS)
    status: JobStatus = "queued"
    output_size: int | None = None
    error_code: str | None = None
    pages: int | None = None


jobs: dict[str, Job] = {}
queue: asyncio.Queue[str] = asyncio.Queue(maxsize=QUEUE_CAPACITY)
worker_task: asyncio.Task[None] | None = None
cleanup_task: asyncio.Task[None] | None = None


def api_error(code: str, status: int) -> HTTPException:
    return HTTPException(status_code=status, detail={"code": code})


def error_response(code: str, status: int) -> JSONResponse:
    return JSONResponse({"error": {"code": code}}, status_code=status, headers={"Cache-Control": "no-store"})


def safe_stem(filename: str | None) -> str:
    stem = Path(filename or "document").stem
    stem = re.sub(r"[\x00-\x1f\x7f/\\]+", "-", stem).strip(" .-")[:80]
    return stem or "document"


def token_matches(job: Job, token: str | None) -> bool:
    if not token:
        return False
    return secrets.compare_digest(job.token_hash, hashlib.sha256(token.encode()).digest())


def job_payload(job: Job, include_token: str | None = None) -> dict:
    payload: dict = {
        "jobId": job.job_id,
        "status": job.status,
        "expiresAt": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(job.expires_at)),
    }
    if include_token:
        payload["token"] = include_token
    if job.status == "ready" and job.output_size is not None:
        payload["output"] = {"filename": job.output_name, "mimeType": job.output_mime, "size": job.output_size}
    if job.error_code:
        payload["error"] = {"code": job.error_code}
    return payload


def require_job(job_id: str, token: str | None) -> Job:
    job = jobs.get(job_id)
    if not job or not token_matches(job, token):
        raise api_error("JOB_EXPIRED", 410)
    if job.expires_at <= time.time() or job.status == "expired":
        remove_job(job_id)
        raise api_error("JOB_EXPIRED", 410)
    return job


def remove_job(job_id: str) -> None:
    job = jobs.pop(job_id, None)
    if job:
        shutil.rmtree(job.input_path.parent, ignore_errors=True)


async def save_upload(upload: UploadFile, destination: Path) -> int:
    size = 0
    with destination.open("wb") as output:
        while chunk := await upload.read(1024 * 1024):
            size += len(chunk)
            if size > MAX_FILE_BYTES:
                output.close()
                destination.unlink(missing_ok=True)
                raise api_error("FILE_TOO_LARGE", 413)
            output.write(chunk)
    return size


def validate_pdf(path: Path) -> int:
    if path.read_bytes()[:5] != b"%PDF-":
        raise api_error("INVALID_TYPE", 415)
    try:
        document = fitz.open(path)
        if document.needs_pass:
            document.close()
            raise api_error("ENCRYPTED_PDF", 422)
        page_count = document.page_count
        document.close()
    except HTTPException:
        raise
    except Exception as exc:
        raise api_error("INVALID_TYPE", 415) from exc
    if page_count < 1 or page_count > MAX_PDF_PAGES:
        raise api_error("PAGE_LIMIT_EXCEEDED", 422)
    return page_count


def validate_word(path: Path, extension: str) -> None:
    signature = path.read_bytes()[:8]
    if extension == ".doc":
        if signature != bytes.fromhex("D0CF11E0A1B11AE1"):
            raise api_error("INVALID_TYPE", 415)
        return
    if extension != ".docx" or signature[:4] != b"PK\x03\x04":
        raise api_error("INVALID_TYPE", 415)
    try:
        with zipfile.ZipFile(path) as archive:
            infos = archive.infolist()
            names = {entry.filename for entry in infos}
            if len(infos) > MAX_DOCX_ENTRIES or sum(entry.file_size for entry in infos) > MAX_DOCX_EXPANDED_BYTES:
                raise api_error("FILE_TOO_LARGE", 413)
            if "[Content_Types].xml" not in names or "word/document.xml" not in names:
                raise api_error("INVALID_TYPE", 415)
    except HTTPException:
        raise
    except (OSError, zipfile.BadZipFile) as exc:
        raise api_error("INVALID_TYPE", 415) from exc


def run_ocr(job: Job, source: Path, output: Path, timeout: float) -> None:
    languages = {"zh-hans": "chi_sim+eng", "zh-hant": "chi_tra+eng", "en": "eng"}[job.locale]
    command = [
        "ocrmypdf", "--skip-text", "--rotate-pages", "--jobs", "1",
        "--tesseract-timeout", "120", "--output-type", "pdf", "--optimize", "0",
        "--language", languages, str(source), str(output),
    ]
    subprocess.run(command, check=True, timeout=max(1, timeout), stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)


def convert_pdf_to_word(job: Job) -> None:
    deadline = time.monotonic() + CONVERSION_TIMEOUT_SECONDS
    with fitz.open(job.input_path) as document:
        scanned_pages = [index for index, page in enumerate(document) if not page.get_text("text").strip()]
    ocr_path = job.input_path.parent / "ocr.pdf"
    job.status = "ocr"
    try:
        run_ocr(job, job.input_path, ocr_path, deadline - time.monotonic())
    except (subprocess.CalledProcessError, subprocess.TimeoutExpired) as exc:
        raise RuntimeError("OCR_FAILED") from exc
    job.status = "converting"
    try:
        subprocess.run(
            [sys.executable, "/app/pdf_to_docx.py", str(ocr_path), str(job.output_path), ",".join(map(str, scanned_pages))],
            check=True,
            timeout=max(1, deadline - time.monotonic()),
            stdout=subprocess.DEVNULL,
            stderr=subprocess.PIPE,
        )
    except (subprocess.CalledProcessError, subprocess.TimeoutExpired) as exc:
        raise RuntimeError("CONVERSION_FAILED") from exc


async def convert_word_to_pdf(job: Job) -> None:
    job.status = "converting"
    async with httpx.AsyncClient(timeout=httpx.Timeout(CONVERSION_TIMEOUT_SECONDS)) as client:
        with job.input_path.open("rb") as source:
            response = await client.post(
                f"{GOTENBERG_URL}/forms/libreoffice/convert",
                files={"files": (job.input_path.name, source, "application/octet-stream")},
                data={"updateIndexes": "false", "exportBookmarks": "true", "exportFormFields": "true"},
                headers={"Gotenberg-Output-Filename": "output"},
            )
        if response.status_code != 200:
            raise RuntimeError("CONVERSION_FAILED")
        if len(response.content) > MAX_OUTPUT_BYTES:
            raise RuntimeError("CONVERSION_FAILED")
        job.output_path.write_bytes(response.content)


async def process_job(job: Job) -> None:
    started = time.monotonic()
    try:
        job.status = "analyzing"
        if job.operation == "pdf-to-word":
            await asyncio.to_thread(convert_pdf_to_word, job)
        else:
            await asyncio.wait_for(convert_word_to_pdf(job), timeout=CONVERSION_TIMEOUT_SECONDS)
        if not job.output_path.is_file() or job.output_path.stat().st_size == 0:
            raise RuntimeError("CONVERSION_FAILED")
        if job.output_path.stat().st_size > MAX_OUTPUT_BYTES:
            raise RuntimeError("CONVERSION_FAILED")
        job.output_size = job.output_path.stat().st_size
        job.status = "ready"
        logger.info("job_complete id=%s operation=%s input_bytes=%d pages=%s output_bytes=%d duration_ms=%d", job.job_id, job.operation, job.input_size, job.pages or "-", job.output_size, round((time.monotonic() - started) * 1000))
    except asyncio.TimeoutError:
        job.status = "failed"
        job.error_code = "CONVERSION_FAILED"
    except Exception as exc:
        job.status = "failed"
        job.error_code = str(exc) if str(exc) in {"OCR_FAILED", "CONVERSION_FAILED"} else "CONVERSION_FAILED"
        logger.warning("job_failed id=%s operation=%s code=%s duration_ms=%d", job.job_id, job.operation, job.error_code, round((time.monotonic() - started) * 1000))


async def worker() -> None:
    while True:
        job_id = await queue.get()
        try:
            job = jobs.get(job_id)
            if job and job.status == "queued":
                await process_job(job)
        finally:
            queue.task_done()


async def cleanup_expired() -> None:
    while True:
        await asyncio.sleep(60)
        now = time.time()
        for job_id, job in list(jobs.items()):
            if job.expires_at <= now:
                job.status = "expired"
                remove_job(job_id)
        for directory in JOB_ROOT.iterdir():
            try:
                if directory.is_dir() and directory.stat().st_mtime < now - JOB_TTL_SECONDS:
                    shutil.rmtree(directory, ignore_errors=True)
            except FileNotFoundError:
                pass


@asynccontextmanager
async def lifespan(_: FastAPI):
    global worker_task, cleanup_task
    JOB_ROOT.mkdir(parents=True, exist_ok=True, mode=0o700)
    worker_task = asyncio.create_task(worker())
    cleanup_task = asyncio.create_task(cleanup_expired())
    yield
    for task in (worker_task, cleanup_task):
        if task:
            task.cancel()
    await asyncio.gather(*(task for task in (worker_task, cleanup_task) if task), return_exceptions=True)


app = FastAPI(title="ZenSoft PDF converter", docs_url=None, redoc_url=None, openapi_url=None, lifespan=lifespan)


@app.exception_handler(HTTPException)
async def http_error_handler(_, exc: HTTPException):
    detail = exc.detail if isinstance(exc.detail, dict) else {"code": "CONVERSION_FAILED"}
    return JSONResponse({"error": detail}, status_code=exc.status_code, headers={"Cache-Control": "no-store"})


@app.get("/api/pdf-convert/health/")
async def health():
    try:
        async with httpx.AsyncClient(timeout=2) as client:
            response = await client.get(f"{GOTENBERG_URL}/health")
        gotenberg_ok = response.status_code == 200
    except httpx.HTTPError:
        gotenberg_ok = False
    return JSONResponse({"status": "ok" if gotenberg_ok else "degraded", "queue": queue.qsize(), "gotenberg": gotenberg_ok}, status_code=200 if gotenberg_ok else 503, headers={"Cache-Control": "no-store"})


@app.post("/api/pdf-convert/jobs/", status_code=202)
async def create_job(operation: str = Form(...), locale: str = Form(...), file: UploadFile = File(...)):
    if operation not in {"pdf-to-word", "word-to-pdf"} or locale not in {"zh-hans", "zh-hant", "en"}:
        return error_response("INVALID_TYPE", 415)
    if queue.full():
        return error_response("QUEUE_FULL", 429)
    extension = Path(file.filename or "").suffix.lower()
    expected = ".pdf" if operation == "pdf-to-word" else extension
    if operation == "pdf-to-word" and extension != ".pdf":
        return error_response("INVALID_TYPE", 415)
    if operation == "word-to-pdf" and extension not in {".doc", ".docx"}:
        return error_response("INVALID_TYPE", 415)

    job_id = secrets.token_urlsafe(18)
    token = secrets.token_urlsafe(32)
    directory = JOB_ROOT / job_id
    directory.mkdir(mode=0o700)
    input_path = directory / f"input{expected}"
    try:
        input_size = await save_upload(file, input_path)
        if input_size == 0:
            raise api_error("INVALID_TYPE", 415)
        pages = validate_pdf(input_path) if operation == "pdf-to-word" else None
        if operation == "word-to-pdf":
            validate_word(input_path, extension)
    except Exception:
        shutil.rmtree(directory, ignore_errors=True)
        raise
    finally:
        await file.close()

    output_extension = ".docx" if operation == "pdf-to-word" else ".pdf"
    output_name = f"{safe_stem(file.filename)}{output_extension}"
    job = Job(
        job_id=job_id,
        token_hash=hashlib.sha256(token.encode()).digest(),
        operation=operation,
        locale=locale,
        input_path=input_path,
        output_path=directory / f"output{output_extension}",
        output_name=output_name,
        output_mime="application/vnd.openxmlformats-officedocument.wordprocessingml.document" if operation == "pdf-to-word" else "application/pdf",
        input_size=input_size,
        pages=pages,
    )
    jobs[job_id] = job
    try:
        queue.put_nowait(job_id)
    except asyncio.QueueFull as exc:
        remove_job(job_id)
        raise api_error("QUEUE_FULL", 429) from exc
    logger.info("job_created id=%s operation=%s input_bytes=%d pages=%s", job_id, operation, input_size, pages or "-")
    return JSONResponse(job_payload(job, token), status_code=202, headers={"Cache-Control": "no-store"})


@app.get("/api/pdf-convert/jobs/{job_id}/")
async def get_job(job_id: str, x_job_token: str | None = Header(default=None)):
    return JSONResponse(job_payload(require_job(job_id, x_job_token)), headers={"Cache-Control": "no-store"})


@app.get("/api/pdf-convert/jobs/{job_id}/download/")
async def download_job(job_id: str, x_job_token: str | None = Header(default=None)):
    job = require_job(job_id, x_job_token)
    if job.status != "ready" or not job.output_path.is_file():
        return error_response("CONVERSION_FAILED", 409)
    return FileResponse(job.output_path, media_type=job.output_mime, filename=job.output_name, headers={"Cache-Control": "no-store"}, background=BackgroundTask(remove_job, job_id))


@app.delete("/api/pdf-convert/jobs/{job_id}/", status_code=204)
async def delete_job(job_id: str, x_job_token: str | None = Header(default=None)):
    require_job(job_id, x_job_token)
    remove_job(job_id)
    return Response(status_code=204)
