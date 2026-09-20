import type { Metadata } from "next";
import { SiteShell } from "@/components/SiteShell";
import { assetPublicUrl, getPublishedContent } from "@/lib/db";

export const runtime = "nodejs";
// 静态生成 + ISR：后台发布/回滚时 revalidatePath("/") 即时刷新，60s 兜底自动重新生成。
export const revalidate = 60;

export function generateMetadata(): Metadata {
  const content = getPublishedContent();
  const logo = assetPublicUrl(content.brand.activeLogoId);
  return {
    title: content.seo.title,
    description: content.seo.description,
    icons: logo ? { icon: logo } : undefined,
    openGraph: {
      title: content.seo.openGraphTitle,
      description: content.seo.openGraphDescription,
      type: "website",
      locale: "zh_CN",
      images: logo ? [logo] : undefined,
    },
  };
}

export default function Page() {
  // 初始语言固定 zh（HTML 可整体缓存）；英文浏览器首次访问由
  // LanguageProvider 在挂载时按 navigator.language 自动切换。
  return <SiteShell content={getPublishedContent()} initialLanguage="zh" />;
}
