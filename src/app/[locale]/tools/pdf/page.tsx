import { notFound, permanentRedirect } from "next/navigation";
import { isPdfLocale, pdfUrl } from "@/lib/pdf-tools";

export default async function PdfIndex({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (!isPdfLocale(locale)) notFound();
  permanentRedirect(pdfUrl(locale, "merge"));
}
