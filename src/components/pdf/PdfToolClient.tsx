"use client";

import { useEffect, useRef, useState } from "react";
import { PDF_COPY, type CorePdfTool, type PdfLocale } from "@/lib/pdf-tools";
import type { CompressionMethod, RasterQuality } from "@/lib/pdf-operations";

type SelectedFile = { id: string; file: File; pages: number };
type ReadyResult = { url: string; filename: string; size: number; originalSize: number; reduced?: boolean; previews?: { before: string; after: string } };

const MAX_FILE_BYTES = 40 * 1024 * 1024;
const MAX_TOTAL_BYTES = 100 * 1024 * 1024;
const MAX_PAGES = 150;

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function errorMessage(error: unknown, locale: PdfLocale): string {
  const copy = PDF_COPY[locale];
  if (error instanceof Error && error.message === "invalid-range") return copy.invalidRange;
  if (error instanceof Error && error.message === "cannot-remove-all") return copy.cannotRemoveAll;
  if (error instanceof Error && error.message === "too-many-pages") return copy.tooManyPages;
  return copy.processError;
}

export function PdfToolClient({ locale, tool }: { locale: PdfLocale; tool: CorePdfTool }) {
  const copy = PDF_COPY[locale];
  const inputRef = useRef<HTMLInputElement>(null);
  const resultUrlRef = useRef<string | null>(null);
  const [files, setFiles] = useState<SelectedFile[]>([]);
  const [pageRange, setPageRange] = useState("");
  const [splitEach, setSplitEach] = useState(false);
  const [method, setMethod] = useState<CompressionMethod>("structure");
  const [quality, setQuality] = useState<RasterQuality>("balanced");
  const [rotation, setRotation] = useState<90 | -90>(90);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ReadyResult | null>(null);

  useEffect(() => {
    document.documentElement.lang = locale === "en" ? "en" : locale === "zh-hant" ? "zh-Hant" : "zh-Hans";
    return () => { if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current); };
  }, [locale]);

  function clearResult() {
    if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
    resultUrlRef.current = null;
    setResult(null);
  }

  async function addFiles(incoming: FileList | File[]) {
    const candidates = Array.from(incoming);
    if (candidates.length === 0) return;
    setError(null);
    clearResult();
    const accepted = tool === "merge" ? candidates : candidates.slice(0, 1);
    if (accepted.some((file) => !file.name.toLowerCase().endsWith(".pdf") || file.size === 0)) {
      setError(copy.invalidPdf);
      return;
    }
    if (accepted.some((file) => file.size > MAX_FILE_BYTES) || accepted.reduce((sum, file) => sum + file.size, 0) + (tool === "merge" ? files.reduce((sum, item) => sum + item.file.size, 0) : 0) > MAX_TOTAL_BYTES) {
      setError(copy.tooLarge);
      return;
    }
    setBusy(true);
    try {
      const { inspectPdf } = await import("@/lib/pdf-operations");
      const inspected = await Promise.all(accepted.map(async (file) => {
        const pages = await inspectPdf(file);
        if (pages < 1 || pages > MAX_PAGES) throw new Error("too-many-pages");
        return { id: crypto.randomUUID(), file, pages };
      }));
      setFiles((current) => tool === "merge" ? [...current, ...inspected] : inspected);
      if (tool === "split" || tool === "remove-pages" || tool === "extract-pages") setPageRange("");
    } catch (cause) {
      setError(cause instanceof Error && cause.message === "too-many-pages" ? copy.tooManyPages : copy.invalidPdf);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function move(index: number, offset: number) {
    const next = [...files];
    const target = index + offset;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setFiles(next);
    clearResult();
  }

  async function process() {
    setError(null);
    clearResult();
    if (tool === "merge" && files.length < 2) { setError(copy.needTwoFiles); return; }
    if (tool !== "merge" && files.length === 0) { setError(copy.needFile); return; }
    setBusy(true);
    setProgress(copy.processing);
    try {
      const operations = await import("@/lib/pdf-operations");
      const update = (done: number, total: number) => setProgress(copy.progress(done, total));
      let output;
      if (tool === "merge") {
        output = await operations.mergePdfs(files.map((item) => item.file), update);
      } else if (tool === "split") {
        const pages = operations.parsePageRange(pageRange, files[0].pages);
        output = await operations.splitPdf(files[0].file, pages, splitEach, update);
      } else if (tool === "remove-pages") {
        const pages = operations.parsePageRange(pageRange, files[0].pages);
        output = await operations.removePdfPages(files[0].file, pages, update);
      } else if (tool === "extract-pages") {
        const pages = operations.parsePageRange(pageRange, files[0].pages);
        output = await operations.splitPdf(files[0].file, pages, false, update);
      } else if (tool === "rotate") {
        output = await operations.rotatePdf(files[0].file, rotation, update);
      } else {
        output = await operations.compressPdf(files[0].file, method, quality, update);
      }
      const mime = output.filename.endsWith(".zip") ? "application/zip" : "application/pdf";
      const url = URL.createObjectURL(new Blob([new Uint8Array(output.bytes)], { type: mime }));
      resultUrlRef.current = url;
      let previews: ReadyResult["previews"];
      if (tool === "compress") {
        try {
          const before = await operations.previewFirstPage(new Uint8Array(await files[0].file.arrayBuffer()));
          const after = output.reduced ? await operations.previewFirstPage(output.bytes) : before;
          previews = { before, after };
        } catch {
          // A preview failure must not prevent downloading a valid result.
        }
      }
      setResult({
        url,
        filename: output.filename,
        size: output.bytes.byteLength,
        originalSize: files.reduce((sum, item) => sum + item.file.size, 0),
        reduced: output.reduced,
        previews,
      });
    } catch (cause) {
      setError(errorMessage(cause, locale));
    } finally {
      setBusy(false);
      setProgress(null);
    }
  }

  return (
    <div className="pdf-workspace">
      <div className="pdf-work-main">
        <div className="pdf-work-heading">
          <h2>{copy.toolsCopy[tool].title}</h2>
          <p>{copy.toolsCopy[tool].description}</p>
        </div>

        <input
          ref={inputRef}
          className="pdf-visually-hidden"
          type="file"
          accept=".pdf,application/pdf"
          multiple={tool === "merge"}
          onChange={(event) => { void addFiles(event.target.files ?? []); }}
          aria-label={tool === "merge" ? copy.chooseFiles : copy.chooseFile}
        />
        <button
          type="button"
          className={`pdf-dropzone${dragging ? " pdf-dropzone--active" : ""}`}
          disabled={busy}
          onClick={() => inputRef.current?.click()}
          onDragEnter={(event) => { event.preventDefault(); setDragging(true); }}
          onDragOver={(event) => event.preventDefault()}
          onDragLeave={(event) => { event.preventDefault(); setDragging(false); }}
          onDrop={(event) => { event.preventDefault(); setDragging(false); void addFiles(event.dataTransfer.files); }}
        >
          <span className="pdf-upload-icon" aria-hidden>＋</span>
          <strong>{tool === "merge" ? copy.dropFiles : copy.dropFile}</strong>
          <span>{copy.pdfOnly}</span>
        </button>

        {files.length > 0 ? (
          <div className="pdf-files" aria-live="polite">
            <div className="pdf-files-heading">
              <span>{copy.fileCount(files.length)} · {formatBytes(files.reduce((sum, item) => sum + item.file.size, 0))}</span>
              <button type="button" onClick={() => { setFiles([]); clearResult(); setError(null); }} disabled={busy}>{copy.clearAll}</button>
            </div>
            <ol className="pdf-file-list">
              {files.map((item, index) => (
                <li key={item.id}>
                  <span className="pdf-file-glyph" aria-hidden><i /><i /><i /></span>
                  <span className="pdf-file-info"><strong title={item.file.name}>{item.file.name}</strong><small>{copy.pageCount(item.pages)} · {formatBytes(item.file.size)}</small></span>
                  <span className="pdf-file-actions">
                    {tool === "merge" ? <>
                      <button type="button" aria-label={`${copy.moveUp}: ${item.file.name}`} title={copy.moveUp} disabled={index === 0 || busy} onClick={() => move(index, -1)}>↑</button>
                      <button type="button" aria-label={`${copy.moveDown}: ${item.file.name}`} title={copy.moveDown} disabled={index === files.length - 1 || busy} onClick={() => move(index, 1)}>↓</button>
                    </> : null}
                    <button type="button" aria-label={`${copy.remove}: ${item.file.name}`} title={copy.remove} disabled={busy} onClick={() => { setFiles(files.filter((entry) => entry.id !== item.id)); clearResult(); }}>×</button>
                  </span>
                </li>
              ))}
            </ol>
          </div>
        ) : null}

        {(tool === "split" || tool === "remove-pages" || tool === "extract-pages") && files.length > 0 ? (
          <div className="pdf-options">
            <label className="pdf-field-label" htmlFor="pdf-page-range">{tool === "remove-pages" ? copy.pagesToRemove : tool === "extract-pages" ? copy.pagesToExtract : copy.pageRange}</label>
            <input id="pdf-page-range" className="pdf-range-input" type="text" value={pageRange} onChange={(event) => { setPageRange(event.target.value); clearResult(); }} placeholder="1-3,5,8" aria-describedby="pdf-range-hint" />
            <p id="pdf-range-hint" className="pdf-field-hint">{copy.pageRangeHint} {copy.pageCount(files[0].pages)}</p>
            {tool === "split" ? <fieldset className="pdf-choice-group"><legend>{copy.splitMode}</legend>
              <label><input type="radio" name="split-mode" checked={!splitEach} onChange={() => { setSplitEach(false); clearResult(); }} /><span>{copy.extractTogether}</span></label>
              <label><input type="radio" name="split-mode" checked={splitEach} onChange={() => { setSplitEach(true); clearResult(); }} /><span>{copy.splitEach}</span></label>
            </fieldset> : null}
          </div>
        ) : null}

        {tool === "rotate" && files.length > 0 ? (
          <div className="pdf-options">
            <fieldset className="pdf-choice-group"><legend>{copy.rotation}</legend>
              <label><input type="radio" name="rotation" checked={rotation === 90} onChange={() => { setRotation(90); clearResult(); }} /><span>{copy.clockwise}</span></label>
              <label><input type="radio" name="rotation" checked={rotation === -90} onChange={() => { setRotation(-90); clearResult(); }} /><span>{copy.counterClockwise}</span></label>
            </fieldset>
          </div>
        ) : null}

        {tool === "compress" && files.length > 0 ? (
          <div className="pdf-options">
            <fieldset className="pdf-method-group"><legend>{copy.compressMode}</legend>
              <label className={method === "structure" ? "pdf-method--selected" : ""}><input type="radio" name="compress-mode" checked={method === "structure"} onChange={() => { setMethod("structure"); clearResult(); }} /><span><strong>{copy.preserveText}</strong><small>{copy.preserveTextHint}</small></span></label>
              <label className={method === "raster" ? "pdf-method--selected" : ""}><input type="radio" name="compress-mode" checked={method === "raster"} onChange={() => { setMethod("raster"); clearResult(); }} /><span><strong>{copy.scannedPages}</strong><small>{copy.scannedPagesHint}</small></span></label>
            </fieldset>
            {method === "raster" ? <div className="pdf-quality"><label htmlFor="pdf-quality">{copy.quality}</label><select id="pdf-quality" value={quality} onChange={(event) => { setQuality(event.target.value as RasterQuality); clearResult(); }}><option value="balanced">{copy.balanced}</option><option value="smaller">{copy.smaller}</option></select><p>{copy.rasterWarning}</p></div> : null}
          </div>
        ) : null}

        {error ? <p className="pdf-error" role="alert">{error}</p> : null}
        {progress ? <p className="pdf-progress" role="status">{progress}</p> : null}

        <div className="pdf-work-actions">
          {tool === "merge" && files.length > 0 ? <button type="button" className="pdf-secondary-button" onClick={() => inputRef.current?.click()} disabled={busy}>{copy.addFiles}</button> : <span />}
          <button type="button" className="pdf-action-button" onClick={() => { void process(); }} disabled={busy || files.length === 0}>{busy ? copy.processing : copy.start[tool]} <span aria-hidden>→</span></button>
        </div>

        {result ? (
          <div className="pdf-result-wrap">
            <div className="pdf-result" role="status">
              <div><strong>{copy.resultReady}</strong><span>{copy.originalSize}: {formatBytes(result.originalSize)} <b aria-hidden>→</b> {copy.resultSize}: {formatBytes(result.size)}</span>{tool === "compress" && !result.reduced ? <small>{copy.noReduction}</small> : null}</div>
              <a href={result.url} download={result.filename} className="pdf-download-button">{copy.download} ↓</a>
            </div>
            {result.previews ? <div className="pdf-preview"><p>{copy.previewHint}</p><div className="pdf-preview-grid"><figure><figcaption>{copy.originalSize}</figcaption><img src={result.previews.before} alt={`${copy.originalSize} · ${copy.firstPage}`} /></figure><figure><figcaption>{copy.resultSize}</figcaption><img src={result.previews.after} alt={`${copy.resultSize} · ${copy.firstPage}`} /></figure></div></div> : null}
          </div>
        ) : null}
      </div>

      <aside className="pdf-work-aside">
        <div className="pdf-assurance"><span aria-hidden>⌁</span><div><strong>{copy.privacyTitle}</strong><p>{copy.privacyText}</p></div></div>
        <div className="pdf-assurance"><span aria-hidden>✓</span><div><strong>{copy.noAccountTitle}</strong><p>{copy.noAccountText}</p></div></div>
      </aside>
    </div>
  );
}
