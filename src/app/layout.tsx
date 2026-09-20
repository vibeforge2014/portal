import type { Viewport } from "next";
import { ThemeScript } from "@/components/ThemeScript";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f8fafc" },
    { media: "(prefers-color-scheme: dark)", color: "#090a0e" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // lang 由客户端 LanguageProvider 按用户语言切换（见 document.documentElement.lang 同步），
  // 服务端保持静态默认值，避免根 layout 访问请求头导致全站动态渲染。
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body>{children}</body>
    </html>
  );
}
