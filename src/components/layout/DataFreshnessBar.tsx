import meta from "@/data/meta.json";
import manifest from "@/data/data-manifest.json";

export function getDataLastUpdatedIso(): string | null {
  return manifest.lastUpdated || meta.lastUpdated || null;
}

export function formatDataDate(iso: string | null): string {
  if (!iso) return "未知";
  return new Date(iso).toLocaleString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

/** 顶栏轻量数据新鲜度提示 */
export function DataFreshnessBar({ className = "" }: { className?: string }) {
  const iso = getDataLastUpdatedIso();
  if (!iso) return null;

  return (
    <div
      className={`rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground sm:text-sm ${className}`}
    >
      <span className="font-medium text-foreground">数据截至</span>
      <span className="mx-1.5">{formatDataDate(iso)}</span>
      {manifest.autoSync && <span>· 已启用自动同步</span>}
      <span className="mx-1.5">·</span>
      <span>仅供参考，以北京教育考试院官方发布为准</span>
    </div>
  );
}
