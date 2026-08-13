"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getProducts, type Product } from "@/data/products";
import { useLanguage } from "./LanguageProvider";
import {
  fetchVisibilityConfig,
  filterVisible,
  resolveVisibility,
} from "@/lib/visibilityConfig";

type ProductsContextValue = {
  products: Product[];
  loading: boolean;
};

const ProductsContext = createContext<ProductsContextValue | null>(null);

/**
 * Serves the *visible* product list to the storefront.
 *
 * The first render uses catalog defaults (so it matches the statically
 * exported HTML and avoids a hydration mismatch); an effect then fetches
 * `visibility.json` and refines the list. Both Hero and ProductGrid read from
 * here so counts and cards always stay in sync.
 */
export function ProductsProvider({ children }: { children: React.ReactNode }) {
  const { language } = useLanguage();
  const catalog = useMemo(() => getProducts(language), [language]);

  const [products, setProducts] = useState<Product[]>(() =>
    catalog.filter((product) => product.visible !== false),
  );
  const [loading, setLoading] = useState(true);

  // Apply catalog defaults immediately when the language (hence catalog) changes.
  useEffect(() => {
    setProducts(catalog.filter((product) => product.visible !== false));
  }, [catalog]);

  // Refine from the remote config once per catalog change.
  useEffect(() => {
    let cancelled = false;
    fetchVisibilityConfig().then((config) => {
      if (cancelled) return;
      setProducts(filterVisible(catalog, resolveVisibility(catalog, config)));
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [catalog]);

  const value = useMemo<ProductsContextValue>(() => ({ products, loading }), [products, loading]);

  return <ProductsContext.Provider value={value}>{children}</ProductsContext.Provider>;
}

export function useProducts() {
  const context = useContext(ProductsContext);
  if (!context) throw new Error("useProducts must be used within ProductsProvider");
  return context;
}
