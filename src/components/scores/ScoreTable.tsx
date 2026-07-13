import Link from "next/link";
import { ScoreRecord } from "@/lib/schools";

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
          {records.map((record) => (
            <tr
              key={`${record.schoolId}-${record.year}-${record.batch}`}
              className="border-b border-border last:border-0 hover:bg-muted/30"
            >
              <td className="px-4 py-3">
                <Link
                  href={`/schools/${record.schoolId}`}
                  className="block hover:text-primary"
                >
                  <div className="font-medium">{record.shortName}</div>
                  <div className="text-xs text-muted-foreground">{record.schoolName}</div>
                </Link>
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
