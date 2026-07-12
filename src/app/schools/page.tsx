import type { Metadata } from "next";
import { filterSchools, getDistricts, getAllSchools, getSchoolsWithScores } from "@/lib/schools";
import { SCHOOL_TYPES } from "@/types/school";
import { SchoolCard, SchoolFilter } from "@/components/schools/SchoolCard";
import { DataDisclaimer } from "@/components/layout/DataDisclaimer";

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
  }>;
}

export default async function SchoolsPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const schools = filterSchools({
    district: params.district,
    type: params.type,
    query: params.query,
    hasScores: params.hasScores === "1",
  });
  const districts = getDistricts();
  const total = getAllSchools().length;
  const withScores = getSchoolsWithScores();

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-8">
        <h1 className="mb-2 text-3xl font-bold">学校库</h1>
        <p className="text-muted-foreground">
          收录北京市教委公示的 {total} 所普通高中（含示范性高中和重点校），
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
        </div>
      </div>

      <DataDisclaimer className="mt-8" />
    </div>
  );
}
