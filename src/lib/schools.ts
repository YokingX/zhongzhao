/**
 * 学校数据访问层
 *
 * 运行时：D1 为唯一数据源（按需 SQL 查询，避免全量加载）
 * 构建时：schools.json 仅用于 SSG 静态路径生成
 */
import { cache } from "react";
import { School, AdmissionBatch } from "@/types/school";
import schoolsData from "@/data/schools.json";
import { formatScore, getLatestScore } from "@/lib/school-utils";
import { matchesSchoolQuery } from "@/lib/pinyin";

export { formatScore, getLatestScore };

let schoolsCache: School[] | null = null;
let jsonFallbackWarned = false;

async function getD1(): Promise<D1Database | null> {
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const { env } = getCloudflareContext();
    return env?.DB ?? null;
  } catch {
    return null;
  }
}

function loadSchoolsFromJson(): School[] {
  if (!jsonFallbackWarned && process.env.NODE_ENV === "development") {
    jsonFallbackWarned = true;
    console.warn(
      "[zhongzhao] 未连接 D1，使用 schools.json。本地开发请用 npm run dev（本地 D1）而非 dev:next。"
    );
  }
  if (!schoolsCache) {
    schoolsCache = schoolsData as School[];
  }
  return schoolsCache;
}

async function resolveSchoolIdsByQuery(query: string): Promise<string[] | undefined> {
  const d1 = await getD1();
  if (d1) {
    const { querySchoolSearchIndexD1 } = await import("@/db/d1-queries");
    const index = await querySchoolSearchIndexD1(d1);
    return index
      .filter((s) =>
        matchesSchoolQuery(query, {
          name: s.name,
          shortName: s.shortName,
          district: s.district,
        })
      )
      .map((s) => s.id);
  }
  return loadSchoolsFromJson()
    .filter((s) =>
      matchesSchoolQuery(query, {
        name: s.name,
        shortName: s.shortName,
        district: s.district,
      })
    )
    .map((s) => s.id);
}

/** 构建阶段 SSG / sitemap 专用，运行时动态页勿调用 */
export async function getAllSchools(): Promise<School[]> {
  const d1 = await getD1();
  if (d1) {
    const { queryAllSchoolsD1 } = await import("@/db/d1-queries");
    const schools = await queryAllSchoolsD1(d1);
    if (schools.length > 0) return schools;
  }
  return loadSchoolsFromJson();
}

export const getSchoolCounts = cache(async (): Promise<{ total: number; withScores: number }> => {
  const d1 = await getD1();
  if (d1) {
    const { querySchoolCountsD1 } = await import("@/db/d1-queries");
    return querySchoolCountsD1(d1);
  }
  const schools = loadSchoolsFromJson();
  return {
    total: schools.length,
    withScores: schools.filter((s) => s.scoreLines.length > 0).length,
  };
});

export const getSchoolById = cache(async (id: string): Promise<School | undefined> => {
  const d1 = await getD1();
  if (d1) {
    const { querySchoolByIdD1 } = await import("@/db/d1-queries");
    const school = await querySchoolByIdD1(d1, id);
    if (school) return school;
  }
  return loadSchoolsFromJson().find((s) => s.id === id);
});

export const filterSchools = cache(
  async (options: {
    district?: string;
    type?: string;
    query?: string;
    hasScores?: boolean;
  }): Promise<School[]> => {
    const schoolIds = options.query ? await resolveSchoolIdsByQuery(options.query) : undefined;
    if (options.query && schoolIds?.length === 0) return [];

    const d1 = await getD1();
    if (d1) {
      const { querySchoolsForListD1 } = await import("@/db/d1-queries");
      return querySchoolsForListD1(d1, {
        district: options.district,
        type: options.type,
        hasScores: options.hasScores,
        schoolIds,
      });
    }

    return loadSchoolsFromJson().filter((school) => {
      if (options.hasScores && school.scoreLines.length === 0) return false;
      if (options.district && options.district !== "全部" && school.district !== options.district)
        return false;
      if (options.type && options.type !== "全部" && school.type !== options.type) return false;
      if (options.query) {
        return matchesSchoolQuery(options.query, {
          name: school.name,
          shortName: school.shortName,
          district: school.district,
        });
      }
      return true;
    });
  }
);

export interface ScoreRecord {
  schoolId: string;
  schoolName: string;
  shortName: string;
  district: string;
  type: string;
  year: number;
  batch: AdmissionBatch;
  minScore: number;
  maxScore?: number;
  districtRank?: number;
  note?: string;
}

export const filterScoreRecords = cache(
  async (options: {
    district?: string;
    batch?: string;
    year?: number;
    minScore?: number;
    maxScore?: number;
    query?: string;
  }): Promise<ScoreRecord[]> => {
    const schoolIds = options.query ? await resolveSchoolIdsByQuery(options.query) : undefined;
    if (options.query && schoolIds?.length === 0) return [];

    const d1 = await getD1();
    if (d1) {
      const { queryScoreRecordsD1 } = await import("@/db/d1-queries");
      return queryScoreRecordsD1(d1, {
        district: options.district,
        batch: options.batch,
        year: options.year,
        minScore: options.minScore,
        maxScore: options.maxScore,
        schoolIds,
      });
    }

    const records: ScoreRecord[] = [];
    for (const school of loadSchoolsFromJson()) {
      if (schoolIds && !schoolIds.includes(school.id)) continue;
      for (const line of school.scoreLines) {
        records.push({
          schoolId: school.id,
          schoolName: school.name,
          shortName: school.shortName,
          district: school.district,
          type: school.type,
          year: line.year,
          batch: line.batch,
          minScore: line.minScore,
          maxScore: line.maxScore,
          districtRank: line.districtRank,
          note: line.note,
        });
      }
    }
    return records
      .filter((record) => {
        if (options.district && options.district !== "全部" && record.district !== options.district)
          return false;
        if (options.batch && options.batch !== "全部" && record.batch !== options.batch) return false;
        if (options.year && record.year !== options.year) return false;
        if (options.minScore && record.minScore < options.minScore) return false;
        if (options.maxScore && record.minScore > options.maxScore) return false;
        return true;
      })
      .sort((a, b) => b.year - a.year || b.minScore - a.minScore);
  }
);

export const getDistricts = cache(async (): Promise<string[]> => {
  const d1 = await getD1();
  if (d1) {
    const { queryDistrictsD1 } = await import("@/db/d1-queries");
    return queryDistrictsD1(d1);
  }
  return [...new Set(loadSchoolsFromJson().map((s) => s.district))].sort();
});

export const getSchoolsWithScores = cache(async (): Promise<number> => {
  const { withScores } = await getSchoolCounts();
  return withScores;
});

export const getScoreYears = cache(async (): Promise<number[]> => {
  const d1 = await getD1();
  if (d1) {
    const { queryScoreYearsD1 } = await import("@/db/d1-queries");
    return queryScoreYearsD1(d1);
  }
  const years = new Set<number>();
  for (const school of loadSchoolsFromJson()) {
    for (const line of school.scoreLines) {
      years.add(line.year);
    }
  }
  return [...years].sort((a, b) => b - a);
});
