/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
  serverExternalPackages: ["argon2", "better-sqlite3", "sharp"],
};

export default nextConfig;
