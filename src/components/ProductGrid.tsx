"use client";

import { motion, useReducedMotion } from "motion/react";
import { products } from "@/data/products";
import { ProductCard } from "./ProductCard";

export function ProductGrid() {
  const reduceMotion = useReducedMotion();

  return (
    <section id="products" className="products-section" aria-labelledby="products-title">
      <div className="section-heading">
        <div>
          <p className="section-label">产品矩阵</p>
          <h2 id="products-title">专注做好两款<br />macOS 工具。</h2>
        </div>
        <p>ChargePilot 现已开放购买。<br />MinuteFlow 正在准备中，暂不开放购买。</p>
      </div>

      <motion.div
        className="product-bento"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-80px" }}
        variants={{
          hidden: {},
          visible: { transition: { staggerChildren: reduceMotion ? 0 : 0.055 } },
        }}
      >
        {products.map((product, index) => (
          <motion.div
            key={product.id}
            className={index === 0 ? "product-slot product-slot--featured" : "product-slot"}
            variants={reduceMotion ? { hidden: { opacity: 0 }, visible: { opacity: 1 } } : {
              hidden: { opacity: 0, y: 20 },
              visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 260, damping: 28 } },
            }}
          >
            <ProductCard product={product} featured={index === 0} />
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
