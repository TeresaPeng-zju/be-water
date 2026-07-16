import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });
export const metadata: Metadata = {
  title: "Be Water — AI Growth OS",
  description: "把一个人的专业知识，转化为持续获客、成交和自我优化的生意系统。",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
  openGraph: {
    title: "Be Water — A Calm Growth Operating System",
    description: "让你的专业，自然流向需要它的人。",
    images: [{ url: "/og.png", width: 1200, height: 630, alt: "Be Water Growth OS" }],
  },
  twitter: { card: "summary_large_image", images: ["/og.png"] },
};
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="zh-CN"><body className={`${geistSans.variable} ${geistMono.variable}`}>{children}</body></html>; }
