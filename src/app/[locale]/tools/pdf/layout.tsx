import { notFound } from "next/navigation";
import { PdfLanguageLinks } from "@/components/pdf/PdfLanguageLinks";
import { PdfToolDropdown } from "@/components/pdf/PdfToolDropdown";
import { PDF_COPY, PDF_LOCALES, isPdfLocale, pdfUrl } from "@/lib/pdf-tools";
import "./tools.css";

export const revalidate = 60;
export const dynamicParams = false;

export function generateStaticParams() {
  return PDF_LOCALES.map((locale) => ({ locale }));
}

export default async function PdfLayout({ children, params }: { children: React.ReactNode; params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isPdfLocale(locale)) notFound();
  const copy = PDF_COPY[locale];

  return (
    <div className="pdf-site">
      <header className="pdf-site-header">
        <nav className="pdf-site-nav" aria-label={copy.tools}>
          <a href={pdfUrl(locale)} className="pdf-brand">
            <img src="/icons/pdf-toolbox-v2.webp" className="pdf-brand-product-icon" alt="" aria-hidden />
            <strong>{copy.brandName}</strong>
          </a>
          <div className="pdf-header-links">
            {(["merge", "split", "compress"] as const).map((tool) => <a key={tool} href={pdfUrl(locale, tool)}>{copy.toolsCopy[tool].title}</a>)}
            <PdfToolDropdown locale={locale} />
          </div>
          <div className="pdf-mobile-menu"><PdfToolDropdown locale={locale} compact /></div>
          <PdfLanguageLinks locale={locale} />
        </nav>
      </header>
      {children}
      <footer className="pdf-site-footer"><a href={pdfUrl(locale, "merge")} className="pdf-footer-brand">{copy.brandName}</a><p>{copy.footer}</p><div className="pdf-footer-tools">{(["merge", "split", "compress"] as const).map((tool) => <a key={tool} href={pdfUrl(locale, tool)}>{copy.toolsCopy[tool].title}</a>)}</div></footer>
    </div>
  );
}
