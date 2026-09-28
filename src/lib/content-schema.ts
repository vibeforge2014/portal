import { z } from "zod";

const shortText = z.string().trim().min(1).max(180);
const bodyText = z.string().trim().min(1).max(1400);
const safeUrl = z.string().url().refine((value) => value.startsWith("https://") || value.startsWith("http://"), "Only HTTP(S) URLs are allowed");

export const LocalizedStringSchema = z.object({ zh: shortText, en: shortText });

// v2 时代的公司区块默认值，仅用于 v1→v2 迁移链，勿在前台引用。
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

// v3 首页为企业官网结构：导航「软件产品」下拉 + 公司介绍 + 业务范围。
// 定位口径：不绑定 Apple 平台；口号押「小而美」（品牌品格），平台广度等事实放正文描述。
// 这里只放迁移时需要兜底/重映射的字段默认值；完整种子见 src/data/default-content.ts。
export const V3_COPY_DEFAULTS = {
  zh: {
    productsLabel: "软件产品",
    appsGroupLabel: "原生应用",
    toolsGroupLabel: "在线工具",
    heroTitle: "打造小而美的原生应用。",
    scopeLabel: "业务范围",
    companyLocation: "浙江省绍兴市",
  },
  en: {
    productsLabel: "Products",
    appsGroupLabel: "Native Apps",
    toolsGroupLabel: "Online Tools",
    heroTitle: "Well-crafted native apps,\nsmall by design.",
    scopeLabel: "What We Do",
    companyLocation: "Shaoxing, Zhejiang, China",
  },
} as const;

export const V3_SCOPE_DEFAULTS = {
  zh: [
    { title: "原生应用开发", description: "为各类平台设计与开发原生应用，跟随系统演进持续维护。" },
    { title: "在线工具服务", description: "提供无需安装的浏览器效率工具，文件处理在用户本地完成。" },
    { title: "软件授权与支持", description: "提供授权发放、订单管理与售后技术支持，保障已购用户的长期使用。" },
  ],
  en: [
    { title: "Native app development", description: "Design and develop native applications for a wide range of platforms, maintained over the long term." },
    { title: "Online tools", description: "Browser-based productivity tools that process files locally on the user's device." },
    { title: "Licensing and support", description: "License delivery, order management, and after-sales technical support." },
  ],
} as const;

// v2 旧默认文案 → v3 新定位。迁移时仅替换「仍是旧默认值」的字段，后台改过的保留。
const V2_COPY_REMAP: Record<"zh" | "en", Record<string, string>> = {
  zh: {
    heroTitle: "专注 Apple 平台，打造清晰、可靠的原生应用。",
    heroDescription: "ZenSoft 面向 macOS、iOS 与 Apple TV 提供原生应用，关注实际使用场景、产品稳定性与数据隐私。",
    companyTitle: "以稳定、清晰和长期维护为基础，\n持续开发实用软件。",
    companyDescription: "ZenSoft 是绍兴市臻书科技有限公司运营的软件品牌，主要面向 macOS、iOS 与 Apple TV 平台开发原生应用。公司以实际需求为导向，重视产品可靠性、使用效率与数据隐私。",
    footer: "面向 Apple 平台的原生应用与软件服务。",
  },
  en: {
    heroTitle: "Native applications for Apple platforms.",
    heroDescription: "ZenSoft provides native applications for macOS, iOS, and Apple TV, with a focus on practical use cases, product stability, and data privacy.",
    companyTitle: "Practical software built for reliability, clarity, and long-term support.",
    companyDescription: "ZenSoft is a software brand operated by Shaoxing Zhenshu Technology Co., Ltd. We develop native applications for macOS, iOS, and Apple TV, with an emphasis on practical requirements, product reliability, efficient use, and data privacy.",
    footer: "Native applications and software services for Apple platforms.",
  },
};

const V3_COPY_REMAP_TARGET: Record<"zh" | "en", Record<string, string>> = {
  zh: {
    heroDescription: "ZenSoft 是绍兴市臻书科技有限公司旗下的软件品牌，为各类平台开发原生应用，并提供浏览器内即可使用的在线工具。产品围绕真实需求设计，注重长期维护与数据隐私。",
    companyTitle: "从真实需求出发，\n持续开发，长期维护。",
    companyDescription: "ZenSoft 是绍兴市臻书科技有限公司旗下的软件品牌，为各类平台开发原生应用与在线工具。产品从真实使用场景出发，注重可靠性、运行效率与数据隐私，并在发布后持续维护。",
    footer: "原生应用与软件服务。",
  },
  en: {
    heroDescription: "ZenSoft is the software brand of Shaoxing Zhenshu Technology Co., Ltd. We develop native applications for a wide range of platforms and online tools that run directly in the browser. Products are designed around real needs, with attention to long-term maintenance and data privacy.",
    companyTitle: "Software built around real needs\nand maintained for the long term.",
    companyDescription: "ZenSoft is a software brand of Shaoxing Zhenshu Technology Co., Ltd. We develop native applications and online tools for a wide range of platforms. Every product starts from a real use case and is maintained with attention to reliability, efficiency, and data privacy.",
    footer: "Native applications and software services.",
  },
};

// v2 旧默认 SEO 文案 → v3 新默认。迁移时仅替换「仍是旧默认值」的字段，
// 后台手动改过的 SEO 原样保留。种子文案（default-content.ts）同源于 V3。
export const V2_SEO_DEFAULTS = {
  title: "ZenSoft — Apple 平台原生应用",
  description: "ZenSoft 是绍兴市臻书科技有限公司运营的软件品牌，面向 macOS、iOS 与 Apple TV 提供原生应用。",
  openGraphTitle: "ZenSoft — Apple 平台原生应用",
  openGraphDescription: "绍兴市臻书科技有限公司面向 macOS、iOS 与 Apple TV 开发和维护原生应用。",
} as const;

export const V3_SEO_DEFAULTS = {
  title: "ZenSoft 臻书科技",
  description: "ZenSoft 是绍兴市臻书科技有限公司旗下的软件品牌，为各类平台开发可靠的原生应用，并提供浏览器内即可使用的在线工具。",
  openGraphTitle: "ZenSoft 臻书科技",
  openGraphDescription: "绍兴市臻书科技有限公司为各类平台开发和维护原生应用，并提供在线工具服务。",
} as const;

export const LanguageCopySchema = z.object({
  navLabel: shortText,
  homeLabel: shortText,
  productsLabel: shortText,
  appsGroupLabel: shortText,
  toolsGroupLabel: shortText,
  companyLabel: shortText,
  language: shortText,
  languageLabel: shortText,
  heroTitle: bodyText,
  heroDescription: bodyText,
  companyTitle: bodyText,
  companyDescription: bodyText,
  companyLocation: shortText,
  scopeLabel: shortText,
  scopeList: z.array(z.object({ title: shortText, description: bodyText })).min(1).max(8),
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
  schemaVersion: z.literal(3),
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
  return SiteContentSchema.parse(migrateSiteContent(migrateSiteContent(value)));
}

// v1→v2：工作室措辞公司化。v2→v3：裁掉产品晾晒区文案，补企业官网新字段。
function migrateSiteContent(value: unknown): unknown {
  if (!value || typeof value !== "object") return value;
  const record = value as Record<string, unknown>;
  const version = record.schemaVersion;
  const copy = record.copy && typeof record.copy === "object" ? record.copy as Record<string, unknown> : {};
  const zh = copy.zh && typeof copy.zh === "object" ? copy.zh as Record<string, unknown> : {};
  const en = copy.en && typeof copy.en === "object" ? copy.en as Record<string, unknown> : {};

  if (version === 1) {
    return {
      ...record,
      schemaVersion: 2,
      copy: {
        ...copy,
        zh: { ...zh, studio: zh.studio === "独立软件工作室" ? "绍兴市臻书科技有限公司" : zh.studio, about: zh.about === "了解 ZenSoft" ? "了解臻书科技" : zh.about, ...COMPANY_COPY_DEFAULTS.zh },
        en: { ...en, studio: en.studio === "Independent software studio" ? "Shaoxing Zhenshu Technology Co., Ltd." : en.studio, about: en.about === "About ZenSoft" ? "About Zhenshu Technology" : en.about, ...COMPANY_COPY_DEFAULTS.en },
      },
    };
  }

  if (version === 2) {
    const pick = (locale: Record<string, unknown>, fallback: Record<string, unknown>, defaults: (typeof V3_COPY_DEFAULTS)[keyof typeof V3_COPY_DEFAULTS], scope: { title: string; description: string }[], localeKey: "zh" | "en", toggleLabel: string, titleSeparator: string) => {
      // 旧默认值 → 新定位；heroTitle 比对的是旧 headlinePlain+Accent 拼接结果。
      const remap = (key: "heroTitle" | "heroDescription" | "companyTitle" | "companyDescription" | "footer", value: string) =>
        V2_COPY_REMAP[localeKey][key] === value ? (key === "heroTitle" ? defaults.heroTitle : V3_COPY_REMAP_TARGET[localeKey][key]) : value;
      const heroTitle = [locale.headlinePlain, locale.headlineAccent].filter((part): part is string => typeof part === "string" && part.length > 0).join(titleSeparator);
      return {
        navLabel: locale.navLabel ?? fallback.navLabel,
        homeLabel: locale.homeLabel ?? fallback.homeLabel,
        productsLabel: defaults.productsLabel,
        appsGroupLabel: defaults.appsGroupLabel,
        toolsGroupLabel: defaults.toolsGroupLabel,
        companyLabel: locale.companyLabel ?? fallback.companyLabel,
        language: locale.language ?? toggleLabel,
        languageLabel: locale.languageLabel ?? fallback.languageLabel,
        heroTitle: remap("heroTitle", heroTitle || defaults.heroTitle),
        heroDescription: typeof locale.heroDescription === "string" ? remap("heroDescription", locale.heroDescription) : V3_COPY_REMAP_TARGET[localeKey].heroDescription,
        companyTitle: typeof locale.companyTitle === "string" ? remap("companyTitle", locale.companyTitle) : V3_COPY_REMAP_TARGET[localeKey].companyTitle,
        companyDescription: typeof locale.companyDescription === "string" ? remap("companyDescription", locale.companyDescription) : V3_COPY_REMAP_TARGET[localeKey].companyDescription,
        companyLocation: defaults.companyLocation,
        scopeLabel: defaults.scopeLabel,
        scopeList: scope,
        footer: typeof locale.footer === "string" ? remap("footer", locale.footer) : V3_COPY_REMAP_TARGET[localeKey].footer,
        companyName: locale.companyName ?? fallback.companyName,
      };
    };
    return {
      ...record,
      schemaVersion: 3,
      copy: {
        zh: pick(zh, COMPANY_COPY_DEFAULTS.zh, V3_COPY_DEFAULTS.zh, V3_SCOPE_DEFAULTS.zh.map((item) => ({ ...item })), "zh", "EN", ""),
        en: pick(en, COMPANY_COPY_DEFAULTS.en, V3_COPY_DEFAULTS.en, V3_SCOPE_DEFAULTS.en.map((item) => ({ ...item })), "en", "中", " "),
      },
      seo: remapSeo(record.seo),
    };
  }

  return value;
}

function remapSeo(seo: unknown): unknown {
  if (!seo || typeof seo !== "object") return seo;
  const remapped = { ...(seo as Record<string, unknown>) };
  for (const key of ["title", "description", "openGraphTitle", "openGraphDescription"] as const) {
    if (remapped[key] === V2_SEO_DEFAULTS[key]) remapped[key] = V3_SEO_DEFAULTS[key];
  }
  return remapped;
}
