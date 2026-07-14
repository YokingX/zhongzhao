"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function CompareError({ reset }: { error: Error; reset: () => void }) {
  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <h1 className="mb-2 text-xl font-bold">对比页加载失败</h1>
      <p className="mb-6 text-sm text-muted-foreground">请稍后重试，或重新选择学校。</p>
      <div className="flex flex-wrap justify-center gap-3">
        <Button onClick={reset}>重试</Button>
        <Button variant="outline" asChild>
          <Link href="/compare">清空重选</Link>
        </Button>
      </div>
    </div>
  );
}
