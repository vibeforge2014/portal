"use client";

import { useEffect, useRef, useState } from "react";
import { PDF_COPY, type CorePdfTool, type PdfLocale, type PdfTool } from "@/lib/pdf-tools";
import type { CropMargins, JpgQuality, PageNumberPosition, PageSizePreset, PdfFormFieldInfo, RedactionRect, SignaturePosition, TextOverlayPosition } from "@/lib/pdf-operations";

type ExtraPdfTool = Exclude<PdfTool, CorePdfTool | "pdf-to-word" | "word-to-pdf">;
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
    pageSize: "目标纸张", a4: "A4", letter: "Letter", signatureText: "签名文字", signaturePlaceholder: "输入姓名或签名", signaturePage: "签名页码", signaturePosition: "签名位置", bottomLeft: "左下角", signatureBottomCenter: "底部居中", signatureBottomRight: "右下角", missingSignature: "请输入签名文字并检查页码。",
    password: "打开密码", ownerPassword: "所有者密码（可选）", passwordPlaceholder: "输入密码", ownerPasswordHint: "用于完整权限管理；留空时与打开密码相同。", restrictChanges: "限制复制和修改", missingPassword: "请输入密码。", wrongPassword: "密码不正确，或文件不是受支持的加密 PDF。",
    editText: "要添加的文字", editPlaceholder: "输入要放到页面上的文字", editPage: "目标页码", editPosition: "文字位置", topLeft: "左上角", topCenter: "顶部居中", center: "页面中央", missingEdit: "请输入文字并检查页码。",
    redactionPage: "涂黑页码", redactionArea: "涂黑区域（占页面百分比）", fromLeft: "距左", fromTop: "距上", areaWidth: "宽度", areaHeight: "高度", invalidRedaction: "请检查页码和涂黑区域，区域必须完整位于页面内。",
    formFields: "表单字段", noFormFields: "这份 PDF 没有可识别的标准表单字段。", unsupportedField: "暂不支持此字段类型",
    start: { organize: "整理并导出", "reverse-pages": "倒序页面", "scan-to-pdf": "生成扫描 PDF", repair: "修复 PDF", grayscale: "转换为黑白", linearize: "优化 Web 打开", "jpg-to-pdf": "生成 PDF", "pdf-to-jpg": "转换为 JPG", "pdf-to-png": "转换为 PNG", "pdf-to-text": "提取文字", "pdf-to-markdown": "生成 Markdown", "page-numbers": "添加页码", watermark: "添加水印", crop: "裁剪 PDF", resize: "调整页面尺寸", edit: "添加文字", sign: "添加可视签名", redact: "永久涂黑", "fill-forms": "填写表单", "flatten-forms": "扁平化表单", protect: "加密 PDF", unlock: "解锁 PDF", compare: "开始对比" },
  },
  "zh-hant": {
    chooseImages: "選擇 JPG 或 PNG 圖片", dropImages: "拖入 JPG 或 PNG 圖片，或點按選擇", imageHint: "可加入多張圖片，稍後可以調整順序。", invalidImage: "請選擇有效的 JPG 或 PNG 圖片。", imageCount: (n: number) => `${n} 張圖片`,
    arrange: "頁面順序", page: (n: number) => `第 ${n} 頁`, moveLeft: "向前移動", moveRight: "向後移動", loadingPages: "正在產生頁面預覽…", organizeLimit: "整理工具單次最多處理 60 頁。",
    imageQuality: "圖片清晰度", balanced: "標準（檔案較小）", high: "高清", position: "頁碼位置", bottomCenter: "底部置中", bottomRight: "右下角", topRight: "右上角", startAt: "起始頁碼",
    watermarkText: "浮水印文字", watermarkPlaceholder: "例如：僅供內部使用", opacity: "透明度", light: "較淺", medium: "標準", dark: "較深", missingWatermark: "請輸入浮水印文字。",
    cropMargins: "裁切寬度（毫米）", top: "上", right: "右", bottom: "下", left: "左", chooseTwo: "選擇兩份 PDF", dropTwo: "拖入兩份 PDF，或點按選擇", compareHint: "依列表順序將第一份與第二份進行比較。",
    pageSize: "目標紙張", a4: "A4", letter: "Letter", signatureText: "簽名文字", signaturePlaceholder: "輸入姓名或簽名", signaturePage: "簽名頁碼", signaturePosition: "簽名位置", bottomLeft: "左下角", signatureBottomCenter: "底部置中", signatureBottomRight: "右下角", missingSignature: "請輸入簽名文字並檢查頁碼。",
    password: "開啟密碼", ownerPassword: "擁有者密碼（可選）", passwordPlaceholder: "輸入密碼", ownerPasswordHint: "用於完整權限管理；留空時與開啟密碼相同。", restrictChanges: "限制複製與修改", missingPassword: "請輸入密碼。", wrongPassword: "密碼不正確，或檔案不是支援的加密 PDF。",
    editText: "要加入的文字", editPlaceholder: "輸入要放到頁面上的文字", editPage: "目標頁碼", editPosition: "文字位置", topLeft: "左上角", topCenter: "頂部置中", center: "頁面中央", missingEdit: "請輸入文字並檢查頁碼。",
    redactionPage: "塗黑頁碼", redactionArea: "塗黑區域（佔頁面百分比）", fromLeft: "距左", fromTop: "距上", areaWidth: "寬度", areaHeight: "高度", invalidRedaction: "請檢查頁碼與塗黑區域，區域必須完整位於頁面內。",
    formFields: "表單欄位", noFormFields: "這份 PDF 沒有可辨識的標準表單欄位。", unsupportedField: "暫不支援此欄位類型",
    start: { organize: "整理並匯出", "reverse-pages": "倒序頁面", "scan-to-pdf": "產生掃描 PDF", repair: "修復 PDF", grayscale: "轉換為黑白", linearize: "最佳化 Web 開啟", "jpg-to-pdf": "產生 PDF", "pdf-to-jpg": "轉換為 JPG", "pdf-to-png": "轉換為 PNG", "pdf-to-text": "擷取文字", "pdf-to-markdown": "產生 Markdown", "page-numbers": "加入頁碼", watermark: "加入浮水印", crop: "裁切 PDF", resize: "調整頁面尺寸", edit: "加入文字", sign: "加入可視簽名", redact: "永久塗黑", "fill-forms": "填寫表單", "flatten-forms": "扁平化表單", protect: "加密 PDF", unlock: "解鎖 PDF", compare: "開始比較" },
  },
  en: {
    chooseImages: "Choose JPG or PNG images", dropImages: "Drop JPG or PNG images here, or choose files", imageHint: "Add multiple images and arrange them before creating the PDF.", invalidImage: "Choose valid JPG or PNG images.", imageCount: (n: number) => `${n} ${n === 1 ? "image" : "images"}`,
    arrange: "Page order", page: (n: number) => `Page ${n}`, moveLeft: "Move earlier", moveRight: "Move later", loadingPages: "Creating page previews…", organizeLimit: "The organize tool supports up to 60 pages at a time.",
    imageQuality: "Image quality", balanced: "Standard (smaller files)", high: "High quality", position: "Number position", bottomCenter: "Bottom center", bottomRight: "Bottom right", topRight: "Top right", startAt: "Starting number",
    watermarkText: "Watermark text", watermarkPlaceholder: "For example: Internal use only", opacity: "Opacity", light: "Light", medium: "Standard", dark: "Dark", missingWatermark: "Enter watermark text.",
    cropMargins: "Crop amount (millimeters)", top: "Top", right: "Right", bottom: "Bottom", left: "Left", chooseTwo: "Choose two PDFs", dropTwo: "Drop two PDFs here, or choose files", compareHint: "The first file in the list is compared with the second.",
    pageSize: "Target paper", a4: "A4", letter: "Letter", signatureText: "Signature text", signaturePlaceholder: "Enter a name or signature", signaturePage: "Page to sign", signaturePosition: "Signature position", bottomLeft: "Bottom left", signatureBottomCenter: "Bottom center", signatureBottomRight: "Bottom right", missingSignature: "Enter signature text and check the page number.",
    password: "Open password", ownerPassword: "Owner password (optional)", passwordPlaceholder: "Enter a password", ownerPasswordHint: "Controls full permissions; when blank, it matches the open password.", restrictChanges: "Restrict copying and changes", missingPassword: "Enter a password.", wrongPassword: "The password is incorrect, or this is not a supported encrypted PDF.",
    editText: "Text to add", editPlaceholder: "Enter text to place on the page", editPage: "Target page", editPosition: "Text position", topLeft: "Top left", topCenter: "Top center", center: "Page center", missingEdit: "Enter text and check the page number.",
    redactionPage: "Page to redact", redactionArea: "Redaction area (percent of page)", fromLeft: "From left", fromTop: "From top", areaWidth: "Width", areaHeight: "Height", invalidRedaction: "Check the page and redaction area. The region must fit entirely inside the page.",
    formFields: "Form fields", noFormFields: "This PDF has no recognized standard form fields.", unsupportedField: "This field type is not supported yet",
    start: { organize: "Organize and export", "reverse-pages": "Reverse pages", "scan-to-pdf": "Create scanned PDF", repair: "Repair PDF", grayscale: "Convert to grayscale", linearize: "Optimize for web", "jpg-to-pdf": "Create PDF", "pdf-to-jpg": "Convert to JPG", "pdf-to-png": "Convert to PNG", "pdf-to-text": "Extract text", "pdf-to-markdown": "Create Markdown", "page-numbers": "Add page numbers", watermark: "Add watermark", crop: "Crop PDF", resize: "Resize pages", edit: "Add text", sign: "Add visible signature", redact: "Redact permanently", "fill-forms": "Fill form", "flatten-forms": "Flatten forms", protect: "Encrypt PDF", unlock: "Unlock PDF", compare: "Compare files" },
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
  const [pageSize, setPageSize] = useState<PageSizePreset>("a4");
  const [signature, setSignature] = useState("");
  const [signaturePage, setSignaturePage] = useState(1);
  const [signaturePosition, setSignaturePosition] = useState<SignaturePosition>("bottom-right");
  const [password, setPassword] = useState("");
  const [ownerPassword, setOwnerPassword] = useState("");
  const [restrictChanges, setRestrictChanges] = useState(false);
  const [editText, setEditText] = useState("");
  const [editPage, setEditPage] = useState(1);
  const [editPosition, setEditPosition] = useState<TextOverlayPosition>("top-left");
  const [redactionPage, setRedactionPage] = useState(1);
  const [redaction, setRedaction] = useState<RedactionRect>({ x: 10, y: 10, width: 35, height: 12 });
  const [formFields, setFormFields] = useState<PdfFormFieldInfo[]>([]);
  const [formValues, setFormValues] = useState<Record<string, string | boolean>>({});
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
    setFormFields([]);
    setFormValues({});
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
        if (tool === "unlock") {
          setFiles([{ id: crypto.randomUUID(), file: accepted[0] }]);
          return;
        }
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
        if (tool === "fill-forms") {
          const fields = await operations.inspectPdfForm(accepted[0]);
          if (fields.length === 0) throw new Error("no-form-fields");
          setFormFields(fields);
          setFormValues(Object.fromEntries(fields.map((field) => [field.name, field.value])));
        }
      }
    } catch (cause) {
      if (!multiPdfMode) setFiles([]);
      setThumbnails([]);
      setPageOrder([]);
      setError(cause instanceof Error && cause.message === "too-many-pages" ? (tool === "organize" ? ui.organizeLimit : copy.tooManyPages) : cause instanceof Error && cause.message === "no-form-fields" ? ui.noFormFields : copy.invalidPdf);
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
    if (tool === "sign" && (!signature.trim() || !Number.isInteger(signaturePage) || signaturePage < 1 || signaturePage > (files[0].pages ?? 0))) { setError(ui.missingSignature); return; }
    if ((tool === "protect" || tool === "unlock") && !password) { setError(ui.missingPassword); return; }
    if (tool === "edit" && (!editText.trim() || !Number.isInteger(editPage) || editPage < 1 || editPage > (files[0].pages ?? 0))) { setError(ui.missingEdit); return; }
    if (tool === "redact" && (!Number.isInteger(redactionPage) || redactionPage < 1 || redactionPage > (files[0].pages ?? 0) || redaction.width <= 0 || redaction.height <= 0 || redaction.x < 0 || redaction.y < 0 || redaction.x + redaction.width > 100 || redaction.y + redaction.height > 100)) { setError(ui.invalidRedaction); return; }
    setBusy(true);
    setProgress(copy.processing);
    try {
      const operations = await import("@/lib/pdf-operations");
      const update = (done: number, total: number) => setProgress(copy.progress(done, total));
      let output;
      if (tool === "organize") output = await operations.reorderPdf(files[0].file, pageOrder, update);
      else if (tool === "reverse-pages") output = await operations.reversePdfPages(files[0].file, update);
      else if (tool === "jpg-to-pdf") output = await operations.imagesToPdf(files.map((item) => item.file), update);
      else if (tool === "scan-to-pdf") output = await operations.scanImagesToPdf(files.map((item) => item.file), update);
      else if (tool === "pdf-to-jpg") output = await operations.pdfToJpg(files[0].file, quality, update);
      else if (tool === "pdf-to-png") output = await operations.pdfToPng(files[0].file, quality, update);
      else if (tool === "pdf-to-text") output = await operations.pdfToText(files[0].file, update);
      else if (tool === "pdf-to-markdown") output = await operations.pdfToMarkdown(files[0].file, update);
      else if (tool === "repair") output = await operations.repairPdf(files[0].file, update);
      else if (tool === "grayscale") output = await operations.grayscalePdf(files[0].file, quality, update);
      else if (tool === "linearize") output = await operations.linearizePdf(files[0].file, update);
      else if (tool === "page-numbers") output = await operations.addPageNumbers(files[0].file, position, Math.max(1, Math.trunc(startAt)), update);
      else if (tool === "watermark") output = await operations.addWatermark(files[0].file, watermark, opacity, update);
      else if (tool === "crop") output = await operations.cropPdf(files[0].file, Object.fromEntries(Object.entries(cropMargins).map(([key, value]) => [key, Math.max(0, value) * 72 / 25.4])) as CropMargins, update);
      else if (tool === "resize") output = await operations.resizePdfPages(files[0].file, pageSize, update);
      else if (tool === "edit") output = await operations.editPdfText(files[0].file, editText, editPage, editPosition, update);
      else if (tool === "sign") output = await operations.signPdf(files[0].file, signature, signaturePage, signaturePosition, update);
      else if (tool === "redact") output = await operations.redactPdf(files[0].file, redactionPage, redaction, update);
      else if (tool === "fill-forms") output = await operations.fillPdfForm(files[0].file, formValues, update);
      else if (tool === "flatten-forms") output = await operations.flattenPdfForms(files[0].file, update);
      else if (tool === "protect") output = await operations.protectPdf(files[0].file, password, ownerPassword, restrictChanges, update);
      else if (tool === "unlock") output = await operations.unlockPdf(files[0].file, password, update);
      else output = await operations.comparePdfText(files[0].file, files[1].file, update);
      const mime = output.filename.endsWith(".zip") ? "application/zip" : output.filename.endsWith(".txt") ? "text/plain;charset=utf-8" : output.filename.endsWith(".md") ? "text/markdown;charset=utf-8" : "application/pdf";
      const url = URL.createObjectURL(new Blob([new Uint8Array(output.bytes)], { type: mime }));
      resultUrlRef.current = url;
      setResult({ url, filename: output.filename, size: output.bytes.byteLength, originalSize: files.reduce((sum, item) => sum + item.file.size, 0) });
    } catch (cause) {
      setError(cause instanceof Error && cause.message === "too-many-pages" ? copy.tooManyPages : tool === "unlock" || (cause instanceof Error && /password/i.test(cause.message)) ? ui.wrongPassword : copy.processError);
    } finally {
      setBusy(false);
      setProgress(null);
    }
  }

  const imagesMode = tool === "jpg-to-pdf" || tool === "scan-to-pdf";
  const multiPdfMode = tool === "compare";
  const accept = imagesMode ? ".jpg,.jpeg,.png,image/jpeg,image/png" : ".pdf,application/pdf";
  const knownPages = files.reduce((sum, item) => sum + (item.pages ?? 0), 0);

  return (
    <div className="pdf-workspace">
      <div className="pdf-work-main">
        <div className="pdf-work-heading"><h2>{copy.toolsCopy[tool].title}</h2><p>{copy.toolsCopy[tool].description}</p></div>
        <input ref={inputRef} className="pdf-visually-hidden" type="file" accept={accept} capture={tool === "scan-to-pdf" ? "environment" : undefined} multiple={imagesMode || multiPdfMode} onChange={(event) => { void addFiles(event.target.files ?? []); }} aria-label={imagesMode ? ui.chooseImages : multiPdfMode ? ui.chooseTwo : copy.chooseFile} />
        <button type="button" className={`pdf-dropzone${dragging ? " pdf-dropzone--active" : ""}`} disabled={busy} onClick={() => inputRef.current?.click()} onDragEnter={(event) => { event.preventDefault(); setDragging(true); }} onDragOver={(event) => event.preventDefault()} onDragLeave={(event) => { event.preventDefault(); setDragging(false); }} onDrop={(event) => { event.preventDefault(); setDragging(false); void addFiles(event.dataTransfer.files); }}>
          <span className="pdf-upload-icon" aria-hidden>＋</span><strong>{imagesMode ? ui.dropImages : multiPdfMode ? ui.dropTwo : copy.dropFile}</strong><span>{imagesMode ? ui.imageHint : multiPdfMode ? ui.compareHint : copy.pdfOnly}</span>
        </button>

        {files.length > 0 ? <div className="pdf-files" aria-live="polite">
          <div className="pdf-files-heading"><span>{imagesMode ? ui.imageCount(files.length) : `${copy.fileCount(files.length)}${knownPages > 0 ? ` · ${copy.pageCount(knownPages)}` : ""}`} · {formatBytes(files.reduce((sum, item) => sum + item.file.size, 0))}</span><button type="button" onClick={clearAll} disabled={busy}>{copy.clearAll}</button></div>
          <ol className="pdf-file-list">{files.map((item, index) => <li key={item.id}>
            <span className="pdf-file-glyph" aria-hidden><i /><i /><i /></span><span className="pdf-file-info"><strong title={item.file.name}>{item.file.name}</strong><small>{item.pages ? `${copy.pageCount(item.pages)} · ` : ""}{formatBytes(item.file.size)}</small></span>
            <span className="pdf-file-actions">{imagesMode ? <><button type="button" aria-label={`${copy.moveUp}: ${item.file.name}`} disabled={index === 0 || busy} onClick={() => moveFile(index, -1)}>↑</button><button type="button" aria-label={`${copy.moveDown}: ${item.file.name}`} disabled={index === files.length - 1 || busy} onClick={() => moveFile(index, 1)}>↓</button></> : null}<button type="button" aria-label={`${copy.remove}: ${item.file.name}`} disabled={busy} onClick={() => { setFiles(files.filter((entry) => entry.id !== item.id)); clearResult(); }}>×</button></span>
          </li>)}</ol>
        </div> : null}

        {tool === "organize" && pageOrder.length > 0 ? <div className="pdf-options"><h3 className="pdf-field-label">{ui.arrange}</h3><ol className="pdf-page-grid">{pageOrder.map((pageIndex, index) => <li key={pageIndex}><img src={thumbnails[pageIndex]} alt={ui.page(pageIndex + 1)} /><strong>{ui.page(pageIndex + 1)}</strong><span><button type="button" aria-label={`${ui.moveLeft}: ${ui.page(pageIndex + 1)}`} disabled={index === 0 || busy} onClick={() => movePage(index, -1)}>←</button><button type="button" aria-label={`${ui.moveRight}: ${ui.page(pageIndex + 1)}`} disabled={index === pageOrder.length - 1 || busy} onClick={() => movePage(index, 1)}>→</button></span></li>)}</ol></div> : null}

        {(tool === "pdf-to-jpg" || tool === "pdf-to-png" || tool === "grayscale") && files.length > 0 ? <div className="pdf-options"><label className="pdf-field-label" htmlFor="pdf-image-quality">{ui.imageQuality}</label><select id="pdf-image-quality" className="pdf-select" value={quality} onChange={(event) => { setQuality(event.target.value as JpgQuality); clearResult(); }}><option value="balanced">{ui.balanced}</option><option value="high">{ui.high}</option></select></div> : null}

        {tool === "page-numbers" && files.length > 0 ? <div className="pdf-options pdf-inline-fields"><label><span>{ui.position}</span><select className="pdf-select" value={position} onChange={(event) => { setPosition(event.target.value as PageNumberPosition); clearResult(); }}><option value="bottom-center">{ui.bottomCenter}</option><option value="bottom-right">{ui.bottomRight}</option><option value="top-right">{ui.topRight}</option></select></label><label><span>{ui.startAt}</span><input className="pdf-number-input" type="number" min="1" max="9999" value={startAt} onChange={(event) => { setStartAt(Number(event.target.value)); clearResult(); }} /></label></div> : null}

        {tool === "watermark" && files.length > 0 ? <div className="pdf-options"><label className="pdf-field-label" htmlFor="pdf-watermark-text">{ui.watermarkText}</label><input id="pdf-watermark-text" className="pdf-range-input" type="text" maxLength={60} value={watermark} placeholder={ui.watermarkPlaceholder} onChange={(event) => { setWatermark(event.target.value); clearResult(); }} /><label className="pdf-field-label pdf-option-label" htmlFor="pdf-watermark-opacity">{ui.opacity}</label><select id="pdf-watermark-opacity" className="pdf-select" value={opacity} onChange={(event) => { setOpacity(Number(event.target.value)); clearResult(); }}><option value="0.14">{ui.light}</option><option value="0.22">{ui.medium}</option><option value="0.36">{ui.dark}</option></select></div> : null}

        {tool === "crop" && files.length > 0 ? <div className="pdf-options"><h3 className="pdf-field-label">{ui.cropMargins}</h3><div className="pdf-crop-fields">{(["top", "right", "bottom", "left"] as const).map((side) => <label key={side}><span>{ui[side]}</span><input className="pdf-number-input" type="number" min="0" max="100" step="1" value={cropMargins[side]} onChange={(event) => { setCropMargins({ ...cropMargins, [side]: Number(event.target.value) }); clearResult(); }} /></label>)}</div></div> : null}

        {tool === "resize" && files.length > 0 ? <div className="pdf-options"><label className="pdf-field-label" htmlFor="pdf-page-size">{ui.pageSize}</label><select id="pdf-page-size" className="pdf-select" value={pageSize} onChange={(event) => { setPageSize(event.target.value as PageSizePreset); clearResult(); }}><option value="a4">{ui.a4}</option><option value="letter">{ui.letter}</option></select></div> : null}

        {tool === "edit" && files.length > 0 ? <div className="pdf-options"><label className="pdf-field-label" htmlFor="pdf-edit-text">{ui.editText}</label><input id="pdf-edit-text" className="pdf-range-input" type="text" maxLength={120} value={editText} placeholder={ui.editPlaceholder} onChange={(event) => { setEditText(event.target.value); clearResult(); }} /><div className="pdf-inline-fields pdf-option-label"><label><span>{ui.editPage}</span><input className="pdf-number-input" type="number" min="1" max={files[0].pages ?? 1} value={editPage} onChange={(event) => { setEditPage(Number(event.target.value)); clearResult(); }} /></label><label><span>{ui.editPosition}</span><select className="pdf-select" value={editPosition} onChange={(event) => { setEditPosition(event.target.value as TextOverlayPosition); clearResult(); }}><option value="top-left">{ui.topLeft}</option><option value="top-center">{ui.topCenter}</option><option value="top-right">{ui.topRight}</option><option value="center">{ui.center}</option><option value="bottom-left">{ui.bottomLeft}</option><option value="bottom-right">{ui.signatureBottomRight}</option></select></label></div></div> : null}

        {tool === "sign" && files.length > 0 ? <div className="pdf-options"><label className="pdf-field-label" htmlFor="pdf-signature-text">{ui.signatureText}</label><input id="pdf-signature-text" className="pdf-range-input" type="text" maxLength={60} value={signature} placeholder={ui.signaturePlaceholder} onChange={(event) => { setSignature(event.target.value); clearResult(); }} /><div className="pdf-inline-fields pdf-option-label"><label><span>{ui.signaturePage}</span><input className="pdf-number-input" type="number" min="1" max={files[0].pages ?? 1} value={signaturePage} onChange={(event) => { setSignaturePage(Number(event.target.value)); clearResult(); }} /></label><label><span>{ui.signaturePosition}</span><select className="pdf-select" value={signaturePosition} onChange={(event) => { setSignaturePosition(event.target.value as SignaturePosition); clearResult(); }}><option value="bottom-left">{ui.bottomLeft}</option><option value="bottom-center">{ui.signatureBottomCenter}</option><option value="bottom-right">{ui.signatureBottomRight}</option></select></label></div></div> : null}

        {tool === "redact" && files.length > 0 ? <div className="pdf-options"><div className="pdf-inline-fields"><label><span>{ui.redactionPage}</span><input className="pdf-number-input" type="number" min="1" max={files[0].pages ?? 1} value={redactionPage} onChange={(event) => { setRedactionPage(Number(event.target.value)); clearResult(); }} /></label></div><h3 className="pdf-field-label pdf-option-label">{ui.redactionArea}</h3><div className="pdf-crop-fields">{([['x', ui.fromLeft], ['y', ui.fromTop], ['width', ui.areaWidth], ['height', ui.areaHeight]] as const).map(([key, label]) => <label key={key}><span>{label}</span><input className="pdf-number-input" type="number" min="0" max="100" step="1" value={redaction[key]} onChange={(event) => { setRedaction({ ...redaction, [key]: Number(event.target.value) }); clearResult(); }} /></label>)}</div></div> : null}

        {tool === "fill-forms" && files.length > 0 && formFields.length > 0 ? <div className="pdf-options"><h3 className="pdf-field-label">{ui.formFields}</h3><div className="pdf-form-fields">{formFields.map((field) => <div className="pdf-form-field" key={field.name}>{field.type === "text" ? <label><span>{field.name}</span><input className="pdf-range-input" type="text" value={String(formValues[field.name] ?? "")} onChange={(event) => { setFormValues({ ...formValues, [field.name]: event.target.value }); clearResult(); }} /></label> : field.type === "checkbox" ? <label className="pdf-checkbox-option"><input type="checkbox" checked={Boolean(formValues[field.name])} onChange={(event) => { setFormValues({ ...formValues, [field.name]: event.target.checked }); clearResult(); }} /><span>{field.name}</span></label> : field.type === "choice" ? <label><span>{field.name}</span><select className="pdf-select" value={String(formValues[field.name] ?? "")} onChange={(event) => { setFormValues({ ...formValues, [field.name]: event.target.value }); clearResult(); }}>{(field.options ?? []).map((option) => <option key={option} value={option}>{option}</option>)}</select></label> : <div><strong>{field.name}</strong><small>{ui.unsupportedField}</small></div>}</div>)}</div></div> : null}

        {tool === "protect" && files.length > 0 ? <div className="pdf-options"><label className="pdf-field-label" htmlFor="pdf-open-password">{ui.password}</label><input id="pdf-open-password" className="pdf-range-input" type="password" autoComplete="new-password" value={password} placeholder={ui.passwordPlaceholder} onChange={(event) => { setPassword(event.target.value); clearResult(); }} /><label className="pdf-field-label pdf-option-label" htmlFor="pdf-owner-password">{ui.ownerPassword}</label><input id="pdf-owner-password" className="pdf-range-input" type="password" autoComplete="new-password" value={ownerPassword} placeholder={ui.passwordPlaceholder} onChange={(event) => { setOwnerPassword(event.target.value); clearResult(); }} /><p className="pdf-option-hint">{ui.ownerPasswordHint}</p><label className="pdf-checkbox-option"><input type="checkbox" checked={restrictChanges} onChange={(event) => { setRestrictChanges(event.target.checked); clearResult(); }} /><span>{ui.restrictChanges}</span></label></div> : null}

        {tool === "unlock" && files.length > 0 ? <div className="pdf-options"><label className="pdf-field-label" htmlFor="pdf-unlock-password">{ui.password}</label><input id="pdf-unlock-password" className="pdf-range-input" type="password" autoComplete="current-password" value={password} placeholder={ui.passwordPlaceholder} onChange={(event) => { setPassword(event.target.value); clearResult(); }} /></div> : null}

        {error ? <p className="pdf-error" role="alert">{error}</p> : null}{progress ? <p className="pdf-progress" role="status">{progress}</p> : null}
        <div className="pdf-work-actions">{(imagesMode || multiPdfMode) && files.length > 0 && (!multiPdfMode || files.length < 2) ? <button type="button" className="pdf-secondary-button" onClick={() => inputRef.current?.click()} disabled={busy}>{copy.addFiles}</button> : <span />}<button type="button" className="pdf-action-button" onClick={() => { void process(); }} disabled={busy || files.length === 0 || (multiPdfMode && files.length < 2)}>{busy ? copy.processing : ui.start[tool]} <span aria-hidden>→</span></button></div>

        {result ? <div className="pdf-result" role="status"><div><strong>{copy.resultReady}</strong><span>{copy.originalSize}: {formatBytes(result.originalSize)} <b aria-hidden>→</b> {copy.resultSize}: {formatBytes(result.size)}</span></div><a href={result.url} download={result.filename} className="pdf-download-button">{copy.download} ↓</a></div> : null}
      </div>
      <aside className="pdf-work-aside"><div className="pdf-assurance"><span aria-hidden>⌁</span><div><strong>{copy.privacyTitle}</strong><p>{copy.privacyText}</p></div></div><div className="pdf-assurance"><span aria-hidden>✓</span><div><strong>{copy.noAccountTitle}</strong><p>{copy.noAccountText}</p></div></div></aside>
    </div>
  );
}
