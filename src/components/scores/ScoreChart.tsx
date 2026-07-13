"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { AdmissionBatch, SCORE_SCALES } from "@/types/school";

interface ScoreChartProps {
  scoreLines: {
    year: number;
    minScore: number;
    maxScore?: number;
    batch: AdmissionBatch;
    districtRank?: number;
  }[];
  batch?: AdmissionBatch;
}

export function ScoreChart({ scoreLines, batch = "统一招生" }: ScoreChartProps) {
  const filtered = scoreLines
    .filter((l) => l.batch === batch)
    .sort((a, b) => a.year - b.year);

  const data = filtered.map((l) => {
    const max = SCORE_SCALES[l.year] ?? l.maxScore;
    return {
      year: String(l.year),
      score: l.minScore,
      rank: l.districtRank ?? null,
      label: max ? `${l.minScore}/${max}` : String(l.minScore),
    };
  });

  if (data.length === 0) return null;

  const hasRank = data.some((d) => d.rank != null);
  const spansReform =
    filtered.some((l) => l.year <= 2024) && filtered.some((l) => l.year >= 2025);
  const rankValues = data.map((d) => d.rank).filter((r): r is number => r != null);
  const rankMax = rankValues.length > 0 ? Math.max(...rankValues) : 100;
  const rankMin = rankValues.length > 0 ? Math.min(...rankValues) : 1;

  return (
    <div className="space-y-3">
      {spansReform && (
        <p className="text-xs text-amber-700">
          2025 年起中考满分由 670 分调整为 510 分，折线连接仅供趋势参考，跨年请结合区排名或同一年度对比。
        </p>
      )}
      <div className="h-72 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="year" tick={{ fontSize: 12 }} />
            <YAxis
              yAxisId="score"
              domain={["dataMin - 10", "dataMax + 5"]}
              tick={{ fontSize: 12 }}
              label={{ value: "分数线", angle: -90, position: "insideLeft", fontSize: 11 }}
            />
            {hasRank && (
              <YAxis
                yAxisId="rank"
                orientation="right"
                reversed
                domain={[rankMax + 50, Math.max(1, rankMin - 50)]}
                tick={{ fontSize: 12 }}
                label={{ value: "区排名", angle: 90, position: "insideRight", fontSize: 11 }}
              />
            )}
            <Tooltip
              formatter={(value, name, props) => {
                const payload = props?.payload as { label?: string; rank?: number | null } | undefined;
                if (name === "rank") {
                  return value != null ? [`第 ${value} 名`, "区排名"] : ["—", "区排名"];
                }
                return [`${payload?.label ?? value} 分`, "统招最低线"];
              }}
              labelFormatter={(label) => `${label}年`}
            />
            {hasRank && <Legend />}
            <Line
              yAxisId="score"
              type="monotone"
              dataKey="score"
              name="统招最低线"
              stroke="#1d4ed8"
              strokeWidth={2}
              dot={{ fill: "#1d4ed8", r: 4 }}
            />
            {hasRank && (
              <Line
                yAxisId="rank"
                type="monotone"
                dataKey="rank"
                name="区排名"
                stroke="#d97706"
                strokeWidth={2}
                strokeDasharray="5 3"
                connectNulls={false}
                dot={{ fill: "#d97706", r: 4 }}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
