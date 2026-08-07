// Centralized product data for the VibeForge portal.
// All fields are derived from the live GitHub Pages sites (verified 2026-08-07).
// When a site's content is sparse (e.g. TuneSync), we say so plainly rather than invent features.

import type { IconKey } from "@/components/AppIcon";

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
  /** Full GitHub Pages URL. */
  url: string;
  /** Platforms the product runs on. */
  platforms: Platform[];
  /** Which section of the portal it belongs to. */
  group: ProductGroup;
  /** Brand accent, expressed as a CSS gradient pair for the icon tile. */
  accent: { from: string; to: string };
  /** SF-Symbol-style glyph shown inside the squircle icon. */
  icon: IconKey;
  /** 3–5 highlight features. Empty array when the site itself reveals none. */
  features: string[];
  /** True when the live site has little/no published content yet. */
  draft?: boolean;
}

// Base origin for all sibling GitHub Pages sites under this account.
const SITE = "https://vibeforge2014.github.io";

export const products: Product[] = [
  {
    id: "chargepilot",
    name: "ChargePilot",
    category: "macOS 电池管理",
    tagline: "掌控 Mac 的每一次充电",
    description: "原生电池控制工具:管理充电上限、监控温度、追踪实时能耗,全程本地处理。",
    url: `${SITE}/chargepilot-site/`,
    platforms: ["macOS"],
    group: "apps",
    accent: { from: "#34C759", to: "#30B0C7" },
    icon: "battery",
    features: [
      "可调充电上限,稳定电量在设定范围",
      "温度与健康守护,过热自动停充",
      "实时适配器输入与系统负载追踪",
      "菜单栏快捷操作与自动化策略",
    ],
  },
  {
    id: "minuteflow",
    name: "MinuteFlow",
    category: "录音 · 转录 · 纪要",
    tagline: "录音、转录与实时纪要",
    description: "录音并实时将语音转为文字,自动生成会议纪要与摘要。",
    url: `${SITE}/meeting-assistant-site/`,
    platforms: ["macOS"],
    group: "apps",
    accent: { from: "#BF5AF2", to: "#7C4DFF" },
    icon: "waveform",
    features: ["音频录制", "语音转文字", "实时纪要与摘要生成"],
  },
  {
    id: "serverhub",
    name: "ServerHub",
    category: "iOS SSH 服务器管理",
    tagline: "你的服务器,随时触手可及",
    description: "连接主机、监控系统性能、用 SFTP 管理文件,并使用原生 SSH 终端。",
    url: `${SITE}/serverhub-support/`,
    platforms: ["iOS"],
    group: "apps",
    accent: { from: "#0A84FF", to: "#5E5CE6" },
    icon: "terminal",
    features: [
      "集中查看 CPU、内存、磁盘与网络状态",
      "原生 SSH 终端,保存常用命令片段",
      "SFTP 浏览、上传、下载远程文件",
      "凭据存入系统钥匙串,无中转服务器",
    ],
  },
  {
    id: "tellyra",
    name: "Tellyra",
    category: "iOS · Apple TV IPTV",
    tagline: "你的播放清单,随时触手可及",
    description: "手动导入或自动更新 IPTV 播放列表,并支持 AirPlay 投屏播放。",
    url: `${SITE}/tellyra-support/`,
    platforms: ["iOS", "Apple TV"],
    group: "apps",
    accent: { from: "#40C8E0", to: "#30B0C7" },
    icon: "play",
    features: [
      "M3U/M3U8 列表导入,频道搜索与分组",
      "列表播放、观看历史与最近频道",
      "AirPlay 投屏与本地设备联动",
      "无账号系统,不收集行为数据",
    ],
  },
  {
    id: "tivon",
    name: "Tivon",
    category: "iOS Android TV 遥控",
    tagline: "把电视控制与 ADB 工具装进口袋",
    description: "通过局域网无线控制 Android TV 与 Android 设备:遥控、输入、截屏、传文件。",
    url: `${SITE}/tivon-support/`,
    platforms: ["iOS"],
    group: "apps",
    accent: { from: "#FF9F0A", to: "#FF6B00" },
    icon: "remote",
    features: [
      "局域网无线配对 Android 设备",
      "方向键与触控板遥控",
      "直接向电视输入文字",
      "截屏、文件传输与 APK 管理",
    ],
  },
  {
    id: "tunesync",
    name: "TuneSync",
    category: "即将上线",
    tagline: "敬请期待",
    description: "TuneSync 的产品站点已就位,详细内容仍在准备中。",
    url: `${SITE}/TuneSync-Site/`,
    platforms: ["iOS"],
    group: "apps",
    accent: { from: "#FF375F", to: "#FF2D92" },
    icon: "sync",
    features: [],
    draft: true,
  },
  {
    id: "tailtalk",
    name: "TailTalk Starter",
    category: "全栈脚手架模板",
    tagline: "A clean full-stack starter running on vinext",
    description: "面向开发者的全栈起步模板,内置 Cloudflare 绑定本地模拟与可选的 ChatGPT 登录。",
    url: `${SITE}/tailtalk-site/`,
    platforms: ["Web"],
    group: "tools",
    accent: { from: "#5E5CE6", to: "#3F37C9" },
    icon: "code",
    features: [
      "Cloudflare D1 与 Drizzle 集成",
      "vite.config.ts 本地模拟绑定",
      "可选的 ChatGPT 登录(SIWC)辅助",
      "Drizzle 数据库迁移生成",
    ],
  },
];

export const groups: { id: ProductGroup; title: string; subtitle: string }[] = [
  { id: "apps", title: "原生应用", subtitle: "为 macOS、iOS 与 Apple TV 打造" },
  { id: "tools", title: "开发者工具", subtitle: "脚手架与模板" },
];
