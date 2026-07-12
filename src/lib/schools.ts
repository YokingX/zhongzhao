import { School, ScoreLine, AdmissionBatch } from "@/types/school";
import schoolsData from "@/data/schools.json";

const schools = schoolsData as School[];

export function getAllSchools(): School[] {
  return schools;
}

export function getSchoolById(id: string): School | undefined {
  return schools.find((s) => s.id === id);
}

export function filterSchools(options: {
  district?: string;
  type?: string;
  query?: string;
}): School[] {
  return schools.filter((school) => {
    if (options.district && options.district !== "全部" && school.district !== options.district) {
      return false;
    }
    if (options.type && options.type !== "全部" && school.type !== options.type) {
      return false;
    }
    if (options.query) {
      const q = options.query.toLowerCase();
      return (
        school.name.toLowerCase().includes(q) ||
        school.shortName.toLowerCase().includes(q) ||
        school.district.includes(q)
      );
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
  note?: string;
}

export function getAllScoreRecords(): ScoreRecord[] {
  const records: ScoreRecord[] = [];
  for (const school of schools) {
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
        note: line.note,
      });
    }
  }
  return records.sort((a, b) => b.year - a.year || b.minScore - a.minScore);
}

export function filterScoreRecords(options: {
  district?: string;
  batch?: string;
  year?: number;
  minScore?: number;
  maxScore?: number;
  query?: string;
}): ScoreRecord[] {
  return getAllScoreRecords().filter((record) => {
    if (options.district && options.district !== "全部" && record.district !== options.district) {
      return false;
    }
    if (options.batch && options.batch !== "全部" && record.batch !== options.batch) {
      return false;
    }
    if (options.year && record.year !== options.year) {
      return false;
    }
    if (options.minScore && record.minScore < options.minScore) {
      return false;
    }
    if (options.maxScore && record.minScore > options.maxScore) {
      return false;
    }
    if (options.query) {
      const q = options.query.toLowerCase();
      return (
        record.schoolName.toLowerCase().includes(q) ||
        record.shortName.toLowerCase().includes(q)
      );
    }
    return true;
  });
}

export function getLatestScore(school: School, batch: AdmissionBatch = "统一招生"): ScoreLine | undefined {
  return school.scoreLines
    .filter((l) => l.batch === batch)
    .sort((a, b) => b.year - a.year)[0];
}

export function getDistricts(): string[] {
  return [...new Set(schools.map((s) => s.district))].sort();
}

export function getScoreYears(): number[] {
  const years = new Set<number>();
  for (const school of schools) {
    for (const line of school.scoreLines) {
      years.add(line.year);
    }
  }
  return [...years].sort((a, b) => b - a);
}
