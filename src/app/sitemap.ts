import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: "https://zensoft.top/", changeFrequency: "weekly", priority: 1 }];
}
