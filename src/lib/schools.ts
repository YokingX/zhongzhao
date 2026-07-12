import { School, AdmissionBatch } from "@/types/school";
import schoolsData from "@/data/schools.json";
import { formatScore, getLatestScore } from "@/lib/school-utils";
import { matchesSchoolQuery } from "@/lib/pinyin";

export { formatScore, getLatestScore };

let schoolsCache: School[] | null = null;

async function loadSchoolsFromD1(): Promise<School[] | null> {
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const { queryAllSchoolsD1 } = await import("@/db/d1-queries");
    const { env } = getCloudflareContext();
    if (!env?.DB) return null;
    const schools = await queryAllSchoolsD1(env.DB);
    return schools.length > 0 ? schools : null;
  } catch {
    return null;
  }
}

function loadSchoolsFromJson(): School[] {
  if (!schoolsCache) {
    schoolsCache = schoolsData as School[];
  }
  return schoolsCache;
}

export async function getAllSchools(): Promise<School[]> {
  const d1 = await loadSchoolsFromD1();
  return d1 ?? loadSchoolsFromJson();
}

export async function getSchoolById(id: string): Promise<School | undefined> {
  const schools = await getAllSchools();
  return schools.find((s) => s.id === id);
}

export async function filterSchools(options: {
  district?: string;
  type?: string;
  query?: string;
  hasScores?: boolean;
}): Promise<School[]> {
  const schools = await getAllSchools();
  return schools.filter((school) => {
    if (options.hasScores && school.scoreLines.length === 0) return false;
    if (options.district && options.district !== "全部" && school.district !== options.district) return false;
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

export async function getAllScoreRecords(): Promise<ScoreRecord[]> {
  const records: ScoreRecord[] = [];
  for (const school of await getAllSchools()) {
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
  return records.sort((a, b) => b.year - a.year || b.minScore - a.minScore);
}

export async function filterScoreRecords(options: {
  district?: string;
  batch?: string;
  year?: number;
  minScore?: number;
  maxScore?: number;
  query?: string;
}): Promise<ScoreRecord[]> {
  const records = await getAllScoreRecords();
  return records.filter((record) => {
    if (options.district && options.district !== "全部" && record.district !== options.district) return false;
    if (options.batch && options.batch !== "全部" && record.batch !== options.batch) return false;
    if (options.year && record.year !== options.year) return false;
    if (options.minScore && record.minScore < options.minScore) return false;
    if (options.maxScore && record.minScore > options.maxScore) return false;
    if (options.query) {
      return matchesSchoolQuery(options.query, {
        name: record.schoolName,
        shortName: record.shortName,
        district: record.district,
      });
    }
    return true;
  });
}

export async function getDistricts(): Promise<string[]> {
  const schools = await getAllSchools();
  return [...new Set(schools.map((s) => s.district))].sort();
}

export async function getSchoolsWithScores(): Promise<number> {
  const schools = await getAllSchools();
  return schools.filter((s) => s.scoreLines.length > 0).length;
}

export async function getScoreYears(): Promise<number[]> {
  const years = new Set<number>();
  for (const school of await getAllSchools()) {
    for (const line of school.scoreLines) {
      years.add(line.year);
    }
  }
  return [...years].sort((a, b) => b - a);
}
