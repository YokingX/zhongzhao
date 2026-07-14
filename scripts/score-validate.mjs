/** 统招分数合理性校验（抓取脚本 / Sync Worker） */

const SCALES = {
  2025: { min: 200, max: 510 },
  2024: { min: 300, max: 670 },
  2023: { min: 300, max: 660 },
  2022: { min: 300, max: 660 },
};

export function isPlausibleMinScore(year, score) {
  if (!Number.isFinite(score) || !Number.isFinite(year)) return false;
  const scale = SCALES[year];
  if (scale) return score >= scale.min && score <= scale.max;
  return score >= 200 && score <= 700;
}
