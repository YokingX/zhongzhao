"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-white text-slate-900 antialiased">
        <div className="mx-auto max-w-lg px-4 py-20 text-center">
          <h1 className="mb-2 text-xl font-bold">页面出错了</h1>
          <p className="mb-6 text-sm text-slate-600">
            可能是网络波动或临时故障。请重试；若在微信内打开，建议右上角「…」→ 在浏览器中打开。
          </p>
          {process.env.NODE_ENV === "development" && (
            <p className="mb-4 break-all text-xs text-slate-500">{error.message}</p>
          )}
          <div className="flex flex-wrap justify-center gap-3">
            <Button onClick={reset}>重试</Button>
            <Button variant="outline" asChild>
              <Link href="/">回首页</Link>
            </Button>
            <Button variant="ghost" asChild>
              <Link href="/open">手机访问指南</Link>
            </Button>
          </div>
        </div>
      </body>
    </html>
  );
}
