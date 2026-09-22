"use client";

import { motion, useReducedMotion } from "motion/react";
import { Hero } from "@/components/Hero";
import { ProductGrid } from "@/components/ProductGrid";
import { LanguageProvider, useLanguage } from "@/components/LanguageProvider";
import type { SiteContent } from "@/lib/content-schema";
import type { SiteLanguage } from "@/lib/language";

export function BrandMark({ compact = false, logoUrl }: { compact?: boolean; logoUrl?: string | null }) {
  if (logoUrl) return <img src={logoUrl} className={compact ? "brand-logo-image brand-logo-image--compact" : "brand-logo-image"} alt="" aria-hidden />;
  return <span className={compact ? "brand-mark brand-mark--compact" : "brand-mark"} aria-hidden><span /><span /><span /><span /></span>;
}

function TopBar() {
  const reduceMotion = useReducedMotion();
  const { language, setLanguage, text, content, logoUrl } = useLanguage();
  return (
    <motion.header
      className="site-header"
      initial={reduceMotion ? false : { opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: .5, ease: [.23, 1, .32, 1] }}
    >
      <nav className="nav-shell" aria-label={text.navLabel}>
        <a href="#top" className="brand-link">
          <BrandMark compact logoUrl={logoUrl} />
          <span className="brand-wordmark"><strong>{content.brand.name}</strong><small>NATIVE SOFTWARE</small></span>
        </a>
        <div className="nav-links"><a href="#products">{text.apps}</a><a href="#company">{text.companyLabel}</a><a href="#principles">{text.principles}</a></div>
        <div className="nav-actions">
          <button type="button" className="language-toggle" aria-label={text.languageLabel} onClick={() => setLanguage(language === "zh" ? "en" : "zh")}>{text.language}</button>
        </div>
      </nav>
    </motion.header>
  );
}

function Principles() {
  const reduceMotion = useReducedMotion();
  const { text } = useLanguage();
  return (
    <motion.section
      id="principles"
      className="principles-section"
      initial={reduceMotion ? false : { opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-12%" }}
      transition={{ duration: .65, ease: [.23, 1, .32, 1] }}
    >
      <div className="principles-copy"><p className="section-label">{text.principleLabel}</p><h2>{text.principleTitle}</h2><p>{text.principleDescription}</p></div>
      <div className="principle-list">{text.principlesList.map((item, index) => <div key={`${item.title}-${index}`}><span>{String(index + 1).padStart(2, "0")}</span><strong>{item.title}</strong><p>{item.description}</p></div>)}</div>
    </motion.section>
  );
}

function Company() {
  const reduceMotion = useReducedMotion();
  const { language, text, content, logoUrl } = useLanguage();
  const facts = [text.companyLocation, text.companyFocus, text.companyPrinciple];
  return (
    <motion.section
      id="company"
      className="company-section"
      aria-labelledby="company-title"
      initial={reduceMotion ? false : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-12%" }}
      transition={{ duration: .6, ease: [.23, 1, .32, 1] }}
    >
      <div className="company-identity"><BrandMark compact logoUrl={logoUrl} /><div><strong>{content.brand.name}</strong><span>{text.companyName}</span></div></div>
      <div className="company-heading"><p className="section-label">{text.companyLabel}</p><h2 id="company-title">{text.companyTitle}</h2></div>
      <p className="company-description">{text.companyDescription}</p>
      <div className="company-facts" aria-label={text.companyLabel}>
        {facts.map((fact) => <span key={fact}><i />{fact}</span>)}
        {/* Cloudflare 邮箱混淆会在水合前改写此链接的文本与 href，必须 suppress 掉 mismatch，否则 React #418 */}
        <a href="mailto:support@zensoft.top" suppressHydrationWarning><i />{language === "zh" ? "商务联系" : "Business inquiries"} · support@zensoft.top</a>
      </div>
    </motion.section>
  );
}

function Footer() {
  const { language, text, content, logoUrl } = useLanguage();
  return <footer className="site-footer"><a href="#top" className="footer-brand"><BrandMark compact logoUrl={logoUrl} /><span>{content.brand.name}</span></a><p>{text.footer}</p><div className="footer-legal"><span>© {new Date().getFullYear()} {text.companyName} · {language === "zh" ? "版权所有" : "All rights reserved."}</span><a href="https://beian.miit.gov.cn/" target="_blank" rel="noopener noreferrer">浙ICP备2026072549号</a></div></footer>;
}

export function SiteShell({ content, initialLanguage }: { content: SiteContent; initialLanguage: SiteLanguage }) {
  return <LanguageProvider content={content} initialLanguage={initialLanguage}><TopBar /><main id="top"><Hero /><ProductGrid /><Company /><Principles /></main><Footer /></LanguageProvider>;
}
