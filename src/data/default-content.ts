import { V3_SEO_DEFAULTS, type SiteContent } from "@/lib/content-schema";

export type PresetAsset = {
  id: string;
  name: string;
  kind: "logo" | "product-icon";
  url: string | null;
  builtin?: boolean;
};

export const PRESET_ASSETS: PresetAsset[] = [
  { id: "builtin-grid", name: "当前四格 Logo", kind: "logo", url: null, builtin: true },
  ...Array.from({ length: 9 }, (_, index) => ({
    id: `logo-v${index + 1}`,
    name: `ZenSoft Logo v${index + 1}`,
    kind: "logo" as const,
    url: index === 6 ? "/brand/zensoft-logo-v7-light-portal.png"
      : index === 7 ? "/brand/zensoft-logo-v8-convergence.png"
      : index === 8 ? "/brand/zensoft-logo-v9-fold.png"
      : `/brand/zensoft-logo-v${index + 1}.png`,
  })),
  { id: "icon-chargepilot", name: "ChargePilot", kind: "product-icon", url: "/icons/chargepilot-logo-2026.png" },
  { id: "icon-minuteflow", name: "MinuteFlow", kind: "product-icon", url: "/icons/minuteflow.png" },
  { id: "icon-serverhub", name: "ServerHub", kind: "product-icon", url: "/icons/serverhub.png" },
  { id: "icon-tellyra", name: "Tellyra", kind: "product-icon", url: "/icons/tellyra-2026.png" },
  { id: "icon-tivon", name: "Tivon", kind: "product-icon", url: "/icons/tivon-2026.png" },
  { id: "icon-tunesync", name: "TuneSync", kind: "product-icon", url: "/icons/tunesync.png" },
  { id: "icon-tailtalk", name: "TailTalk", kind: "product-icon", url: "/icons/tailtalk-2026.png" },
  { id: "icon-lattice-2026", name: "Lattice", kind: "product-icon", url: "/icons/lattice-2026.png" },
  { id: "icon-visto", name: "Visto", kind: "product-icon", url: "/icons/visto.png" },
];

export const DEFAULT_CONTENT: SiteContent = {
  schemaVersion: 3,
  brand: { name: "ZenSoft", activeLogoId: "builtin-grid" },
  navigation: { githubUrl: "https://github.com/vibeforge2014" },
  copy: {
    zh: {
      navLabel: "主导航", homeLabel: "ZenSoft 首页", productsLabel: "软件产品", appsGroupLabel: "原生应用", toolsGroupLabel: "在线工具",
      companyLabel: "公司介绍", language: "EN", languageLabel: "Switch to English",
      heroTitle: "打造小而美的原生应用。",
      heroDescription: "ZenSoft 是绍兴市臻书科技有限公司旗下的软件品牌，为各类平台开发原生应用，并提供浏览器内即可使用的在线工具。产品围绕真实需求设计，注重长期维护与数据隐私。",
      companyTitle: "从真实需求出发，\n持续开发，长期维护。",
      companyDescription: "ZenSoft 是绍兴市臻书科技有限公司旗下的软件品牌，为各类平台开发原生应用与在线工具。产品从真实使用场景出发，注重可靠性、运行效率与数据隐私，并在发布后持续维护。",
      companyLocation: "浙江省绍兴市",
      scopeLabel: "业务范围",
      scopeList: [
        { title: "原生应用开发", description: "为各类平台设计与开发原生应用，跟随系统演进持续维护。" },
        { title: "在线工具服务", description: "提供无需安装的浏览器效率工具，文件处理在用户本地完成。" },
        { title: "软件授权与支持", description: "提供授权发放、订单管理与售后技术支持，保障已购用户的长期使用。" },
      ],
      footer: "原生应用与软件服务。", companyName: "绍兴市臻书科技有限公司",
    },
    en: {
      navLabel: "Main navigation", homeLabel: "ZenSoft home", productsLabel: "Products", appsGroupLabel: "Native Apps", toolsGroupLabel: "Online Tools",
      companyLabel: "Company Profile", language: "中", languageLabel: "切换到中文",
      heroTitle: "Well-crafted native apps,\nsmall by design.",
      heroDescription: "ZenSoft is the software brand of Shaoxing Zhenshu Technology Co., Ltd. We develop native applications for a wide range of platforms and online tools that run directly in the browser. Products are designed around real needs, with attention to long-term maintenance and data privacy.",
      companyTitle: "Software built around real needs\nand maintained for the long term.",
      companyDescription: "ZenSoft is a software brand of Shaoxing Zhenshu Technology Co., Ltd. We develop native applications and online tools for a wide range of platforms. Every product starts from a real use case and is maintained with attention to reliability, efficiency, and data privacy.",
      companyLocation: "Shaoxing, Zhejiang, China",
      scopeLabel: "What We Do",
      scopeList: [
        { title: "Native app development", description: "Design and develop native applications for a wide range of platforms, maintained over the long term." },
        { title: "Online tools", description: "Browser-based productivity tools that process files locally on the user's device." },
        { title: "Licensing and support", description: "License delivery, order management, and after-sales technical support." },
      ],
      footer: "Native applications and software services.", companyName: "Shaoxing Zhenshu Technology Co., Ltd.",
    },
  },
  products: [
    {
      id: "chargepilot", visible: true, draft: false, order: 0, url: "https://chargepilot.zensoft.top/", platforms: ["macOS"], accentFrom: "#0878FF", accentTo: "#20C8FF", glyph: "battery", iconAssetId: "icon-chargepilot",
      copy: { zh: { name: "ChargePilot", category: "macOS 电池管理", tagline: "Mac 电池充电与状态管理", description: "提供充电上限设置、温度监测与实时能耗查看等功能，相关数据在本机处理。", features: ["可调充电上限", "温度与健康守护", "实时能耗追踪", "菜单栏快捷操作"] }, en: { name: "ChargePilot", category: "macOS battery management", tagline: "Mac battery charging and status management", description: "Provides charge limit settings, temperature monitoring, and real-time energy information, with related data processed locally.", features: ["Adjustable charge limits", "Temperature protection", "Live power monitoring", "Menu bar controls"] } },
    },
    {
      id: "minuteflow", visible: true, draft: true, order: 1, url: "https://minuteflow.zensoft.top/", platforms: ["macOS"], accentFrom: "#FF5A42", accentTo: "#FF8A46", glyph: "waveform", iconAssetId: "icon-minuteflow",
      copy: { zh: { name: "MinuteFlow", category: "macOS 录音与转录", tagline: "录音、转录与会议纪要", description: "支持音频录制、实时语音转写，并根据转写内容生成会议纪要与摘要。", features: ["音频录制", "语音转文字", "实时纪要与摘要生成"] }, en: { name: "MinuteFlow", category: "macOS recording and transcription", tagline: "Recording, transcription, and meeting notes", description: "Supports audio recording and real-time speech transcription, with meeting notes and summaries generated from the transcript.", features: ["Audio recording", "Speech-to-text", "Live minutes and summaries"] } },
    },
    {
      id: "serverhub", visible: true, draft: false, order: 2, url: "https://serverhub.zensoft.top/", platforms: ["iOS"], accentFrom: "#0A84FF", accentTo: "#5E5CE6", glyph: "terminal", iconAssetId: "icon-serverhub",
      copy: { zh: { name: "ServerHub", category: "iOS SSH 服务器管理", tagline: "移动端服务器连接与管理", description: "支持主机连接、系统性能监控、SFTP 文件管理与原生 SSH 终端操作。", features: ["系统性能监控", "原生 SSH 终端", "SFTP 文件管理", "钥匙串凭据保护"] }, en: { name: "ServerHub", category: "iOS SSH server management", tagline: "Mobile server access and management", description: "Supports host connections, system performance monitoring, SFTP file management, and native SSH terminal access.", features: ["System monitoring", "Native SSH terminal", "SFTP file management", "Keychain protection"] } },
    },
    {
      id: "tellyra", visible: true, draft: false, order: 3, url: "https://tellyra.zensoft.top/", platforms: ["iOS", "Apple TV"], accentFrom: "#40C8E0", accentTo: "#30B0C7", glyph: "play", iconAssetId: "icon-tellyra",
      copy: { zh: { name: "Tellyra", category: "iOS · Apple TV IPTV", tagline: "IPTV 播放列表管理与播放", description: "支持手动导入或自动更新 IPTV 播放列表，并可通过 AirPlay 投放播放。", features: ["M3U 播放列表", "频道搜索与分组", "AirPlay 投屏", "无需账号"] }, en: { name: "Tellyra", category: "iOS · Apple TV IPTV", tagline: "IPTV playlist management and playback", description: "Supports manual import or automatic updates for IPTV playlists, with playback available through AirPlay.", features: ["M3U playlists", "Channel search and groups", "AirPlay", "No account required"] } },
    },
    {
      id: "tivon", visible: true, draft: false, order: 4, url: "https://tivon.zensoft.top/", platforms: ["iOS"], accentFrom: "#FF9F0A", accentTo: "#FF6B00", glyph: "remote", iconAssetId: "icon-tivon",
      copy: { zh: { name: "Tivon", category: "iOS Android TV 遥控", tagline: "Android TV 遥控与 ADB 工具", description: "通过局域网连接 Android TV 与 Android 设备，提供遥控、文字输入、截屏和文件传输等功能。", features: ["局域网无线配对", "触控板遥控", "电视文字输入", "文件与 APK 管理"] }, en: { name: "Tivon", category: "iOS remote for Android TV", tagline: "Android TV remote and ADB utilities", description: "Connects to Android TV and Android devices over a local network for remote control, text input, screenshots, and file transfer.", features: ["Wireless pairing", "Touchpad remote", "TV text input", "File and APK management"] } },
    },
    {
      id: "tunesync", visible: true, draft: true, order: 5, url: "https://tunesync.zensoft.top/", platforms: ["iOS"], accentFrom: "#FF375F", accentTo: "#FF2D92", glyph: "sync", iconAssetId: "icon-tunesync",
      copy: { zh: { name: "TuneSync", category: "即将推出", tagline: "产品信息准备中", description: "TuneSync 目前处于产品准备阶段，功能与发布信息将在确认后公布。", features: [] }, en: { name: "TuneSync", category: "Coming soon", tagline: "Product information in preparation", description: "TuneSync is currently in preparation. Features and release information will be published once confirmed.", features: [] } },
    },
    {
      id: "tailtalk", visible: true, draft: false, order: 6, url: "https://tailtalk.zensoft.top/", platforms: ["iOS"], accentFrom: "#5E5CE6", accentTo: "#3F37C9", glyph: "code", iconAssetId: "icon-tailtalk",
      copy: { zh: { name: "TailTalk", category: "iOS 宠物情绪参考", tagline: "宠物声音与行为信息辅助识别", description: "基于宠物声音与行为提供情绪倾向参考及互动建议，结果仅供日常观察使用。", features: ["宠物声音与行为分析", "个性化学习", "设备端隐私保护", "行为趋势记录"] }, en: { name: "TailTalk", category: "iOS pet behavior insights", tagline: "Assisted interpretation of pet sounds and behavior", description: "Provides emotional tendency references and interaction suggestions based on pet sounds and behavior. Results are intended for everyday observation only.", features: ["Sound and behavior analysis", "Personalized learning", "On-device privacy", "Behavior trends"] } },
    },
    {
      id: "lattice", visible: true, draft: false, order: 7, url: "https://lattice-dks.pages.dev/", platforms: ["macOS"], accentFrom: "#A89BFF", accentTo: "#56D4DD", glyph: "code", iconAssetId: "icon-lattice-2026",
      copy: { zh: { name: "Lattice", category: "macOS AI 命令中心", tagline: "一个快捷键，直达整个 Mac", description: "原生 macOS 命令中心，可启动应用、毫秒级搜索全盘文件、运行快捷指令并调用 AI 工具。", features: ["全盘文件快速搜索", "应用与系统命令", "快捷指令集成", "AI 本地工具调用"] }, en: { name: "Lattice", category: "AI command center for macOS", tagline: "One shortcut to your entire Mac", description: "A native macOS command center for launching apps, searching files in milliseconds, running Shortcuts, and calling AI tools.", features: ["Fast full-disk search", "App and system commands", "Shortcuts integration", "AI tool execution"] } },
    },
    {
      id: "visto", visible: true, draft: true, order: 8, url: "https://vibeforge2014.github.io/Visto-Site/", platforms: ["iOS", "macOS"], accentFrom: "#2BD4D4", accentTo: "#1CA3EF", glyph: "sync", iconAssetId: "icon-visto",
      copy: { zh: { name: "Visto · 拓屏", category: "iOS · macOS 副屏拓展", tagline: "把 iPhone / iPad 变成 Mac 的第二块屏幕", description: "通过 QUIC/TLS 1.3 无线或 USB 直连，将 Mac 画面以低延迟镜像到 iPhone 或 iPad，触控可直接回传为 Mac 输入；画面与输入只在设备间传输，不经云端。", features: ["QUIC 无线与 USB 直连", "硬件编解码低延迟", "触控回传 Mac 输入", "本地传输隐私优先"] }, en: { name: "Visto", category: "iOS · macOS second display", tagline: "Turn your iPhone or iPad into a second Mac screen", description: "Mirrors your Mac to an iPhone or iPad over QUIC/TLS 1.3 wireless or a USB cable, with hardware codecs, touch input sent straight back to the Mac, and a local-first design — video and input never leave your devices.", features: ["QUIC wireless and USB link", "Low-latency hardware codecs", "Touch input back to the Mac", "Local-first privacy"] } },
    },
  ],
  seo: { ...V3_SEO_DEFAULTS },
};
