import Link from "next/link";
import { X } from "lucide-react";
import type { School } from "@/types/school";
import { getLatestScore, formatScore } from "@/lib/school-utils";
import { buildCompareUrl, removeCompareId } from "@/lib/compare";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface CompareTableProps {
  schools: School[];
  ids: string[];
}

function Cell({ children }: { children: React.ReactNode }) {
  return <td className="border-b border-border px-3 py-3 align-top text-sm">{children}</td>;
}

function HeaderCell({ children }: { children: React.ReactNode }) {
  return (
    <th className="sticky left-0 z-10 w-28 border-b border-border bg-muted/80 px-3 py-3 text-left text-sm font-medium backdrop-blur sm:w-32">
      {children}
    </th>
  );
}

export function CompareTable({ schools, ids }: CompareTableProps) {
  const years = [
    ...new Set(
      schools.flatMap((s) =>
        s.scoreLines.filter((l) => l.batch === "统一招生").map((l) => l.year)
      )
    ),
  ].sort((a, b) => b - a);

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full min-w-[40rem] border-collapse">
        <thead>
          <tr className="bg-muted/40">
            <HeaderCell>项目</HeaderCell>
            {schools.map((school) => (
              <th
                key={school.id}
                className="border-b border-border px-3 py-3 text-left align-top"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <Link
                      href={`/schools/${school.id}`}
                      className="font-semibold text-foreground hover:text-primary"
                    >
                      {school.shortName}
                    </Link>
                    <p className="mt-0.5 text-xs font-normal text-muted-foreground line-clamp-2">
                      {school.name}
                    </p>
                  </div>
                  <Button variant="ghost" size="sm" className="h-7 w-7 shrink-0 p-0" asChild>
                    <Link
                      href={buildCompareUrl(removeCompareId(ids, school.id))}
                      aria-label={`移除 ${school.shortName}`}
                    >
                      <X className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            <HeaderCell>行政区</HeaderCell>
            {schools.map((s) => (
              <Cell key={s.id}>{s.district}区</Cell>
            ))}
          </tr>
          <tr>
            <HeaderCell>学校类型</HeaderCell>
            {schools.map((s) => (
              <Cell key={s.id}>
                <div className="flex flex-wrap gap-1">
                  {s.isKeySchool && <Badge className="text-xs">重点</Badge>}
                  <Badge variant="secondary" className="text-xs">
                    {s.type}
                  </Badge>
                </div>
              </Cell>
            ))}
          </tr>
          <tr>
            <HeaderCell>招生批次</HeaderCell>
            {schools.map((s) => (
              <Cell key={s.id}>
                {s.admissionTypes.length > 0 ? s.admissionTypes.join("、") : "—"}
              </Cell>
            ))}
          </tr>
          <tr>
            <HeaderCell>最新统招线</HeaderCell>
            {schools.map((s) => {
              const latest = getLatestScore(s);
              return (
                <Cell key={s.id}>
                  {latest ? (
                    <div>
                      <div className="text-lg font-bold text-primary">
                        {formatScore(latest.minScore, latest.year)}
                      </div>
                      <div className="text-xs text-muted-foreground">{latest.year}年</div>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">暂无数据</span>
                  )}
                </Cell>
              );
            })}
          </tr>
          <tr>
            <HeaderCell>区排名</HeaderCell>
            {schools.map((s) => {
              const latest = getLatestScore(s);
              return (
                <Cell key={s.id}>
                  {latest?.districtRank != null ? (
                    <span className="font-medium">第 {latest.districtRank} 名</span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )}
                </Cell>
              );
            })}
          </tr>
          <tr>
            <HeaderCell>办学特色</HeaderCell>
            {schools.map((s) => (
              <Cell key={s.id}>
                {s.features.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {s.features.map((f) => (
                      <Badge key={f} variant="outline" className="text-xs">
                        {f}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <span className="text-muted-foreground">—</span>
                )}
              </Cell>
            ))}
          </tr>
          {years.map((year) => (
            <tr key={year}>
              <HeaderCell>{year} 统招</HeaderCell>
              {schools.map((s) => {
                const line = s.scoreLines.find(
                  (l) => l.year === year && l.batch === "统一招生"
                );
                return (
                  <Cell key={s.id}>
                    {line ? (
                      <div>
                        <span className="font-semibold">
                          {formatScore(line.minScore, year)}
                        </span>
                        {line.districtRank != null && (
                          <span className="ml-1 text-xs text-muted-foreground">
                            区排 {line.districtRank}
                          </span>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </Cell>
                );
              })}
            </tr>
          ))}
          <tr>
            <HeaderCell>简介</HeaderCell>
            {schools.map((s) => (
              <Cell key={s.id}>
                <p className="line-clamp-4 text-muted-foreground">{s.description}</p>
                <Link
                  href={`/schools/${s.id}`}
                  className="mt-2 inline-block text-xs text-primary hover:underline"
                >
                  查看详情
                </Link>
              </Cell>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
