export const PDF_LOCALES = ["zh-hans", "zh-hant", "en"] as const;
export const PDF_TOOLS = [
  "merge", "split", "remove-pages", "extract-pages", "organize",
  "compress", "jpg-to-pdf", "pdf-to-jpg", "rotate", "page-numbers", "watermark",
] as const;

export const CORE_PDF_TOOLS = ["merge", "split", "remove-pages", "extract-pages", "compress", "rotate"] as const;

export type PdfLocale = (typeof PDF_LOCALES)[number];
export type PdfTool = (typeof PDF_TOOLS)[number];
export type CorePdfTool = (typeof CORE_PDF_TOOLS)[number];

export function isCorePdfTool(tool: PdfTool): tool is CorePdfTool {
  return CORE_PDF_TOOLS.includes(tool as CorePdfTool);
}

export function isPdfLocale(value: string): value is PdfLocale {
  return PDF_LOCALES.includes(value as PdfLocale);
}

export function isPdfTool(value: string): value is PdfTool {
  return PDF_TOOLS.includes(value as PdfTool);
}

export function pdfUrl(locale: PdfLocale, tool: PdfTool = "merge"): string {
  return `/${locale}/tools/pdf/${tool}/`;
}

export function pdfAlternates(locale: PdfLocale, tool?: PdfTool) {
  return {
    canonical: pdfUrl(locale, tool),
    languages: {
      "zh-Hans": pdfUrl("zh-hans", tool),
      "zh-Hant": pdfUrl("zh-hant", tool),
      en: pdfUrl("en", tool),
    },
  };
}

type ToolCopy = {
  title: string;
  description: string;
  detail: string;
  steps: [string, string, string];
  limitation: string;
};

type PdfCopy = {
  brandName: string;
  languageName: string;
  tools: string;
  home: string;
  allTools: string;
  moreTools: string;
  privacyTitle: string;
  privacyText: string;
  noAccountTitle: string;
  noAccountText: string;
  workflowTitle: string;
  limitationTitle: string;
  footer: string;
  chooseFiles: string;
  chooseFile: string;
  dropFiles: string;
  dropFile: string;
  pdfOnly: string;
  addFiles: string;
  clearAll: string;
  remove: string;
  moveUp: string;
  moveDown: string;
  fileCount: (count: number) => string;
  pageCount: (count: number) => string;
  pageRange: string;
  pageRangeHint: string;
  splitMode: string;
  extractTogether: string;
  splitEach: string;
  compressMode: string;
  preserveText: string;
  preserveTextHint: string;
  scannedPages: string;
  scannedPagesHint: string;
  quality: string;
  balanced: string;
  smaller: string;
  rasterWarning: string;
  start: Record<CorePdfTool, string>;
  processing: string;
  progress: (done: number, total: number) => string;
  download: string;
  resultReady: string;
  originalSize: string;
  resultSize: string;
  noReduction: string;
  previewHint: string;
  firstPage: string;
  invalidPdf: string;
  tooLarge: string;
  tooManyPages: string;
  needTwoFiles: string;
  needFile: string;
  invalidRange: string;
  cannotRemoveAll: string;
  pagesToRemove: string;
  pagesToExtract: string;
  rotation: string;
  clockwise: string;
  counterClockwise: string;
  processError: string;
  toolsCopy: Record<PdfTool, ToolCopy>;
};

export const PDF_COPY: Record<PdfLocale, PdfCopy> = {
  "zh-hans": {
    brandName: "PDF 工具盒",
    languageName: "简体中文", tools: "工具", home: "首页", allTools: "全部 PDF 工具",
    moreTools: "其他 PDF 工具", privacyTitle: "文件留在你的设备上",
    privacyText: "处理在当前浏览器中完成。本站不接收、存储或读取你的文件。",
    noAccountTitle: "打开就能用", noAccountText: "不用注册、登录或等待邮件。",
    workflowTitle: "使用方法", limitationTitle: "使用前了解", footer: "简单处理日常文件。",
    chooseFiles: "选择 PDF 文件", chooseFile: "选择 PDF 文件", dropFiles: "拖入 PDF 文件，或点击选择", dropFile: "拖入 PDF 文件，或点击选择",
    pdfOnly: "仅支持 PDF。你可以稍后继续添加文件。", addFiles: "继续添加", clearAll: "清空", remove: "移除", moveUp: "上移", moveDown: "下移",
    fileCount: (count) => `${count} 个文件`, pageCount: (count) => `${count} 页`, pageRange: "需要提取的页码",
    pageRangeHint: "例如 1-3,5,8。页码从 1 开始。", splitMode: "输出方式", extractTogether: "合成一份 PDF", splitEach: "每页分别保存为 ZIP",
    compressMode: "处理方式", preserveText: "保留文字与链接", preserveTextHint: "重新整理 PDF 结构，不改变页面画面；部分文件可能不会变小。",
    scannedPages: "缩小扫描页", scannedPagesHint: "将页面重绘为图片，适合扫描件；可能失去可选文字、链接和表单。",
    quality: "图片质量", balanced: "清晰优先", smaller: "体积优先", rasterWarning: "重绘会将整页变成图片。请先检查下载结果是否清晰、完整。",
    start: { merge: "合并 PDF", split: "拆分页码", "remove-pages": "移除页面", "extract-pages": "提取页面", compress: "压缩 PDF", rotate: "旋转 PDF" }, processing: "正在处理文件…",
    progress: (done, total) => `正在处理第 ${done} / ${total} 页`, download: "下载结果", resultReady: "文件已准备好",
    originalSize: "原文件", resultSize: "处理后", noReduction: "这份文件没有变小。已保留原文件供下载。",
    previewHint: "首页预览。请下载后检查整份文件的清晰度与完整性。", firstPage: "第一页",
    invalidPdf: "无法读取 PDF。请确认文件未损坏且未加密。", tooLarge: "文件超出当前设备的处理上限。请尝试较小的文件。",
    tooManyPages: "页数超出当前设备的处理上限。", needTwoFiles: "请至少添加两份 PDF。", needFile: "请先选择 PDF。",
    invalidRange: "页码范围无效。请检查页码是否在文件范围内。", cannotRemoveAll: "至少需要保留一页。", pagesToRemove: "要移除的页码", pagesToExtract: "要提取的页码", rotation: "旋转方向", clockwise: "顺时针 90°", counterClockwise: "逆时针 90°", processError: "处理失败。请检查文件后重试。",
    toolsCopy: {
      merge: { title: "合并 PDF", description: "按你指定的顺序，把多份 PDF 合成一个文件。", detail: "拖入文件，调整先后顺序，再下载合并结果。适合整理扫描件、附件和多份资料。", steps: ["添加至少两份 PDF", "用上下按钮调整顺序", "合并并下载新文件"], limitation: "加密文件暂不支持。交互式表单、书签和附件可能无法完整保留，请检查结果。" },
      split: { title: "拆分 PDF", description: "按页码提取需要的页面，或将每页分别保存。", detail: "输入页码范围，例如 1-3,5。可把选中的页面合成一份 PDF，也可将每页装入 ZIP。", steps: ["选择一份 PDF", "填写要保留的页码", "选择输出方式并下载"], limitation: "加密文件暂不支持。拆页会重新生成文件，书签和交互式表单可能无法完整保留。" },
      "remove-pages": { title: "移除 PDF 页面", description: "删掉不需要的页面，保留其余内容。", detail: "输入要移除的页码或范围，例如 2,4-6。至少保留一页。", steps: ["选择一份 PDF", "输入要移除的页码", "下载整理后的文件"], limitation: "移除的页面不会出现在新文件中。请在下载后核对页数与内容。" },
      "extract-pages": { title: "提取 PDF 页面", description: "把选定页面另存为一份 PDF。", detail: "输入要提取的页码或范围，新文件会按原页序排列。", steps: ["选择一份 PDF", "输入要提取的页码", "下载提取结果"], limitation: "书签和交互式表单可能无法完整保留。请检查结果。" },
      organize: { title: "整理 PDF 页面", description: "预览并调整页面顺序，再导出新的 PDF。", detail: "页面会以缩略图显示。用左右按钮调整顺序，确认后生成一份新文件。", steps: ["选择一份 PDF", "预览并调整页面顺序", "下载整理后的文件"], limitation: "单次最多处理 60 页。书签、附件和交互式表单可能无法完整保留。" },
      compress: { title: "压缩 PDF", description: "比较处理前后的大小，选择适合文件内容的方式。", detail: "先尝试保留文字的结构整理；扫描件可选择重绘页面来缩小体积，并在下载前确认结果。", steps: ["选择一份 PDF", "选择处理方式与质量", "比较大小并检查下载结果"], limitation: "压缩效果取决于原文件。扫描页重绘会失去可选文字、链接和表单，不保证达到指定大小。" },
      "jpg-to-pdf": { title: "JPG 转 PDF", description: "把多张 JPG 或 PNG 图片按顺序合成 PDF。", detail: "添加图片并调整顺序。每张图片会在保留比例的情况下放进独立页面。", steps: ["添加 JPG 或 PNG 图片", "调整图片顺序", "生成并下载 PDF"], limitation: "图片不会上传。超大图片会缩放到页面范围内，透明 PNG 会保留透明区域。" },
      "pdf-to-jpg": { title: "PDF 转 JPG", description: "把 PDF 的每一页转换成 JPG 图片并打包下载。", detail: "选择清晰度后开始转换。所有页面会保存为编号 JPG，并放入一个 ZIP 文件。", steps: ["选择一份 PDF", "选择图片清晰度", "下载包含所有 JPG 的 ZIP"], limitation: "单次最多转换 40 页。转换后的图片不包含可选文字、链接或表单。" },
      rotate: { title: "旋转 PDF", description: "将所有页面顺时针或逆时针旋转 90°。", detail: "选择旋转方向，处理后下载新的 PDF。", steps: ["选择一份 PDF", "选择旋转方向", "下载旋转后的文件"], limitation: "此工具会旋转所有页面。建议下载后检查页面方向。" },
      "page-numbers": { title: "添加 PDF 页码", description: "为每一页添加连续页码，并选择显示位置。", detail: "设置起始数字和页码位置。页码会直接写入每一页的边距区域。", steps: ["选择一份 PDF", "设置位置和起始数字", "下载带页码的文件"], limitation: "页码使用标准数字字体。建议下载后检查是否与原页面内容重叠。" },
      watermark: { title: "PDF 加水印", description: "在 PDF 的每一页添加自定义文字水印。", detail: "输入中英文水印文字并选择透明度，工具会把倾斜水印放在每页中央。", steps: ["选择一份 PDF", "输入水印文字并设置透明度", "下载加水印的文件"], limitation: "水印会嵌入页面内容。请确认文字、透明度和页面可读性后再使用。" },
    },
  },
  "zh-hant": {
    brandName: "PDF 工具盒",
    languageName: "繁體中文", tools: "工具", home: "首頁", allTools: "全部 PDF 工具",
    moreTools: "其他 PDF 工具", privacyTitle: "檔案留在你的裝置上",
    privacyText: "處理在目前的瀏覽器中完成。本站不會接收、儲存或讀取你的檔案。",
    noAccountTitle: "開啟就能用", noAccountText: "不用註冊、登入或等待電子郵件。",
    workflowTitle: "使用方式", limitationTitle: "使用前須知", footer: "輕鬆處理日常檔案。",
    chooseFiles: "選擇 PDF 檔案", chooseFile: "選擇 PDF 檔案", dropFiles: "拖入 PDF 檔案，或點按選擇", dropFile: "拖入 PDF 檔案，或點按選擇",
    pdfOnly: "僅支援 PDF。稍後仍可繼續加入檔案。", addFiles: "繼續加入", clearAll: "清除全部", remove: "移除", moveUp: "上移", moveDown: "下移",
    fileCount: (count) => `${count} 個檔案`, pageCount: (count) => `${count} 頁`, pageRange: "要擷取的頁碼",
    pageRangeHint: "例如 1-3,5,8。頁碼從 1 開始。", splitMode: "輸出方式", extractTogether: "合成一份 PDF", splitEach: "每頁分別儲存為 ZIP",
    compressMode: "處理方式", preserveText: "保留文字與連結", preserveTextHint: "重新整理 PDF 結構，不改變頁面外觀；部分檔案可能不會變小。",
    scannedPages: "縮小掃描頁", scannedPagesHint: "將頁面重新繪製為圖片，適合掃描檔；可能失去可選取文字、連結及表單。",
    quality: "圖片品質", balanced: "清晰優先", smaller: "檔案大小優先", rasterWarning: "重新繪製會把整頁變成圖片。請先確認下載結果清晰且完整。",
    start: { merge: "合併 PDF", split: "分割頁面", "remove-pages": "移除頁面", "extract-pages": "擷取頁面", compress: "壓縮 PDF", rotate: "旋轉 PDF" }, processing: "正在處理檔案…",
    progress: (done, total) => `正在處理第 ${done} / ${total} 頁`, download: "下載結果", resultReady: "檔案已準備好",
    originalSize: "原始檔案", resultSize: "處理後", noReduction: "這份檔案沒有變小。已保留原始檔案供下載。",
    previewHint: "首頁預覽。請下載後檢查整份檔案的清晰度與完整性。", firstPage: "第一頁",
    invalidPdf: "無法讀取 PDF。請確認檔案未損壞且未加密。", tooLarge: "檔案超出目前裝置的處理上限。請嘗試較小的檔案。",
    tooManyPages: "頁數超出目前裝置的處理上限。", needTwoFiles: "請至少加入兩份 PDF。", needFile: "請先選擇 PDF。",
    invalidRange: "頁碼範圍無效。請確認頁碼在檔案範圍內。", cannotRemoveAll: "至少需要保留一頁。", pagesToRemove: "要移除的頁碼", pagesToExtract: "要擷取的頁碼", rotation: "旋轉方向", clockwise: "順時針 90°", counterClockwise: "逆時針 90°", processError: "處理失敗。請檢查檔案後重試。",
    toolsCopy: {
      merge: { title: "合併 PDF", description: "依照指定順序，把多份 PDF 合成一個檔案。", detail: "拖入檔案、調整順序，再下載合併結果。適合整理掃描檔、附件與多份資料。", steps: ["加入至少兩份 PDF", "用上下按鈕調整順序", "合併並下載新檔案"], limitation: "暫不支援加密檔案。互動式表單、書籤與附件可能無法完整保留，請檢查結果。" },
      split: { title: "分割 PDF", description: "依頁碼擷取需要的頁面，或將每頁分別儲存。", detail: "輸入頁碼範圍，例如 1-3,5。可將選取頁面合成一份 PDF，也能把每頁收進 ZIP。", steps: ["選擇一份 PDF", "填入要保留的頁碼", "選擇輸出方式並下載"], limitation: "暫不支援加密檔案。分割會重新產生檔案，書籤與互動式表單可能無法完整保留。" },
      "remove-pages": { title: "移除 PDF 頁面", description: "刪除不需要的頁面，保留其他內容。", detail: "輸入要移除的頁碼或範圍，例如 2,4-6。至少保留一頁。", steps: ["選擇一份 PDF", "輸入要移除的頁碼", "下載整理後的檔案"], limitation: "移除的頁面不會出現在新檔案中。請下載後核對頁數與內容。" },
      "extract-pages": { title: "擷取 PDF 頁面", description: "將選取頁面另存為一份 PDF。", detail: "輸入要擷取的頁碼或範圍，新檔案會依原頁序排列。", steps: ["選擇一份 PDF", "輸入要擷取的頁碼", "下載擷取結果"], limitation: "書籤與互動式表單可能無法完整保留，請檢查結果。" },
      organize: { title: "整理 PDF 頁面", description: "預覽並調整頁面順序，再匯出新的 PDF。", detail: "頁面會以縮圖顯示。用左右按鈕調整順序，確認後產生新檔案。", steps: ["選擇一份 PDF", "預覽並調整頁面順序", "下載整理後的檔案"], limitation: "單次最多處理 60 頁。書籤、附件與互動式表單可能無法完整保留。" },
      compress: { title: "壓縮 PDF", description: "比較處理前後的大小，選擇適合檔案內容的方式。", detail: "先嘗試保留文字的結構整理；掃描檔可選擇重新繪製頁面縮小體積，並在下載後確認結果。", steps: ["選擇一份 PDF", "選擇處理方式與品質", "比較大小並檢查下載結果"], limitation: "壓縮效果取決於原始檔案。掃描頁重新繪製會失去可選取文字、連結和表單，不保證達到指定大小。" },
      "jpg-to-pdf": { title: "JPG 轉 PDF", description: "把多張 JPG 或 PNG 圖片依序合成 PDF。", detail: "加入圖片並調整順序。每張圖片會保留比例並放入獨立頁面。", steps: ["加入 JPG 或 PNG 圖片", "調整圖片順序", "產生並下載 PDF"], limitation: "圖片不會上傳。超大圖片會縮放到頁面範圍內，透明 PNG 會保留透明區域。" },
      "pdf-to-jpg": { title: "PDF 轉 JPG", description: "將 PDF 的每一頁轉成 JPG 圖片並打包下載。", detail: "選擇清晰度後開始轉換。所有頁面會儲存為編號 JPG，並放入一個 ZIP 檔案。", steps: ["選擇一份 PDF", "選擇圖片清晰度", "下載包含所有 JPG 的 ZIP"], limitation: "單次最多轉換 40 頁。轉換後的圖片不包含可選取文字、連結或表單。" },
      rotate: { title: "旋轉 PDF", description: "將所有頁面順時針或逆時針旋轉 90°。", detail: "選擇旋轉方向，處理後下載新的 PDF。", steps: ["選擇一份 PDF", "選擇旋轉方向", "下載旋轉後的檔案"], limitation: "此工具會旋轉所有頁面。建議下載後檢查頁面方向。" },
      "page-numbers": { title: "加入 PDF 頁碼", description: "為每一頁加入連續頁碼，並選擇顯示位置。", detail: "設定起始數字和頁碼位置。頁碼會直接寫入每一頁的邊距區域。", steps: ["選擇一份 PDF", "設定位置和起始數字", "下載帶頁碼的檔案"], limitation: "頁碼使用標準數字字型。建議下載後檢查是否與原頁面內容重疊。" },
      watermark: { title: "PDF 加浮水印", description: "在 PDF 的每一頁加入自訂文字浮水印。", detail: "輸入中英文浮水印文字並選擇透明度，工具會把傾斜浮水印放在每頁中央。", steps: ["選擇一份 PDF", "輸入浮水印文字並設定透明度", "下載加浮水印的檔案"], limitation: "浮水印會嵌入頁面內容。請確認文字、透明度及頁面可讀性後再使用。" },
    },
  },
  en: {
    brandName: "PDF Toolbox",
    languageName: "English", tools: "Tools", home: "Home", allTools: "All PDF tools",
    moreTools: "More PDF tools", privacyTitle: "Files stay on your device",
    privacyText: "Processing runs in this browser. This site does not receive, store, or read your files.",
    noAccountTitle: "Ready when you are", noAccountText: "No account, sign-in, or confirmation email.",
    workflowTitle: "How it works", limitationTitle: "Before you start", footer: "Simple tools for everyday files.",
    chooseFiles: "Choose PDF files", chooseFile: "Choose a PDF", dropFiles: "Drop PDF files here, or choose files", dropFile: "Drop a PDF here, or choose a file",
    pdfOnly: "PDF files only. You can add more files later.", addFiles: "Add more files", clearAll: "Clear all", remove: "Remove", moveUp: "Move up", moveDown: "Move down",
    fileCount: (count) => `${count} ${count === 1 ? "file" : "files"}`, pageCount: (count) => `${count} ${count === 1 ? "page" : "pages"}`,
    pageRange: "Pages to extract", pageRangeHint: "For example: 1-3,5,8. Page numbers start at 1.", splitMode: "Output",
    extractTogether: "One PDF with selected pages", splitEach: "Separate pages in a ZIP",
    compressMode: "Method", preserveText: "Keep text and links", preserveTextHint: "Repack the PDF without changing its appearance. Some files may not get smaller.",
    scannedPages: "Reduce scanned pages", scannedPagesHint: "Renders each page as an image. Best for scans; selectable text, links, and forms may be lost.",
    quality: "Image quality", balanced: "Favor clarity", smaller: "Favor smaller size", rasterWarning: "Rendering turns each page into an image. Check the downloaded result for clarity and completeness.",
    start: { merge: "Merge PDF", split: "Split PDF", "remove-pages": "Remove pages", "extract-pages": "Extract pages", compress: "Compress PDF", rotate: "Rotate PDF" }, processing: "Processing your file…",
    progress: (done, total) => `Processing page ${done} of ${total}`, download: "Download result", resultReady: "Your file is ready",
    originalSize: "Original", resultSize: "After processing", noReduction: "This file did not get smaller. The original is available to download.",
    previewHint: "First-page preview. Check the full download for clarity and completeness.", firstPage: "First page",
    invalidPdf: "We couldn't read this PDF. Check that it is not damaged or encrypted.", tooLarge: "This file exceeds the current device limit. Try a smaller file.",
    tooManyPages: "This document has too many pages for the current device limit.", needTwoFiles: "Add at least two PDF files.", needFile: "Choose a PDF first.",
    invalidRange: "The page range is invalid. Check that every page exists in the document.", cannotRemoveAll: "At least one page must remain.", pagesToRemove: "Pages to remove", pagesToExtract: "Pages to extract", rotation: "Rotation", clockwise: "Clockwise 90°", counterClockwise: "Counterclockwise 90°", processError: "Processing failed. Check the file and try again.",
    toolsCopy: {
      merge: { title: "Merge PDF", description: "Combine PDFs into one file in the order you choose.", detail: "Add files, arrange them, and download one PDF. Useful for scans, attachments, and related documents.", steps: ["Add at least two PDFs", "Use the arrows to arrange them", "Merge and download the new file"], limitation: "Encrypted files are not supported. Interactive forms, bookmarks, and attachments may not be fully preserved; check the result." },
      split: { title: "Split PDF", description: "Extract the pages you need or save pages separately.", detail: "Enter a range such as 1-3,5. Keep selected pages in one PDF or download each page in a ZIP.", steps: ["Choose a PDF", "Enter the pages to keep", "Choose an output and download"], limitation: "Encrypted files are not supported. Splitting recreates the document, so bookmarks and interactive forms may not be fully preserved." },
      "remove-pages": { title: "Remove PDF pages", description: "Delete unwanted pages and keep the rest.", detail: "Enter page numbers or ranges to remove, such as 2,4-6. At least one page must remain.", steps: ["Choose a PDF", "Enter pages to remove", "Download the updated file"], limitation: "Removed pages are absent from the new file. Check the page count and content after downloading." },
      "extract-pages": { title: "Extract PDF pages", description: "Save selected pages as a separate PDF.", detail: "Enter page numbers or ranges to extract. Pages remain in their original order.", steps: ["Choose a PDF", "Enter pages to extract", "Download the result"], limitation: "Bookmarks and interactive forms may not survive extraction. Check the result." },
      organize: { title: "Organize PDF pages", description: "Preview and rearrange pages before exporting a new PDF.", detail: "Pages appear as thumbnails. Use the arrow controls to change their order, then create a new file.", steps: ["Choose a PDF", "Preview and rearrange pages", "Download the organized file"], limitation: "Up to 60 pages per file. Bookmarks, attachments, and interactive forms may not be fully preserved." },
      compress: { title: "Compress PDF", description: "Compare file size before and after choosing a method.", detail: "Try structure optimization to keep text. For scanned documents, render pages to reduce size, then check the result.", steps: ["Choose a PDF", "Select a method and quality", "Compare sizes and inspect the download"], limitation: "Results depend on the source file. Rendering scans removes selectable text, links, and forms, and cannot guarantee a target size." },
      "jpg-to-pdf": { title: "JPG to PDF", description: "Combine JPG or PNG images into one PDF in your chosen order.", detail: "Add images and arrange them. Each image is placed on its own page while keeping its proportions.", steps: ["Add JPG or PNG images", "Arrange the images", "Create and download the PDF"], limitation: "Images stay on your device. Large images are scaled to fit the page, and transparent PNG areas remain transparent." },
      "pdf-to-jpg": { title: "PDF to JPG", description: "Convert every PDF page to a JPG image and download them together.", detail: "Choose an image quality and start. Numbered JPG files are placed in a single ZIP download.", steps: ["Choose a PDF", "Select image quality", "Download the ZIP of JPG files"], limitation: "Up to 40 pages per file. Images do not retain selectable text, links, or forms." },
      rotate: { title: "Rotate PDF", description: "Turn every page 90° clockwise or counterclockwise.", detail: "Choose the direction, then download a new PDF.", steps: ["Choose a PDF", "Choose the direction", "Download the rotated file"], limitation: "This tool rotates every page. Check the page orientation after downloading." },
      "page-numbers": { title: "Add PDF page numbers", description: "Add consecutive page numbers and choose where they appear.", detail: "Set the starting number and position. Numbers are written directly into the margin of every page.", steps: ["Choose a PDF", "Set the position and starting number", "Download the numbered file"], limitation: "Page numbers use a standard numeric font. Check that they do not overlap the original page content." },
      watermark: { title: "Watermark PDF", description: "Add a custom text watermark to every PDF page.", detail: "Enter watermark text and choose its opacity. A diagonal watermark is placed across the center of each page.", steps: ["Choose a PDF", "Enter text and set opacity", "Download the watermarked file"], limitation: "The watermark becomes part of the page. Check its text, opacity, and readability before using the file." },
    },
  },
};
