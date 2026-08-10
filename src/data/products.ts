// Centralized product data for the VibeForge portal.
// All fields are derived from the live GitHub Pages sites (verified 2026-08-07).
// Only products in the current Paddle-facing commercial scope belong here.

import type { IconKey } from "@/components/AppIcon";
import type { Language } from "@/components/LanguageProvider";

export type Platform = "macOS" | "iOS" | "Apple TV" | "Web";

export type ProductGroup = "apps" | "tools";

export interface Product {
  /** Stable id, also the slug used for keying. */
  id: string;
  /** Display name. */
  name: string;
  /** One-line category label shown as an eyebrow. */
  category: string;
  /** Marketing tagline from the site. */
  tagline: string;
  /** One-sentence description of what it does. */
  description: string;
  /** Public product-site URL. */
  url: string;
  /** Platforms the product runs on. */
  platforms: Platform[];
  /** Which section of the portal it belongs to. */
  group: ProductGroup;
  /** Brand accent, expressed as a CSS gradient pair for the icon tile. */
  accent: { from: string; to: string };
  /** SF-Symbol-style glyph shown inside the squircle icon. */
  icon: IconKey;
  /** When set, a real app-icon image is shown instead of the SVG glyph. */
  iconSrc?: string;
  /** 3–5 highlight features. Empty array when the site itself reveals none. */
  features: string[];
  /** True when the live site has little/no published content yet. */
  draft?: boolean;
}

const SITE = {
  chargepilot: "/chargepilot/",
  minuteflow: "/minuteflow/",
} as const;

const localizedProducts: Record<Language, Product[]> = {
  zh: [
  {
    id: "chargepilot",
    name: "ChargePilot",
    category: "macOS 电池管理",
    tagline: "掌控 Mac 的每一次充电",
    description: "原生电池控制工具：管理充电上限、监控温度、追踪实时能耗，全程本地处理。",
    url: SITE.chargepilot,
    platforms: ["macOS"],
    group: "apps",
    accent: { from: "#0878FF", to: "#20C8FF" },
    icon: "battery",
    iconSrc: "icons/chargepilot-logo-2026.png",
    features: [
      "可调充电上限，稳定电量在设定范围",
      "温度与健康守护，过热自动停充",
      "实时适配器输入与系统负载追踪",
      "菜单栏快捷操作与自动化策略",
    ],
  },
  {
    id: "minuteflow",
    name: "MinuteFlow",
    category: "即将推出 · 暂不销售",
    tagline: "录音、转录与实时纪要",
    description: "录音并实时将语音转为文字，自动生成会议纪要与摘要。",
    url: SITE.minuteflow,
    platforms: ["macOS"],
    group: "apps",
    accent: { from: "#FF5A42", to: "#FF8A46" },
    icon: "waveform",
    iconSrc: "icons/minuteflow.png",
    features: ["音频录制", "语音转文字", "实时纪要与摘要生成"],
    draft: true,
  },
  ],
  en: [
    {
      id: "chargepilot",
      name: "ChargePilot",
      category: "macOS battery management",
      tagline: "Take control of every charge",
      description: "A native battery utility for charge limits, temperature protection, and real-time energy monitoring—all processed locally.",
      url: SITE.chargepilot,
      platforms: ["macOS"],
      group: "apps",
      accent: { from: "#0878FF", to: "#20C8FF" },
      icon: "battery",
      iconSrc: "icons/chargepilot-logo-2026.png",
      features: [
        "Adjustable charge limits",
        "Temperature and battery health protection",
        "Real-time power flow monitoring",
        "Menu bar controls and automation",
      ],
    },
    {
      id: "minuteflow",
      name: "MinuteFlow",
      category: "Coming soon · Not for sale",
      tagline: "Record, transcribe, and capture minutes live",
      description: "Record meetings, transcribe speech in real time, and automatically organize minutes and summaries.",
      url: SITE.minuteflow,
      platforms: ["macOS"],
      group: "apps",
      accent: { from: "#FF5A42", to: "#FF8A46" },
      icon: "waveform",
      iconSrc: "icons/minuteflow.png",
      features: ["Audio recording", "Speech-to-text", "Live minutes and summaries"],
      draft: true,
    },
  ],
};

export function getProducts(language: Language): Product[] {
  return localizedProducts[language];
}

export const products = localizedProducts.zh;

export const groups: { id: ProductGroup; title: string; subtitle: string }[] = [
  { id: "apps", title: "原生应用", subtitle: "为 macOS 打造" },
];
