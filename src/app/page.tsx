"use client";

import { Hero } from "@/components/Hero";
import { ProductGrid } from "@/components/ProductGrid";
import { ProductsProvider } from "@/components/ProductsProvider";
import { LanguageProvider, useLanguage } from "@/components/LanguageProvider";

function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <span className={compact ? "brand-mark brand-mark--compact" : "brand-mark"} aria-hidden>
      <span />
      <span />
      <span />
      <span />
    </span>
  );
}

function TopBar() {
  const { language, setLanguage, text } = useLanguage();
  return (
    <header className="site-header">
      <nav className="nav-shell" aria-label={text.navLabel}>
        <a href="#top" className="brand-link" aria-label={text.homeLabel}>
          <BrandMark compact />
          <span>VibeForge</span>
        </a>

        <div className="nav-links">
          <a href="#products">{text.apps}</a>
          <a href="#principles">{text.principles}</a>
        </div>

        <div className="nav-actions">
          <button
            type="button"
            className="language-toggle"
            aria-label={text.languageLabel}
            onClick={() => setLanguage(language === "zh" ? "en" : "zh")}
          >
            {text.language}
          </button>
          <a
            href="https://github.com/vibeforge2014"
            target="_blank"
            rel="noopener noreferrer"
            className="nav-action"
          >
            GitHub
            <svg viewBox="0 0 16 16" aria-hidden><path d="M4 12 12 4M6 4h6v6" /></svg>
          </a>
        </div>
      </nav>
    </header>
  );
}

function Principles() {
  const { text } = useLanguage();
  return (
    <section id="principles" className="principles-section">
      <div className="principles-copy">
        <p className="section-label">{text.principleLabel}</p>
        <h2>{text.principleTitle}</h2>
        <p>{text.principleDescription}</p>
      </div>
      <div className="principle-list">
        {text.principlesList.map(([title, description], index) => (
          <div key={title}><span>0{index + 1}</span><strong>{title}</strong><p>{description}</p></div>
        ))}
      </div>
    </section>
  );
}

function Footer() {
  const { text } = useLanguage();
  return (
    <footer className="site-footer">
      <a href="#top" className="footer-brand">
        <BrandMark compact />
        <span>VibeForge</span>
      </a>
      <p>{text.footer}</p>
      <span>© {new Date().getFullYear()}</span>
    </footer>
  );
}

export default function Page() {
  return (
    <LanguageProvider>
      <ProductsProvider>
        <TopBar />
        <main id="top">
          <Hero />
          <ProductGrid />
          <Principles />
        </main>
        <Footer />
      </ProductsProvider>
    </LanguageProvider>
  );
}
