export interface ScoreFilterParams {
  district?: string;
  batch?: string;
  year?: string;
  query?: string;
  minScore?: string;
  maxScore?: string;
  page?: string;
}

type UrlOverride = Partial<ScoreFilterParams> & {
  clearDistrict?: boolean;
  resetPage?: boolean;
};

export function buildScoresUrl(
  params: ScoreFilterParams,
  overrides: UrlOverride = {}
): string {
  const merged: ScoreFilterParams = { ...params, ...overrides };

  if (overrides.clearDistrict || overrides.district === "") {
    delete merged.district;
  }
  if (overrides.resetPage) {
    delete merged.page;
  }
  if (merged.batch === "全部") delete merged.batch;
  if (merged.year === "全部") delete merged.year;
  if (!merged.query?.trim()) delete merged.query;
  if (!merged.minScore?.trim()) delete merged.minScore;
  if (!merged.maxScore?.trim()) delete merged.maxScore;

  const sp = new URLSearchParams();
  if (merged.district) sp.set("district", merged.district);
  if (merged.batch) sp.set("batch", merged.batch);
  if (merged.year) sp.set("year", merged.year);
  if (merged.query) sp.set("query", merged.query.trim());
  if (merged.minScore) sp.set("minScore", merged.minScore.trim());
  if (merged.maxScore) sp.set("maxScore", merged.maxScore.trim());

  const page = parsePageNum(merged.page);
  if (page > 1) sp.set("page", String(page));

  const qs = sp.toString();
  return qs ? `/scores?${qs}` : "/scores";
}

function parsePageNum(value: string | undefined): number {
  const n = Number(value);
  if (!Number.isFinite(n) || n < 1) return 1;
  return Math.floor(n);
}

export function buildScoresDistrictUrl(
  params: ScoreFilterParams,
  district: string | null
): string {
  if (district == null) {
    return buildScoresUrl(params, { clearDistrict: true, resetPage: true });
  }
  return buildScoresUrl(params, { district, resetPage: true });
}
