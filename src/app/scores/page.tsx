import type { Metadata } from "next";
import { filterScoreRecords, getDistricts, getScoreYears } from "@/lib/schools";
import { ScoreTable, ScoreFilter } from "@/components/scores/ScoreTable";

export const metadata: Metadata = {
  title: "分数线查询",
  description: "查询北京市高中学校历年录取分数线，支持按行政区、批次和分数区间筛选。",
};

interface PageProps {
  searchParams: Promise<{
    district?: string;
    batch?: string;
    year?: string;
    query?: string;
    minScore?: string;
    maxScore?: string;
  }>;
}

export default async function ScoresPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const records = filterScoreRecords({
    district: params.district,
    batch: params.batch,
    year: params.year && params.year !== "全部" ? Number(params.year) : undefined,
    query: params.query,
    minScore: params.minScore ? Number(params.minScore) : undefined,
    maxScore: params.maxScore ? Number(params.maxScore) : undefined,
  });

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">分数线查询</h1>
        <p className="text-muted-foreground">
          查询北京市高中学校历年录取分数线，数据仅供参考，以官方发布为准。
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-4">
        <aside className="lg:col-span-1">
          <div className="sticky top-20 rounded-xl border border-border bg-card p-4">
            <h2 className="mb-4 font-semibold">筛选条件</h2>
            <ScoreFilter
              districts={getDistricts()}
              years={getScoreYears()}
              currentDistrict={params.district}
              currentBatch={params.batch}
              currentYear={params.year}
              currentQuery={params.query}
              currentMinScore={params.minScore}
              currentMaxScore={params.maxScore}
            />
          </div>
        </aside>

        <div className="lg:col-span-3">
          <div className="mb-4 text-sm text-muted-foreground">
            共找到 {records.length} 条记录
          </div>
          <ScoreTable records={records} />
        </div>
      </div>
    </div>
  );
}
