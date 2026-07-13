import { cn } from "@/lib/utils";
import {
  buildSchoolsDistrictUrl,
  type SchoolFilterParams,
} from "@/lib/schools-url";

export type { SchoolFilterParams };
export { buildSchoolsUrl } from "@/lib/schools-url";

interface SchoolDistrictGridProps {
  districtCounts: { district: string; count: number }[];
  totalCount: number;
  currentDistrict?: string;
  filterParams: SchoolFilterParams;
}

function DistrictCard({
  href,
  active,
  title,
  count,
  subtitle,
}: {
  href: string;
  active: boolean;
  title: string;
  count: number;
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
      <span className="mt-1 text-sm text-muted-foreground">{count} 所学校</span>
    </a>
  );
}

function hasExtraFilters(params: SchoolFilterParams): boolean {
  return Boolean(
    params.query?.trim() ||
      (params.type && params.type !== "全部") ||
      params.hasScores === "1"
  );
}

export function SchoolDistrictGrid({
  districtCounts,
  totalCount,
  currentDistrict,
  filterParams,
}: SchoolDistrictGridProps) {
  const baseFilters = {
    type: filterParams.type,
    query: filterParams.query,
    hasScores: filterParams.hasScores,
  };

  return (
    <div className="mb-8">
      <h2 className="mb-4 text-lg font-semibold">选择行政区</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        <DistrictCard
          href={`${buildSchoolsDistrictUrl(baseFilters, null)}#school-list`}
          active={!currentDistrict && !hasExtraFilters(filterParams)}
          title="全部区域"
          count={totalCount}
          subtitle="北京市"
        />
        {districtCounts.map(({ district, count }) => (
          <DistrictCard
            key={district}
            href={`${buildSchoolsDistrictUrl(baseFilters, district)}#school-list`}
            active={currentDistrict === district}
            title={`${district}区`}
            count={count}
          />
        ))}
      </div>
    </div>
  );
}
