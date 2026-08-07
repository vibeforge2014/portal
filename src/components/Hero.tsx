"use client";

import { motion, useReducedMotion } from "motion/react";

/**
 * Hero: brand name + positioning line, over a slow drifting gradient halo.
 * The halo is a material cue (depth without a divider). Under reduced motion it
 * becomes a static gradient — no looping oscillation (§14 warns against ~0.2Hz
 * loops specifically).
 */
export function Hero() {
  const reduceMotion = useReducedMotion();

  return (
    <header className="relative overflow-hidden px-6 pt-28 pb-20 sm:pt-36 sm:pb-28">
      {/* Drifting gradient halos */}
      <div className="pointer-events-none absolute inset-0 -z-10" aria-hidden>
        <motion.div
          className="absolute -top-24 left-1/2 h-[40rem] w-[40rem] -translate-x-1/2 rounded-full opacity-40 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, rgba(10,132,255,0.45), rgba(191,90,242,0.25) 45%, transparent 70%)",
          }}
          animate={
            reduceMotion
              ? undefined
              : { x: [-30, 30, -30], y: [-10, 20, -10] }
          }
          transition={
            reduceMotion
              ? undefined
              : { duration: 18, repeat: Infinity, ease: "easeInOut" }
          }
        />
        <motion.div
          className="absolute top-20 right-0 h-[28rem] w-[28rem] rounded-full opacity-30 blur-3xl"
          style={{
            background:
              "radial-gradient(circle, rgba(255,159,10,0.4), rgba(52,199,89,0.2) 50%, transparent 70%)",
          }}
          animate={
            reduceMotion
              ? undefined
              : { x: [20, -20, 20], y: [10, -15, 10] }
          }
          transition={
            reduceMotion
              ? undefined
              : { duration: 22, repeat: Infinity, ease: "easeInOut" }
          }
        />
      </div>

      <div className="mx-auto max-w-content text-center">
        <motion.p
          className="eyebrow mb-5"
          initial={reduceMotion ? false : { opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 30 }}
        >
          产品矩阵
        </motion.p>

        <motion.h1
          className="display text-[rgb(var(--fg))]"
          initial={reduceMotion ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 28, delay: 0.05 }}
        >
          VibeForge
        </motion.h1>

        <motion.p
          className="mx-auto mt-6 max-w-2xl text-lg sm:text-xl text-[rgb(var(--fg-secondary))] leading-relaxed"
          initial={reduceMotion ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 28, delay: 0.12 }}
        >
          为创作者打造的原生应用与开发工具。
          <br className="hidden sm:block" />
          macOS、iOS 与 Apple TV 上的精致体验,本地优先,隐私至上。
        </motion.p>
      </div>
    </header>
  );
}
