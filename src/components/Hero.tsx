"use client";

import { motion, useMotionTemplate, useMotionValue, useReducedMotion, useSpring } from "motion/react";
import { AppIcon } from "./AppIcon";
import { useLanguage } from "./LanguageProvider";

const spring = { type: "spring" as const, stiffness: 260, damping: 28 };
const tiltSpring = { stiffness: 130, damping: 22, mass: 0.7 };

function HeroAppIcon({ product, size }: { product: ReturnType<typeof useLanguage>["products"][number]; size: number }) {
  const inset = size >= 50 ? 4 : 3;
  return (
    <span className="hero-app-icon" style={{ width: size, height: size, borderRadius: size * 0.27 }}>
      <AppIcon icon={product.icon} gradient={product.accent} iconSrc={product.iconSrc} size={size - inset * 2} />
    </span>
  );
}

export function Hero() {
  const reduceMotion = useReducedMotion();
  const { text, products, content } = useLanguage();
  const pointerX = useMotionValue(0);
  const pointerY = useMotionValue(0);
  const rotateX = useSpring(pointerY, tiltSpring);
  const rotateY = useSpring(pointerX, tiltSpring);
  const panelTransform = useMotionTemplate`perspective(1100px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (reduceMotion || event.pointerType === "touch") return;
    const bounds = event.currentTarget.getBoundingClientRect();
    pointerX.set(((event.clientX - bounds.left) / bounds.width - 0.5) * 6);
    pointerY.set((0.5 - (event.clientY - bounds.top) / bounds.height) * 5);
  }

  function resetTilt() {
    pointerX.set(0);
    pointerY.set(0);
  }

  return (
    <section className="hero-section" aria-labelledby="hero-title">
      <div className="hero-ambient" aria-hidden />

      <motion.div
        className="hero-copy"
        initial={reduceMotion ? false : { opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={spring}
      >
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
          <a href="#company" className="quiet-button">
            {text.about} <span>↓</span>
          </a>
        </div>
      </motion.div>

      <motion.div
        className="showcase-wrap"
        initial={reduceMotion ? false : { opacity: 0, x: 24, scale: 0.98 }}
        animate={{ opacity: 1, x: 0, scale: 1 }}
        transition={{ ...spring, delay: 0.08 }}
        aria-label={`${content.brand.name} ${text.overviewLabel}`}
        onPointerMove={handlePointerMove}
        onPointerLeave={resetTilt}
      >
        <div className="showcase-orbit showcase-orbit--one" aria-hidden />
        <div className="showcase-orbit showcase-orbit--two" aria-hidden />
        <motion.div className="showcase-panel" style={reduceMotion ? undefined : { transform: panelTransform }}>
          <div className="panel-scan" aria-hidden />
          <div className="panel-toolbar">
            <div className="traffic-lights"><span /><span /><span /></div>
            <span>ZenSoft Apps</span>
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
                <span className="stage-app-float" style={{ animationDelay: `${index * -0.7}s` }}>
                  <HeroAppIcon product={product} size={58} />
                  <span>{product.name}</span>
                </span>
              </motion.a>
            ))}
          </div>
          <div className="panel-dock">
            {products.slice(0, 5).map((product) => (
              <a key={product.id} href={product.url} aria-label={product.name}>
                <HeroAppIcon product={product} size={42} />
              </a>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
