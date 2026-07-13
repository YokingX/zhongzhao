import Link from "next/link";
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

interface SchoolDistrictPickerProps {
  districtCounts: { district: string; count: number }[];
  totalCount: number;
  currentDistrict?: string;
  filterParams: SchoolFilterParams;
}

export function SchoolDistrictPicker({
  districtCounts,
  totalCount,
  currentDistrict,
  filterParams,
}: SchoolDistrictPickerProps) {
  const chipClass = (active: boolean) =>
    cn(
      "shrink-0 rounded-full px-3 py-1.5 text-sm transition-colors",
      active
        ? "bg-primary text-primary-foreground"
        : "bg-muted text-muted-foreground hover:bg-muted/80"
    );

  const baseParams = { ...filterParams, page: undefined };

  return (
    <div className="mb-6">
      <p className="mb-3 text-sm font-medium">按行政区浏览</p>
      <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 scrollbar-thin">
        <Link
          href={buildSchoolsUrl(baseParams, { district: undefined })}
          className={chipClass(!currentDistrict)}
        >
          全部 ({totalCount})
        </Link>
        {districtCounts.map(({ district, count }) => (
          <Link
            key={district}
            href={buildSchoolsUrl(baseParams, { district })}
            className={chipClass(currentDistrict === district)}
          >
            {district}区 ({count})
          </Link>
        ))}
      </div>
    </div>
  );
}
