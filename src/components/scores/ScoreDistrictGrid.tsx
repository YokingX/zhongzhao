import { cn } from "@/lib/utils";
import {
  buildScoresDistrictUrl,
  type ScoreFilterParams,
} from "@/lib/scores-url";

interface ScoreDistrictGridProps {
  districtCounts: { district: string; count: number }[];
  totalCount: number;
  currentDistrict?: string;
  filterParams: ScoreFilterParams;
  countLabel?: string;
}

function DistrictCard({
  href,
  active,
  title,
  count,
  countLabel,
  subtitle,
}: {
  href: string;
  active: boolean;
  title: string;
  count: number;
  countLabel: string;
  subtitle?: string;
}) {
  return (
    <a
      href={href}
      className={cn(
        "flex flex-col rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/40 hover:shadow-sm active:scale-[0.98]",
        active && "border-primary bg-primary/5 ring-2 ring-primary/20"
      )}
    >
      <div className="mb-2 text-xs text-muted-foreground">{subtitle ?? "行政区"}</div>
      <span className="text-base font-semibold leading-snug">{title}</span>
      <span className="mt-1 text-sm text-muted-foreground">
        {count} {countLabel}
      </span>
    </a>
  );
}

export function ScoreDistrictGrid({
  districtCounts,
  totalCount,
  currentDistrict,
  filterParams,
  countLabel = "条",
}: ScoreDistrictGridProps) {
  const baseFilters: ScoreFilterParams = {
    batch: filterParams.batch,
    year: filterParams.year,
    query: filterParams.query,
    minScore: filterParams.minScore,
    maxScore: filterParams.maxScore,
  };

  return (
    <div className="mb-8">
      <h2 className="mb-4 text-lg font-semibold">选择行政区</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        <DistrictCard
          href={`${buildScoresDistrictUrl(baseFilters, null)}#score-list`}
          active={!currentDistrict}
          title="全部区域"
          count={totalCount}
          countLabel={countLabel}
          subtitle="北京市"
        />
        {districtCounts.map(({ district, count }) => (
          <DistrictCard
            key={district}
            href={`${buildScoresDistrictUrl(baseFilters, district)}#score-list`}
            active={currentDistrict === district}
            title={`${district}区`}
            count={count}
            countLabel={countLabel}
          />
        ))}
      </div>
    </div>
  );
}
