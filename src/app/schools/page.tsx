import type { Metadata } from "next";
import Link from "next/link";
import { filterSchools, getDistricts, getSchoolCounts } from "@/lib/schools";
import { SCHOOL_TYPES } from "@/types/school";
import { SchoolCard, SchoolFilter } from "@/components/schools/SchoolCard";
import { DataDisclaimer } from "@/components/layout/DataDisclaimer";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "学校库",
  description: "浏览北京市优质高中学校信息，包括学校简介、办学特色和历年录取分数线。",
};

interface PageProps {
  searchParams: Promise<{
    district?: string;
    type?: string;
    query?: string;
    hasScores?: string;
    page?: string;
  }>;
}

function buildPageUrl(
  params: Record<string, string | undefined>,
  page: number
): string {
  const sp = new URLSearchParams();
  if (params.district) sp.set("district", params.district);
  if (params.type) sp.set("type", params.type);
  if (params.query) sp.set("query", params.query);
  if (params.hasScores) sp.set("hasScores", params.hasScores);
  if (page > 1) sp.set("page", String(page));
  const qs = sp.toString();
  return qs ? `/schools?${qs}` : "/schools";
}

export default async function SchoolsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const page = Math.max(1, Number(params.page) || 1);
  const filterParams = {
    district: params.district,
    type: params.type,
    query: params.query,
    hasScores: params.hasScores === "1",
    page,
  };

  const [{ schools, total, pageSize }, districts, { total: allTotal, withScores }] =
    await Promise.all([
      filterSchools(filterParams),
      getDistricts(),
      getSchoolCounts(),
    ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">学校库</h1>
        <p className="text-muted-foreground">
          收录北京市教委公示的 {allTotal} 所普通高中（含示范性高中和重点校），
          其中 {withScores} 所有历年统招分数线数据。支持按行政区和学校类型筛选。
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-4">
        <aside className="lg:col-span-1">
          <div className="sticky top-20 rounded-xl border border-border bg-card p-4">
            <h2 className="mb-4 font-semibold">筛选条件</h2>
            <SchoolFilter
              districts={districts}
              types={SCHOOL_TYPES}
              currentDistrict={params.district}
              currentType={params.type}
              currentQuery={params.query}
              currentHasScores={params.hasScores}
            />
          </div>
        </aside>

        <div className="lg:col-span-3">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
            <span>
              {total === 0
                ? "共 0 所学校"
                : `显示 ${from}–${to} / 共 ${total} 所学校`}
            </span>
            {totalPages > 1 && (
              <span>
                第 {page} / {totalPages} 页
              </span>
            )}
          </div>

          {schools.length === 0 ? (
            <div className="rounded-xl border border-border bg-card p-12 text-center text-muted-foreground">
              没有找到匹配的学校，请调整筛选条件
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              {schools.map((school) => (
                <SchoolCard key={school.id} school={school} />
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
              {page > 1 ? (
                <Button variant="outline" size="sm" asChild>
                  <Link href={buildPageUrl(params, page - 1)}>上一页</Link>
                </Button>
              ) : (
                <Button variant="outline" size="sm" disabled>
                  上一页
                </Button>
              )}
              {page < totalPages ? (
                <Button variant="outline" size="sm" asChild>
                  <Link href={buildPageUrl(params, page + 1)}>下一页</Link>
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
