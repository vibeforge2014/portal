"use client";

import { motion, useReducedMotion } from "motion/react";

/**
 * Hero. Built in three layers per Apple's material discipline (§12):
 *   1. The drifting halo field — a slow ambient material behind everything.
 *   2. The brand mark / lockup — an actual visual object with weight.
 *   3. The headline + subhead — the verbal hierarchy, with size-specific
 *      tracking and tight leading (§15).
 *
 * Under reduced motion the halos freeze and the spring-driven entrance reduces
 * to a short cross-fade (§14).
 */
export function Hero() {
  const reduceMotion = useReducedMotion();

  return (
    <header className="relative overflow-hidden px-6 pt-20 pb-24 sm:pt-28 sm:pb-32">
      {/* Layer 1 — drifting ambient halos. Bigger, softer, slower than v1. */}
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
        <motion.div
          className="absolute -top-32 left-1/2 h-[52rem] w-[52rem] -translate-x-1/2 rounded-full blur-3xl"
          style={{
            background:
              "radial-gradient(circle, rgba(10,132,255,0.55), rgba(191,90,242,0.30) 40%, transparent 70%)",
          }}
          animate={reduceMotion ? undefined : { x: [-40, 40, -40], y: [-20, 25, -20] }}
          transition={reduceMotion ? undefined : { duration: 22, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute top-40 right-0 h-[36rem] w-[36rem] rounded-full blur-3xl"
          style={{
            background:
              "radial-gradient(circle, rgba(255,159,10,0.40), rgba(52,199,89,0.22) 50%, transparent 70%)",
          }}
          animate={reduceMotion ? undefined : { x: [25, -25, 25], y: [15, -20, 15] }}
          transition={reduceMotion ? undefined : { duration: 26, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-0 left-0 h-[32rem] w-[32rem] rounded-full blur-3xl opacity-60"
          style={{
            background:
              "radial-gradient(circle, rgba(94,92,230,0.45), transparent 70%)",
          }}
          animate={reduceMotion ? undefined : { x: [10, -30, 10], y: [-15, 10, -15] }}
          transition={reduceMotion ? undefined : { duration: 28, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Layer 2 + 3 — brand mark + headline */}
      <div className="mx-auto max-w-content text-center">
        {/* Brand mark — small but heavy, sits above the wordmark like an Apple lockup */}
        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 12, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 26 }}
          className="mb-6 flex justify-center"
        >
          <span
            className="relative flex h-14 w-14 items-center justify-center rounded-2xl text-2xl font-bold text-white"
            style={{
              borderRadius: "1.75rem",
              backgroundImage:
                "linear-gradient(145deg, #0A84FF 0%, #5E5CE6 55%, #BF5AF2 100%)",
              boxShadow:
                "0 10px 24px -8px rgba(94,92,230,0.55), inset 0 1.5px 1px rgba(255,255,255,0.4), inset 0 -2px 4px rgba(0,0,0,0.18)",
            }}
            aria-hidden
          >
            V
            <span
              className="pointer-events-none absolute inset-0 rounded-2xl"
              style={{
                borderRadius: "1.75rem",
                background:
                  "linear-gradient(180deg, rgba(255,255,255,0.30) 0%, rgba(255,255,255,0) 55%)",
              }}
            />
          </span>
        </motion.div>

        {/* Eyebrow */}
        <motion.p
          className="eyebrow mb-5"
          initial={reduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30, delay: 0.05 }}
        >
          Product Matrix · 7 Apps
        </motion.p>

        {/* Display headline — tighter tracking as it grows (§15) */}
        <motion.h1
          className="display text-[rgb(var(--fg))]"
          initial={reduceMotion ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 28, delay: 0.1 }}
        >
          VibeForge
        </motion.h1>

        {/* Subhead — slightly larger, looser leading. Reads as a second beat, not a footnote. */}
        <motion.p
          className="mx-auto mt-6 max-w-2xl text-lg sm:text-xl text-[rgb(var(--fg-secondary))] leading-relaxed"
          initial={reduceMotion ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 28, delay: 0.17 }}
        >
          为创作者打造的原生应用。
          <br className="hidden sm:block" />
          macOS、iOS 与 Apple TV,本地优先,隐私至上。
        </motion.p>

        {/* Anchor chips — concrete counts, telegraphing the matrix (§8). */}
        <motion.div
          className="mt-10 flex flex-wrap items-center justify-center gap-2.5"
          initial={reduceMotion ? false : { opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 28, delay: 0.24 }}
        >
          {[
            { label: "7 个原生应用", color: "rgba(10,132,255,0.18)" },
            { label: "3 个平台", color: "rgba(94,92,230,0.18)" },
            { label: "全本地处理", color: "rgba(52,199,89,0.18)" },
            { label: "无追踪", color: "rgba(191,90,242,0.18)" },
          ].map((chip) => (
            <span
              key={chip.label}
              className="rounded-full border border-[rgba(var(--hairline),0.1)] bg-[rgba(var(--card),0.6)] backdrop-blur px-3.5 py-1.5 text-[13px] font-medium text-[rgb(var(--fg-secondary))] shadow-[0_2px_8px_-2px_rgba(var(--card-shadow),0.18)]"
            >
              <span
                className="mr-2 inline-block h-1.5 w-1.5 rounded-full align-middle"
                style={{ background: chip.color, boxShadow: `0 0 6px ${chip.color}` }}
                aria-hidden
              />
              {chip.label}
            </span>
          ))}
        </motion.div>
      </div>
    </header>
  );
}