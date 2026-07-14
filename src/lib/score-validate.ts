/** 统招分数合理性校验（抓取/入库/展示共用口径） */

const SCALES: Record<number, { min: number; max: number }> = {
  2025: { min: 200, max: 510 },
  2024: { min: 300, max: 670 },
  2023: { min: 300, max: 660 },
  2022: { min: 300, max: 660 },
};

/**
 * 是否为可信的统招最低分（排除「1」等明显错解析）。
 * year 未知时用宽松区间。
 */
export function isPlausibleMinScore(year: number, score: number): boolean {
  if (!Number.isFinite(score) || !Number.isFinite(year)) return false;
  const scale = SCALES[year];
  if (scale) return score >= scale.min && score <= scale.max;
  return score >= 200 && score <= 700;
}

export function filterPlausibleScoreLines<T extends { year: number; minScore: number }>(
  lines: T[]
): T[] {
  return lines.filter((l) => isPlausibleMinScore(l.year, l.minScore));
}
