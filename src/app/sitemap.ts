import type { MetadataRoute } from "next";
import { PDF_LOCALES, PDF_TOOLS, pdfUrl } from "@/lib/pdf-tools";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://zensoft.top";
  return [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    ...PDF_TOOLS.flatMap((tool) => PDF_LOCALES.map((locale) => ({
      url: `${base}${pdfUrl(locale, tool)}`,
      changeFrequency: "monthly" as const,
      priority: 0.7,
      alternates: {
        languages: {
          "zh-Hans": `${base}${pdfUrl("zh-hans", tool)}`,
          "zh-Hant": `${base}${pdfUrl("zh-hant", tool)}`,
          en: `${base}${pdfUrl("en", tool)}`,
        },
      },
    }))),
  ];
}
