"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type Language = "zh" | "en";

const STORAGE_KEY = "norelle-language";

const copy = {
  zh: {
    navLabel: "主导航",
    homeLabel: "VibeForge 首页",
    apps: "应用",
    principles: "理念",
    language: "EN",
    languageLabel: "Switch to English",
    studio: "独立软件工作室",
    headlinePlain: "好工具，应该让人",
    headlineAccent: "自然地喜欢上。",
    heroDescription: "我们打造专注、可靠的原生应用。复杂留给技术，简单留给你。",
    browseApps: "浏览全部应用",
    about: "了解 VibeForge",
    overviewLabel: "产品概览",
    onSale: "款在售产品",
    macApps: "款原生应用",
    tracking: "行为追踪",
    toolkit: "一套为日常而生的\n原生工具。",
    productMatrix: "产品矩阵",
    productTitle: "专注做好\n每一款应用。",
    productIntro: "每一款都为真实的需求而生，\n安静、可靠、不打扰。",
    principleLabel: "我们的坚持",
    principleTitle: "不打扰，才是好工具。",
    principleDescription: "让复杂的能力自然融入日常。数据留在设备上，界面保持清晰，每一次操作都给你即时而恰当的回应。",
    principlesList: [
      ["原生体验", "为每个平台认真设计，而不是简单移植。"],
      ["隐私优先", "尽可能在本地完成处理，不追踪你的行为。"],
      ["克制设计", "只留下真正有用的能力，让使用自然发生。"],
    ],
    footer: "独立开发，用心打磨。",
  },
  en: {
    navLabel: "Main navigation",
    homeLabel: "VibeForge home",
    apps: "Apps",
    principles: "Principles",
    language: "中",
    languageLabel: "切换到中文",
    studio: "Independent software studio",
    headlinePlain: "Tools should feel",
    headlineAccent: "naturally delightful.",
    heroDescription: "We build focused, dependable native apps—keeping the complexity in the technology and the experience simple for you.",
    browseApps: "Explore all apps",
    about: "About VibeForge",
    overviewLabel: "Product overview",
    onSale: "product available",
    macApps: "native apps",
    tracking: "behavior tracking",
    toolkit: "A native toolkit\nfor everyday work.",
    productMatrix: "Product lineup",
    productTitle: "Every app,\ncrafted with care.",
    productIntro: "Each one is built for a real need —\nquiet, reliable, and unobtrusive.",
    principleLabel: "What we believe",
    principleTitle: "Great tools stay out of the way.",
    principleDescription: "Complex capabilities should fit naturally into daily work. Data stays on your device, interfaces stay clear, and every action receives a timely, considered response.",
    principlesList: [
      ["Native experience", "Designed carefully for each platform, never merely ported."],
      ["Privacy first", "Process locally whenever possible, without tracking your behavior."],
      ["Intentional design", "Keep only what is genuinely useful, so every action feels natural."],
    ],
    footer: "Independently built, thoughtfully crafted.",
  },
} as const;

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  text: (typeof copy)[Language];
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>("zh");

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    const preferred: Language = saved === "en" || saved === "zh"
      ? saved
      : window.navigator.language.toLowerCase().startsWith("zh") ? "zh" : "en";
    setLanguageState(preferred);
  }, []);

  useEffect(() => {
    document.documentElement.lang = language === "zh" ? "zh-CN" : "en";
  }, [language]);

  const value = useMemo<LanguageContextValue>(() => ({
    language,
    setLanguage(next) {
      window.localStorage.setItem(STORAGE_KEY, next);
      setLanguageState(next);
    },
    text: copy[language],
  }), [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within LanguageProvider");
  return context;
}
