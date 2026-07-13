import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "志愿填报攻略",
  description:
    "北京中考志愿填报分批次指南：提前招生、指标分配、统一招生规则说明，含估分志愿助手与指标分配资格自查。",
  keywords: ["北京中考志愿填报", "校额到校", "指标分配", "统一招生", "冲稳保"],
};

export default function GuideLayout({ children }: { children: React.ReactNode }) {
  return children;
}
