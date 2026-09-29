import assert from "node:assert/strict";
import test from "node:test";
import { unzipSync } from "fflate";
import { PDFDocument } from "pdf-lib";
import { addPageNumbers, compressPdf, cropPdf, fillPdfForm, flattenPdfForms, imagesToPdf, inspectPdfForm, linearizePdf, mergePdfs, parsePageRange, protectPdf, removePdfPages, reorderPdf, repairPdf, resizePdfPages, reversePdfPages, rotatePdf, scanImagesToPdf, splitPdf, unlockPdf } from "../src/lib/pdf-operations";

async function sampleFile(name: string, pageWidths: number[]): Promise<File> {
  const pdf = await PDFDocument.create();
  for (const width of pageWidths) pdf.addPage([width, 300]);
  return new File([new Uint8Array(await pdf.save())], name, { type: "application/pdf" });
}

test("parses page ranges, deduplicates, and rejects out-of-bounds pages", () => {
  assert.deepEqual(parsePageRange("3, 1-2，2", 4), [0, 1, 2]);
  for (const input of ["", "0", "5", "3-2", "1,,2", "x", "1-5"]) {
    assert.throws(() => parsePageRange(input, 4));
  }
});

test("merges PDFs in the chosen file order", async () => {
  const first = await sampleFile("first.pdf", [101, 102]);
  const second = await sampleFile("second.pdf", [203]);
  const result = await mergePdfs([second, first]);
  const merged = await PDFDocument.load(result.bytes);
  assert.equal(result.filename, "merged.pdf");
  assert.deepEqual(merged.getPages().map((page) => page.getWidth()), [203, 101, 102]);
});

test("extracts selected pages and packages separate pages into a ZIP", async () => {
  const source = await sampleFile("source.pdf", [101, 102, 103]);
  const selected = await splitPdf(source, [0, 2], false);
  const extracted = await PDFDocument.load(selected.bytes);
  assert.deepEqual(extracted.getPages().map((page) => page.getWidth()), [101, 103]);

  const separate = await splitPdf(source, [0, 2], true);
  const zip = unzipSync(separate.bytes);
  assert.deepEqual(Object.keys(zip).sort(), ["page-001.pdf", "page-003.pdf"]);
  assert.equal((await PDFDocument.load(zip["page-003.pdf"])).getPage(0).getWidth(), 103);
});

test("structure compression never replaces a file with a larger result", async () => {
  const source = await sampleFile("source.pdf", [101]);
  const result = await compressPdf(source, "structure", "balanced");
  assert.ok(result.bytes.byteLength <= source.size);
  assert.equal((await PDFDocument.load(result.bytes)).getPageCount(), 1);
});

test("removes selected pages but keeps at least one", async () => {
  const source = await sampleFile("source.pdf", [101, 102, 103, 104]);
  const result = await removePdfPages(source, [1, 3]);
  const remaining = await PDFDocument.load(result.bytes);
  assert.deepEqual(remaining.getPages().map((page) => page.getWidth()), [101, 103]);
  await assert.rejects(removePdfPages(source, [0, 1, 2, 3]), /cannot-remove-all/);
});

test("rotates each page relative to its current orientation", async () => {
  const source = await sampleFile("source.pdf", [101, 102]);
  const first = await rotatePdf(source, 90);
  const second = await rotatePdf(new File([new Uint8Array(first.bytes)], "rotated.pdf"), -90);
  const restored = await PDFDocument.load(second.bytes);
  assert.deepEqual(restored.getPages().map((page) => page.getRotation().angle), [0, 0]);
});

test("reorders every page using an exact permutation", async () => {
  const source = await sampleFile("source.pdf", [101, 202, 303]);
  const result = await reorderPdf(source, [2, 0, 1]);
  const organized = await PDFDocument.load(result.bytes);
  assert.deepEqual(organized.getPages().map((page) => page.getWidth()), [303, 101, 202]);
  await assert.rejects(reorderPdf(source, [0, 0, 1]), /invalid-order/);
});

test("creates one PDF page per input image", async () => {
  const png = Uint8Array.from(Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64"));
  const first = new File([png], "first.png", { type: "image/png" });
  const second = new File([png], "second.png", { type: "image/png" });
  const result = await imagesToPdf([first, second]);
  assert.equal(result.filename, "images.pdf");
  assert.equal((await PDFDocument.load(result.bytes)).getPageCount(), 2);
});

test("adds consecutive page numbers without changing the page count", async () => {
  const source = await sampleFile("source.pdf", [101, 102, 103]);
  const result = await addPageNumbers(source, "bottom-right", 7);
  assert.equal(result.filename, "numbered.pdf");
  assert.equal((await PDFDocument.load(result.bytes)).getPageCount(), 3);
  assert.ok(result.bytes.byteLength > source.size);
});

test("crops every page with independent edge margins", async () => {
  const source = await sampleFile("source.pdf", [300, 400]);
  const result = await cropPdf(source, { top: 20, right: 30, bottom: 40, left: 10 });
  const cropped = await PDFDocument.load(result.bytes);
  assert.deepEqual(cropped.getPages().map((page) => {
    const box = page.getCropBox();
    return [box.x, box.y, box.width, box.height];
  }), [[10, 40, 260, 240], [10, 40, 360, 240]]);
  await assert.rejects(cropPdf(source, { top: 160, right: 0, bottom: 160, left: 0 }), /invalid-crop/);
});

test("rebuilds PDFs and names camera-image output for scanning", async () => {
  const source = await sampleFile("source.pdf", [101, 202]);
  const repaired = await repairPdf(source);
  assert.equal(repaired.filename, "repaired.pdf");
  assert.deepEqual((await PDFDocument.load(repaired.bytes)).getPages().map((page) => page.getWidth()), [101, 202]);

  const png = Uint8Array.from(Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=", "base64"));
  const scanned = await scanImagesToPdf([new File([png], "scan.png", { type: "image/png" })]);
  assert.equal(scanned.filename, "scanned-pages.pdf");
  assert.equal((await PDFDocument.load(scanned.bytes)).getPageCount(), 1);
});

test("reverses pages and resizes portrait and landscape pages", async () => {
  const source = await sampleFile("source.pdf", [101, 400]);
  const reversed = await reversePdfPages(source);
  assert.deepEqual((await PDFDocument.load(reversed.bytes)).getPages().map((page) => page.getWidth()), [400, 101]);

  const resized = await resizePdfPages(source, "a4");
  const sizes = (await PDFDocument.load(resized.bytes)).getPages().map((page) => [page.getWidth(), page.getHeight()].map(Math.round));
  assert.deepEqual(sizes, [[595, 842], [842, 595]]);
});

test("flattens interactive form fields into page content", async () => {
  const document = await PDFDocument.create();
  const page = document.addPage([300, 300]);
  const field = document.getForm().createTextField("customer.name");
  field.addToPage(page, { x: 20, y: 220, width: 180, height: 30 });
  field.setText("Ada Lovelace");
  const source = new File([new Uint8Array(await document.save())], "form.pdf", { type: "application/pdf" });
  const result = await flattenPdfForms(source);
  const flattened = await PDFDocument.load(result.bytes);
  assert.equal(flattened.getForm().getFields().length, 0);
  assert.equal(flattened.getPageCount(), 1);
});

test("inspects and fills standard AcroForm fields", async () => {
  const document = await PDFDocument.create();
  const page = document.addPage([300, 300]);
  const form = document.getForm();
  const name = form.createTextField("customer.name");
  name.addToPage(page, { x: 20, y: 220, width: 180, height: 30 });
  const subscribed = form.createCheckBox("customer.subscribed");
  subscribed.addToPage(page, { x: 20, y: 170, width: 20, height: 20 });
  const source = new File([new Uint8Array(await document.save())], "form.pdf", { type: "application/pdf" });

  assert.deepEqual(await inspectPdfForm(source), [
    { name: "customer.name", type: "text", value: "" },
    { name: "customer.subscribed", type: "checkbox", value: false },
  ]);

  const result = await fillPdfForm(source, { "customer.name": "Ada Lovelace", "customer.subscribed": true });
  const filled = await PDFDocument.load(result.bytes);
  assert.equal(filled.getForm().getTextField("customer.name").getText(), "Ada Lovelace");
  assert.equal(filled.getForm().getCheckBox("customer.subscribed").isChecked(), true);
});

test("encrypts with AES-256 and decrypts with the supplied password", async () => {
  const source = await sampleFile("source.pdf", [101, 202]);
  const protectedResult = await protectPdf(source, "open-secret", "owner-secret", true);
  const protectedText = Buffer.from(protectedResult.bytes).toString("latin1");
  const encryptedBuffer = protectedResult.bytes.buffer.slice(protectedResult.bytes.byteOffset, protectedResult.bytes.byteOffset + protectedResult.bytes.byteLength) as ArrayBuffer;
  assert.match(protectedText, /\/Encrypt/);
  await assert.rejects(PDFDocument.load(protectedResult.bytes), /encrypted/i);
  await assert.rejects(unlockPdf(new File([encryptedBuffer], "protected.pdf", { type: "application/pdf" }), "wrong-secret"));

  const unlocked = await unlockPdf(new File([encryptedBuffer], "protected.pdf", { type: "application/pdf" }), "open-secret");
  assert.equal((await PDFDocument.load(unlocked.bytes)).getPageCount(), 2);
});

test("linearizes a PDF for fast web view without changing its pages", async () => {
  const source = await sampleFile("source.pdf", [101, 202, 303]);
  const result = await linearizePdf(source);
  assert.match(Buffer.from(result.bytes.subarray(0, 1024)).toString("latin1"), /\/Linearized/);
  assert.equal((await PDFDocument.load(result.bytes)).getPageCount(), 3);
});

import sitemap from "../src/app/sitemap";
import { PDF_COPY, PDF_LOCALES, PDF_TOOLS, pdfUrl } from "../src/lib/pdf-tools";

test("registers 31 localized PDF tools including Word conversion", () => {
  assert.equal(PDF_TOOLS.length, 31);
  assert.ok(PDF_TOOLS.includes("pdf-to-word"));
  assert.ok(PDF_TOOLS.includes("word-to-pdf"));
  for (const locale of PDF_LOCALES) {
    assert.ok(PDF_COPY[locale].toolsCopy["pdf-to-word"].title);
    assert.ok(PDF_COPY[locale].toolsCopy["word-to-pdf"].title);
  }
});

test("sitemap exposes all six localized Word conversion pages", () => {
  const urls = new Set(sitemap().map((entry) => entry.url));
  for (const locale of PDF_LOCALES) {
    for (const tool of ["pdf-to-word", "word-to-pdf"] as const) {
      assert.ok(urls.has(`https://zensoft.top${pdfUrl(locale, tool)}`));
    }
  }
});
