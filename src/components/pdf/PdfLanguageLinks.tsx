"use client";

import { usePathname } from "next/navigation";
import { PDF_LOCALES, isPdfTool, pdfUrl, type PdfLocale } from "@/lib/pdf-tools";

const LABELS: Record<PdfLocale, string> = { "zh-hans": "简", "zh-hant": "繁", en: "EN" };
const LANGS: Record<PdfLocale, string> = { "zh-hans": "zh-Hans", "zh-hant": "zh-Hant", en: "en" };

export function PdfLanguageLinks({ locale }: { locale: PdfLocale }) {
  const pathname = usePathname();
  const segment = pathname.split("/").filter(Boolean)[3];
  const tool = segment && isPdfTool(segment) ? segment : undefined;
  return (
    <div className="pdf-language-links" aria-label="Language">
      {PDF_LOCALES.map((target) => <a key={target} href={pdfUrl(target, tool)} lang={LANGS[target]} aria-current={locale === target ? "page" : undefined}>{LABELS[target]}</a>)}
    </div>
  );
}
