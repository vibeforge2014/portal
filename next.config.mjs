/** @type {import('next').NextConfig} */
const repo = "portal"; // change to "" if deploying to <user>.github.io

const basePath = repo ? `/${repo}` : "";

const nextConfig = {
  output: "export",
  // GitHub Pages serves the site under /<repo>/, so assets must be prefixed.
  basePath: basePath,
  assetPrefix: repo ? `/${repo}/` : "",
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
