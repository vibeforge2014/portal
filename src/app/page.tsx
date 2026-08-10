import { Hero } from "@/components/Hero";
import { ProductGrid } from "@/components/ProductGrid";

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
  return (
    <header className="site-header">
      <nav className="nav-shell" aria-label="主导航">
        <a href="#top" className="brand-link" aria-label="VibeForge 首页">
          <BrandMark compact />
          <span>VibeForge</span>
        </a>

        <div className="nav-links">
          <a href="#products">应用</a>
          <a href="#principles">理念</a>
        </div>

        <a
          href="https://github.com/vibeforge2014"
          target="_blank"
          rel="noopener noreferrer"
          className="nav-action"
        >
          GitHub
          <svg viewBox="0 0 16 16" aria-hidden><path d="M4 12 12 4M6 4h6v6" /></svg>
        </a>
      </nav>
    </header>
  );
}

function Principles() {
  return (
    <section id="principles" className="principles-section">
      <div className="principles-copy">
        <p className="section-label">我们的坚持</p>
        <h2>不打扰，才是好工具。</h2>
        <p>
          让复杂的能力自然融入日常。数据留在设备上，界面保持清晰，
          每一次操作都给你即时而恰当的回应。
        </p>
      </div>
      <div className="principle-list">
        <div><span>01</span><strong>原生体验</strong><p>为每个平台认真设计，而不是简单移植。</p></div>
        <div><span>02</span><strong>隐私优先</strong><p>尽可能在本地完成处理，不追踪你的行为。</p></div>
        <div><span>03</span><strong>克制设计</strong><p>只留下真正有用的能力，让使用自然发生。</p></div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="site-footer">
      <a href="#top" className="footer-brand">
        <BrandMark compact />
        <span>VibeForge</span>
      </a>
      <p>独立开发，用心打磨。</p>
      <span>© {new Date().getFullYear()}</span>
    </footer>
  );
}

export default function Page() {
  return (
    <>
      <TopBar />
      <main id="top">
        <Hero />
        <ProductGrid />
        <Principles />
      </main>
      <Footer />
    </>
  );
}
