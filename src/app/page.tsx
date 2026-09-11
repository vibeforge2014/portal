import type { Metadata } from "next";
import { SiteShell } from "@/components/SiteShell";
import { assetPublicUrl, getPublishedContent } from "@/lib/db";
import { getRequestLanguage } from "@/lib/server-language";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const content = getPublishedContent();
  const language = await getRequestLanguage();
  const logo = assetPublicUrl(content.brand.activeLogoId);
  const english = language === "en";
  return {
    title: english ? `${content.brand.name} — Native Apps for Apple Platforms` : content.seo.title,
    description: english ? `${content.brand.name} develops reliable, privacy-conscious native applications for macOS, iOS, and Apple TV.` : content.seo.description,
    icons: logo ? { icon: logo } : undefined,
    openGraph: {
      title: english ? `${content.brand.name} — Native Apps for Apple Platforms` : content.seo.openGraphTitle,
      description: english ? "Native applications from Shaoxing Zhenshu Technology Co., Ltd. for macOS, iOS, and Apple TV." : content.seo.openGraphDescription,
      type: "website",
      locale: english ? "en_US" : "zh_CN",
      images: logo ? [logo] : undefined,
    },
  };
}

export default async function Page() {
  return <SiteShell content={getPublishedContent()} initialLanguage={await getRequestLanguage()} />;
}
