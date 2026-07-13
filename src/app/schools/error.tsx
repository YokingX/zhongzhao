"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function SchoolsError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <h1 className="mb-2 text-xl font-bold">学校库加载失败</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        可能是网络波动或筛选条件异常。请重试，或先选择单个行政区查看。
      </p>
      <div className="flex flex-wrap justify-center gap-3">
        <Button onClick={reset}>重试</Button>
        <Button variant="outline" asChild>
          <Link href="/schools">返回学校库</Link>
        </Button>
        <Button variant="ghost" asChild>
          <Link href="/open">手机访问指南</Link>
        </Button>
      </div>
    </div>
  );
}
