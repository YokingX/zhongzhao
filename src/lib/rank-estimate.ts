import type { School } from "@/types/school";

export type RankNeighbor = {
  schoolId: string;
  schoolName: string;
  shortName: string;
  minScore: number;
  districtRank: number;
};

export type RankEstimate = {
  estimatedRank: number | null;
  method: string;
  neighborsBelow: RankNeighbor[];
  neighborsAbove: RankNeighbor[];
  sampleSize: number;
};

/**
 * 用同区同年统招线的「分数 ↔ 区排」样本，粗估某估分对应的区排名区间。
 * 非官方一分一段，仅供相对位置参考。
 */
export function estimateDistrictRank(
  schools: School[],
  opts: { year: number; district: string; score: number }
): RankEstimate {
  const { year, district, score } = opts;
  const points: RankNeighbor[] = [];

  for (const s of schools) {
    if (s.district !== district) continue;
    for (const line of s.scoreLines) {
      if (line.year !== year || line.batch !== "统一招生") continue;
      if (line.districtRank == null || line.districtRank <= 0) continue;
      if (!Number.isFinite(line.minScore) || line.minScore <= 0) continue;
      points.push({
        schoolId: s.id,
        schoolName: s.name,
        shortName: s.shortName,
        minScore: line.minScore,
        districtRank: line.districtRank,
      });
    }
  }

  // 同分保留更靠前的区排
  points.sort((a, b) => b.minScore - a.minScore || a.districtRank - b.districtRank);
  const dedup: RankNeighbor[] = [];
  const seen = new Set<string>();
  for (const p of points) {
    const key = `${p.minScore}-${p.districtRank}`;
    if (seen.has(key)) continue;
    seen.add(key);
    dedup.push(p);
  }

  const below = dedup.filter((p) => p.minScore <= score).slice(0, 5);
  const above = dedup.filter((p) => p.minScore > score).slice(-5).reverse();

  let estimatedRank: number | null = null;
  let method = "样本不足，无法估算";

  const lo = below[0];
  const hi = above[0];

  if (lo && hi && hi.minScore !== lo.minScore) {
    const t = (score - lo.minScore) / (hi.minScore - lo.minScore);
    estimatedRank = Math.round(lo.districtRank + t * (hi.districtRank - lo.districtRank));
    method = "按邻近学校统招线线性插值";
  } else if (lo) {
    estimatedRank = lo.districtRank;
    method = "取不高于估分的最近统招线区排";
  } else if (hi) {
    estimatedRank = hi.districtRank;
    method = "取高于估分的最近统招线区排（估分偏低）";
  }

  return {
    estimatedRank,
    method,
    neighborsBelow: below,
    neighborsAbove: above,
    sampleSize: dedup.length,
  };
}
