"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { GitCompare } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  MAX_COMPARE_SCHOOLS,
  addCompareId,
  buildCompareUrl,
  parseCompareIds,
} from "@/lib/compare";

const STORAGE_KEY = "zhongzhao-compare-ids";

function readIds(): string[] {
  try {
    return parseCompareIds(sessionStorage.getItem(STORAGE_KEY) ?? "");
  } catch {
    return [];
  }
}

function writeIds(ids: string[]) {
  try {
    sessionStorage.setItem(STORAGE_KEY, ids.join(","));
  } catch {
    /* ignore */
  }
}

interface CompareAddButtonProps {
  schoolId: string;
  schoolName?: string;
  variant?: "default" | "outline" | "secondary" | "ghost";
  size?: "default" | "sm" | "lg";
  className?: string;
}

export function CompareAddButton({
  schoolId,
  schoolName,
  variant = "outline",
  size = "sm",
  className,
}: CompareAddButtonProps) {
  const [ids, setIds] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setIds(readIds());
    setReady(true);
  }, []);

  const alreadyIn = ids.includes(schoolId);
  const full = ids.length >= MAX_COMPARE_SCHOOLS && !alreadyIn;
  const nextIds = alreadyIn ? ids : addCompareId(ids, schoolId);
  const href = buildCompareUrl(nextIds);

  function handleClick() {
    writeIds(nextIds);
  }

  if (!ready) {
    return (
      <Button variant={variant} size={size} className={className} disabled>
        <GitCompare className="mr-1.5 h-4 w-4" />
        加入对比
      </Button>
    );
  }

  return (
    <Button variant={variant} size={size} className={className} asChild>
      <Link href={href} onClick={handleClick}>
        <GitCompare className="mr-1.5 h-4 w-4" />
        {alreadyIn
          ? "查看对比"
          : full
            ? `替换第 ${MAX_COMPARE_SCHOOLS} 所`
            : schoolName
              ? `对比${schoolName}`
              : "加入对比"}
      </Link>
    </Button>
  );
}
