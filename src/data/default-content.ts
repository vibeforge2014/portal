import { COMPANY_COPY_DEFAULTS, type SiteContent } from "@/lib/content-schema";

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
  { id: "icon-lattice", name: "Lattice", kind: "product-icon", url: "/icons/lattice.svg" },
];

export const DEFAULT_CONTENT: SiteContent = {
  schemaVersion: 2,
  brand: { name: "ZenSoft", activeLogoId: "builtin-grid" },
  navigation: { githubUrl: "https://github.com/vibeforge2014" },
  copy: {
    zh: {
      navLabel: "主导航", homeLabel: "ZenSoft 首页", apps: "应用", principles: "理念", language: "EN", languageLabel: "Switch to English",
      studio: "绍兴市臻书科技有限公司", headlinePlain: "专注 Apple 平台，打造", headlineAccent: "清晰、可靠的原生应用。",
      heroDescription: "ZenSoft 面向 macOS、iOS 与 Apple TV 提供原生应用，关注实际使用场景、产品稳定性与数据隐私。",
      browseApps: "查看产品", about: "公司介绍", overviewLabel: "产品概览", onSale: "款已发布产品", nativeApps: "款原生应用", tracking: "第三方行为追踪",
      toolkit: "面向日常场景的\n原生应用产品组合。", productMatrix: "产品与服务", productTitle: "覆盖效率、设备管理与\n数字娱乐等使用场景。",
      productIntro: "各产品围绕明确需求独立设计，并针对 Apple 平台的交互方式与系统能力进行适配。",
      ...COMPANY_COPY_DEFAULTS.zh,
      principleLabel: "产品原则", principleTitle: "以明确的标准持续完善产品。",
      principleDescription: "我们在产品设计与开发过程中，优先考虑平台一致性、数据隐私和长期可维护性，并通过持续迭代改善使用体验。",
      principlesList: [
        { title: "原生开发", description: "根据各平台的交互规范与系统能力进行设计和实现。" },
        { title: "隐私保护", description: "在功能允许的范围内优先采用设备端处理，并减少非必要的数据收集。" },
        { title: "克制设计", description: "围绕核心需求组织功能与界面，减少不必要的操作和干扰。" },
      ],
      footer: "面向 Apple 平台的原生应用与软件服务。", companyName: "绍兴市臻书科技有限公司",
    },
    en: {
      navLabel: "Main navigation", homeLabel: "ZenSoft home", apps: "Apps", principles: "Principles", language: "中", languageLabel: "切换到中文",
      studio: "Shaoxing Zhenshu Technology Co., Ltd.", headlinePlain: "Native applications for", headlineAccent: "Apple platforms.",
      heroDescription: "ZenSoft provides native applications for macOS, iOS, and Apple TV, with a focus on practical use cases, product stability, and data privacy.",
      browseApps: "View products", about: "Company profile", overviewLabel: "Product overview", onSale: "released product", nativeApps: "native applications", tracking: "third-party behavior tracking",
      toolkit: "A native application portfolio\nfor everyday use.", productMatrix: "Products and services", productTitle: "Supporting productivity, device management,\nand digital entertainment.",
      productIntro: "Each product addresses a defined requirement and is adapted to the interaction patterns and system capabilities of Apple platforms.",
      ...COMPANY_COPY_DEFAULTS.en,
      principleLabel: "Product principles", principleTitle: "Improving products through clear standards.",
      principleDescription: "Our design and development process prioritizes platform consistency, data privacy, and long-term maintainability, supported by continuous product iteration.",
      principlesList: [
        { title: "Native development", description: "Designed and implemented around each platform's interaction standards and system capabilities." },
        { title: "Privacy protection", description: "Use on-device processing where practical and minimize unnecessary data collection." },
        { title: "Focused design", description: "Organize interfaces and functionality around core requirements, reducing unnecessary steps and distractions." },
      ],
      footer: "Native applications and software services for Apple platforms.", companyName: "Shaoxing Zhenshu Technology Co., Ltd.",
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
      id: "lattice", visible: true, draft: false, order: 7, url: "https://lattice-dks.pages.dev/", platforms: ["macOS"], accentFrom: "#A89BFF", accentTo: "#56D4DD", glyph: "code", iconAssetId: "icon-lattice",
      copy: { zh: { name: "Lattice", category: "macOS AI 命令中心", tagline: "一个快捷键，直达整个 Mac", description: "原生 macOS 命令中心，可启动应用、毫秒级搜索全盘文件、运行快捷指令并调用 AI 工具。", features: ["全盘文件快速搜索", "应用与系统命令", "快捷指令集成", "AI 本地工具调用"] }, en: { name: "Lattice", category: "AI command center for macOS", tagline: "One shortcut to your entire Mac", description: "A native macOS command center for launching apps, searching files in milliseconds, running Shortcuts, and calling AI tools.", features: ["Fast full-disk search", "App and system commands", "Shortcuts integration", "AI tool execution"] } },
    },
  ],
  seo: {
    title: "ZenSoft — Apple 平台原生应用",
    description: "ZenSoft 是绍兴市臻书科技有限公司运营的软件品牌，面向 macOS、iOS 与 Apple TV 提供原生应用。",
    openGraphTitle: "ZenSoft — Apple 平台原生应用",
    openGraphDescription: "绍兴市臻书科技有限公司面向 macOS、iOS 与 Apple TV 开发和维护原生应用。",
  },
};
