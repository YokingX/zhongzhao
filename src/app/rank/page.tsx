import type { Metadata } from "next";
import Link from "next/link";
import { TrendingUp } from "lucide-react";
import { getAllSchools } from "@/lib/schools";
import { estimateDistrictRank } from "@/lib/rank-estimate";
import { BEIJING_DISTRICTS } from "@/types/school";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DataDisclaimer } from "@/components/layout/DataDisclaimer";
import { firstParam, normalizeDistrict, parseOptionalNumber } from "@/lib/search-params";

export const metadata: Metadata = {
  title: "估分看区排",
  description: "根据近年统招线粗估分数对应的区排名相对位置（非官方一分一段）。",
};

interface PageProps {
  searchParams: Promise<{
    score?: string | string[];
    year?: string | string[];
    district?: string | string[];
  }>;
}

export default async function RankPage({ searchParams }: PageProps) {
  const raw = await searchParams;
  const score = parseOptionalNumber(firstParam(raw.score));
  const yearRaw = firstParam(raw.year);
  const year = yearRaw === "2024" ? 2024 : 2025;
  const district = normalizeDistrict(firstParam(raw.district)) ?? "海淀";

  const schools = await getAllSchools();
  const result =
    score != null && score > 0
      ? estimateDistrictRank(schools, { year, district, score })
      : null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="mb-8">
        <div className="mb-2 flex items-center gap-2">
          <TrendingUp className="h-7 w-7 text-primary" />
          <h1 className="text-3xl font-bold">估分看区排</h1>
        </div>
        <p className="text-muted-foreground">
          本工具用同区同年「统招录取线 ↔ 区排」样本做相对位置参考，
          <strong className="font-medium text-foreground">不是考试院官方一分一段表</strong>
          ，不能当作录取预测。
        </p>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">输入估分</CardTitle>
          <CardDescription>建议先选对年份分制（2025=510，2024=670）与行政区。</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="grid gap-3 sm:grid-cols-4" action="/rank" method="get">
            <label className="block text-sm sm:col-span-1">
              <span className="mb-1.5 block text-muted-foreground">估分</span>
              <input
                name="score"
                type="number"
                required
                defaultValue={score ?? (year === 2025 ? 480 : 620)}
                min={1}
                max={year === 2025 ? 510 : 670}
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1.5 block text-muted-foreground">年份</span>
              <select
                name="year"
                defaultValue={String(year)}
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
              >
                <option value="2025">2025 · 510</option>
                <option value="2024">2024 · 670</option>
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1.5 block text-muted-foreground">行政区</span>
              <select
                name="district"
                defaultValue={district}
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm"
              >
                {BEIJING_DISTRICTS.map((d) => (
                  <option key={d} value={d}>
                    {d}区
                  </option>
                ))}
              </select>
            </label>
            <div className="flex items-end">
              <Button type="submit" className="w-full">
                估算区排
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {result && score != null && (
        <Card className="mb-6 border-primary/30">
          <CardHeader>
            <CardTitle className="text-base">
              {district}区 · {year} 年 · 估分 {score}
            </CardTitle>
            <CardDescription>
              样本学校 {result.sampleSize} 所 · {result.method}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {result.estimatedRank != null ? (
              <p className="text-3xl font-bold text-primary">
                大约区排第 {result.estimatedRank} 名
                <span className="mt-1 block text-sm font-normal text-muted-foreground">
                  仅供相对位置参考，正式排名以考试院公布为准
                </span>
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">该区样本不足，暂无法估算。请换区或先查分数线。</p>
            )}

            <div className="grid gap-4 sm:grid-cols-2">
              <NeighborList title="分数不高于你的邻近校" items={result.neighborsBelow} />
              <NeighborList title="分数高于你的邻近校" items={result.neighborsAbove} />
            </div>

            <div className="flex flex-wrap gap-2">
              <Button asChild size="sm">
                <Link
                  href={`/guide/suggest?score=${score}&year=${year}&district=${encodeURIComponent(district)}`}
                >
                  生成冲稳保清单
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href={`/scores?year=${year}&batch=${encodeURIComponent("统一招生")}&district=${encodeURIComponent(district)}`}>
                  查看该区统招线
                </Link>
              </Button>
              <Button asChild variant="outline" size="sm">
                <Link href="/assist">问 AI 怎么排志愿</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <DataDisclaimer />
    </div>
  );
}

function NeighborList({
  title,
  items,
}: {
  title: string;
  items: { schoolId: string; shortName: string; minScore: number; districtRank: number }[];
}) {
  return (
    <div>
      <h3 className="mb-2 text-sm font-medium">{title}</h3>
      {items.length === 0 ? (
        <p className="text-xs text-muted-foreground">暂无</p>
      ) : (
        <ul className="space-y-1.5 text-sm">
          {items.map((item) => (
            <li key={`${item.schoolId}-${item.minScore}`}>
              <Link href={`/schools/${item.schoolId}`} className="text-primary hover:underline">
                {item.shortName}
              </Link>
              <span className="text-muted-foreground">
                {" "}
                · {item.minScore} 分 · 区排 {item.districtRank}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
