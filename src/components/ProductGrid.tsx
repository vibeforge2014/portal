"use client";

import { motion, useReducedMotion } from "motion/react";
import { getProducts } from "@/data/products";
import { ProductCard } from "./ProductCard";
import { useLanguage } from "./LanguageProvider";

export function ProductGrid() {
  const reduceMotion = useReducedMotion();
  const { language, text } = useLanguage();
  const products = getProducts(language);

  return (
    <section id="products" className="products-section" aria-labelledby="products-title">
      <div className="section-heading">
        <div>
          <p className="section-label">{text.productMatrix}</p>
          <h2 id="products-title">{text.productTitle.split("\n").map((line, index) => <span key={line}>{index > 0 && <br />}{line}</span>)}</h2>
        </div>
        <p>{text.productIntro.split("\n").map((line, index) => <span key={line}>{index > 0 && <br />}{line}</span>)}</p>
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
