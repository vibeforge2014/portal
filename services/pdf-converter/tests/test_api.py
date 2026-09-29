import asyncio
import io
import tempfile
import unittest
from pathlib import Path

import fitz
from fastapi.testclient import TestClient

import app as converter


def pdf_bytes(pages: int = 1, password: str | None = None) -> bytes:
    document = fitz.open()
    for _ in range(pages):
        document.new_page().insert_text((72, 72), "Editable test text")
    options = {}
    if password:
        options = {
            "encryption": fitz.PDF_ENCRYPT_AES_256,
            "owner_pw": password,
            "user_pw": password,
        }
    data = document.tobytes(**options)
    document.close()
    return data


class ApiTests(unittest.TestCase):
    def setUp(self):
        self.temporary = tempfile.TemporaryDirectory()
        converter.JOB_ROOT = Path(self.temporary.name)
        converter.jobs.clear()
        converter.queue = asyncio.Queue(maxsize=converter.QUEUE_CAPACITY)
        self.client = TestClient(converter.app)

    def tearDown(self):
        self.client.close()
        self.temporary.cleanup()

    def create_pdf_job(self, data: bytes | None = None):
        return self.client.post(
            "/api/pdf-convert/jobs/",
            data={"operation": "pdf-to-word", "locale": "en"},
            files={"file": ("document.pdf", io.BytesIO(data or pdf_bytes()), "application/pdf")},
        )

    def test_job_token_status_and_delete(self):
        created = self.create_pdf_job()
        self.assertEqual(created.status_code, 202)
        payload = created.json()
        url = f"/api/pdf-convert/jobs/{payload['jobId']}/"
        self.assertEqual(self.client.get(url).status_code, 410)
        status = self.client.get(url, headers={"X-Job-Token": payload["token"]})
        self.assertEqual(status.status_code, 200)
        self.assertEqual(status.json()["status"], "queued")
        self.assertEqual(self.client.delete(url, headers={"X-Job-Token": payload["token"]}).status_code, 204)
        self.assertEqual(self.client.get(url, headers={"X-Job-Token": payload["token"]}).status_code, 410)

    def test_rejects_fake_encrypted_and_long_pdfs(self):
        fake = self.create_pdf_job(b"not a pdf")
        self.assertEqual((fake.status_code, fake.json()["error"]["code"]), (415, "INVALID_TYPE"))
        encrypted = self.create_pdf_job(pdf_bytes(password="secret"))
        self.assertEqual((encrypted.status_code, encrypted.json()["error"]["code"]), (422, "ENCRYPTED_PDF"))
        long_pdf = self.create_pdf_job(pdf_bytes(pages=61))
        self.assertEqual((long_pdf.status_code, long_pdf.json()["error"]["code"]), (422, "PAGE_LIMIT_EXCEEDED"))

    def test_rejects_oversized_upload(self):
        response = self.create_pdf_job(b"%PDF-" + b"0" * converter.MAX_FILE_BYTES)
        self.assertEqual((response.status_code, response.json()["error"]["code"]), (413, "FILE_TOO_LARGE"))


if __name__ == "__main__":
    unittest.main()
