import type { IconKey } from "@/components/AppIcon";

export type Platform = "macOS" | "iOS" | "Apple TV" | "Web";
export type ProductGroup = "apps" | "tools";

export interface Product {
  id: string;
  name: string;
  category: string;
  tagline: string;
  description: string;
  url: string;
  platforms: Platform[];
  group: ProductGroup;
  accent: { from: string; to: string };
  icon: IconKey;
  iconSrc?: string;
  features: string[];
  draft?: boolean;
}
