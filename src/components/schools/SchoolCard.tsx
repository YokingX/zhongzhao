import Link from "next/link";
import { MapPin, ExternalLink } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { School } from "@/types/school";
import { getLatestScore, formatScore } from "@/lib/school-utils";
import { CompareAddButton } from "@/components/compare/CompareAddButton";

interface SchoolCardProps {
  school: School;
}

export function SchoolCard({ school }: SchoolCardProps) {
  const latestScore = getLatestScore(school);

  return (
    <Card className="flex h-full flex-col transition-shadow hover:shadow-md">
      <Link href={`/schools/${school.id}`} className="flex-1">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-2">
            <CardTitle className="text-base leading-snug">{school.shortName}</CardTitle>
            <div className="flex shrink-0 gap-1">
              {school.isKeySchool && (
                <Badge variant="default" className="text-xs">重点</Badge>
              )}
              <Badge variant="secondary">{school.type}</Badge>
            </div>
          </div>
          <p className="text-sm text-muted-foreground line-clamp-1">{school.name}</p>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="mb-3 flex items-center gap-1 text-sm text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" />
            {school.district}区
          </div>
          {school.features.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-1">
              {school.features.slice(0, 3).map((f) => (
                <Badge key={f} variant="outline" className="text-xs">
                  {f}
                </Badge>
              ))}
            </div>
          )}
          {latestScore ? (
            <div className="text-sm">
              <span className="text-muted-foreground">{latestScore.year}年统招线：</span>
              <span className="font-semibold text-primary">
                {formatScore(latestScore.minScore, latestScore.year)}
              </span>
              {latestScore.districtRank && (
                <span className="ml-2 text-xs text-muted-foreground">
                  区排 {latestScore.districtRank}
                </span>
              )}
            </div>
          ) : (
            <div className="text-xs text-muted-foreground">暂无公开分数线</div>
          )}
        </CardContent>
      </Link>
      <div className="border-t border-border px-4 py-2">
        <CompareAddButton schoolId={school.id} variant="ghost" className="h-8 w-full" />
      </div>
    </Card>
  );
}

interface SchoolFilterProps {
  types: string[];
  currentDistrict?: string;
  currentType?: string;
  currentQuery?: string;
  currentHasScores?: string;
}

export function SchoolFilter({
  types,
  currentDistrict,
  currentType,
  currentQuery,
  currentHasScores,
}: SchoolFilterProps) {
  return (
    <form
      className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 sm:flex-row sm:flex-wrap sm:items-end"
      action="/schools"
      method="get"
    >
      {currentDistrict && <input type="hidden" name="district" value={currentDistrict} />}
      <div className="min-w-0 flex-1 sm:min-w-[12rem]">
        <label htmlFor="query" className="mb-1.5 block text-sm font-medium">
          搜索学校
        </label>
        <input
          id="query"
          name="query"
          type="search"
          defaultValue={currentQuery}
          placeholder="学校名称或拼音首字母"
          className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        />
      </div>
      <div className="w-full sm:w-40">
        <label htmlFor="type" className="mb-1.5 block text-sm font-medium">
          学校类型
        </label>
        <select
          id="type"
          name="type"
          defaultValue={currentType || "全部"}
          className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="全部">全部</option>
          {types.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>
      <label className="flex h-10 shrink-0 items-center gap-2 rounded-lg border border-input bg-background px-3 text-sm sm:mb-0">
        <input
          type="checkbox"
          name="hasScores"
          value="1"
          defaultChecked={currentHasScores === "1"}
          className="h-4 w-4 rounded border-input"
        />
        仅有分数线
      </label>
      <button
        type="submit"
        className="inline-flex h-10 shrink-0 items-center justify-center rounded-lg bg-primary px-6 text-sm font-medium text-primary-foreground hover:bg-primary/90"
      >
        搜索
      </button>
    </form>
  );
}

export function SchoolDetailInfo({ school }: { school: School }) {
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {school.isKeySchool && <Badge>示范性高中</Badge>}
        <Badge variant="secondary">{school.type}</Badge>
        <Badge variant="outline">{school.district}区</Badge>
        {school.admissionTypes.map((t) => (
          <Badge key={t} variant="outline">{t}</Badge>
        ))}
      </div>

      <p className="text-muted-foreground leading-relaxed">{school.description}</p>

      {school.features.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {school.features.map((f) => (
            <Badge key={f} variant="accent">{f}</Badge>
          ))}
        </div>
      )}

      {(school.address || school.website) && (
        <div className="space-y-2 text-sm">
          {school.address && (
            <div className="flex items-start gap-2">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
              <span>{school.address}</span>
            </div>
          )}
          {school.website && (
            <div className="flex items-center gap-2">
              <ExternalLink className="h-4 w-4 text-muted-foreground" />
              <a
                href={school.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                学校官网
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
