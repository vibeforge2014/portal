"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { SiteContent } from "@/lib/content-schema";
import type { Product } from "@/data/products";
import { LANGUAGE_COOKIE, matchAcceptLanguage, normalizeLanguage, type SiteLanguage } from "@/lib/language";

export type Language = SiteLanguage;
const STORAGE_KEY = "zensoft-language";

type LanguageContextValue = {
  language: Language;
  setLanguage: (language: Language) => void;
  text: SiteContent["copy"][Language];
  products: Product[];
  content: SiteContent;
  logoUrl: string | null;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children, content, initialLanguage }: { children: React.ReactNode; content: SiteContent; initialLanguage: Language }) {
  const [language, setLanguageState] = useState<Language>(initialLanguage);

  useEffect(() => {
    const saved = normalizeLanguage(window.localStorage.getItem(STORAGE_KEY));
    if (saved) {
      if (saved !== initialLanguage) setLanguageState(saved);
      persistLanguage(saved);
      return;
    }
    // 首次访问：HTML 按默认语言静态输出，这里按浏览器偏好纠正（替代原服务端 Accept-Language 检测）。
    const preferred = matchAcceptLanguage(navigator.languages?.join(",") ?? navigator.language);
    if (preferred !== initialLanguage) setLanguageState(preferred);
  }, [initialLanguage]);

  useEffect(() => { document.documentElement.lang = language === "zh" ? "zh-CN" : "en"; }, [language]);

  const value = useMemo<LanguageContextValue>(() => {
    const products = content.products.filter((product) => product.visible).sort((a, b) => a.order - b.order).map<Product>((product) => ({
      id: product.id,
      ...product.copy[language],
      url: product.url,
      platforms: product.platforms,
      group: "apps",
      accent: { from: product.accentFrom, to: product.accentTo },
      icon: product.glyph,
      iconSrc: `/api/media/${encodeURIComponent(product.iconAssetId)}`,
      draft: product.draft,
    }));
    return {
      language,
      setLanguage(next) { persistLanguage(next); setLanguageState(next); },
      text: content.copy[language], products, content,
      logoUrl: content.brand.activeLogoId === "builtin-grid" ? null : `/api/media/${encodeURIComponent(content.brand.activeLogoId)}`,
    };
  }, [content, language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

function persistLanguage(language: Language) {
  window.localStorage.setItem(STORAGE_KEY, language);
  const secure = window.location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${LANGUAGE_COOKIE}=${language}; Path=/; Max-Age=31536000; SameSite=Lax${secure}`;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within LanguageProvider");
  return context;
}
