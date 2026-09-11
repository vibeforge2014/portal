import { z } from "zod";

const shortText = z.string().trim().min(1).max(180);
const bodyText = z.string().trim().min(1).max(1400);
const safeUrl = z.string().url().refine((value) => value.startsWith("https://") || value.startsWith("http://"), "Only HTTP(S) URLs are allowed");

export const LocalizedStringSchema = z.object({ zh: shortText, en: shortText });

export const COMPANY_COPY_DEFAULTS = {
  zh: {
    companyLabel: "公司介绍",
    companyTitle: "以稳定、清晰和长期维护为基础，\n持续开发实用软件。",
    companyDescription: "ZenSoft 是绍兴市臻书科技有限公司运营的软件品牌，主要面向 macOS、iOS 与 Apple TV 平台开发原生应用。公司以实际需求为导向，重视产品可靠性、使用效率与数据隐私。",
    companyLocation: "浙江绍兴 · 中国",
    companyFocus: "Apple 平台原生应用",
    companyPrinciple: "数据隐私与安全",
  },
  en: {
    companyLabel: "Company Profile",
    companyTitle: "Practical software built for reliability, clarity, and long-term support.",
    companyDescription: "ZenSoft is a software brand operated by Shaoxing Zhenshu Technology Co., Ltd. We develop native applications for macOS, iOS, and Apple TV, with an emphasis on practical requirements, product reliability, efficient use, and data privacy.",
    companyLocation: "Shaoxing, Zhejiang · China",
    companyFocus: "Native apps for Apple platforms",
    companyPrinciple: "Data privacy and security",
  },
} as const;

export const LanguageCopySchema = z.object({
  navLabel: shortText,
  homeLabel: shortText,
  apps: shortText,
  principles: shortText,
  language: shortText,
  languageLabel: shortText,
  studio: shortText,
  headlinePlain: shortText,
  headlineAccent: shortText,
  heroDescription: bodyText,
  browseApps: shortText,
  about: shortText,
  overviewLabel: shortText,
  onSale: shortText,
  nativeApps: shortText,
  tracking: shortText,
  toolkit: bodyText,
  productMatrix: shortText,
  productTitle: bodyText,
  productIntro: bodyText,
  companyLabel: shortText,
  companyTitle: bodyText,
  companyDescription: bodyText,
  companyLocation: shortText,
  companyFocus: shortText,
  companyPrinciple: shortText,
  principleLabel: shortText,
  principleTitle: shortText,
  principleDescription: bodyText,
  principlesList: z.array(z.object({ title: shortText, description: bodyText })).min(1).max(8),
  footer: shortText,
  companyName: shortText,
});

export const ProductSchema = z.object({
  id: z.string().regex(/^[a-z0-9][a-z0-9-]{1,63}$/),
  visible: z.boolean(),
  draft: z.boolean(),
  order: z.number().int().min(0).max(999),
  url: safeUrl,
  platforms: z.array(z.enum(["macOS", "iOS", "Apple TV", "Web"])).min(1).max(4),
  accentFrom: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  accentTo: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  glyph: z.enum(["battery", "waveform", "terminal", "play", "remote", "sync", "code"]),
  iconAssetId: z.string().min(1).max(128),
  copy: z.object({
    zh: z.object({ name: shortText, category: shortText, tagline: shortText, description: bodyText, features: z.array(shortText).max(8) }),
    en: z.object({ name: shortText, category: shortText, tagline: shortText, description: bodyText, features: z.array(shortText).max(8) }),
  }),
});

export const SiteContentSchema = z.object({
  schemaVersion: z.literal(2),
  brand: z.object({ name: shortText, activeLogoId: z.string().min(1).max(128) }),
  navigation: z.object({ githubUrl: safeUrl }),
  copy: z.object({ zh: LanguageCopySchema, en: LanguageCopySchema }),
  products: z.array(ProductSchema).min(1).max(50).superRefine((products, context) => {
    const ids = new Set<string>();
    for (const [index, product] of products.entries()) {
      if (ids.has(product.id)) context.addIssue({ code: "custom", path: [index, "id"], message: "Product ids must be unique" });
      ids.add(product.id);
    }
  }),
  seo: z.object({
    title: shortText,
    description: bodyText,
    openGraphTitle: shortText,
    openGraphDescription: bodyText,
  }),
});

export type SiteContent = z.infer<typeof SiteContentSchema>;
export type LanguageCopy = z.infer<typeof LanguageCopySchema>;
export type ManagedProduct = z.infer<typeof ProductSchema>;

export function parseSiteContent(value: unknown): SiteContent {
  return SiteContentSchema.parse(migrateSiteContent(value));
}

function migrateSiteContent(value: unknown): unknown {
  if (!value || typeof value !== "object" || (value as { schemaVersion?: unknown }).schemaVersion !== 1) return value;
  const legacy = value as Record<string, unknown>;
  const copy = legacy.copy && typeof legacy.copy === "object" ? legacy.copy as Record<string, unknown> : {};
  const zh = copy.zh && typeof copy.zh === "object" ? copy.zh as Record<string, unknown> : {};
  const en = copy.en && typeof copy.en === "object" ? copy.en as Record<string, unknown> : {};
  return {
    ...legacy,
    schemaVersion: 2,
    copy: {
      ...copy,
      zh: {
        ...zh,
        studio: zh.studio === "独立软件工作室" ? "绍兴市臻书科技有限公司" : zh.studio,
        about: zh.about === "了解 ZenSoft" ? "了解臻书科技" : zh.about,
        ...COMPANY_COPY_DEFAULTS.zh,
      },
      en: {
        ...en,
        studio: en.studio === "Independent software studio" ? "Shaoxing Zhenshu Technology Co., Ltd." : en.studio,
        about: en.about === "About ZenSoft" ? "About Zhenshu Technology" : en.about,
        ...COMPANY_COPY_DEFAULTS.en,
      },
    },
  };
}
