import type { Metadata } from "next";
import Link from "next/link";
import { filterScoreRecords } from "@/lib/schools";
import { SCORE_SCALES } from "@/types/school";
import { firstParam, parseOptionalNumber } from "@/lib/search-params";
import { DataFreshnessBar } from "@/components/layout/DataFreshnessBar";
import { DataDisclaimer } from "@/components/layout/DataDisclaimer";
import { ShareLinkButton } from "@/components/layout/ShareLinkButton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { SITE_URL } from "@/lib/site";

export const metadata: Metadata = {
  title: "按估分看学校",
  description: "根据预估中考分数生成冲稳保兜统招学校参考清单。",
};

interface PageProps {
  searchParams: Promise<{
    score?: string | string[];
    year?: string | string[];
    district?: string | string[];
  }>;
}

type ScaleYear = 2024 | 2025;

function to2025Scale(score: number, scaleYear: ScaleYear): number {
  if (scaleYear === 2025) return score;
  return Math.round((score / SCORE_SCALES[2024]) * SCORE_SCALES[2025]);
}

function from2025Scale(score2025: number, scaleYear: ScaleYear): number {
  if (scaleYear === 2025) return score2025;
  return Math.round((score2025 / SCORE_SCALES[2025]) * SCORE_SCALES[2024]);
}

function bandsForScore(score: number, scaleYear: ScaleYear) {
  const score2025 = to2025Scale(score, scaleYear);
  const max = SCORE_SCALES[scaleYear];
  const defs = [
    { label: "冲刺", tip: "略高于估分", lo: score2025 + 10, hi: score2025 + 25 },
    { label: "稳妥", tip: "贴近估分", lo: score2025 - 5, hi: score2025 + 10 },
    { label: "保底", tip: "低于估分 5–20", lo: score2025 - 20, hi: score2025 - 5 },
    { label: "兜底", tip: "确保有学上", lo: score2025 - 35, hi: score2025 - 20 },
  ] as const;

  return defs.map((d) => ({
    label: d.label,
    tip: d.tip,
    minScore: Math.max(1, from2025Scale(d.lo, scaleYear)),
    maxScore: Math.min(max, from2025Scale(d.hi, scaleYear)),
  }));
}

export default async function SuggestPage({ searchParams }: PageProps) {
  const raw = await searchParams;
  const score = parseOptionalNumber(firstParam(raw.score));
  const yearRaw = firstParam(raw.year);
  const year = (yearRaw === "2024" ? 2024 : 2025) as ScaleYear;
  const district = firstParam(raw.district)?.replace(/区$/, "");

  if (score == null || score <= 0 || score > (SCORE_SCALES[year] ?? 700)) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="mb-2 text-xl font-bold">请先填写有效估分</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          请从填报攻略中的「估分志愿助手」提交分数，或手动传入 ?score=480&year=2025
        </p>
        <Button asChild>
          <Link href="/guide">返回填报攻略</Link>
        </Button>
      </div>
    );
  }

  const bands = bandsForScore(score, year);
  const sections = await Promise.all(
    bands.map(async (band) => {
      const { records, total } = await filterScoreRecords({
        year,
        batch: "统一招生",
        district: district && district !== "全部" ? district : undefined,
        minScore: band.minScore,
        maxScore: band.maxScore,
        page: 1,
        pageSize: 8,
      });
      // 去重学校，保留最高分那条（已按分数排序）
      const seen = new Set<string>();
      const unique = records.filter((r) => {
        if (seen.has(r.schoolId)) return false;
        seen.add(r.schoolId);
        return true;
      });
      return { ...band, schools: unique, total };
    })
  );

  const pageUrl = `${SITE_URL}/guide/suggest?score=${score}&year=${year}${
    district ? `&district=${encodeURIComponent(district)}` : ""
  }`;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-bold">按估分看学校</h1>
          <p className="text-muted-foreground">
            估分 <strong className="text-foreground">{score}</strong> 分（{year} 年 {SCORE_SCALES[year]} 分制）
            {district ? ` · ${district}区` : " · 全市"} · 统一招生参考清单
          </p>
        </div>
        <ShareLinkButton
          title={`估分 ${score} 分学校清单`}
          summary={`${year}统招冲稳保兜参考（非录取预测）`}
          url={pageUrl}
        />
      </div>

      <DataFreshnessBar className="mb-6" />

      <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
        仅按近年统招最低线区间匹配，不是录取预测。请结合区排名、招生简章与官方系统综合判断。
      </div>

      <div className="mb-8 flex flex-wrap gap-2">
        <Button variant={!district ? "default" : "outline"} size="sm" asChild>
          <Link href={`/guide/suggest?score=${score}&year=${year}`}>全市</Link>
        </Button>
        {["海淀", "西城", "东城", "朝阳", "丰台", "石景山", "通州", "昌平", "大兴", "顺义", "房山", "门头沟"].map((d) => (
          <Button
            key={d}
            variant={district === d ? "default" : "outline"}
            size="sm"
            asChild
          >
            <Link href={`/guide/suggest?score=${score}&year=${year}&district=${encodeURIComponent(d)}`}>
              {d}区
            </Link>
          </Button>
        ))}
      </div>

      <div className="space-y-6">
        {sections.map((section) => (
          <Card key={section.label}>
            <CardHeader className="pb-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Badge>{section.label}</Badge>
                  <span className="text-sm font-normal text-muted-foreground">
                    {section.minScore}–{section.maxScore} 分 · {section.tip}
                  </span>
                </CardTitle>
                <Link
                  href={`/scores?year=${year}&batch=${encodeURIComponent("统一招生")}&minScore=${section.minScore}&maxScore=${section.maxScore}${
                    district ? `&district=${encodeURIComponent(district)}` : ""
                  }`}
                  className="text-xs text-primary hover:underline"
                >
                  在分数线页查看全部 →
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {section.schools.length === 0 ? (
                <p className="text-sm text-muted-foreground">该区间暂无匹配学校，可放宽区筛选或调整估分。</p>
              ) : (
                <ul className="divide-y divide-border rounded-lg border border-border">
                  {section.schools.map((s) => (
                    <li key={`${section.label}-${s.schoolId}`} className="flex flex-wrap items-center justify-between gap-2 px-3 py-2.5">
                      <div className="min-w-0">
                        <Link
                          href={`/schools/${s.schoolId}`}
                          className="font-medium hover:text-primary"
                        >
                          {s.shortName}
                        </Link>
                        <div className="text-xs text-muted-foreground">
                          {s.district}区 · {s.year}统招 {s.minScore}
                          {s.districtRank != null && ` · 区排 ${s.districtRank}`}
                        </div>
                      </div>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/compare?ids=${s.schoolId}`}>对比</Link>
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
              {section.total > section.schools.length && (
                <p className="mt-2 text-xs text-muted-foreground">
                  共约 {section.total} 条记录，上表仅展示前 {section.schools.length} 所。
                </p>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <Button asChild>
          <Link href="/guide">返回攻略 / 改估分</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/guide#volunteer-draft">填写志愿草案</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/faq">常见问题</Link>
        </Button>
      </div>

      <DataDisclaimer className="mt-8" />
    </div>
  );
}
