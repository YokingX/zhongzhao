import meta from "@/data/meta.json";
import manifest from "@/data/data-manifest.json";

function formatDate(iso: string | null) {
  if (!iso) return "未知";
  return new Date(iso).toLocaleString("zh-CN", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function DataDisclaimer({ className = "" }: { className?: string }) {
  const lastUpdated = manifest.lastUpdated || meta.lastUpdated;

  return (
    <div className={`rounded-lg border border-border bg-muted/50 p-4 text-sm text-muted-foreground ${className}`}>
      <p className="mb-1 font-medium text-foreground">数据说明</p>
      <p>{meta.disclaimer}</p>
      <p className="mt-2">
        <strong className="font-medium text-foreground">本站分数线以统一招生为主</strong>
        ；校额到校/提前批暂无完整校线表。学校名单来源：{meta.schoolListSource}。分数线来源：
        {meta.dataSource}。权威请查
        <a
          href={meta.officialSource}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-1 text-primary hover:underline"
        >
          北京教育考试院官网
        </a>
        。更多见
        <a href="/data" className="ml-1 text-primary hover:underline">
          数据说明页
        </a>
        ，纠错见
        <a href="/feedback" className="ml-1 text-primary hover:underline">
          反馈
        </a>
        。
      </p>
      {lastUpdated && (
        <p className="mt-2 text-xs">
          数据最后更新：{formatDate(lastUpdated)}
          {manifest.autoSync && " · 已启用自动同步"}
          {meta.database && " · SQLite 数据库"}
        </p>
      )}
    </div>
  );
}
