"use client";

import { LanguageProvider, useLanguage } from "@/components/LanguageProvider";
import { SoftwareDropdown } from "@/components/SoftwareDropdown";
import type { SiteContent } from "@/lib/content-schema";
import type { SiteLanguage } from "@/lib/language";

export function BrandMark({ compact = false, logoUrl }: { compact?: boolean; logoUrl?: string | null }) {
  if (logoUrl) return <img src={logoUrl} className={compact ? "brand-logo-image brand-logo-image--compact" : "brand-logo-image"} alt="" aria-hidden />;
  return <span className={compact ? "brand-mark brand-mark--compact" : "brand-mark"} aria-hidden><span /><span /><span /><span /></span>;
}

function TopBar() {
  const { language, setLanguage, text, content, logoUrl } = useLanguage();
  return (
    <header className="site-header">
      <nav className="nav-shell" aria-label={text.navLabel}>
        <a href="#top" className="brand-link">
          <BrandMark compact logoUrl={logoUrl} />
          <span className="brand-wordmark"><strong>{content.brand.name}</strong><small>NATIVE SOFTWARE</small></span>
        </a>
        <div className="nav-links"><SoftwareDropdown /><a href="#company">{text.companyLabel}</a></div>
        <div className="nav-actions">
          <div className="mobile-tools-menu"><SoftwareDropdown compact /></div>
          <button type="button" className="language-toggle" aria-label={text.languageLabel} onClick={() => setLanguage(language === "zh" ? "en" : "zh")}>{text.language}</button>
        </div>
      </nav>
    </header>
  );
}

function Hero() {
  const { text } = useLanguage();
  return (
    <section className="home-hero" aria-labelledby="hero-title">
      <p className="hero-eyebrow">{text.companyName}</p>
      <h1 id="hero-title">{text.heroTitle.split("\n").map((line, index) => <span key={line}>{index > 0 && <br />}{line}</span>)}</h1>
      <p className="hero-description">{text.heroDescription}</p>
      <a className="hero-anchor" href="#company">{text.companyLabel} <span aria-hidden>↓</span></a>
    </section>
  );
}

function Company() {
  const { language, text, content, logoUrl } = useLanguage();
  return (
    <section id="company" className="company-section" aria-labelledby="company-title">
      <div className="company-identity"><BrandMark compact logoUrl={logoUrl} /><div><strong>{content.brand.name}</strong><span>{text.companyName}</span></div></div>
      <div className="company-heading"><p className="section-label">{text.companyLabel}</p><h2 id="company-title">{text.companyTitle.split("\n").map((line, index) => <span key={line}>{index > 0 && <br />}{line}</span>)}</h2></div>
      <p className="company-description">{text.companyDescription}</p>
      <div className="company-facts" aria-label={text.companyLabel}>
        <span><i />{text.companyLocation}</span>
        {/* Cloudflare 邮箱混淆会在水合前改写此链接的文本与 href，必须 suppress 掉 mismatch，否则 React #418 */}
        <a href="mailto:support@zensoft.top" suppressHydrationWarning><i />{language === "zh" ? "商务联系" : "Business inquiries"} · support@zensoft.top</a>
      </div>
    </section>
  );
}

function Scope() {
  const { text } = useLanguage();
  return (
    <section id="scope" className="scope-section" aria-labelledby="scope-title">
      <div className="scope-heading"><h2 id="scope-title">{text.scopeLabel}</h2></div>
      <div className="scope-list">
        {text.scopeList.map((item, index) => <div key={`${item.title}-${index}`}><span>{String(index + 1).padStart(2, "0")}</span><strong>{item.title}</strong><p>{item.description}</p></div>)}
      </div>
    </section>
  );
}

function Footer() {
  const { language, text, content, logoUrl } = useLanguage();
  return <footer className="site-footer"><a href="#top" className="footer-brand"><BrandMark compact logoUrl={logoUrl} /><span>{content.brand.name}</span></a><p>{text.footer} <a href={language === "zh" ? "/zh-hans/tools/pdf/merge/" : "/en/tools/pdf/merge/"}>{language === "zh" ? "PDF 工具" : "PDF tools"}</a></p><div className="footer-legal"><span>© {new Date().getFullYear()} {text.companyName} · {language === "zh" ? "版权所有" : "All rights reserved."}</span><a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer">浙ICP备2026072549号</a><a href="https://beian.mps.gov.cn/#/query/webSearch?code=33060402002121" target="_blank" rel="noopener noreferrer">浙公网安备33060402002121号</a></div></footer>;
}

export function SiteShell({ content, initialLanguage }: { content: SiteContent; initialLanguage: SiteLanguage }) {
  return <LanguageProvider content={content} initialLanguage={initialLanguage}><TopBar /><main id="top"><Hero /><Company /><Scope /></main><Footer /></LanguageProvider>;
}
