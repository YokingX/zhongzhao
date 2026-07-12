import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "志愿填报攻略",
  description: "北京中考志愿填报分批次指南，含指标分配资格自查和常见填报误区。",
};

export default function GuideLayout({ children }: { children: React.ReactNode }) {
  return children;
}
