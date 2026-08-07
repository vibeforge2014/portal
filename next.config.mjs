/** @type {import('next').NextConfig} */
const repo = "portal"; // change to "" if deploying to <user>.github.io

const nextConfig = {
  output: "export",
  // GitHub Pages serves the site under /<repo>/, so assets must be prefixed.
  basePath: repo ? `/${repo}` : "",
  assetPrefix: repo ? `/${repo}/` : "",
  images: {
    unoptimized: true,
  },
  // emit the static site into ./out
  distDir: "out",
  trailingSlash: true,
};

export default nextConfig;
