import type { MetadataRoute } from "next";
import { PDF_LOCALES, PDF_TOOLS, pdfUrl } from "@/lib/pdf-tools";

export default function sitemap(): MetadataRoute.Sitemap {
  const base = "https://zensoft.top";
  const toolUrls = [undefined, ...PDF_TOOLS] as const;
  return [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    ...toolUrls.flatMap((tool) => PDF_LOCALES.map((locale) => ({
      url: `${base}${pdfUrl(locale, tool)}`,
      changeFrequency: "monthly" as const,
      priority: tool ? 0.7 : 0.8,
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
