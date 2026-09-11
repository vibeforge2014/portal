"use client";

import { motion, useReducedMotion } from "motion/react";
import { useRef } from "react";
import type { Product } from "@/data/products";
import { AppIcon } from "./AppIcon";

export function ProductCard({ product, featured = false }: { product: Product; featured?: boolean }) {
  const reduceMotion = useReducedMotion();
  const glowRef = useRef<HTMLDivElement>(null);

  function moveGlow(event: React.PointerEvent<HTMLAnchorElement>) {
    if (reduceMotion || event.pointerType === "touch" || !glowRef.current) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    glowRef.current.style.transform = `translate3d(${event.clientX - bounds.left - 150}px, ${event.clientY - bounds.top - 150}px, 0)`;
  }

  return (
    <motion.a
      href={product.url}
      aria-label={`${product.name} — ${product.tagline}`}
      className={`product-card${featured ? " product-card--featured" : ""}`}
      whileHover={reduceMotion ? undefined : { y: -5 }}
      whileTap={{ scale: 0.985 }}
      transition={{ type: "spring", stiffness: 340, damping: 30 }}
      style={{ "--product-from": product.accent.from, "--product-to": product.accent.to } as React.CSSProperties}
      onPointerMove={moveGlow}
    >
      <div ref={glowRef} className="card-glow" aria-hidden />
      <div className="card-topline">
        <AppIcon icon={product.icon} gradient={product.accent} iconSrc={product.iconSrc} size={featured ? 72 : 58} />
        <span className="card-arrow" aria-hidden>
          <svg viewBox="0 0 20 20"><path d="M5 15 15 5M7 5h8v8" /></svg>
        </span>
      </div>

      <div className="card-content">
        <p className="card-category">{product.category}</p>
        <h3>{product.name}</h3>
        <p className="card-tagline">{product.tagline}</p>
        <p className="card-description">{product.description}</p>
      </div>

      <div className="card-footer">
        <div className="platform-list">
          {product.platforms.map((platform) => <span key={platform}>{platform}</span>)}
        </div>
        {!featured && product.features[0] && <span className="feature-note">{product.features[0].split(",")[0]}</span>}
      </div>
    </motion.a>
  );
}
