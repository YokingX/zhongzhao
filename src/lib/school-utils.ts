import { School, ScoreLine, AdmissionBatch, SCORE_SCALES } from "@/types/school";
import { isPlausibleMinScore } from "@/lib/score-validate";

export function getLatestScore(school: School, batch: AdmissionBatch = "统一招生"): ScoreLine | undefined {
  return school.scoreLines
    .filter((l) => l.batch === batch && isPlausibleMinScore(l.year, l.minScore))
    .sort((a, b) => b.year - a.year)[0];
}

export function formatScore(score: number, year: number): string {
  const max = SCORE_SCALES[year];
  return max ? `${score}/${max}` : `${score}`;
}
