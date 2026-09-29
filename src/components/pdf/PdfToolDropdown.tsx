"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { PDF_COPY, pdfUrl, type PdfLocale, type PdfTool } from "@/lib/pdf-tools";

const GROUPS: { key: "organize" | "optimize" | "convert" | "edit" | "security" | "review"; tools: PdfTool[] }[] = [
  { key: "organize", tools: ["merge", "split", "remove-pages", "extract-pages", "organize", "reverse-pages", "scan-to-pdf"] },
  { key: "optimize", tools: ["compress", "repair", "grayscale", "linearize"] },
  { key: "convert", tools: ["jpg-to-pdf", "pdf-to-jpg", "pdf-to-png", "pdf-to-text", "pdf-to-markdown"] },
  { key: "edit", tools: ["rotate", "page-numbers", "watermark", "crop", "resize", "edit", "sign", "redact", "fill-forms", "flatten-forms"] },
  { key: "security", tools: ["protect", "unlock"] },
  { key: "review", tools: ["compare"] },
];

const GROUP_LABELS: Record<PdfLocale, Record<(typeof GROUPS)[number]["key"], string>> = {
  "zh-hans": { organize: "整理 PDF", optimize: "优化 PDF", convert: "转换 PDF", edit: "编辑 PDF", security: "安全 PDF", review: "检查 PDF" },
  "zh-hant": { organize: "整理 PDF", optimize: "最佳化 PDF", convert: "轉換 PDF", edit: "編輯 PDF", security: "安全 PDF", review: "檢查 PDF" },
  en: { organize: "Organize PDF", optimize: "Optimize PDF", convert: "Convert PDF", edit: "Edit PDF", security: "Secure PDF", review: "Review PDF" },
};

const TOOL_GLYPHS: Record<PdfTool, string> = { merge: "⇄", split: "✂", "remove-pages": "×", "extract-pages": "▤", organize: "↕", "reverse-pages": "⇅", "scan-to-pdf": "⌑", compress: "↘", repair: "✣", grayscale: "◐", linearize: "⚡", "jpg-to-pdf": "▧", "pdf-to-jpg": "▣", "pdf-to-png": "▦", "pdf-to-text": "T", "pdf-to-markdown": "M", rotate: "↻", "page-numbers": "#", watermark: "W", crop: "⌗", resize: "↔", edit: "T+", sign: "✎", redact: "■", "fill-forms": "✓", "flatten-forms": "▱", protect: "⌾", unlock: "◌", compare: "≠" };

export function PdfToolDropdown({ locale, compact = false }: { locale: PdfLocale; compact?: boolean }) {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const pathname = usePathname();
  const copy = PDF_COPY[locale];

  useEffect(() => {
    function closeOnOutside(event: PointerEvent) {
      if (detailsRef.current && !detailsRef.current.contains(event.target as Node)) detailsRef.current.open = false;
    }
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape" && detailsRef.current?.open) {
        detailsRef.current.open = false;
        detailsRef.current.querySelector("summary")?.focus();
      }
    }
    document.addEventListener("pointerdown", closeOnOutside);
    document.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOnOutside);
      document.removeEventListener("keydown", closeOnEscape);
    };
  }, []);

  useEffect(() => { if (detailsRef.current) detailsRef.current.open = false; }, [pathname]);

  return (
    <details ref={detailsRef} className={`pdf-tool-dropdown${compact ? " pdf-tool-dropdown--compact" : ""}`}>
      <summary>{copy.allTools}<span className="pdf-dropdown-chevron" aria-hidden><svg viewBox="0 0 12 12" width="11" height="11"><path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg></span></summary>
      <div className="pdf-dropdown-panel">
        {GROUPS.map((group) => (
          <div className="pdf-dropdown-group" key={group.key}>
            <h2>{GROUP_LABELS[locale][group.key]}</h2>
            <ul>
              {group.tools.map((tool) => (
                <li key={tool}>
                  <a href={pdfUrl(locale, tool)} aria-current={pathname === pdfUrl(locale, tool) ? "page" : undefined}>
                    <span className={`pdf-dropdown-icon pdf-dropdown-icon--${tool}`} aria-hidden>{TOOL_GLYPHS[tool]}</span>
                    <span>{copy.toolsCopy[tool].title}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </details>
  );
}
