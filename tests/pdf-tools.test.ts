import assert from "node:assert/strict";
import test from "node:test";
import { unzipSync } from "fflate";
import { PDFDocument } from "pdf-lib";
import { addPageNumbers, compressPdf, imagesToPdf, mergePdfs, parsePageRange, removePdfPages, reorderPdf, rotatePdf, splitPdf } from "../src/lib/pdf-operations";

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
