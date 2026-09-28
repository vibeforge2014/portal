"use client";

import { useEffect, useRef, useState } from "react";
import { PDF_COPY, type CorePdfTool, type PdfLocale, type PdfTool } from "@/lib/pdf-tools";
import type { CropMargins, JpgQuality, PageNumberPosition } from "@/lib/pdf-operations";

type ExtraPdfTool = Exclude<PdfTool, CorePdfTool>;
type SelectedFile = { id: string; file: File; pages?: number };
type ReadyResult = { url: string; filename: string; size: number; originalSize: number };

const MAX_FILE_BYTES = 40 * 1024 * 1024;
const MAX_TOTAL_BYTES = 100 * 1024 * 1024;

const UI = {
  "zh-hans": {
    chooseImages: "选择 JPG 或 PNG 图片", dropImages: "拖入 JPG 或 PNG 图片，或点击选择", imageHint: "可添加多张图片，稍后可以调整顺序。", invalidImage: "请选择有效的 JPG 或 PNG 图片。", imageCount: (n: number) => `${n} 张图片`,
    arrange: "页面顺序", page: (n: number) => `第 ${n} 页`, moveLeft: "向前移动", moveRight: "向后移动", loadingPages: "正在生成页面预览…", organizeLimit: "整理工具单次最多处理 60 页。",
    imageQuality: "图片清晰度", balanced: "标准（文件更小）", high: "高清", position: "页码位置", bottomCenter: "底部居中", bottomRight: "右下角", topRight: "右上角", startAt: "起始页码",
    watermarkText: "水印文字", watermarkPlaceholder: "例如：仅供内部使用", opacity: "透明度", light: "较浅", medium: "标准", dark: "较深", missingWatermark: "请输入水印文字。",
    cropMargins: "裁剪宽度（毫米）", top: "上", right: "右", bottom: "下", left: "左", chooseTwo: "选择两份 PDF", dropTwo: "拖入两份 PDF，或点击选择", compareHint: "按列表顺序将第一份与第二份进行比较。",
    start: { organize: "整理并导出", "scan-to-pdf": "生成扫描 PDF", repair: "修复 PDF", "jpg-to-pdf": "生成 PDF", "pdf-to-jpg": "转换为 JPG", "pdf-to-png": "转换为 PNG", "pdf-to-text": "提取文字", "page-numbers": "添加页码", watermark: "添加水印", crop: "裁剪 PDF", compare: "开始对比" },
  },
  "zh-hant": {
    chooseImages: "選擇 JPG 或 PNG 圖片", dropImages: "拖入 JPG 或 PNG 圖片，或點按選擇", imageHint: "可加入多張圖片，稍後可以調整順序。", invalidImage: "請選擇有效的 JPG 或 PNG 圖片。", imageCount: (n: number) => `${n} 張圖片`,
    arrange: "頁面順序", page: (n: number) => `第 ${n} 頁`, moveLeft: "向前移動", moveRight: "向後移動", loadingPages: "正在產生頁面預覽…", organizeLimit: "整理工具單次最多處理 60 頁。",
    imageQuality: "圖片清晰度", balanced: "標準（檔案較小）", high: "高清", position: "頁碼位置", bottomCenter: "底部置中", bottomRight: "右下角", topRight: "右上角", startAt: "起始頁碼",
    watermarkText: "浮水印文字", watermarkPlaceholder: "例如：僅供內部使用", opacity: "透明度", light: "較淺", medium: "標準", dark: "較深", missingWatermark: "請輸入浮水印文字。",
    cropMargins: "裁切寬度（毫米）", top: "上", right: "右", bottom: "下", left: "左", chooseTwo: "選擇兩份 PDF", dropTwo: "拖入兩份 PDF，或點按選擇", compareHint: "依列表順序將第一份與第二份進行比較。",
    start: { organize: "整理並匯出", "scan-to-pdf": "產生掃描 PDF", repair: "修復 PDF", "jpg-to-pdf": "產生 PDF", "pdf-to-jpg": "轉換為 JPG", "pdf-to-png": "轉換為 PNG", "pdf-to-text": "擷取文字", "page-numbers": "加入頁碼", watermark: "加入浮水印", crop: "裁切 PDF", compare: "開始比較" },
  },
  en: {
    chooseImages: "Choose JPG or PNG images", dropImages: "Drop JPG or PNG images here, or choose files", imageHint: "Add multiple images and arrange them before creating the PDF.", invalidImage: "Choose valid JPG or PNG images.", imageCount: (n: number) => `${n} ${n === 1 ? "image" : "images"}`,
    arrange: "Page order", page: (n: number) => `Page ${n}`, moveLeft: "Move earlier", moveRight: "Move later", loadingPages: "Creating page previews…", organizeLimit: "The organize tool supports up to 60 pages at a time.",
    imageQuality: "Image quality", balanced: "Standard (smaller files)", high: "High quality", position: "Number position", bottomCenter: "Bottom center", bottomRight: "Bottom right", topRight: "Top right", startAt: "Starting number",
    watermarkText: "Watermark text", watermarkPlaceholder: "For example: Internal use only", opacity: "Opacity", light: "Light", medium: "Standard", dark: "Dark", missingWatermark: "Enter watermark text.",
    cropMargins: "Crop amount (millimeters)", top: "Top", right: "Right", bottom: "Bottom", left: "Left", chooseTwo: "Choose two PDFs", dropTwo: "Drop two PDFs here, or choose files", compareHint: "The first file in the list is compared with the second.",
    start: { organize: "Organize and export", "scan-to-pdf": "Create scanned PDF", repair: "Repair PDF", "jpg-to-pdf": "Create PDF", "pdf-to-jpg": "Convert to JPG", "pdf-to-png": "Convert to PNG", "pdf-to-text": "Extract text", "page-numbers": "Add page numbers", watermark: "Add watermark", crop: "Crop PDF", compare: "Compare files" },
  },
} satisfies Record<PdfLocale, object>;

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function isImage(file: File) {
  const name = file.name.toLowerCase();
  return file.type === "image/jpeg" || file.type === "image/png" || name.endsWith(".jpg") || name.endsWith(".jpeg") || name.endsWith(".png");
}

export function PdfExtraToolClient({ locale, tool }: { locale: PdfLocale; tool: ExtraPdfTool }) {
  const copy = PDF_COPY[locale];
  const ui = UI[locale];
  const inputRef = useRef<HTMLInputElement>(null);
  const resultUrlRef = useRef<string | null>(null);
  const [files, setFiles] = useState<SelectedFile[]>([]);
  const [pageOrder, setPageOrder] = useState<number[]>([]);
  const [thumbnails, setThumbnails] = useState<string[]>([]);
  const [quality, setQuality] = useState<JpgQuality>("balanced");
  const [position, setPosition] = useState<PageNumberPosition>("bottom-center");
  const [startAt, setStartAt] = useState(1);
  const [watermark, setWatermark] = useState("");
  const [opacity, setOpacity] = useState(0.22);
  const [cropMargins, setCropMargins] = useState({ top: 5, right: 5, bottom: 5, left: 5 });
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ReadyResult | null>(null);

  useEffect(() => () => { if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current); }, []);

  function clearResult() {
    if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
    resultUrlRef.current = null;
    setResult(null);
  }

  function clearAll() {
    setFiles([]);
    setPageOrder([]);
    setThumbnails([]);
    setError(null);
    clearResult();
  }

  async function addFiles(incoming: FileList | File[]) {
    const candidates = Array.from(incoming);
    if (candidates.length === 0) return;
    setError(null);
    clearResult();
    const imagesMode = tool === "jpg-to-pdf" || tool === "scan-to-pdf";
    const multiPdfMode = tool === "compare";
    const accepted = imagesMode ? candidates : multiPdfMode ? candidates.slice(0, Math.max(0, 2 - files.length)) : candidates.slice(0, 1);
    if (accepted.length === 0) return;
    if (accepted.some((file) => file.size === 0 || (imagesMode ? !isImage(file) : !file.name.toLowerCase().endsWith(".pdf")))) {
      setError(imagesMode ? ui.invalidImage : copy.invalidPdf);
      return;
    }
    const previousSize = imagesMode || multiPdfMode ? files.reduce((sum, item) => sum + item.file.size, 0) : 0;
    if (accepted.some((file) => file.size > MAX_FILE_BYTES) || previousSize + accepted.reduce((sum, file) => sum + file.size, 0) > MAX_TOTAL_BYTES) {
      setError(copy.tooLarge);
      return;
    }
    setBusy(true);
    try {
      if (imagesMode) {
        const additions = accepted.map((file) => ({ id: crypto.randomUUID(), file }));
        setFiles((current) => [...current, ...additions]);
      } else {
        const operations = await import("@/lib/pdf-operations");
        const inspected = await Promise.all(accepted.map(async (file) => {
          const pages = await operations.inspectPdf(file);
          if (pages > (tool === "organize" ? operations.MAX_ORGANIZE_PAGES : operations.MAX_PAGES)) throw new Error("too-many-pages");
          return { id: crypto.randomUUID(), file, pages };
        }));
        setFiles((current) => multiPdfMode ? [...current, ...inspected].slice(0, 2) : inspected);
        if (tool === "organize") {
          setProgress(ui.loadingPages);
          const previews = await operations.renderPdfThumbnails(accepted[0]);
          setThumbnails(previews);
          setPageOrder(previews.map((_, index) => index));
        }
      }
    } catch (cause) {
      if (!multiPdfMode) setFiles([]);
      setThumbnails([]);
      setPageOrder([]);
      setError(cause instanceof Error && cause.message === "too-many-pages" ? (tool === "organize" ? ui.organizeLimit : copy.tooManyPages) : copy.invalidPdf);
    } finally {
      setBusy(false);
      setProgress(null);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function moveFile(index: number, offset: number) {
    const next = [...files];
    const target = index + offset;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setFiles(next);
    clearResult();
  }

  function movePage(index: number, offset: number) {
    const next = [...pageOrder];
    const target = index + offset;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setPageOrder(next);
    clearResult();
  }

  async function process() {
    setError(null);
    clearResult();
    if (files.length === 0) { setError(copy.needFile); return; }
    if (tool === "compare" && files.length < 2) { setError(copy.needTwoFiles); return; }
    if (tool === "watermark" && !watermark.trim()) { setError(ui.missingWatermark); return; }
    setBusy(true);
    setProgress(copy.processing);
    try {
      const operations = await import("@/lib/pdf-operations");
      const update = (done: number, total: number) => setProgress(copy.progress(done, total));
      let output;
      if (tool === "organize") output = await operations.reorderPdf(files[0].file, pageOrder, update);
      else if (tool === "jpg-to-pdf") output = await operations.imagesToPdf(files.map((item) => item.file), update);
      else if (tool === "scan-to-pdf") output = await operations.scanImagesToPdf(files.map((item) => item.file), update);
      else if (tool === "pdf-to-jpg") output = await operations.pdfToJpg(files[0].file, quality, update);
      else if (tool === "pdf-to-png") output = await operations.pdfToPng(files[0].file, quality, update);
      else if (tool === "pdf-to-text") output = await operations.pdfToText(files[0].file, update);
      else if (tool === "repair") output = await operations.repairPdf(files[0].file, update);
      else if (tool === "page-numbers") output = await operations.addPageNumbers(files[0].file, position, Math.max(1, Math.trunc(startAt)), update);
      else if (tool === "watermark") output = await operations.addWatermark(files[0].file, watermark, opacity, update);
      else if (tool === "crop") output = await operations.cropPdf(files[0].file, Object.fromEntries(Object.entries(cropMargins).map(([key, value]) => [key, Math.max(0, value) * 72 / 25.4])) as CropMargins, update);
      else output = await operations.comparePdfText(files[0].file, files[1].file, update);
      const mime = output.filename.endsWith(".zip") ? "application/zip" : output.filename.endsWith(".txt") ? "text/plain;charset=utf-8" : "application/pdf";
      const url = URL.createObjectURL(new Blob([new Uint8Array(output.bytes)], { type: mime }));
      resultUrlRef.current = url;
      setResult({ url, filename: output.filename, size: output.bytes.byteLength, originalSize: files.reduce((sum, item) => sum + item.file.size, 0) });
    } catch (cause) {
      setError(cause instanceof Error && cause.message === "too-many-pages" ? copy.tooManyPages : copy.processError);
    } finally {
      setBusy(false);
      setProgress(null);
    }
  }

  const imagesMode = tool === "jpg-to-pdf" || tool === "scan-to-pdf";
  const multiPdfMode = tool === "compare";
  const accept = imagesMode ? ".jpg,.jpeg,.png,image/jpeg,image/png" : ".pdf,application/pdf";

  return (
    <div className="pdf-workspace">
      <div className="pdf-work-main">
        <div className="pdf-work-heading"><h2>{copy.toolsCopy[tool].title}</h2><p>{copy.toolsCopy[tool].description}</p></div>
        <input ref={inputRef} className="pdf-visually-hidden" type="file" accept={accept} capture={tool === "scan-to-pdf" ? "environment" : undefined} multiple={imagesMode || multiPdfMode} onChange={(event) => { void addFiles(event.target.files ?? []); }} aria-label={imagesMode ? ui.chooseImages : multiPdfMode ? ui.chooseTwo : copy.chooseFile} />
        <button type="button" className={`pdf-dropzone${dragging ? " pdf-dropzone--active" : ""}`} disabled={busy} onClick={() => inputRef.current?.click()} onDragEnter={(event) => { event.preventDefault(); setDragging(true); }} onDragOver={(event) => event.preventDefault()} onDragLeave={(event) => { event.preventDefault(); setDragging(false); }} onDrop={(event) => { event.preventDefault(); setDragging(false); void addFiles(event.dataTransfer.files); }}>
          <span className="pdf-upload-icon" aria-hidden>＋</span><strong>{imagesMode ? ui.dropImages : multiPdfMode ? ui.dropTwo : copy.dropFile}</strong><span>{imagesMode ? ui.imageHint : multiPdfMode ? ui.compareHint : copy.pdfOnly}</span>
        </button>

        {files.length > 0 ? <div className="pdf-files" aria-live="polite">
          <div className="pdf-files-heading"><span>{imagesMode ? ui.imageCount(files.length) : `${copy.fileCount(files.length)} · ${copy.pageCount(files.reduce((sum, item) => sum + (item.pages ?? 0), 0))}`} · {formatBytes(files.reduce((sum, item) => sum + item.file.size, 0))}</span><button type="button" onClick={clearAll} disabled={busy}>{copy.clearAll}</button></div>
          <ol className="pdf-file-list">{files.map((item, index) => <li key={item.id}>
            <span className="pdf-file-glyph" aria-hidden><i /><i /><i /></span><span className="pdf-file-info"><strong title={item.file.name}>{item.file.name}</strong><small>{item.pages ? `${copy.pageCount(item.pages)} · ` : ""}{formatBytes(item.file.size)}</small></span>
            <span className="pdf-file-actions">{imagesMode ? <><button type="button" aria-label={`${copy.moveUp}: ${item.file.name}`} disabled={index === 0 || busy} onClick={() => moveFile(index, -1)}>↑</button><button type="button" aria-label={`${copy.moveDown}: ${item.file.name}`} disabled={index === files.length - 1 || busy} onClick={() => moveFile(index, 1)}>↓</button></> : null}<button type="button" aria-label={`${copy.remove}: ${item.file.name}`} disabled={busy} onClick={() => { setFiles(files.filter((entry) => entry.id !== item.id)); clearResult(); }}>×</button></span>
          </li>)}</ol>
        </div> : null}

        {tool === "organize" && pageOrder.length > 0 ? <div className="pdf-options"><h3 className="pdf-field-label">{ui.arrange}</h3><ol className="pdf-page-grid">{pageOrder.map((pageIndex, index) => <li key={pageIndex}><img src={thumbnails[pageIndex]} alt={ui.page(pageIndex + 1)} /><strong>{ui.page(pageIndex + 1)}</strong><span><button type="button" aria-label={`${ui.moveLeft}: ${ui.page(pageIndex + 1)}`} disabled={index === 0 || busy} onClick={() => movePage(index, -1)}>←</button><button type="button" aria-label={`${ui.moveRight}: ${ui.page(pageIndex + 1)}`} disabled={index === pageOrder.length - 1 || busy} onClick={() => movePage(index, 1)}>→</button></span></li>)}</ol></div> : null}

        {(tool === "pdf-to-jpg" || tool === "pdf-to-png") && files.length > 0 ? <div className="pdf-options"><label className="pdf-field-label" htmlFor="pdf-image-quality">{ui.imageQuality}</label><select id="pdf-image-quality" className="pdf-select" value={quality} onChange={(event) => { setQuality(event.target.value as JpgQuality); clearResult(); }}><option value="balanced">{ui.balanced}</option><option value="high">{ui.high}</option></select></div> : null}

        {tool === "page-numbers" && files.length > 0 ? <div className="pdf-options pdf-inline-fields"><label><span>{ui.position}</span><select className="pdf-select" value={position} onChange={(event) => { setPosition(event.target.value as PageNumberPosition); clearResult(); }}><option value="bottom-center">{ui.bottomCenter}</option><option value="bottom-right">{ui.bottomRight}</option><option value="top-right">{ui.topRight}</option></select></label><label><span>{ui.startAt}</span><input className="pdf-number-input" type="number" min="1" max="9999" value={startAt} onChange={(event) => { setStartAt(Number(event.target.value)); clearResult(); }} /></label></div> : null}

        {tool === "watermark" && files.length > 0 ? <div className="pdf-options"><label className="pdf-field-label" htmlFor="pdf-watermark-text">{ui.watermarkText}</label><input id="pdf-watermark-text" className="pdf-range-input" type="text" maxLength={60} value={watermark} placeholder={ui.watermarkPlaceholder} onChange={(event) => { setWatermark(event.target.value); clearResult(); }} /><label className="pdf-field-label pdf-option-label" htmlFor="pdf-watermark-opacity">{ui.opacity}</label><select id="pdf-watermark-opacity" className="pdf-select" value={opacity} onChange={(event) => { setOpacity(Number(event.target.value)); clearResult(); }}><option value="0.14">{ui.light}</option><option value="0.22">{ui.medium}</option><option value="0.36">{ui.dark}</option></select></div> : null}

        {tool === "crop" && files.length > 0 ? <div className="pdf-options"><h3 className="pdf-field-label">{ui.cropMargins}</h3><div className="pdf-crop-fields">{(["top", "right", "bottom", "left"] as const).map((side) => <label key={side}><span>{ui[side]}</span><input className="pdf-number-input" type="number" min="0" max="100" step="1" value={cropMargins[side]} onChange={(event) => { setCropMargins({ ...cropMargins, [side]: Number(event.target.value) }); clearResult(); }} /></label>)}</div></div> : null}

        {error ? <p className="pdf-error" role="alert">{error}</p> : null}{progress ? <p className="pdf-progress" role="status">{progress}</p> : null}
        <div className="pdf-work-actions">{(imagesMode || multiPdfMode) && files.length > 0 && (!multiPdfMode || files.length < 2) ? <button type="button" className="pdf-secondary-button" onClick={() => inputRef.current?.click()} disabled={busy}>{copy.addFiles}</button> : <span />}<button type="button" className="pdf-action-button" onClick={() => { void process(); }} disabled={busy || files.length === 0 || (multiPdfMode && files.length < 2)}>{busy ? copy.processing : ui.start[tool]} <span aria-hidden>→</span></button></div>

        {result ? <div className="pdf-result" role="status"><div><strong>{copy.resultReady}</strong><span>{copy.originalSize}: {formatBytes(result.originalSize)} <b aria-hidden>→</b> {copy.resultSize}: {formatBytes(result.size)}</span></div><a href={result.url} download={result.filename} className="pdf-download-button">{copy.download} ↓</a></div> : null}
      </div>
      <aside className="pdf-work-aside"><div className="pdf-assurance"><span aria-hidden>⌁</span><div><strong>{copy.privacyTitle}</strong><p>{copy.privacyText}</p></div></div><div className="pdf-assurance"><span aria-hidden>✓</span><div><strong>{copy.noAccountTitle}</strong><p>{copy.noAccountText}</p></div></div></aside>
    </div>
  );
}
