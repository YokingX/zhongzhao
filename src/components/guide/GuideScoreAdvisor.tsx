"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SCORE_SCALES } from "@/types/school";

type ScaleYear = 2024 | 2025;

const THRESHOLDS_2025 = {
  early: 380,
  quota: 430,
} as const;

function to2025Scale(score: number, scaleYear: ScaleYear): number {
  if (scaleYear === 2025) return score;
  const max2024 = SCORE_SCALES[2024];
  const max2025 = SCORE_SCALES[2025];
  return Math.round((score / max2024) * max2025);
}

function from2025Scale(score2025: number, scaleYear: ScaleYear): number {
  if (scaleYear === 2025) return score2025;
  return Math.round((score2025 / SCORE_SCALES[2025]) * SCORE_SCALES[2024]);
}

function volunteerBands(score2025: number) {
  return [
    { label: "冲刺", range: [score2025 + 10, score2025 + 25], tip: "前 3 个志愿，略高于估分" },
    { label: "稳妥", range: [score2025 - 5, score2025 + 10], tip: "中间 4 个志愿，贴近估分" },
    { label: "保底", range: [score2025 - 20, score2025 - 5], tip: "后 3 个志愿，低于估分 5–20 分" },
    { label: "兜底", range: [score2025 - 35, score2025 - 20], tip: "最后 2 个志愿，确保有学上" },
  ] as const;
}

function volunteerBandsForScale(score: number, scaleYear: ScaleYear) {
  const base = volunteerBands(to2025Scale(score, scaleYear));
  const max = SCORE_SCALES[scaleYear];
  return base.map((band) => ({
    ...band,
    range: [
      Math.max(1, from2025Scale(band.range[0], scaleYear)),
      Math.min(max, from2025Scale(band.range[1], scaleYear)),
    ] as [number, number],
  }));
}

export function GuideScoreAdvisor() {
  const [rawScore, setRawScore] = useState("480");
  const [scaleYear, setScaleYear] = useState<ScaleYear>(2025);

  const parsed = Number(rawScore);
  const valid = Number.isFinite(parsed) && parsed > 0 && parsed <= (SCORE_SCALES[scaleYear] ?? 700);

  const score2025 = valid ? to2025Scale(parsed, scaleYear) : null;
  const displayScore = valid ? parsed : null;

  const eligibility = useMemo(() => {
    if (score2025 == null) return null;
    return {
      early: score2025 >= THRESHOLDS_2025.early,
      quota: score2025 >= THRESHOLDS_2025.quota,
      unified: true,
    };
  }, [score2025]);

  const bands = valid && displayScore != null ? volunteerBandsForScale(displayScore, scaleYear) : [];
  const queryYear = scaleYear;
  const scoreMax = SCORE_SCALES[scaleYear];

  return (
    <Card className="mb-8">
      <CardHeader>
        <CardTitle>估分志愿助手</CardTitle>
        <CardDescription>
          输入预估中考总分，查看各批次填报资格与统一招生「冲稳保兜」分数区间建议（按 2025 年 510 分制换算）。
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex flex-wrap items-end gap-4">
          <div className="min-w-[140px] flex-1">
            <label htmlFor="est-score" className="mb-1.5 block text-sm font-medium">
              预估总分
            </label>
            <Input
              id="est-score"
              type="number"
              min={1}
              max={SCORE_SCALES[scaleYear]}
              value={rawScore}
              onChange={(e) => setRawScore(e.target.value)}
              placeholder={scaleYear === 2025 ? "如 480" : "如 620"}
            />
          </div>
          <div>
            <span className="mb-1.5 block text-sm font-medium">满分制</span>
            <div className="flex gap-2">
              {([2025, 2024] as const).map((y) => (
                <button
                  key={y}
                  type="button"
                  onClick={() => setScaleYear(y)}
                  className={`rounded-lg border px-3 py-2 text-sm transition-colors ${
                    scaleYear === y
                      ? "border-primary bg-primary/10 font-medium text-primary"
                      : "border-border hover:bg-muted/50"
                  }`}
                >
                  {y}（{SCORE_SCALES[y]}分）
                </button>
              ))}
            </div>
          </div>
        </div>

        {!valid && (
          <p className="text-sm text-muted-foreground">
            请输入 1–{SCORE_SCALES[scaleYear]} 之间的有效分数。
          </p>
        )}

        {valid && eligibility && displayScore != null && score2025 != null && (
          <>
            {scaleYear === 2024 && (
              <p className="text-sm text-amber-700">
                已按满分比例换算为 2025 分制约 <strong>{score2025}</strong> 分，用于批次门槛与志愿区间参考。
              </p>
            )}

            <div>
              <h3 className="mb-3 text-sm font-semibold">批次填报资格（参考线）</h3>
              <div className="flex flex-wrap gap-2">
                <Badge variant={eligibility.early ? "default" : "secondary"}>
                  提前招生 {eligibility.early ? "可填报" : "未达贯通线（≥380）"}
                </Badge>
                <Badge variant={eligibility.quota ? "default" : "secondary"}>
                  指标分配 {eligibility.quota ? "分数达标" : "未达 430 分线"}
                  {eligibility.quota && "（还需满足综评等条件）"}
                </Badge>
                <Badge variant="accent">统一招生 可填报</Badge>
              </div>
            </div>

            <div>
              <h3 className="mb-3 text-sm font-semibold">统一招生 12 志愿区间建议</h3>
              <div className="grid gap-3 sm:grid-cols-2">
                {bands.map((band) => {
                  const [clampedMin, clampedMax] = band.range;
                  const href = `/scores?year=${queryYear}&batch=统一招生&minScore=${clampedMin}&maxScore=${clampedMax}`;
                  return (
                    <div
                      key={band.label}
                      className="rounded-lg border border-border p-3 hover:bg-muted/30"
                    >
                      <div className="mb-1 flex items-center justify-between">
                        <span className="font-medium">{band.label}</span>
                        <span className="text-sm text-primary">
                          {clampedMin}–{clampedMax} 分
                        </span>
                      </div>
                      <p className="mb-2 text-xs text-muted-foreground">{band.tip}</p>
                      <Link href={href} className="text-xs text-primary hover:underline">
                        查看该区间学校 →
                      </Link>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button asChild size="sm">
                <Link
                  href={`/scores?year=${queryYear}&batch=统一招生&minScore=${Math.max(1, displayScore - 15)}&maxScore=${Math.min(scoreMax, displayScore + 15)}`}
                >
                  查看估分 ±15 分学校
                </Link>
              </Button>
              <Button variant="outline" size="sm" asChild>
                <Link href={`/scores?year=${queryYear}&district=全部`}>浏览全部分数线</Link>
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
