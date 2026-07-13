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
import { ScoreRecord } from "@/lib/schools";
import { AdmissionBatch, SCORE_SCALES } from "@/types/school";

interface ScoreTableProps {
  records: ScoreRecord[];
}

export function ScoreTable({ records }: ScoreTableProps) {
  if (records.length === 0) {
    return (
      <div className="rounded-lg border border-border bg-card p-8 text-center text-muted-foreground">
        暂无匹配的分数线数据
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            <th className="px-4 py-3 text-left font-medium">学校</th>
            <th className="px-4 py-3 text-left font-medium">行政区</th>
            <th className="px-4 py-3 text-left font-medium">年份</th>
            <th className="px-4 py-3 text-left font-medium">批次</th>
            <th className="px-4 py-3 text-right font-medium">分数线</th>
            <th className="px-4 py-3 text-right font-medium">区排名</th>
          </tr>
        </thead>
        <tbody>
          {records.map((record, i) => (
            <tr key={`${record.schoolId}-${record.year}-${record.batch}-${i}`} className="border-b border-border last:border-0 hover:bg-muted/30">
              <td className="px-4 py-3">
                <div className="font-medium">{record.shortName}</div>
                <div className="text-xs text-muted-foreground">{record.schoolName}</div>
              </td>
              <td className="px-4 py-3">{record.district}</td>
              <td className="px-4 py-3">{record.year}</td>
              <td className="px-4 py-3">{record.batch}</td>
              <td className="px-4 py-3 text-right font-semibold text-primary">
                {record.maxScore
                  ? `${record.minScore}/${record.maxScore}`
                  : record.minScore}
              </td>
              <td className="px-4 py-3 text-right text-muted-foreground">
                {record.districtRank ?? "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

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

interface ScoreFilterProps {
  districts: string[];
  years: number[];
  currentDistrict?: string;
  currentBatch?: string;
  currentYear?: string;
  currentQuery?: string;
  currentMinScore?: string;
  currentMaxScore?: string;
}

export function ScoreFilter({
  districts,
  years,
  currentDistrict,
  currentBatch,
  currentYear,
  currentQuery,
  currentMinScore,
  currentMaxScore,
}: ScoreFilterProps) {
  return (
    <form className="space-y-4" action="/scores" method="get">
      <div>
        <label htmlFor="query" className="mb-1.5 block text-sm font-medium">搜索学校</label>
        <input
          id="query"
          name="query"
          type="search"
          defaultValue={currentQuery}
          placeholder="输入学校名称或拼音首字母..."
          className="flex h-10 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div>
          <label htmlFor="district" className="mb-1.5 block text-sm font-medium">行政区</label>
          <select id="district" name="district" defaultValue={currentDistrict || "全部"} className="flex h-10 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm">
            <option value="全部">全部</option>
            {districts.map((d) => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="batch" className="mb-1.5 block text-sm font-medium">录取批次</label>
          <select id="batch" name="batch" defaultValue={currentBatch || "全部"} className="flex h-10 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm">
            <option value="全部">全部</option>
            <option value="提前招生">提前招生</option>
            <option value="指标分配">指标分配</option>
            <option value="统一招生">统一招生</option>
          </select>
        </div>
        <div>
          <label htmlFor="year" className="mb-1.5 block text-sm font-medium">年份</label>
          <select id="year" name="year" defaultValue={currentYear || "全部"} className="flex h-10 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm">
            <option value="全部">全部</option>
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor="minScore" className="mb-1.5 block text-sm font-medium">最低分</label>
          <input id="minScore" name="minScore" type="number" defaultValue={currentMinScore} placeholder="如 600" className="flex h-10 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm" />
        </div>
        <div>
          <label htmlFor="maxScore" className="mb-1.5 block text-sm font-medium">最高分</label>
          <input id="maxScore" name="maxScore" type="number" defaultValue={currentMaxScore} placeholder="如 650" className="flex h-10 w-full rounded-lg border border-input bg-card px-3 py-2 text-sm" />
        </div>
      </div>
      <button type="submit" className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary/90">
        查询
      </button>
    </form>
  );
}
