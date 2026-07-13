"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function ScoresError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <h1 className="mb-2 text-xl font-bold">分数线加载失败</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        可能是网络波动或查询数据量过大。请稍后重试，或缩小筛选范围（如选择具体年份与批次）。
      </p>
      {process.env.NODE_ENV === "development" && (
        <p className="mb-4 break-all text-xs text-muted-foreground">{error.message}</p>
      )}
      <div className="flex flex-wrap justify-center gap-3">
        <Button onClick={reset}>重试</Button>
        <Button variant="outline" asChild>
          <Link href="/scores?year=2025&batch=统一招生">查看 2025 统招线</Link>
        </Button>
        <Button variant="ghost" asChild>
          <Link href="/open">手机访问指南</Link>
        </Button>
      </div>
    </div>
  );
}
