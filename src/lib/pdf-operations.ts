import { PDFDocument } from "pdf-lib";

export const MAX_FILE_BYTES = 40 * 1024 * 1024;
export const MAX_TOTAL_BYTES = 100 * 1024 * 1024;
export const MAX_PAGES = 150;
export const MAX_RASTER_PAGES = 40;

export type PdfResult = { bytes: Uint8Array; filename: string; reduced?: boolean };
export type CompressionMethod = "structure" | "raster";
export type RasterQuality = "balanced" | "smaller";

export async function previewFirstPage(bytes: Uint8Array): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdfjs/pdf.worker.min.mjs";
  const loading = pdfjs.getDocument({
    data: bytes.slice(),
    cMapUrl: "/pdfjs/cmaps/",
    cMapPacked: true,
    standardFontDataUrl: "/pdfjs/standard_fonts/",
  });
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
    const pdfjs = await import("pdfjs-dist");
    pdfjs.GlobalWorkerOptions.workerSrc = "/pdfjs/pdf.worker.min.mjs";
    const loading = pdfjs.getDocument({
      data: original.slice(),
      cMapUrl: "/pdfjs/cmaps/",
      cMapPacked: true,
      standardFontDataUrl: "/pdfjs/standard_fonts/",
    });
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
        const imageBlob = await new Promise<Blob>((resolve, reject) => {
          canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("image-encoding-failed")), "image/jpeg", jpegQuality);
        });
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
