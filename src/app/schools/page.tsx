import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { filterSchools, getDistrictSchoolCounts, getSchoolCounts } from "@/lib/schools";
import { SCHOOL_TYPES } from "@/types/school";
import { SchoolCard, SchoolFilter } from "@/components/schools/SchoolCard";
import { SchoolDistrictGrid } from "@/components/schools/SchoolDistrictPicker";
import { buildSchoolsUrl, type SchoolFilterParams } from "@/lib/schools-url";
import {
  firstParam,
  normalizeDistrict,
  parseBooleanFlag,
  parsePage,
} from "@/lib/search-params";
import { DataDisclaimer } from "@/components/layout/DataDisclaimer";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "学校库",
  description: "浏览北京市优质高中学校信息，包括学校简介、办学特色和历年录取分数线。",
};

interface PageProps {
  searchParams: Promise<{
    district?: string | string[];
    type?: string | string[];
    query?: string | string[];
    hasScores?: string | string[];
    page?: string | string[];
  }>;
}

export default async function SchoolsPage({ searchParams }: PageProps) {
  const raw = await searchParams;
  const district = normalizeDistrict(firstParam(raw.district));
  const type = firstParam(raw.type);
  const query = firstParam(raw.query);
  const hasScores = parseBooleanFlag(firstParam(raw.hasScores));
  const page = parsePage(firstParam(raw.page));

  const filterParams: SchoolFilterParams = {
    district,
    type,
    query,
    hasScores: hasScores ? "1" : undefined,
    page: page > 1 ? String(page) : undefined,
  };

  const filterInput = { district, type, query, hasScores, page };

  const [{ schools, total, pageSize }, districtCounts, { total: allTotal, withScores }] =
    await Promise.all([
      filterSchools(filterInput),
      getDistrictSchoolCounts(),
      getSchoolCounts(),
    ]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  if (total > 0 && page > totalPages) {
    redirect(buildSchoolsUrl(filterParams, { page: String(totalPages) }));
  }

  const from = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const to = Math.min(page * pageSize, total);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">学校库</h1>
        <p className="text-muted-foreground">
          收录北京市教委公示的 {allTotal} 所普通高中（含示范性高中和重点校），
          其中 {withScores} 所有历年统招分数线数据。点击下方行政区卡片查看对应学校；也可
          <Link href="/compare" className="mx-1 text-primary hover:underline">
            学校对比
          </Link>
          并排比较最多 3 所。
        </p>
      </div>

      <div className="mb-8">
        <SchoolFilter
          types={SCHOOL_TYPES}
          currentDistrict={district}
          currentType={type}
          currentQuery={query}
          currentHasScores={hasScores ? "1" : undefined}
        />
      </div>

      <SchoolDistrictGrid
        districtCounts={districtCounts}
        totalCount={allTotal}
        currentDistrict={district}
        filterParams={filterParams}
      />

      <section id="school-list" className="scroll-mt-24">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-semibold">
            {district ? `${district}区学校` : "全部学校"}
          </h2>
          <span className="text-sm text-muted-foreground">
            {total === 0
              ? "共 0 所"
              : `显示 ${from}–${to} / 共 ${total} 所`}
            {totalPages > 1 && ` · 第 ${page}/${totalPages} 页`}
          </span>
        </div>

        {schools.length === 0 ? (
          <div className="rounded-xl border border-border bg-card p-12 text-center text-muted-foreground">
            <p className="mb-4">没有找到匹配的学校</p>
            <Button variant="outline" size="sm" asChild>
              <Link href="/schools">返回全部行政区</Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {schools.map((school) => (
              <SchoolCard key={school.id} school={school} />
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-8 flex flex-wrap items-center justify-center gap-2">
            {page > 1 ? (
              <Button variant="outline" size="sm" asChild>
                <Link href={buildSchoolsUrl(filterParams, { page: String(page - 1) })}>
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
                <Link href={buildSchoolsUrl(filterParams, { page: String(page + 1) })}>
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
