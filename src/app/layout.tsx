import type { Metadata, Viewport } from "next";
import { ThemeScript } from "@/components/ThemeScript";
import "./globals.css";

export const metadata: Metadata = {
  title: "VibeForge — ChargePilot 与 MinuteFlow",
  description:
    "VibeForge 的 macOS 原生应用：ChargePilot 现已开放购买，MinuteFlow 暂不销售。",
  icons: {
    icon: [
      {
        url: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'><stop offset='0' stop-color='%230A84FF'/><stop offset='1' stop-color='%23BF5AF2'/></linearGradient></defs><rect width='100' height='100' rx='24' fill='url(%23g)'/><text x='50' y='70' font-size='56' font-weight='700' text-anchor='middle' fill='white' font-family='system-ui,sans-serif'>V</text></svg>",
      },
    ],
  },
  openGraph: {
    title: "VibeForge — ChargePilot 与 MinuteFlow",
    description:
      "ChargePilot 现已开放购买，MinuteFlow 暂不销售。",
    type: "website",
  },
};

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
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <ThemeScript />
      </head>
      <body>{children}</body>
    </html>
  );
}
