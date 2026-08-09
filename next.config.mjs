/** @type {import('next').NextConfig} */
// Root-path builds are used by Cloudflare Pages. GitHub Pages can still opt
// into its repository subpath with BASE_PATH=/portal.
const basePath = process.env.BASE_PATH ?? "";

const nextConfig = {
  output: "export",
  basePath: basePath || undefined,
  assetPrefix: basePath || undefined,
  // Expose basePath to client code so <img> srcs in public/ resolve correctly
  // (next/image under static export does not reliably prefix public assets).
  env: {
    NEXT_PUBLIC_BASEPATH: basePath,
  },
  images: {
    unoptimized: true,
  },
  // emit the static site into ./out
  distDir: "out",
  trailingSlash: true,
};

export default nextConfig;
