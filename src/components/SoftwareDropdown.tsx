"use client";

// 主站导航的「软件产品」下拉：原生应用（后台数据，仅已发布）+ PDF 工具盒产品入口。
// 交互骨架与 PdfToolDropdown 一致（details/summary + 外点/Esc 关闭），
// 共用其下拉样式类，产品行样式见 globals.css 的 .software-app-*。
import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { AppIcon } from "@/components/AppIcon";
import { useLanguage } from "@/components/LanguageProvider";
import { PDF_COPY, PDF_TOOLS, pdfUrl, type PdfLocale } from "@/lib/pdf-tools";

export function SoftwareDropdown({ compact = false }: { compact?: boolean }) {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const pathname = usePathname();
  const { language, text, products } = useLanguage();
  const locale: PdfLocale = language === "zh" ? "zh-hans" : "en";
  const released = products.filter((product) => !product.draft);
  const pdfCopy = PDF_COPY[locale];
  const pdfProductUrl = pdfUrl(locale);
  const pdfCategory = language === "zh" ? `${PDF_TOOLS.length} 个 PDF 工具` : `${PDF_TOOLS.length} PDF tools`;

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
      <summary>{text.productsLabel}<span className="pdf-dropdown-chevron" aria-hidden><svg viewBox="0 0 12 12" width="11" height="11"><path d="M2.5 4.5 6 8l3.5-3.5" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" /></svg></span></summary>
      <div className="pdf-dropdown-panel">
        <div className="pdf-dropdown-group">
          <h2>{text.appsGroupLabel}</h2>
          <ul>
            {released.map((product) => (
              <li key={product.id}>
                <a href={product.url}>
                  <span className="software-app-icon"><AppIcon icon={product.icon} gradient={product.accent} iconSrc={product.iconSrc} size={27} /></span>
                  <span className="software-app-copy"><strong>{product.name}</strong><small>{product.category}</small></span>
                </a>
              </li>
            ))}
          </ul>
        </div>
        <div className="pdf-dropdown-group">
          <h2>{text.toolsGroupLabel}</h2>
          <ul>
            <li>
              <a href={pdfProductUrl} aria-current={pathname.startsWith(`/${locale}/tools/pdf/`) ? "page" : undefined}>
                <img className="software-pdf-product-icon" src="/icons/pdf-toolbox-v2.webp" alt="" aria-hidden />
                <span className="software-app-copy"><strong>{pdfCopy.brandName}</strong><small>{pdfCategory}</small></span>
              </a>
            </li>
          </ul>
        </div>
      </div>
    </details>
  );
}
