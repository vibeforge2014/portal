"use client";

import { motion, useReducedMotion } from "motion/react";
import type { Product } from "@/data/products";

/**
 * A single product card. Rendered as a real <a> so it is keyboard-focusable and
 * reachable without JS. Motion only enhances: hover lift (symmetric path, §7),
 * pointer-down scale for instant response (§1).
 *
 * Springs follow Apple's defaults: critically damped (1.0 / no overshoot) for
 * ordinary UI, ~0.4s response (§4).
 */
export function ProductCard({ product }: { product: Product }) {
  const reduceMotion = useReducedMotion();
  const gradient = `linear-gradient(135deg, ${product.accent.from}, ${product.accent.to})`;

  // Hover lift: translate up + deepen shadow. Symmetric on enter/exit (§7).
  const lift = reduceMotion
    ? {}
    : {
        y: -6,
        boxShadow:
          "0 18px 40px -12px rgba(var(--card-shadow), 0.28), 0 4px 12px -4px rgba(var(--card-shadow), 0.16)",
      };

  return (
    <motion.a
      href={product.url}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={`${product.name} — ${product.tagline}`}
      whileHover={lift}
      whileTap={{ scale: 0.985 }}
      transition={{ type: "spring", stiffness: 400, damping: 30, mass: 0.6 }}
      className="group relative flex flex-col rounded-2xl p-6 no-underline
        bg-[rgb(var(--card))] border border-[rgba(var(--hairline),0.1)]
        shadow-[0_1px_3px_rgba(var(--card-shadow),0.08),0_8px_24px_-12px_rgba(var(--card-shadow),0.18)]
        transition-colors"
    >
      {/* Icon tile: brand-gradient glyph. Material weight via gradient + soft shadow (§12). */}
      <div
        className="mb-5 flex h-12 w-12 items-center justify-center rounded-xl text-white text-xl font-semibold
          shadow-[0_6px_16px_-6px_rgba(0,0,0,0.4)]
          transition-transform duration-300 group-hover:scale-105"
        style={{ backgroundImage: gradient }}
        aria-hidden
      >
        {product.glyph}
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
      <p className="mt-1 text-[15px] text-[rgb(var(--fg-secondary))] leading-snug">
        {product.tagline}
      </p>

      {/* Description */}
      <p className="mt-3 text-sm text-[rgb(var(--fg-secondary))] leading-relaxed flex-1">
        {product.description}
      </p>

      {/* Feature chips (only when the site actually publishes features) */}
      {product.features.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-1.5">
          {product.features.slice(0, 3).map((f) => (
            <li
              key={f}
              className="rounded-md bg-[rgba(var(--hairline),0.06)] px-2 py-1
                text-[11px] text-[rgb(var(--fg-secondary))] leading-none"
            >
              {f}
            </li>
          ))}
        </ul>
      )}

      {/* Platform badges */}
      <div className="mt-5 flex items-center justify-between border-t border-[rgba(var(--hairline),0.08)] pt-3">
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
        {/* Arrow nudges on hover, telegraphing the link destination (§8). */}
        <span
          className="text-[rgb(var(--fg-tertiary))] transition-all duration-200
            group-hover:translate-x-0.5 group-hover:text-[rgb(var(--accent))]"
          aria-hidden
        >
          →
        </span>
      </div>
    </motion.a>
  );
}
