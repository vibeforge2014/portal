// Centralized product data for the VibeForge portal.
//
// The FULL catalog lives here. Whether a product is actually shown on the
// public storefront is decided at runtime by `public/config/visibility.json`,
// which is editable from the `/admin/` page (committed back to this repo via
// the GitHub API). That way, taking an app in or out of the storefront no
// longer requires editing source code — flip its switch in the admin page.

import type { IconKey } from "@/components/AppIcon";
import type { Language } from "@/components/LanguageProvider";

export type Platform = "macOS" | "iOS" | "Apple TV" | "Web";

export type ProductGroup = "apps" | "tools";

export interface Product {
  /** Stable id, also the slug used for keying and the visibility config key. */
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
  /** Default storefront visibility. `undefined`/`true` = shown; `false` = hidden
   *  unless `visibility.json` overrides it. */
  visible?: boolean;
}

/** Locale-paired text. Keeping copy next to the stable fields avoids the
 *  zh/en arrays drifting out of sync as the catalog grows. */
type Localized = { zh: string; en: string };

interface ProductDefinition {
  id: string;
  name: string;
  url: string;
  platforms: Platform[];
  group: ProductGroup;
  accent: { from: string; to: string };
  icon: IconKey;
  iconSrc?: string;
  features: Localized[];
  /** Default storefront visibility (omit = visible). */
  visible?: boolean;
  draft?: boolean;
  category: Localized;
  tagline: Localized;
  description: Localized;
}

const SITE = {
  chargepilot: "/chargepilot/",
  minuteflow: "/minuteflow/",
  serverhub: "/serverhub/",
  tellyra: "/tellyra/",
  tivon: "/tivon/",
  tunesync: "/tunesync/",
  tailtalk: "/tailtalk/",
} as const;

/**
 * Full product matrix. Visibility is controlled by `visible` here as a default
 * and overridden at runtime by `public/config/visibility.json` (admin page).
 * Defaults preserve the current storefront: ChargePilot + MinuteFlow shown.
 */
const catalog: ProductDefinition[] = [
  {
    id: "chargepilot",
    name: "ChargePilot",
    url: SITE.chargepilot,
    platforms: ["macOS"],
    group: "apps",
    accent: { from: "#0878FF", to: "#20C8FF" },
    icon: "battery",
    iconSrc: "icons/chargepilot-logo-2026.png",
    category: { zh: "macOS 电池管理", en: "macOS battery management" },
    tagline: { zh: "掌控 Mac 的每一次充电", en: "Take control of every charge" },
    description: {
      zh: "原生电池控制工具：管理充电上限、监控温度、追踪实时能耗，全程本地处理。",
      en: "A native battery utility for charge limits, temperature protection, and real-time energy monitoring—all processed locally.",
    },
    features: [
      { zh: "可调充电上限，稳定电量在设定范围", en: "Adjustable charge limits" },
      { zh: "温度与健康守护，过热自动停充", en: "Temperature and battery health protection" },
      { zh: "实时适配器输入与系统负载追踪", en: "Real-time power flow monitoring" },
      { zh: "菜单栏快捷操作与自动化策略", en: "Menu bar controls and automation" },
    ],
  },
  {
    id: "minuteflow",
    name: "MinuteFlow",
    url: SITE.minuteflow,
    platforms: ["macOS"],
    group: "apps",
    accent: { from: "#FF5A42", to: "#FF8A46" },
    icon: "waveform",
    iconSrc: "icons/minuteflow.png",
    draft: true,
    category: { zh: "即将推出 · 暂不销售", en: "Coming soon · Not for sale" },
    tagline: { zh: "录音、转录与实时纪要", en: "Record, transcribe, and capture minutes live" },
    description: {
      zh: "录音并实时将语音转为文字，自动生成会议纪要与摘要。",
      en: "Record meetings, transcribe speech in real time, and automatically organize minutes and summaries.",
    },
    features: [
      { zh: "音频录制", en: "Audio recording" },
      { zh: "语音转文字", en: "Speech-to-text" },
      { zh: "实时纪要与摘要生成", en: "Live minutes and summaries" },
    ],
  },
  {
    id: "serverhub",
    name: "ServerHub",
    url: SITE.serverhub,
    platforms: ["iOS"],
    group: "apps",
    accent: { from: "#0A84FF", to: "#5E5CE6" },
    icon: "terminal",
    iconSrc: "icons/serverhub.png",
    visible: false,
    category: { zh: "iOS SSH 服务器管理", en: "iOS SSH server management" },
    tagline: { zh: "你的服务器，随时触手可及", en: "Your servers, always within reach" },
    description: {
      zh: "连接主机、监控系统性能、用 SFTP 管理文件，并使用原生 SSH 终端。",
      en: "Connect to hosts, monitor performance, manage files over SFTP, and use a native SSH terminal.",
    },
    features: [
      { zh: "集中查看 CPU、内存、磁盘与网络状态", en: "Monitor CPU, memory, disk, and network in one place" },
      { zh: "原生 SSH 终端，保存常用命令片段", en: "Native SSH terminal with saved command snippets" },
      { zh: "SFTP 浏览、上传、下载远程文件", en: "Browse, upload, and download files over SFTP" },
      { zh: "凭据存入系统钥匙串，无中转服务器", en: "Credentials stored in the keychain—no relay servers" },
    ],
  },
  {
    id: "tellyra",
    name: "Tellyra",
    url: SITE.tellyra,
    platforms: ["iOS", "Apple TV"],
    group: "apps",
    accent: { from: "#40C8E0", to: "#30B0C7" },
    icon: "play",
    iconSrc: "icons/tellyra.png",
    visible: false,
    category: { zh: "iOS · Apple TV IPTV", en: "iOS · Apple TV IPTV" },
    tagline: { zh: "你的播放清单，随时触手可及", en: "Your playlists, always within reach" },
    description: {
      zh: "手动导入或自动更新 IPTV 播放列表，并支持 AirPlay 投屏播放。",
      en: "Import or auto-update IPTV playlists and stream to your TV with AirPlay support.",
    },
    features: [
      { zh: "M3U/M3U8 列表导入，频道搜索与分组", en: "Import M3U/M3U8 lists with search and grouping" },
      { zh: "列表播放、观看历史与最近频道", en: "Playlist playback, history, and recent channels" },
      { zh: "AirPlay 投屏与本地设备联动", en: "AirPlay streaming to local devices" },
      { zh: "无账号系统，不收集行为数据", en: "No accounts, no behavioral tracking" },
    ],
  },
  {
    id: "tivon",
    name: "Tivon",
    url: SITE.tivon,
    platforms: ["iOS"],
    group: "apps",
    accent: { from: "#FF9F0A", to: "#FF6B00" },
    icon: "remote",
    iconSrc: "icons/tivon.png",
    visible: false,
    category: { zh: "iOS · Android TV 遥控", en: "iOS · Android TV remote" },
    tagline: { zh: "把电视控制与 ADB 工具装进口袋", en: "TV control and ADB tools in your pocket" },
    description: {
      zh: "通过局域网无线控制 Android TV 与 Android 设备：遥控、输入、截屏、传文件。",
      en: "Control Android TV and Android devices over Wi-Fi: remote, text input, screenshots, and file transfer.",
    },
    features: [
      { zh: "局域网无线配对 Android 设备", en: "Pair Android devices wirelessly over LAN" },
      { zh: "方向键与触控板遥控", en: "D-pad and trackpad remote control" },
      { zh: "直接向电视输入文字", en: "Type directly to your TV" },
      { zh: "截屏、文件传输与 APK 管理", en: "Screenshots, file transfer, and APK management" },
    ],
  },
  {
    id: "tunesync",
    name: "TuneSync",
    url: SITE.tunesync,
    platforms: ["iOS"],
    group: "apps",
    accent: { from: "#FF375F", to: "#FF2D92" },
    icon: "sync",
    iconSrc: "icons/tunesync.png",
    visible: false,
    draft: true,
    category: { zh: "即将上线", en: "Coming soon" },
    tagline: { zh: "敬请期待", en: "Stay tuned" },
    description: {
      zh: "TuneSync 的产品站点已就位，详细内容仍在准备中。",
      en: "TuneSync's product site is live; full details are still in the works.",
    },
    features: [],
  },
  {
    id: "tailtalk",
    name: "TailTalk",
    url: SITE.tailtalk,
    platforms: ["iOS"],
    group: "apps",
    accent: { from: "#5E5CE6", to: "#3F37C9" },
    icon: "code",
    iconSrc: "icons/tailtalk.png",
    visible: false,
    category: { zh: "iOS 宠物情绪翻译", en: "iOS pet emotion translator" },
    tagline: { zh: "更细心地理解它此刻的感受", en: "Understand how they feel, more attentively" },
    description: {
      zh: "分析宠物的声音与行为，给出情绪倾向、潜在意图与安全的互动建议——本地优先，诚实不夸大。",
      en: "Analyzes pet sounds and behavior to suggest mood, intent, and safe ways to interact—local-first and honestly scoped.",
    },
    features: [
      { zh: "双向交流：翻译人声为低刺激宠物声音", en: "Two-way chat: translate your voice into gentle pet sounds" },
      { zh: "个性化学习：设备端声纹特征建专属档案", en: "Personalized: on-device voiceprints build a private profile" },
      { zh: "本地优先：录音与档案从不上传", en: "Local-first: recordings and profiles never leave the device" },
      { zh: "TailTalk Plus：无限互动与行为趋势周报", en: "TailTalk Plus: unlimited interactions and weekly behavior trends" },
    ],
  },
];

function localize(def: ProductDefinition, language: Language): Product {
  return {
    id: def.id,
    name: def.name,
    category: def.category[language],
    tagline: def.tagline[language],
    description: def.description[language],
    url: def.url,
    platforms: def.platforms,
    group: def.group,
    accent: def.accent,
    icon: def.icon,
    iconSrc: def.iconSrc,
    features: def.features.map((feature) => feature[language]),
    draft: def.draft,
    visible: def.visible,
  };
}

export function getProducts(language: Language): Product[] {
  return catalog.map((def) => localize(def, language));
}

/** Default-locale catalog, kept for backwards compatibility. */
export const products = getProducts("zh");

export const groups: { id: ProductGroup; title: string; subtitle: string }[] = [
  { id: "apps", title: "原生应用", subtitle: "为 Apple 平台打造" },
];
