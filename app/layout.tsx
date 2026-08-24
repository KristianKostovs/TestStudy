import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const origin = "https://python-framework-quest.leafy-slug-3142.chatgpt.site";
const title = "测试能力修炼场";
const description = "选择 Python 框架、UI 自动化、API 自动化、AI 测试或性能测试，进入各自独立的学习路线。";

export const metadata: Metadata = {
  metadataBase: new URL(origin),
  title,
  description,
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
  openGraph: { title, description, type: "website", images: [`${origin}/og-platform.png`] },
  twitter: { card: "summary_large_image", title, description, images: [`${origin}/og-platform.png`] },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
