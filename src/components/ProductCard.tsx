"use client";

import { motion, useReducedMotion } from "motion/react";
import type { Product } from "@/data/products";
import { AppIcon } from "./AppIcon";

/**
 * A single product card.
 *
 * Material hierarchy (§12):
 *   1. A subtle radial highlight bleeds in from the icon corner — a static
 *      ambient cue so the card always reads as layered, not flat.
 *   2. The icon's brand glow blooms behind the card on hover.
 *   3. Lift + deeper shadow on hover; symmetric enter/exit path (§7).
 *   4. Inner top edge highlight + outer shadow compose a glass plate.
 *
 * Springs: critically damped (§4). Reduced motion collapses hover/lift and
 * skips the ambient blooms (§14).
 */
export function ProductCard({ product }: { product: Product }) {
  const reduceMotion = useReducedMotion();

  // Hover lift: translate up + deepen shadow + slight scale. Symmetric on enter/exit.
  const lift = reduceMotion
    ? {}
    : {
        y: -8,
        scale: 1.012,
        boxShadow:
          "0 28px 60px -20px rgba(var(--card-shadow), 0.35), 0 8px 18px -8px rgba(var(--card-shadow), 0.2)",
      };

  return (
    <motion.a
      href={product.url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${product.name} — ${product.tagline}`}
      whileHover={lift}
      whileTap={{ scale: 0.985 }}
      transition={{ type: "spring", stiffness: 360, damping: 30, mass: 0.6 }}
      className="group relative flex h-full flex-col rounded-3xl p-7 no-underline overflow-hidden
        bg-[rgb(var(--card))]
        shadow-[0_1px_2px_rgba(var(--card-shadow),0.06),0_12px_28px_-16px_rgba(var(--card-shadow),0.22),inset_0_1px_0_rgba(255,255,255,0.08)]
        border border-[rgba(var(--hairline),0.10)]
        transition-colors"
    >
      {/* Always-on ambient brand glow from the icon corner — static depth cue. */}
      <span
        className="pointer-events-none absolute -top-20 -left-20 h-56 w-56 rounded-full opacity-[0.10] blur-3xl transition-opacity duration-500 group-hover:opacity-30"
        style={{
          background: `radial-gradient(circle, ${product.accent.from}, transparent 70%)`,
        }}
        aria-hidden
      />
      {/* Opposite-corner bloom that surfaces on hover — telegraphing the link target. */}
      <span
        className="pointer-events-none absolute -bottom-24 -right-24 h-56 w-56 rounded-full opacity-0 blur-3xl transition-opacity duration-700 group-hover:opacity-35"
        style={{
          background: `radial-gradient(circle, ${product.accent.to}, transparent 70%)`,
        }}
        aria-hidden
      />

      {/* Top hairline that catches light at the rim of the material. */}
      <span
        className="pointer-events-none absolute inset-x-6 top-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(255,255,255,0.18) 50%, transparent)",
        }}
        aria-hidden
      />

      {/* App icon. */}
      <div className="relative mb-5 transition-transform duration-500 group-hover:scale-[1.04] group-hover:-translate-y-0.5">
        <AppIcon icon={product.icon} gradient={product.accent} iconSrc={product.iconSrc} size={64} />
      </div>

      {/* Eyebrow category */}
      <div className="eyebrow mb-2">
        {product.category}
        {product.draft ? " · 占位" : ""}
      </div>

      {/* Name + tagline */}
      <h3 className="text-xl font-semibold tracking-tight text-[rgb(var(--fg))]">
        {product.name}
      </h3>
      <p className="mt-1.5 text-[15px] text-[rgb(var(--fg-secondary))] leading-snug">
        {product.tagline}
      </p>

      {/* Description */}
      <p className="mt-3 text-sm text-[rgb(var(--fg-secondary))] leading-relaxed">
        {product.description}
      </p>

      {/* Feature chips */}
      {product.features.length > 0 && (
        <ul className="mt-5 mb-6 flex flex-wrap gap-1.5">
          {product.features.slice(0, 3).map((f) => (
            <li
              key={f}
              className="rounded-lg bg-[rgba(var(--hairline),0.06)] px-2.5 py-1
                text-[11px] text-[rgb(var(--fg-secondary))] leading-none"
            >
              {f}
            </li>
          ))}
        </ul>
      )}

      {/* Platform badges + arrow — pinned to bottom */}
      <div className="mt-auto flex items-center justify-between border-t border-[rgba(var(--hairline),0.08)] pt-4">
        <div className="flex gap-1.5">
          {product.platforms.map((p) => (
            <span
              key={p}
              className="rounded-full bg-[rgba(var(--hairline),0.06)] px-2.5 py-0.5
                text-[11px] font-medium text-[rgb(var(--fg-secondary))]"
            >
              {p}
            </span>
          ))}
        </div>
        <span
          className="text-[rgb(var(--fg-tertiary))] transition-all duration-200
            group-hover:translate-x-1 group-hover:text-[rgb(var(--accent))]"
          aria-hidden
        >
          →
        </span>
      </div>
    </motion.a>
  );
}