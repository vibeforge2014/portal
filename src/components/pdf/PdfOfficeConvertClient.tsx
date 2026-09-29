"use client";

import { useEffect, useRef, useState } from "react";
import { PDF_COPY, type PdfLocale } from "@/lib/pdf-tools";

export type PdfOfficeTool = "pdf-to-word" | "word-to-pdf";

type JobState = "queued" | "analyzing" | "ocr" | "converting" | "ready" | "failed" | "expired";
type Job = {
  jobId: string;
  token: string;
  status: JobState;
  expiresAt: string;
  output?: { filename: string; mimeType: string; size: number };
  error?: { code: string };
};

const MAX_FILE_BYTES = 10 * 1024 * 1024;
const MAX_PDF_PAGES = 60;
const POLL_INTERVAL_MS = 1500;

const UI = {
  "zh-hans": {
    choosePdf: "选择 PDF 文件", chooseWord: "选择 Word 文件", dropPdf: "拖入 PDF 文件，或点击选择", dropWord: "拖入 DOC 或 DOCX 文件，或点击选择",
    pdfHint: "最大 10 MB、60 页。扫描件会自动进行中英文 OCR。", wordHint: "最大 10 MB。支持 DOC 和 DOCX。", invalidPdf: "请选择有效且未加密的 PDF 文件。", invalidWord: "请选择有效的 DOC 或 DOCX 文件。",
    tooLarge: "文件不能超过 10 MB。", tooManyPages: "PDF 不能超过 60 页。", upload: "上传并转换", clear: "移除", preparing: "正在准备上传…", queued: "已进入转换队列…", analyzing: "正在分析文档…", ocr: "正在识别扫描页文字…", converting: "正在转换文件…", ready: "转换完成", failed: "转换失败，请检查文件后重试。", unavailable: "转换服务暂时不可用，请稍后重试。", expired: "转换结果已过期，请重新上传。", download: "下载结果", downloading: "正在下载…", original: "原文件", result: "转换结果",
    privacyTitle: "仅临时处理文件", privacyText: "文件会安全上传到本站的转换服务器。下载后立即删除，未下载文件最长保留 15 分钟。", noAccountTitle: "无需注册", noAccountText: "无需账号或邮箱，转换完成后可直接下载。",
  },
  "zh-hant": {
    choosePdf: "選擇 PDF 檔案", chooseWord: "選擇 Word 檔案", dropPdf: "拖入 PDF 檔案，或點按選擇", dropWord: "拖入 DOC 或 DOCX 檔案，或點按選擇",
    pdfHint: "最大 10 MB、60 頁。掃描檔會自動進行中英文 OCR。", wordHint: "最大 10 MB。支援 DOC 與 DOCX。", invalidPdf: "請選擇有效且未加密的 PDF 檔案。", invalidWord: "請選擇有效的 DOC 或 DOCX 檔案。",
    tooLarge: "檔案不能超過 10 MB。", tooManyPages: "PDF 不能超過 60 頁。", upload: "上傳並轉換", clear: "移除", preparing: "正在準備上傳…", queued: "已進入轉換佇列…", analyzing: "正在分析文件…", ocr: "正在辨識掃描頁文字…", converting: "正在轉換檔案…", ready: "轉換完成", failed: "轉換失敗，請檢查檔案後重試。", unavailable: "轉換服務暫時無法使用，請稍後重試。", expired: "轉換結果已過期，請重新上傳。", download: "下載結果", downloading: "正在下載…", original: "原檔案", result: "轉換結果",
    privacyTitle: "僅暫時處理檔案", privacyText: "檔案會安全上傳到本站的轉換伺服器。下載後立即刪除，未下載檔案最長保留 15 分鐘。", noAccountTitle: "無需註冊", noAccountText: "無需帳號或電子郵件，轉換完成後可直接下載。",
  },
  en: {
    choosePdf: "Choose a PDF", chooseWord: "Choose a Word document", dropPdf: "Drop a PDF here, or choose a file", dropWord: "Drop a DOC or DOCX here, or choose a file",
    pdfHint: "Up to 10 MB and 60 pages. Scanned pages are recognized automatically.", wordHint: "Up to 10 MB. DOC and DOCX are supported.", invalidPdf: "Choose a valid, unencrypted PDF.", invalidWord: "Choose a valid DOC or DOCX document.",
    tooLarge: "The file must be 10 MB or smaller.", tooManyPages: "The PDF must have no more than 60 pages.", upload: "Upload and convert", clear: "Remove", preparing: "Preparing the upload…", queued: "Waiting in the conversion queue…", analyzing: "Analyzing the document…", ocr: "Recognizing text on scanned pages…", converting: "Converting the file…", ready: "Conversion complete", failed: "Conversion failed. Check the file and try again.", unavailable: "The conversion service is temporarily unavailable. Try again later.", expired: "The result has expired. Upload the file again.", download: "Download result", downloading: "Downloading…", original: "Original", result: "Result",
    privacyTitle: "Temporary processing only", privacyText: "Your file is securely uploaded to this site's conversion server. It is deleted after download or within 15 minutes.", noAccountTitle: "No account needed", noAccountText: "Convert and download without an account or email address.",
  },
} as const;

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function errorCopy(code: string | undefined, locale: PdfLocale, tool: PdfOfficeTool): string {
  const ui = UI[locale];
  if (code === "FILE_TOO_LARGE") return ui.tooLarge;
  if (code === "PAGE_LIMIT_EXCEEDED") return ui.tooManyPages;
  if (code === "INVALID_TYPE" || code === "ENCRYPTED_PDF") return tool === "pdf-to-word" ? ui.invalidPdf : ui.invalidWord;
  if (code === "JOB_EXPIRED") return ui.expired;
  if (code === "QUEUE_FULL") return ui.unavailable;
  return ui.failed;
}

export function PdfOfficeConvertClient({ locale, tool }: { locale: PdfLocale; tool: PdfOfficeTool }) {
  const copy = PDF_COPY[locale];
  const ui = UI[locale];
  const inputRef = useRef<HTMLInputElement>(null);
  const pollAbortRef = useRef<AbortController | null>(null);
  const resultUrlRef = useRef<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [pages, setPages] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);
  const [busy, setBusy] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [status, setStatus] = useState<JobState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [job, setJob] = useState<Job | null>(null);
  const [resultUrl, setResultUrl] = useState<string | null>(null);

  useEffect(() => () => {
    pollAbortRef.current?.abort();
    if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
  }, []);

  function resetResult() {
    pollAbortRef.current?.abort();
    pollAbortRef.current = null;
    if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
    resultUrlRef.current = null;
    setResultUrl(null);
    setJob(null);
    setStatus(null);
  }

  function clearFile() {
    resetResult();
    setFile(null);
    setPages(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function chooseFile(incoming: FileList | File[]) {
    const candidate = Array.from(incoming)[0];
    if (!candidate) return;
    resetResult();
    setError(null);
    setFile(null);
    setPages(null);
    const name = candidate.name.toLowerCase();
    const valid = tool === "pdf-to-word" ? name.endsWith(".pdf") : name.endsWith(".doc") || name.endsWith(".docx");
    if (!valid || candidate.size === 0) { setError(tool === "pdf-to-word" ? ui.invalidPdf : ui.invalidWord); return; }
    if (candidate.size > MAX_FILE_BYTES) { setError(ui.tooLarge); return; }
    if (tool === "pdf-to-word") {
      setBusy(true);
      try {
        const { inspectPdf } = await import("@/lib/pdf-operations");
        const count = await inspectPdf(candidate);
        if (count < 1 || count > MAX_PDF_PAGES) { setError(ui.tooManyPages); return; }
        setPages(count);
      } catch {
        setError(ui.invalidPdf);
        return;
      } finally {
        setBusy(false);
      }
    }
    setFile(candidate);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function poll(nextJob: Job, signal: AbortSignal) {
    let current = nextJob;
    while (!signal.aborted) {
      await new Promise<void>((resolve) => window.setTimeout(resolve, POLL_INTERVAL_MS));
      const response = await fetch(`/api/pdf-convert/jobs/${encodeURIComponent(current.jobId)}/`, { headers: { "X-Job-Token": current.token }, cache: "no-store", signal });
      if (!response.ok) throw new Error(response.status === 404 || response.status === 410 ? "JOB_EXPIRED" : "SERVICE_UNAVAILABLE");
      current = { ...await response.json() as Omit<Job, "token">, token: current.token };
      setJob(current);
      setStatus(current.status);
      if (current.status === "ready") return;
      if (current.status === "failed" || current.status === "expired") throw new Error(current.error?.code || "CONVERSION_FAILED");
    }
  }

  async function startConversion() {
    if (!file) return;
    resetResult();
    setBusy(true);
    setStatus("queued");
    setError(null);
    const controller = new AbortController();
    pollAbortRef.current = controller;
    try {
      const form = new FormData();
      form.set("operation", tool);
      form.set("locale", locale);
      form.set("file", file);
      const response = await fetch("/api/pdf-convert/jobs/", { method: "POST", body: form, signal: controller.signal });
      if (!response.ok) {
        const payload = await response.json().catch(() => ({})) as { error?: { code?: string } };
        throw new Error(payload.error?.code || "SERVICE_UNAVAILABLE");
      }
      const created = await response.json() as Job;
      setJob(created);
      setStatus(created.status);
      await poll(created, controller.signal);
    } catch (cause) {
      if (controller.signal.aborted) return;
      const code = cause instanceof Error ? cause.message : undefined;
      setError(code === "SERVICE_UNAVAILABLE" ? ui.unavailable : errorCopy(code, locale, tool));
      setStatus(null);
    } finally {
      if (!controller.signal.aborted) setBusy(false);
    }
  }

  async function downloadResult() {
    if (!job || job.status !== "ready" || !job.output) return;
    setDownloading(true);
    setError(null);
    try {
      const response = await fetch(`/api/pdf-convert/jobs/${encodeURIComponent(job.jobId)}/download/`, { headers: { "X-Job-Token": job.token }, cache: "no-store" });
      if (!response.ok) throw new Error(response.status === 404 || response.status === 410 ? "JOB_EXPIRED" : "SERVICE_UNAVAILABLE");
      const blob = await response.blob();
      if (resultUrlRef.current) URL.revokeObjectURL(resultUrlRef.current);
      const url = URL.createObjectURL(blob);
      resultUrlRef.current = url;
      setResultUrl(url);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = job.output.filename;
      anchor.click();
      void fetch(`/api/pdf-convert/jobs/${encodeURIComponent(job.jobId)}/`, { method: "DELETE", headers: { "X-Job-Token": job.token } });
    } catch (cause) {
      const code = cause instanceof Error ? cause.message : undefined;
      setError(code === "SERVICE_UNAVAILABLE" ? ui.unavailable : errorCopy(code, locale, tool));
    } finally {
      setDownloading(false);
    }
  }

  const statusText = status ? ui[status] : null;
  const accept = tool === "pdf-to-word" ? ".pdf,application/pdf" : ".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

  return (
    <div className="pdf-workspace">
      <div className="pdf-work-main">
        <div className="pdf-work-heading"><h2>{copy.toolsCopy[tool].title}</h2><p>{copy.toolsCopy[tool].description}</p></div>
        <input ref={inputRef} className="pdf-visually-hidden" type="file" accept={accept} onChange={(event) => { void chooseFile(event.target.files ?? []); }} aria-label={tool === "pdf-to-word" ? ui.choosePdf : ui.chooseWord} />
        <button type="button" className={`pdf-dropzone${dragging ? " pdf-dropzone--active" : ""}`} disabled={busy} onClick={() => inputRef.current?.click()} onDragEnter={(event) => { event.preventDefault(); setDragging(true); }} onDragOver={(event) => event.preventDefault()} onDragLeave={(event) => { event.preventDefault(); setDragging(false); }} onDrop={(event) => { event.preventDefault(); setDragging(false); void chooseFile(event.dataTransfer.files); }}>
          <span className="pdf-upload-icon" aria-hidden>＋</span><strong>{tool === "pdf-to-word" ? ui.dropPdf : ui.dropWord}</strong><span>{tool === "pdf-to-word" ? ui.pdfHint : ui.wordHint}</span>
        </button>
        {file ? <div className="pdf-files" aria-live="polite"><ol className="pdf-file-list"><li><span className="pdf-file-glyph" aria-hidden><i /><i /><i /></span><span className="pdf-file-info"><strong title={file.name}>{file.name}</strong><small>{pages ? `${copy.pageCount(pages)} · ` : ""}{formatBytes(file.size)}</small></span><span className="pdf-file-actions"><button type="button" aria-label={`${ui.clear}: ${file.name}`} disabled={busy} onClick={clearFile}>×</button></span></li></ol></div> : null}
        {error ? <p className="pdf-error" role="alert">{error}</p> : null}
        {statusText ? <p className="pdf-progress" role="status">{statusText}</p> : null}
        <div className="pdf-work-actions"><span /><button type="button" className="pdf-action-button" disabled={!file || busy || status === "ready"} onClick={() => { void startConversion(); }}>{busy ? (statusText || ui.preparing) : ui.upload} <span aria-hidden>→</span></button></div>
        {job?.status === "ready" && job.output ? <div className="pdf-result" role="status"><div><strong>{ui.ready}</strong><span>{ui.original}: {formatBytes(file?.size ?? 0)} <b aria-hidden>→</b> {ui.result}: {formatBytes(job.output.size)}</span></div><button type="button" className="pdf-download-button" disabled={downloading} onClick={() => { void downloadResult(); }}>{downloading ? ui.downloading : ui.download} ↓</button>{resultUrl ? <a className="pdf-visually-hidden" href={resultUrl} download={job.output.filename}>Download</a> : null}</div> : null}
      </div>
      <aside className="pdf-work-aside"><div className="pdf-assurance"><span aria-hidden>⌁</span><div><strong>{ui.privacyTitle}</strong><p>{ui.privacyText}</p></div></div><div className="pdf-assurance"><span aria-hidden>✓</span><div><strong>{ui.noAccountTitle}</strong><p>{ui.noAccountText}</p></div></div></aside>
    </div>
  );
}
