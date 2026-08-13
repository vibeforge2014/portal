"use client";

import { motion, useReducedMotion } from "motion/react";
import { AppIcon } from "./AppIcon";
import { useLanguage } from "./LanguageProvider";
import { useProducts } from "./ProductsProvider";

const spring = { type: "spring" as const, stiffness: 260, damping: 28 };

export function Hero() {
  const reduceMotion = useReducedMotion();
  const { text } = useLanguage();
  const { products } = useProducts();
  // "On sale" = visible products that aren't drafts/coming-soon.
  const onSaleCount = products.filter((product) => !product.draft).length;

  return (
    <section className="hero-section" aria-labelledby="hero-title">
      <div className="hero-ambient" aria-hidden />

      <motion.div
        className="hero-copy"
        initial={reduceMotion ? false : { opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={spring}
      >
        <div className="studio-pill"><span /> {text.studio}</div>
        <h1 id="hero-title">
          <span className="headline-plain">{text.headlinePlain}</span>
          <span>{text.headlineAccent}</span>
        </h1>
        <p className="hero-description">{text.heroDescription}</p>
        <div className="hero-actions">
          <a href="#products" className="primary-button">
            {text.browseApps}
            <svg viewBox="0 0 18 18" aria-hidden><path d="m5 7 4 4 4-4" /></svg>
          </a>
          <a href="https://github.com/vibeforge2014" target="_blank" rel="noopener noreferrer" className="quiet-button">
            {text.about} <span>↗</span>
          </a>
        </div>
        <div className="hero-meta" aria-label={text.overviewLabel}>
          <div><strong>{onSaleCount}</strong><span>{text.onSale}</span></div>
          <div><strong>{products.length}</strong><span>{text.macApps}</span></div>
          <div><strong>0</strong><span>{text.tracking}</span></div>
        </div>
      </motion.div>

      <motion.div
        className="showcase-wrap"
        initial={reduceMotion ? false : { opacity: 0, x: 24, scale: 0.98 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        transition={{ ...spring, delay: 0.08 }}
        aria-label="VibeForge 应用预览"
      >
        <div className="showcase-orbit showcase-orbit--one" aria-hidden />
        <div className="showcase-orbit showcase-orbit--two" aria-hidden />
        <div className="showcase-panel">
          <div className="panel-toolbar">
            <div className="traffic-lights"><span /><span /><span /></div>
            <span>VibeForge Apps</span>
            <span className="panel-status"><i /> {products.length} Apps</span>
          </div>
          <div className="panel-copy">
            <span>YOUR EVERYDAY TOOLKIT</span>
            <h2>{text.toolkit.split("\n").map((line, index) => <span key={line}>{index > 0 && <br />}{line}</span>)}</h2>
          </div>
          <div className="icon-stage">
            {products.slice(0, 6).map((product, index) => (
              <motion.a
                key={product.id}
                href={product.url}
                className={`stage-app stage-app--${index + 1}`}
                aria-label={product.name}
                whileHover={reduceMotion ? undefined : { y: -7, scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                transition={spring}
              >
                <AppIcon icon={product.icon} gradient={product.accent} iconSrc={product.iconSrc} size={58} />
                <span>{product.name}</span>
              </motion.a>
            ))}
          </div>
          <div className="panel-dock">
            {products.slice(0, 5).map((product) => (
              <a key={product.id} href={product.url} aria-label={product.name}>
                <AppIcon icon={product.icon} gradient={product.accent} iconSrc={product.iconSrc} size={42} />
              </a>
            ))}
          </div>
        </div>
      </motion.div>
    </section>
  );
}
