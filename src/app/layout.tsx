import type { Metadata } from "next";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "北京中考升学指导 - 初三学生报考高中参考平台",
    template: "%s | 北京中考升学指导",
  },
  description:
    "面向北京初三学生及家长的中考升学信息查询与指导平台，提供学校介绍、历年分数线、政策解读和志愿填报攻略。",
  keywords: ["北京中考", "初三升学", "高中报考", "志愿填报", "分数线", "校额到校"],
  openGraph: {
    title: "北京中考升学指导",
    description: "北京初三学生报考高中的信息查询与升学指导平台",
    locale: "zh_CN",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen antialiased">
        <Header />
        <main className="min-h-[calc(100vh-8rem)]">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
