import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { filterScoreRecords, getDistricts, getScoreYears } from "@/lib/schools";
import { ScoreTable } from "@/components/scores/ScoreTable";
import { ScoreFilter } from "@/components/scores/ScoreFilter";
import { DataDisclaimer } from "@/components/layout/DataDisclaimer";
import { Button } from "@/components/ui/button";

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
    page?: string;
  }>;
}

function buildPageUrl(params: Record<string, string | undefined>, page: number): string {
  const sp = new URLSearchParams();
  if (params.district) sp.set("district", params.district);
  if (params.batch) sp.set("batch", params.batch);
  if (params.year) sp.set("year", params.year);
  if (params.query) sp.set("query", params.query);
  if (params.minScore) sp.set("minScore", params.minScore);
  if (params.maxScore) sp.set("maxScore", params.maxScore);
  if (page > 1) sp.set("page", String(page));
  const qs = sp.toString();
  return qs ? `/scores?${qs}` : "/scores";
}

function parseOptionalNumber(value: string | undefined): number | undefined {
  if (value == null || value === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

export default async function ScoresPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);

  const [years, districts] = await Promise.all([getScoreYears(), getDistricts()]);
  const latestYear = years[0];

  const displayYear = params.year ?? (latestYear != null ? String(latestYear) : "全部");
  const displayBatch = params.batch ?? "统一招生";

  const effectiveYear =
    params.year === undefined
      ? latestYear
      : params.year === "全部"
        ? undefined
        : Number(params.year);
  const effectiveBatch =
    params.batch === undefined
      ? "统一招生"
      : params.batch === "全部"
        ? undefined
        : params.batch;

  const filterInput = {
    district: params.district,
    batch: effectiveBatch,
    year: effectiveYear,
    query: params.query,
    minScore: parseOptionalNumber(params.minScore),
    maxScore: parseOptionalNumber(params.maxScore),
    page,
  };

  const { records, total, pageSize } = await filterScoreRecords(filterInput);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  if (total > 0 && page > totalPages) {
    redirect(buildPageUrl(params, totalPages));
  }

  const safePage = page;
  const from = total === 0 ? 0 : (safePage - 1) * pageSize + 1;
  const to = Math.min(safePage * pageSize, total);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">分数线查询</h1>
        <p className="text-muted-foreground">
          查询北京市高中学校历年统招录取分数线及区排名。2025年满分510分，2024年满分670分，跨年不可直接比较绝对分值。
        </p>
        {params.year === undefined && params.batch === undefined && latestYear != null && (
          <p className="mt-2 text-sm text-muted-foreground">
            默认展示 {latestYear} 年「统一招生」批次；可在左侧筛选查看其他年份或批次。
          </p>
        )}
      </div>

      <div className="grid gap-8 lg:grid-cols-4">
        <aside className="lg:col-span-1">
          <div className="sticky top-20 rounded-xl border border-border bg-card p-4">
            <h2 className="mb-4 font-semibold">筛选条件</h2>
            <ScoreFilter
              districts={districts}
              years={years}
              currentDistrict={params.district}
              currentBatch={displayBatch}
              currentYear={displayYear}
              currentQuery={params.query}
              currentMinScore={params.minScore}
              currentMaxScore={params.maxScore}
            />
          </div>
        </aside>

        <div className="lg:col-span-3">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
            <span>
              {total === 0
                ? "共 0 条记录"
                : `显示 ${from}–${to} / 共 ${total} 条记录`}
            </span>
            {totalPages > 1 && (
              <span>
                第 {safePage} / {totalPages} 页
              </span>
            )}
          </div>
          <ScoreTable records={records} />

          {totalPages > 1 && (
            <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
              {safePage > 1 ? (
                <Button variant="outline" size="sm" asChild>
                  <Link href={buildPageUrl(params, safePage - 1)}>上一页</Link>
                </Button>
              ) : (
                <Button variant="outline" size="sm" disabled>
                  上一页
                </Button>
              )}
              {safePage < totalPages ? (
                <Button variant="outline" size="sm" asChild>
                  <Link href={buildPageUrl(params, safePage + 1)}>下一页</Link>
                </Button>
              ) : (
                <Button variant="outline" size="sm" disabled>
                  下一页
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      <DataDisclaimer className="mt-8" />
    </div>
  );
}
