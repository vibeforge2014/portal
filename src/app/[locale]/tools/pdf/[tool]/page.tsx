import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PdfToolClient } from "@/components/pdf/PdfToolClient";
import { PDF_COPY, PDF_TOOLS, isPdfLocale, isPdfTool, pdfAlternates, pdfUrl } from "@/lib/pdf-tools";

type Props = { params: Promise<{ locale: string; tool: string }> };

export function generateStaticParams() {
  return PDF_TOOLS.map((tool) => ({ tool }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, tool } = await params;
  if (!isPdfLocale(locale) || !isPdfTool(tool)) notFound();
  const copy = PDF_COPY[locale];
  const item = copy.toolsCopy[tool];
  return {
    metadataBase: new URL("https://zensoft.top"),
    title: `${item.title} — ${copy.brandName}`,
    description: item.description,
    alternates: pdfAlternates(locale, tool),
    openGraph: { title: `${item.title} — ${copy.brandName}`, description: item.description, type: "website" },
  };
}

export default async function PdfToolPage({ params }: Props) {
  const { locale, tool } = await params;
  if (!isPdfLocale(locale) || !isPdfTool(tool)) notFound();
  const copy = PDF_COPY[locale];
  const item = copy.toolsCopy[tool];

  return (
    <main className="pdf-page pdf-tool-page">
      <div className="pdf-breadcrumb"><a href="/">{copy.home}</a><span aria-hidden>›</span><span>{item.title}</span></div>
      <div className="pdf-page-intro"><h1>{item.title}</h1><p>{item.description}</p></div>
      <PdfToolClient locale={locale} tool={tool} />
      <section className="pdf-help-grid" aria-label={copy.workflowTitle}>
        <div><h2>{copy.workflowTitle}</h2><p>{item.detail}</p><ol>{item.steps.map((step) => <li key={step}>{step}</li>)}</ol></div>
        <div><h2>{copy.limitationTitle}</h2><p>{item.limitation}</p></div>
      </section>
      <section className="pdf-more-tools"><h2>{copy.moreTools}</h2><div className="pdf-more-list">{PDF_TOOLS.filter((other) => other !== tool).map((other) => <a key={other} href={pdfUrl(locale, other)}><strong>{copy.toolsCopy[other].title}</strong><small>{copy.toolsCopy[other].description}</small><span aria-hidden>↗</span></a>)}</div></section>
    </main>
  );
}
