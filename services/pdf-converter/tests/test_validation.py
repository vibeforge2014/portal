import hashlib
import tempfile
import unittest
import zipfile
from pathlib import Path

import fitz

from app import Job, safe_stem, token_matches, validate_pdf, validate_word


class ValidationTests(unittest.TestCase):
    def test_accepts_real_docx_and_rejects_renamed_zip(self):
        with tempfile.TemporaryDirectory() as directory:
            valid = Path(directory) / "valid.docx"
            with zipfile.ZipFile(valid, "w") as archive:
                archive.writestr("[Content_Types].xml", "<Types/>")
                archive.writestr("word/document.xml", "<document/>")
            validate_word(valid, ".docx")

            invalid = Path(directory) / "invalid.docx"
            with zipfile.ZipFile(invalid, "w") as archive:
                archive.writestr("readme.txt", "not a Word document")
            with self.assertRaises(Exception):
                validate_word(invalid, ".docx")

    def test_accepts_legacy_doc_signature(self):
        with tempfile.TemporaryDirectory() as directory:
            path = Path(directory) / "legacy.doc"
            path.write_bytes(bytes.fromhex("D0CF11E0A1B11AE1") + b"payload")
            validate_word(path, ".doc")

    def test_pdf_page_limit(self):
        with tempfile.TemporaryDirectory() as directory:
            valid = Path(directory) / "valid.pdf"
            document = fitz.open()
            document.new_page()
            document.save(valid)
            document.close()
            self.assertEqual(validate_pdf(valid), 1)

            too_long = Path(directory) / "too-long.pdf"
            document = fitz.open()
            for _ in range(61):
                document.new_page()
            document.save(too_long)
            document.close()
            with self.assertRaises(Exception):
                validate_pdf(too_long)

    def test_tokens_and_output_names(self):
        token = "secret-token"
        job = Job("id", hashlib.sha256(token.encode()).digest(), "pdf-to-word", "en", Path("input.pdf"), Path("output.docx"), "output.docx", "application/docx", 1)
        self.assertTrue(token_matches(job, token))
        self.assertFalse(token_matches(job, "wrong"))
        self.assertEqual(safe_stem("../季度\x00报告.pdf"), "季度-报告")


if __name__ == "__main__":
    unittest.main()
