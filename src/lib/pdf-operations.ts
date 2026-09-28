import { PDFDocument, StandardFonts, degrees, rgb } from "pdf-lib";

export const MAX_FILE_BYTES = 40 * 1024 * 1024;
export const MAX_TOTAL_BYTES = 100 * 1024 * 1024;
export const MAX_PAGES = 150;
export const MAX_RASTER_PAGES = 40;
export const MAX_ORGANIZE_PAGES = 60;

export type PdfResult = { bytes: Uint8Array; filename: string; reduced?: boolean };
export type CompressionMethod = "structure" | "raster";
export type RasterQuality = "balanced" | "smaller";
export type JpgQuality = "balanced" | "high";
export type PageNumberPosition = "bottom-center" | "bottom-right" | "top-right";
export type CropMargins = { top: number; right: number; bottom: number; left: number };

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("image-encoding-failed")), type, quality);
  });
}

async function loadPdfForRendering(bytes: Uint8Array) {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdfjs/pdf.worker.min.mjs";
  return pdfjs.getDocument({
    data: bytes.slice(),
    cMapUrl: "/pdfjs/cmaps/",
    cMapPacked: true,
    standardFontDataUrl: "/pdfjs/standard_fonts/",
  });
}

export async function previewFirstPage(bytes: Uint8Array): Promise<string> {
  const loading = await loadPdfForRendering(bytes);
  try {
    const document = await loading.promise;
    const page = await document.getPage(1);
    const natural = page.getViewport({ scale: 1 });
    const viewport = page.getViewport({ scale: Math.min(1, 360 / natural.width) });
    const canvas = window.document.createElement("canvas");
    canvas.width = Math.max(1, Math.floor(viewport.width));
    canvas.height = Math.max(1, Math.floor(viewport.height));
    const context = canvas.getContext("2d", { alpha: false });
    if (!context) throw new Error("canvas-unavailable");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    await page.render({ canvas, canvasContext: context, viewport }).promise;
    const image = canvas.toDataURL("image/jpeg", 0.8);
    canvas.width = 0;
    canvas.height = 0;
    page.cleanup();
    return image;
  } finally {
    await loading.destroy();
  }
}

export async function renderPdfThumbnails(file: File): Promise<string[]> {
  const loading = await loadPdfForRendering(new Uint8Array(await file.arrayBuffer()));
  try {
    const source = await loading.promise;
    if (source.numPages > MAX_ORGANIZE_PAGES) throw new Error("too-many-pages");
    const thumbnails: string[] = [];
    for (let index = 1; index <= source.numPages; index += 1) {
      const page = await source.getPage(index);
      const natural = page.getViewport({ scale: 1 });
      const viewport = page.getViewport({ scale: Math.min(0.45, 150 / natural.width) });
      const canvas = window.document.createElement("canvas");
      canvas.width = Math.max(1, Math.floor(viewport.width));
      canvas.height = Math.max(1, Math.floor(viewport.height));
      const context = canvas.getContext("2d", { alpha: false });
      if (!context) throw new Error("canvas-unavailable");
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvas, canvasContext: context, viewport }).promise;
      thumbnails.push(canvas.toDataURL("image/jpeg", 0.72));
      canvas.width = 0;
      canvas.height = 0;
      page.cleanup();
    }
    return thumbnails;
  } finally {
    await loading.destroy();
  }
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function parsePageRange(input: string, pageCount: number): number[] {
  if (!input.trim() || !Number.isInteger(pageCount) || pageCount < 1) throw new Error("invalid-range");
  const selected = new Set<number>();
  for (const rawPart of input.replaceAll("，", ",").split(",")) {
    const part = rawPart.trim();
    const match = /^(\d+)(?:\s*[-–]\s*(\d+))?$/.exec(part);
    if (!match) throw new Error("invalid-range");
    const start = Number(match[1]);
    const end = match[2] ? Number(match[2]) : start;
    if (start < 1 || end < start || end > pageCount) throw new Error("invalid-range");
    for (let page = start; page <= end; page += 1) selected.add(page - 1);
  }
  if (selected.size === 0) throw new Error("invalid-range");
  return [...selected].sort((a, b) => a - b);
}

export async function inspectPdf(file: File): Promise<number> {
  const document = await PDFDocument.load(await file.arrayBuffer());
  return document.getPageCount();
}

export async function mergePdfs(files: File[], onProgress?: (done: number, total: number) => void): Promise<PdfResult> {
  const output = await PDFDocument.create();
  for (let index = 0; index < files.length; index += 1) {
    const source = await PDFDocument.load(await files[index].arrayBuffer());
    const copied = await output.copyPages(source, source.getPageIndices());
    copied.forEach((page) => output.addPage(page));
    onProgress?.(index + 1, files.length);
  }
  const bytes = await output.save({ useObjectStreams: true });
  return { bytes, filename: "merged.pdf" };
}

export async function splitPdf(file: File, pageNumbers: number[], eachPage: boolean, onProgress?: (done: number, total: number) => void): Promise<PdfResult> {
  const source = await PDFDocument.load(await file.arrayBuffer());
  if (pageNumbers.length === 0 || pageNumbers.some((page) => page < 0 || page >= source.getPageCount())) throw new Error("invalid-range");

  if (!eachPage) {
    const output = await PDFDocument.create();
    const copied = await output.copyPages(source, pageNumbers);
    copied.forEach((page) => output.addPage(page));
    onProgress?.(pageNumbers.length, pageNumbers.length);
    return { bytes: await output.save({ useObjectStreams: true }), filename: "extracted-pages.pdf" };
  }

  const entries: Record<string, Uint8Array> = {};
  for (let index = 0; index < pageNumbers.length; index += 1) {
    const output = await PDFDocument.create();
    const [page] = await output.copyPages(source, [pageNumbers[index]]);
    output.addPage(page);
    entries[`page-${String(pageNumbers[index] + 1).padStart(3, "0")}.pdf`] = await output.save({ useObjectStreams: true });
    onProgress?.(index + 1, pageNumbers.length);
  }
  const { zipSync } = await import("fflate");
  return { bytes: zipSync(entries, { level: 0 }), filename: "split-pages.zip" };
}

export async function removePdfPages(file: File, pageNumbers: number[], onProgress?: (done: number, total: number) => void): Promise<PdfResult> {
  const document = await PDFDocument.load(await file.arrayBuffer());
  const count = document.getPageCount();
  if (pageNumbers.length === 0 || pageNumbers.some((page) => page < 0 || page >= count)) throw new Error("invalid-range");
  const toRemove = [...new Set(pageNumbers)].sort((a, b) => b - a);
  if (toRemove.length >= count) throw new Error("cannot-remove-all");
  toRemove.forEach((page, index) => {
    document.removePage(page);
    onProgress?.(index + 1, toRemove.length);
  });
  return { bytes: await document.save({ useObjectStreams: true }), filename: "pages-removed.pdf" };
}

export async function rotatePdf(file: File, direction: 90 | -90, onProgress?: (done: number, total: number) => void): Promise<PdfResult> {
  const document = await PDFDocument.load(await file.arrayBuffer());
  const pages = document.getPages();
  pages.forEach((page, index) => {
    page.setRotation(degrees((page.getRotation().angle + direction + 360) % 360));
    onProgress?.(index + 1, pages.length);
  });
  return { bytes: await document.save({ useObjectStreams: true }), filename: "rotated.pdf" };
}

export async function reorderPdf(file: File, pageOrder: number[], onProgress?: (done: number, total: number) => void): Promise<PdfResult> {
  const source = await PDFDocument.load(await file.arrayBuffer());
  const count = source.getPageCount();
  if (pageOrder.length !== count || new Set(pageOrder).size !== count || pageOrder.some((page) => page < 0 || page >= count)) {
    throw new Error("invalid-order");
  }
  const output = await PDFDocument.create();
  const copied = await output.copyPages(source, pageOrder);
  copied.forEach((page, index) => {
    output.addPage(page);
    onProgress?.(index + 1, copied.length);
  });
  return { bytes: await output.save({ useObjectStreams: true }), filename: "organized.pdf" };
}

export async function imagesToPdf(files: File[], onProgress?: (done: number, total: number) => void): Promise<PdfResult> {
  if (files.length === 0) throw new Error("need-file");
  const output = await PDFDocument.create();
  for (let index = 0; index < files.length; index += 1) {
    const file = files[index];
    const bytes = await file.arrayBuffer();
    const isPng = file.type === "image/png" || file.name.toLowerCase().endsWith(".png");
    const image = isPng ? await output.embedPng(bytes) : await output.embedJpg(bytes);
    const landscape = image.width > image.height;
    const pageWidth = landscape ? 842 : 595;
    const pageHeight = landscape ? 595 : 842;
    const margin = 24;
    const scale = Math.min((pageWidth - margin * 2) / image.width, (pageHeight - margin * 2) / image.height, 1);
    const width = image.width * scale;
    const height = image.height * scale;
    const page = output.addPage([pageWidth, pageHeight]);
    page.drawImage(image, { x: (pageWidth - width) / 2, y: (pageHeight - height) / 2, width, height });
    onProgress?.(index + 1, files.length);
  }
  return { bytes: await output.save({ useObjectStreams: true }), filename: "images.pdf" };
}

export async function scanImagesToPdf(files: File[], onProgress?: (done: number, total: number) => void): Promise<PdfResult> {
  const result = await imagesToPdf(files, onProgress);
  return { ...result, filename: "scanned-pages.pdf" };
}

export async function pdfToJpg(file: File, quality: JpgQuality, onProgress?: (done: number, total: number) => void): Promise<PdfResult> {
  const loading = await loadPdfForRendering(new Uint8Array(await file.arrayBuffer()));
  try {
    const source = await loading.promise;
    if (source.numPages > MAX_RASTER_PAGES) throw new Error("too-many-pages");
    const entries: Record<string, Uint8Array> = {};
    const scale = quality === "high" ? 2 : 1.45;
    const jpegQuality = quality === "high" ? 0.92 : 0.82;
    for (let index = 1; index <= source.numPages; index += 1) {
      const page = await source.getPage(index);
      const natural = page.getViewport({ scale: 1 });
      const maxScale = Math.sqrt(5_000_000 / (natural.width * natural.height));
      const viewport = page.getViewport({ scale: Math.min(scale, maxScale) });
      const canvas = window.document.createElement("canvas");
      canvas.width = Math.max(1, Math.floor(viewport.width));
      canvas.height = Math.max(1, Math.floor(viewport.height));
      const context = canvas.getContext("2d", { alpha: false });
      if (!context) throw new Error("canvas-unavailable");
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvas, canvasContext: context, viewport }).promise;
      entries[`page-${String(index).padStart(3, "0")}.jpg`] = new Uint8Array(await (await canvasToBlob(canvas, "image/jpeg", jpegQuality)).arrayBuffer());
      canvas.width = 0;
      canvas.height = 0;
      page.cleanup();
      onProgress?.(index, source.numPages);
    }
    const { zipSync } = await import("fflate");
    return { bytes: zipSync(entries, { level: 0 }), filename: "pdf-pages-jpg.zip" };
  } finally {
    await loading.destroy();
  }
}

export async function pdfToPng(file: File, quality: JpgQuality, onProgress?: (done: number, total: number) => void): Promise<PdfResult> {
  const loading = await loadPdfForRendering(new Uint8Array(await file.arrayBuffer()));
  try {
    const source = await loading.promise;
    if (source.numPages > MAX_RASTER_PAGES) throw new Error("too-many-pages");
    const entries: Record<string, Uint8Array> = {};
    const scale = quality === "high" ? 2 : 1.45;
    for (let index = 1; index <= source.numPages; index += 1) {
      const page = await source.getPage(index);
      const natural = page.getViewport({ scale: 1 });
      const maxScale = Math.sqrt(5_000_000 / (natural.width * natural.height));
      const viewport = page.getViewport({ scale: Math.min(scale, maxScale) });
      const canvas = window.document.createElement("canvas");
      canvas.width = Math.max(1, Math.floor(viewport.width));
      canvas.height = Math.max(1, Math.floor(viewport.height));
      const context = canvas.getContext("2d", { alpha: false });
      if (!context) throw new Error("canvas-unavailable");
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      await page.render({ canvas, canvasContext: context, viewport }).promise;
      entries[`page-${String(index).padStart(3, "0")}.png`] = new Uint8Array(await (await canvasToBlob(canvas, "image/png")).arrayBuffer());
      canvas.width = 0;
      canvas.height = 0;
      page.cleanup();
      onProgress?.(index, source.numPages);
    }
    const { zipSync } = await import("fflate");
    return { bytes: zipSync(entries, { level: 0 }), filename: "pdf-pages-png.zip" };
  } finally {
    await loading.destroy();
  }
}

async function extractTextPages(file: File, onProgress?: (done: number, total: number) => void): Promise<string[]> {
  const loading = await loadPdfForRendering(new Uint8Array(await file.arrayBuffer()));
  try {
    const source = await loading.promise;
    const pages: string[] = [];
    for (let index = 1; index <= source.numPages; index += 1) {
      const page = await source.getPage(index);
      const content = await page.getTextContent();
      const text = content.items
        .map((item) => "str" in item ? item.str : "")
        .join(" ")
        .replace(/\s+/g, " ")
        .trim();
      pages.push(text);
      page.cleanup();
      onProgress?.(index, source.numPages);
    }
    return pages;
  } finally {
    await loading.destroy();
  }
}

export async function pdfToText(file: File, onProgress?: (done: number, total: number) => void): Promise<PdfResult> {
  const pages = await extractTextPages(file, onProgress);
  const text = pages.map((page, index) => `--- Page ${index + 1} ---\n${page}`).join("\n\n");
  return { bytes: new TextEncoder().encode(text), filename: "extracted-text.txt" };
}

export async function comparePdfText(first: File, second: File, onProgress?: (done: number, total: number) => void): Promise<PdfResult> {
  const firstPages = await extractTextPages(first, (done, total) => onProgress?.(done, total * 2));
  const secondPages = await extractTextPages(second, (done) => onProgress?.(firstPages.length + done, firstPages.length + Math.max(firstPages.length, done)));
  const pageCount = Math.max(firstPages.length, secondPages.length);
  const changed: number[] = [];
  for (let index = 0; index < pageCount; index += 1) {
    if ((firstPages[index] ?? "") !== (secondPages[index] ?? "")) changed.push(index);
  }
  const details = changed.slice(0, 20).map((index) => [
    `=== Page ${index + 1} ===`,
    `A: ${(firstPages[index] ?? "[missing page]").slice(0, 1200)}`,
    `B: ${(secondPages[index] ?? "[missing page]").slice(0, 1200)}`,
  ].join("\n")).join("\n\n");
  const report = [
    "PDF text comparison",
    `File A: ${first.name}`,
    `File B: ${second.name}`,
    `Pages: ${firstPages.length} / ${secondPages.length}`,
    `Different pages: ${changed.length ? changed.map((page) => page + 1).join(", ") : "none"}`,
    changed.length > 20 ? `Detailed excerpts are limited to the first 20 of ${changed.length} changed pages.` : "",
    details,
  ].filter(Boolean).join("\n\n");
  return { bytes: new TextEncoder().encode(report), filename: "pdf-comparison.txt" };
}

export async function repairPdf(file: File, onProgress?: (done: number, total: number) => void): Promise<PdfResult> {
  const source = await PDFDocument.load(await file.arrayBuffer(), { updateMetadata: false });
  const output = await PDFDocument.create();
  const pages = await output.copyPages(source, source.getPageIndices());
  pages.forEach((page, index) => {
    output.addPage(page);
    onProgress?.(index + 1, pages.length);
  });
  return { bytes: await output.save({ useObjectStreams: true }), filename: "repaired.pdf" };
}

export async function cropPdf(file: File, margins: CropMargins, onProgress?: (done: number, total: number) => void): Promise<PdfResult> {
  const document = await PDFDocument.load(await file.arrayBuffer());
  const pages = document.getPages();
  pages.forEach((page, index) => {
    const { width, height } = page.getSize();
    const left = Math.max(0, margins.left);
    const right = Math.max(0, margins.right);
    const top = Math.max(0, margins.top);
    const bottom = Math.max(0, margins.bottom);
    if (left + right >= width - 10 || top + bottom >= height - 10) throw new Error("invalid-crop");
    page.setCropBox(left, bottom, width - left - right, height - top - bottom);
    onProgress?.(index + 1, pages.length);
  });
  return { bytes: await document.save({ useObjectStreams: true }), filename: "cropped.pdf" };
}

export async function addPageNumbers(
  file: File,
  position: PageNumberPosition,
  startAt: number,
  onProgress?: (done: number, total: number) => void,
): Promise<PdfResult> {
  const document = await PDFDocument.load(await file.arrayBuffer());
  const font = await document.embedFont(StandardFonts.Helvetica);
  const pages = document.getPages();
  pages.forEach((page, index) => {
    const label = String(startAt + index);
    const size = 10;
    const width = font.widthOfTextAtSize(label, size);
    const x = position === "bottom-center" ? (page.getWidth() - width) / 2 : page.getWidth() - width - 24;
    const y = position === "top-right" ? page.getHeight() - 30 : 22;
    page.drawText(label, { x, y, size, font, color: rgb(0.25, 0.25, 0.28), opacity: 0.85 });
    onProgress?.(index + 1, pages.length);
  });
  return { bytes: await document.save({ useObjectStreams: true }), filename: "numbered.pdf" };
}

async function createWatermarkImage(text: string): Promise<{ bytes: Uint8Array; width: number; height: number }> {
  const canvas = window.document.createElement("canvas");
  const context = canvas.getContext("2d");
  if (!context) throw new Error("canvas-unavailable");
  context.font = '600 72px -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif';
  const measured = Math.ceil(context.measureText(text).width);
  canvas.width = Math.max(180, measured + 56);
  canvas.height = 116;
  context.font = '600 72px -apple-system, BlinkMacSystemFont, "PingFang SC", "Microsoft YaHei", sans-serif';
  context.fillStyle = "#20232a";
  context.textAlign = "center";
  context.textBaseline = "middle";
  context.fillText(text, canvas.width / 2, canvas.height / 2);
  const blob = await canvasToBlob(canvas, "image/png");
  return { bytes: new Uint8Array(await blob.arrayBuffer()), width: canvas.width, height: canvas.height };
}

export async function addWatermark(
  file: File,
  text: string,
  opacity: number,
  onProgress?: (done: number, total: number) => void,
): Promise<PdfResult> {
  const value = text.trim();
  if (!value) throw new Error("missing-watermark");
  const document = await PDFDocument.load(await file.arrayBuffer());
  const sourceImage = await createWatermarkImage(value);
  const image = await document.embedPng(sourceImage.bytes);
  const pages = document.getPages();
  pages.forEach((page, index) => {
    const width = Math.min(page.getWidth() * 0.58, 390);
    const height = width * (sourceImage.height / sourceImage.width);
    const angle = 30;
    const radians = angle * Math.PI / 180;
    const rotatedWidth = width * Math.cos(radians) + height * Math.sin(radians);
    const rotatedHeight = height * Math.cos(radians) + width * Math.sin(radians);
    page.drawImage(image, {
      x: (page.getWidth() - rotatedWidth) / 2 + height * Math.sin(radians),
      y: (page.getHeight() - rotatedHeight) / 2,
      width,
      height,
      opacity: Math.min(0.65, Math.max(0.08, opacity)),
      rotate: degrees(angle),
    });
    onProgress?.(index + 1, pages.length);
  });
  return { bytes: await document.save({ useObjectStreams: true }), filename: "watermarked.pdf" };
}

export async function compressPdf(
  file: File,
  method: CompressionMethod,
  quality: RasterQuality,
  onProgress?: (done: number, total: number) => void,
): Promise<PdfResult> {
  const original = new Uint8Array(await file.arrayBuffer());
  let bytes: Uint8Array;

  if (method === "structure") {
    const document = await PDFDocument.load(original);
    bytes = await document.save({ useObjectStreams: true });
    onProgress?.(document.getPageCount(), document.getPageCount());
  } else {
    const loading = await loadPdfForRendering(original);
    const source = await loading.promise;
    if (source.numPages > MAX_RASTER_PAGES) {
      await loading.destroy();
      throw new Error("too-many-pages");
    }
    const output = await PDFDocument.create();
    const dpi = quality === "balanced" ? 135 : 100;
    const jpegQuality = quality === "balanced" ? 0.78 : 0.62;
    try {
      for (let index = 1; index <= source.numPages; index += 1) {
        const page = await source.getPage(index);
        const pageSize = page.getViewport({ scale: 1 });
        const maxScale = Math.sqrt(4_000_000 / (pageSize.width * pageSize.height));
        const scale = Math.min(dpi / 72, maxScale);
        const viewport = page.getViewport({ scale });
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.floor(viewport.width));
        canvas.height = Math.max(1, Math.floor(viewport.height));
        const context = canvas.getContext("2d", { alpha: false });
        if (!context) throw new Error("canvas-unavailable");
        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, canvas.width, canvas.height);
        await page.render({ canvas, canvasContext: context, viewport }).promise;
        const imageBlob = await canvasToBlob(canvas, "image/jpeg", jpegQuality);
        const image = await output.embedJpg(await imageBlob.arrayBuffer());
        const outPage = output.addPage([pageSize.width, pageSize.height]);
        outPage.drawImage(image, { x: 0, y: 0, width: pageSize.width, height: pageSize.height });
        canvas.width = 0;
        canvas.height = 0;
        page.cleanup();
        onProgress?.(index, source.numPages);
      }
      bytes = await output.save({ useObjectStreams: true });
    } finally {
      await loading.destroy();
    }
  }

  const reduced = bytes.byteLength < original.byteLength;
  return {
    bytes: reduced ? bytes : original,
    filename: reduced ? "compressed.pdf" : file.name,
    reduced,
  };
}
