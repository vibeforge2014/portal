import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PDF_COPY, PDF_TOOLS, isPdfLocale, pdfAlternates, pdfUrl } from "@/lib/pdf-tools";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  if (!isPdfLocale(locale)) notFound();
  const copy = PDF_COPY[locale];
  return {
    metadataBase: new URL("https://zensoft.top"),
    title: `${copy.allTools} — ${copy.brandName}`,
    description: copy.hubDescription,
    alternates: pdfAlternates(locale),
    openGraph: { title: `${copy.allTools} — ${copy.brandName}`, description: copy.hubDescription, type: "website" },
  };
}

export default async function PdfHub({ params }: Props) {
  const { locale } = await params;
  if (!isPdfLocale(locale)) notFound();
  const copy = PDF_COPY[locale];

  return (
    <main className="pdf-page pdf-hub-page">
      <div className="pdf-breadcrumb"><a href="/">{copy.home}</a><span aria-hidden>›</span><span>{copy.allTools}</span></div>
      <div className="pdf-hub-intro"><h1>{copy.hubTitle}</h1><p>{copy.hubDescription}</p></div>
      <p className="pdf-hub-note">{copy.hubIntro}</p>
      <div className="pdf-hub-list">
        {PDF_TOOLS.map((tool, index) => (
          <a key={tool} href={pdfUrl(locale, tool)} className="pdf-hub-item">
            <span className="pdf-hub-index">0{index + 1}</span>
            <span><strong>{copy.toolsCopy[tool].title}</strong><small>{copy.toolsCopy[tool].description}</small></span>
            <span className="pdf-hub-arrow" aria-hidden>↗</span>
          </a>
        ))}
      </div>
      <div className="pdf-hub-assurance"><div><strong>{copy.privacyTitle}</strong><p>{copy.privacyText}</p></div><div><strong>{copy.noAccountTitle}</strong><p>{copy.noAccountText}</p></div></div>
    </main>
  );
}
