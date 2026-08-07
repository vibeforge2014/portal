import { Hero } from "@/components/Hero";
import { ProductGrid } from "@/components/ProductGrid";

/**
 * Sticky translucent top bar. Built as a glass material so content scrolls
 * underneath instead of consuming a fixed opaque strip (§12). The brand mark
 * links back to the GitHub account.
 */
function TopBar() {
  return (
    <div className="sticky top-0 z-50 glass">
      <div className="mx-auto flex max-w-content items-center justify-between px-6 py-3.5">
        <a
          href="https://github.com/vibeforge2014"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 no-underline"
        >
          <span
            className="flex h-7 w-7 items-center justify-center rounded-lg text-[13px] font-bold text-white"
            style={{
              backgroundImage:
                "linear-gradient(135deg, #0A84FF, #BF5AF2)",
            }}
            aria-hidden
          >
            V
          </span>
          <span className="text-[15px] font-semibold tracking-tight text-[rgb(var(--fg))]">
            VibeForge
          </span>
        </a>
        <a
          href="https://github.com/vibeforge2014"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium text-[rgb(var(--fg-secondary))] no-underline transition-colors hover:text-[rgb(var(--accent))]"
        >
          GitHub ↗
        </a>
      </div>
    </div>
  );
}

function Footer() {
  return (
    <footer className="px-6 py-12">
      <div className="mx-auto flex max-w-content flex-col items-center gap-2 text-center">
        <p className="text-sm text-[rgb(var(--fg-tertiary))]">
          © {new Date().getFullYear()} VibeForge
        </p>
        <a
          href="https://github.com/vibeforge2014"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm text-[rgb(var(--fg-secondary))] no-underline transition-colors hover:text-[rgb(var(--accent))]"
        >
          github.com/vibeforge2014
        </a>
      </div>
    </footer>
  );
}

export default function Page() {
  return (
    <>
      <TopBar />
      <main>
        <Hero />
        <ProductGrid />
      </main>
      <Footer />
    </>
  );
}
