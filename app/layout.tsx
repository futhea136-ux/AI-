import type { Metadata } from "next";
import "../styles.css";

export const metadata: Metadata = {
  title: "AI 小秘",
  description: "会听、会记、会提醒的智能日程助手",
  applicationName: "AI 小秘",
  appleWebApp: {
    capable: true,
    title: "AI 小秘",
    statusBarStyle: "default"
  }
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="zh-CN">
      <body data-theme="fusion">{children}</body>
    </html>
  );
}
