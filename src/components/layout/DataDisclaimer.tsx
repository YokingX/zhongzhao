import meta from "@/data/meta.json";

export function DataDisclaimer({ className = "" }: { className?: string }) {
  return (
    <div className={`rounded-lg border border-border bg-muted/50 p-4 text-sm text-muted-foreground ${className}`}>
      <p className="mb-1 font-medium text-foreground">数据说明</p>
      <p>{meta.disclaimer}</p>
      <p className="mt-2">
        学校名单来源：{meta.schoolListSource}。
        分数线来源：{meta.dataSource}。
        <a
          href={meta.officialSource}
          target="_blank"
          rel="noopener noreferrer"
          className="ml-1 text-primary hover:underline"
        >
          北京教育考试院官网
        </a>
      </p>
    </div>
  );
}
