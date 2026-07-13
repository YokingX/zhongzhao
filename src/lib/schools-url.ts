export interface SchoolFilterParams {
  district?: string;
  type?: string;
  query?: string;
  hasScores?: string;
  page?: string;
}

type UrlOverride = Partial<SchoolFilterParams> & {
  clearDistrict?: boolean;
  resetPage?: boolean;
};

export function buildSchoolsUrl(
  params: SchoolFilterParams,
  overrides: UrlOverride = {}
): string {
  const merged: SchoolFilterParams = { ...params, ...overrides };

  if (overrides.clearDistrict || overrides.district === "") {
    delete merged.district;
  }
  if (overrides.resetPage) {
    delete merged.page;
  }
  if (merged.type === "全部") delete merged.type;
  if (!merged.query?.trim()) delete merged.query;
  if (merged.hasScores !== "1") delete merged.hasScores;

  const sp = new URLSearchParams();
  if (merged.district) sp.set("district", merged.district);
  if (merged.type) sp.set("type", merged.type);
  if (merged.query) sp.set("query", merged.query.trim());
  if (merged.hasScores === "1") sp.set("hasScores", "1");

  const page = parsePageNum(merged.page);
  if (page > 1) sp.set("page", String(page));

  const qs = sp.toString();
  return qs ? `/schools?${qs}` : "/schools";
}

function parsePageNum(value: string | undefined): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.floor(n);
}

export function buildSchoolsDistrictUrl(
  params: SchoolFilterParams,
  district: string | null
): string {
  if (district == null) {
    return buildSchoolsUrl(params, { clearDistrict: true, resetPage: true });
  }
  return buildSchoolsUrl(params, { district, resetPage: true });
}

export function hasSchoolListFilters(params: {
  district?: string;
  type?: string;
  query?: string;
  hasScores?: boolean;
}): boolean {
  return Boolean(
    params.district ||
      params.query?.trim() ||
      (params.type && params.type !== "全部") ||
      params.hasScores
  );
}
