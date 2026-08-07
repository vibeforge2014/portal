"use client";

import { motion, useReducedMotion, type Variants } from "motion/react";
import { products, groups, type ProductGroup } from "@/data/products";
import { ProductCard } from "./ProductCard";

/**
 * Renders the product grid grouped by section. Each card enters with a staggered
 * critically-damped spring (§4). Under reduced motion the stagger collapses to a
 * short cross-fade (§14) — no slide, no overshoot.
 */
export function ProductGrid() {
  const reduceMotion = useReducedMotion();

  const container: Variants = reduceMotion
    ? { hidden: { opacity: 1 }, show: { opacity: 1 } }
    : {
        hidden: {},
        show: {
          transition: { staggerChildren: 0.06, delayChildren: 0.1 },
        },
      };

  // Card enter: gentle rise + fade. Critically damped (no overshoot) by default.
  const item = reduceMotion
    ? {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        transition: { duration: 0.2 },
      }
    : {
        initial: { opacity: 0, y: 16 },
        animate: { opacity: 1, y: 0 },
        transition: { type: "spring" as const, stiffness: 300, damping: 30 },
      };

  return (
    <div className="mx-auto w-full max-w-content px-6">
      {groups.map((group) => {
        const items = products.filter((p) => p.group === (group.id as ProductGroup));
        if (items.length === 0) return null;
        return (
          <section key={group.id} className="mb-20 last:mb-0">
            <div className="mb-8 flex items-end justify-between gap-6">
              <div>
                <p className="eyebrow mb-2">{group.subtitle}</p>
                <h2 className="text-3xl sm:text-4xl font-semibold tracking-tight text-[rgb(var(--fg))]">
                  {group.title}
                  <span className="ml-3 text-[rgb(var(--fg-tertiary))] font-normal">
                    · {items.length}
                  </span>
                </h2>
              </div>
              {/* Decorative hairline that "separates without dividing" (§12) */}
              <div className="hidden flex-1 sm:block">
                <div
                  className="h-px w-full"
                  style={{
                    background:
                      "linear-gradient(90deg, rgba(var(--hairline),0.18), rgba(var(--hairline),0) 80%)",
                  }}
                />
              </div>
            </div>
            <motion.div
              variants={container}
              initial="hidden"
              animate="show"
              className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3"
            >
              {items.map((product) => (
                <motion.div key={product.id} variants={item} className="h-full">
                  <ProductCard product={product} />
                </motion.div>
              ))}
            </motion.div>
          </section>
        );
      })}
    </div>
  );
}
