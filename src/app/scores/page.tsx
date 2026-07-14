import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  filterScoreRecords,
  getDistrictScoreCounts,
  getScoreYears,
} from "@/lib/schools";
import { ScoreTable } from "@/components/scores/ScoreTable";
import { ScoreFilter } from "@/components/scores/ScoreFilter";
import { ScoreDistrictGrid } from "@/components/scores/ScoreDistrictGrid";
import { buildScoresUrl, type ScoreFilterParams } from "@/lib/scores-url";
import { DataDisclaimer } from "@/components/layout/DataDisclaimer";
import { Button } from "@/components/ui/button";
import {
  firstParam,
  normalizeDistrict,
  parseOptionalNumber,
  parsePage,
} from "@/lib/search-params";

export const metadata: Metadata = {
  title: "分数线查询",
  description: "查询北京市高中学校历年录取分数线，支持按行政区、批次和分数区间筛选。",
};

interface PageProps {
  searchParams: Promise<{
    district?: string | string[];
    batch?: string | string[];
    year?: string | string[];
    query?: string | string[];
    minScore?: string | string[];
    maxScore?: string | string[];
    page?: string | string[];
  }>;
}

export default async function ScoresPage({ searchParams }: PageProps) {
  const raw = await searchParams;
  const page = parsePage(firstParam(raw.page));
  const district = normalizeDistrict(firstParam(raw.district));
  const batch = firstParam(raw.batch);
  const yearRaw = firstParam(raw.year);
  const query = firstParam(raw.query);
  const minScore = firstParam(raw.minScore);
  const maxScore = firstParam(raw.maxScore);

  const years = await getScoreYears();
  const latestYear = years[0];

  const displayYear = yearRaw ?? (latestYear != null ? String(latestYear) : "全部");
  const displayBatch = batch ?? "统一招生";

  const effectiveYear =
    yearRaw === undefined
      ? latestYear
      : yearRaw === "全部"
        ? undefined
        : Number(yearRaw);
  const effectiveBatch =
    batch === undefined
      ? "统一招生"
      : batch === "全部"
        ? undefined
        : batch;

  const filterParams: ScoreFilterParams = {
    district,
    batch: batch ?? undefined,
    year: yearRaw,
    query,
    minScore,
    maxScore,
    page: page > 1 ? String(page) : undefined,
  };

  // 网格 URL 用展示用参数（含默认年/批次），切换区时保留当前筛选
  const gridFilterParams: ScoreFilterParams = {
    batch: displayBatch === "全部" ? undefined : displayBatch,
    year: displayYear === "全部" ? undefined : displayYear,
    query,
    minScore,
    maxScore,
  };

  const [{ records, total, pageSize }, { districts: districtCounts, total: gridTotal }] =
    await Promise.all([
      filterScoreRecords({
        district,
        batch: effectiveBatch,
        year: effectiveYear,
        query,
        minScore: parseOptionalNumber(minScore),
        maxScore: parseOptionalNumber(maxScore),
        page,
      }),
      getDistrictScoreCounts({
        year: effectiveYear,
        batch: effectiveBatch,
      }),
    ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  if (total > 0 && page > totalPages) {
    redirect(buildScoresUrl(filterParams, { page: String(totalPages) }));
  }

  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">分数线查询</h1>
        <p className="text-muted-foreground">
          查询北京市高中学校历年统招录取分数线及区排名。2025年满分510分，2024年满分670分，跨年不可直接比较绝对分值。
          点击下方行政区卡片即可快速筛选。
        </p>
        {yearRaw === undefined && batch === undefined && latestYear != null && (
          <p className="mt-2 text-sm text-muted-foreground">
            默认展示 {latestYear} 年「统一招生」批次；可在上方修改年份或批次。
          </p>
        )}
      </div>

      <div className="mb-8">
        <ScoreFilter
          years={years}
          currentDistrict={district}
          currentBatch={displayBatch}
          currentYear={displayYear}
          currentQuery={query}
          currentMinScore={minScore}
          currentMaxScore={maxScore}
        />
      </div>

      <ScoreDistrictGrid
        districtCounts={districtCounts}
        totalCount={gridTotal}
        currentDistrict={district}
        filterParams={gridFilterParams}
        countLabel="条"
      />

      {district && (
        <p className="mb-4 text-sm text-muted-foreground">
          当前浏览：
          <span className="font-medium text-foreground">{district}区</span>
          {displayYear !== "全部" && <span> · {displayYear}年</span>}
          {displayBatch !== "全部" && <span> · {displayBatch}</span>}
        </p>
      )}

      <section id="score-list" className="scroll-mt-24">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">
            {district ? `${district}区分数线` : "全部区域分数线"}
          </h2>
          <span className="text-sm text-muted-foreground">
            {total === 0
              ? "共 0 条"
              : `显示 ${from}–${to} / 共 ${total} 条`}
            {totalPages > 1 && ` · 第 ${page}/${totalPages} 页`}
          </span>
        </div>

        <ScoreTable records={records} />

        {totalPages > 1 && (
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
            {page > 1 ? (
              <Button variant="outline" size="sm" asChild>
                <Link href={buildScoresUrl(filterParams, { page: String(page - 1) })}>
                  上一页
                </Link>
              </Button>
            ) : (
              <Button variant="outline" size="sm" disabled>
                上一页
              </Button>
            )}
            {page < totalPages ? (
              <Button variant="outline" size="sm" asChild>
                <Link href={buildScoresUrl(filterParams, { page: String(page + 1) })}>
                  下一页
                </Link>
              </Button>
            ) : (
              <Button variant="outline" size="sm" disabled>
                下一页
              </Button>
            )}
          </div>
        )}
      </section>

      <DataDisclaimer className="mt-8" />
    </div>
  );
}
