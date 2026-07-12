import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getAllSchools, getSchoolById, formatScore } from "@/lib/schools";
import { SchoolDetailInfo } from "@/components/schools/SchoolCard";
import { ScoreChart } from "@/components/scores/ScoreTable";
import { DataDisclaimer } from "@/components/layout/DataDisclaimer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface PageProps {
  params: Promise<{ id: string }>;
}

export function generateStaticParams() {
  return getAllSchools().map((school) => ({ id: school.id }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;
  const school = getSchoolById(id);
  if (!school) return { title: "学校未找到" };
  return {
    title: school.name,
    description: school.description,
  };
}

export default async function SchoolDetailPage({ params }: PageProps) {
  const { id } = await params;
  const school = getSchoolById(id);
  if (!school) notFound();

  const unifiedLines = school.scoreLines
    .filter((l) => l.batch === "统一招生")
    .sort((a, b) => b.year - a.year);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Link
        href="/schools"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="h-4 w-4" />
        返回学校库
      </Link>

      <div className="mb-8">
        <h1 className="mb-1 text-3xl font-bold">{school.name}</h1>
        <p className="text-lg text-muted-foreground">{school.shortName}</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>学校简介</CardTitle>
            </CardHeader>
            <CardContent>
              <SchoolDetailInfo school={school} />
            </CardContent>
          </Card>

          {unifiedLines.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>统一招生分数线趋势</CardTitle>
              </CardHeader>
              <CardContent>
                <ScoreChart scoreLines={school.scoreLines} batch="统一招生" />
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>历年录取分数线</CardTitle>
            </CardHeader>
            <CardContent>
              {school.scoreLines.length === 0 ? (
                <p className="text-sm text-muted-foreground">暂无公开统招录取分数线数据</p>
              ) : (
                <div className="space-y-3">
                  {school.scoreLines
                    .sort((a, b) => b.year - a.year || b.minScore - a.minScore)
                    .map((line, i) => (
                      <div
                        key={`${line.year}-${line.batch}-${i}`}
                        className="flex items-center justify-between border-b border-border pb-2 last:border-0"
                      >
                        <div>
                          <div className="text-sm font-medium">{line.year}年</div>
                          <div className="text-xs text-muted-foreground">{line.batch}</div>
                        </div>
                        <div className="text-right">
                          <div className="text-lg font-bold text-primary">
                            {formatScore(line.minScore, line.year)}
                          </div>
                          {line.districtRank && (
                            <div className="text-xs text-muted-foreground">
                              区排 {line.districtRank}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <DataDisclaimer className="mt-8" />
    </div>
  );
}
