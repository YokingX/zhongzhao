import Link from "next/link";
import { MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SchoolFilterParams {
  district?: string;
  type?: string;
  query?: string;
  hasScores?: string;
  page?: string;
}

export function buildSchoolsUrl(
  params: SchoolFilterParams,
  overrides: Partial<SchoolFilterParams> = {}
): string {
  const merged = { ...params, ...overrides };
  const sp = new URLSearchParams();
  if (merged.district) sp.set("district", merged.district);
  if (merged.type) sp.set("type", merged.type);
  if (merged.query) sp.set("query", merged.query);
  if (merged.hasScores) sp.set("hasScores", merged.hasScores);
  const page = Number(merged.page);
  if (page > 1) sp.set("page", String(page));
  const qs = sp.toString();
  return qs ? `/schools?${qs}` : "/schools";
}

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
    <Link
      href={href}
      className={cn(
        "flex flex-col rounded-xl border border-border bg-card p-4 transition-all hover:border-primary/40 hover:shadow-sm",
        active && "border-primary bg-primary/5 ring-2 ring-primary/20"
      )}
    >
      <div className="mb-2 flex items-center gap-1.5 text-muted-foreground">
        <MapPin className="h-3.5 w-3.5 shrink-0" />
        <span className="text-xs">{subtitle ?? "行政区"}</span>
      </div>
      <span className="text-base font-semibold leading-snug">{title}</span>
      <span className="mt-1 text-sm text-muted-foreground">{count} 所学校</span>
    </Link>
  );
}

export function SchoolDistrictGrid({
  districtCounts,
  totalCount,
  currentDistrict,
  filterParams,
}: SchoolDistrictGridProps) {
  const baseParams = { ...filterParams, page: undefined };

  return (
    <div className="mb-8">
      <h2 className="mb-4 text-lg font-semibold">选择行政区</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
        <DistrictCard
          href={buildSchoolsUrl(baseParams, { district: undefined })}
          active={!currentDistrict}
          title="全部区域"
          count={totalCount}
          subtitle="北京市"
        />
        {districtCounts.map(({ district, count }) => (
          <DistrictCard
            key={district}
            href={buildSchoolsUrl(baseParams, { district })}
            active={currentDistrict === district}
            title={`${district}区`}
            count={count}
          />
        ))}
      </div>
    </div>
  );
}
