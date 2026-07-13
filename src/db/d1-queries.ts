import { drizzle } from "drizzle-orm/d1";
import type { School, ScoreLine, AdmissionBatch, SchoolType } from "@/types/school";
import * as schema from "./schema";

function parseJsonArray<T>(value: string | null | undefined, fallback: T[] = []): T[] {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T[];
  } catch {
    return fallback;
  }
}

function rowToSchool(
  row: typeof schema.schools.$inferSelect,
  lines: (typeof schema.scoreLines.$inferSelect)[]
): School {
  return {
    id: row.id,
    name: row.name,
    shortName: row.shortName,
    district: row.district,
    type: row.type as SchoolType,
    description: row.description,
    features: parseJsonArray<string>(row.features),
    admissionTypes: parseJsonArray<AdmissionBatch>(row.admissionTypes),
    isKeySchool: row.isKeySchool ?? false,
    address: row.address ?? undefined,
    website: row.website ?? undefined,
    scoreLines: lines
      .map(
        (line): ScoreLine => ({
          year: line.year,
          batch: line.batch as AdmissionBatch,
          minScore: line.minScore,
          maxScore: line.maxScore ?? undefined,
          districtRank: line.districtRank ?? undefined,
          note: line.note ?? undefined,
          source: line.source ?? undefined,
        })
      )
      .sort((a, b) => b.year - a.year || b.minScore - a.minScore),
  };
}

function mapSchoolRow(row: Record<string, unknown>): typeof schema.schools.$inferSelect {
  return {
    id: row.id as string,
    name: row.name as string,
    shortName: row.short_name as string,
    district: row.district as string,
    type: row.type as string,
    description: row.description as string,
    features: row.features as string,
    admissionTypes: row.admission_types as string,
    isKeySchool: Boolean(row.is_key_school),
    address: (row.address as string | null) ?? null,
    website: (row.website as string | null) ?? null,
    updatedAt: (row.updated_at as string | null) ?? null,
  };
}

function mapScoreLineRow(row: Record<string, unknown>): typeof schema.scoreLines.$inferSelect {
  return {
    id: row.id as number,
    schoolId: row.school_id as string,
    year: row.year as number,
    batch: row.batch as string,
    minScore: row.min_score as number,
    maxScore: (row.max_score as number | null) ?? null,
    districtRank: (row.district_rank as number | null) ?? null,
    note: (row.note as string | null) ?? null,
    source: (row.source as string | null) ?? null,
  };
}

/** 构建/SSG 全量加载（勿在运行时动态页使用） */
export async function queryAllSchoolsD1(d1: D1Database): Promise<School[]> {
  const db = drizzle(d1, { schema });
  const schoolRows = await db.select().from(schema.schools).all();
  const lineRows = await db.select().from(schema.scoreLines).all();

  const linesBySchool = new Map<string, (typeof schema.scoreLines.$inferSelect)[]>();
  for (const line of lineRows) {
    const list = linesBySchool.get(line.schoolId) || [];
    list.push(line);
    linesBySchool.set(line.schoolId, list);
  }

  return schoolRows.map((row) => rowToSchool(row, linesBySchool.get(row.id) || []));
}

export async function querySchoolCountsD1(
  d1: D1Database
): Promise<{ total: number; withScores: number }> {
  const row = await d1
    .prepare(
      `SELECT
        (SELECT COUNT(*) FROM schools) AS total,
        (SELECT COUNT(DISTINCT school_id) FROM score_lines) AS with_scores`
    )
    .first<{ total: number; with_scores: number }>();
  return { total: row?.total ?? 0, withScores: row?.with_scores ?? 0 };
}

export async function queryDistrictsD1(d1: D1Database): Promise<string[]> {
  const { results } = await d1
    .prepare(`SELECT DISTINCT district FROM schools ORDER BY district`)
    .all<{ district: string }>();
  return (results || []).map((r) => r.district);
}

export async function queryScoreYearsD1(d1: D1Database): Promise<number[]> {
  const { results } = await d1
    .prepare(`SELECT DISTINCT year FROM score_lines ORDER BY year DESC`)
    .all<{ year: number }>();
  return (results || []).map((r) => r.year);
}

export async function querySchoolByIdD1(
  d1: D1Database,
  id: string
): Promise<School | undefined> {
  const schoolRow = await d1
    .prepare(`SELECT * FROM schools WHERE id = ?`)
    .bind(id)
    .first<Record<string, unknown>>();
  if (!schoolRow) return undefined;

  const { results: lineRows } = await d1
    .prepare(`SELECT * FROM score_lines WHERE school_id = ? ORDER BY year DESC, min_score DESC`)
    .bind(id)
    .all<Record<string, unknown>>();

  return rowToSchool(
    mapSchoolRow(schoolRow),
    (lineRows || []).map(mapScoreLineRow)
  );
}

export interface SchoolListFilter {
  district?: string;
  type?: string;
  hasScores?: boolean;
  schoolIds?: string[];
}

/** 学校列表：仅附带最新统招线，避免全量分数线加载 */
export async function querySchoolsForListD1(
  d1: D1Database,
  options: SchoolListFilter = {}
): Promise<School[]> {
  let sql = `SELECT * FROM schools WHERE 1=1`;
  const binds: unknown[] = [];

  if (options.district && options.district !== "全部") {
    sql += ` AND district = ?`;
    binds.push(options.district);
  }
  if (options.type && options.type !== "全部") {
    sql += ` AND type = ?`;
    binds.push(options.type);
  }
  if (options.hasScores) {
    sql += ` AND id IN (SELECT DISTINCT school_id FROM score_lines)`;
  }
  if (options.schoolIds?.length) {
    sql += ` AND id IN (${options.schoolIds.map(() => "?").join(",")})`;
    binds.push(...options.schoolIds);
  } else if (options.schoolIds && options.schoolIds.length === 0) {
    return [];
  }

  sql += ` ORDER BY district, short_name`;

  const { results: schoolRows } = await d1
    .prepare(sql)
    .bind(...binds)
    .all<Record<string, unknown>>();
  if (!schoolRows?.length) return [];

  const ids = schoolRows.map((r) => r.id as string);
  const placeholders = ids.map(() => "?").join(",");
  const { results: latestLines } = await d1
    .prepare(
      `SELECT sl.* FROM score_lines sl
       INNER JOIN (
         SELECT school_id, MAX(year) AS max_year
         FROM score_lines
         WHERE batch = '统一招生' AND school_id IN (${placeholders})
         GROUP BY school_id
       ) latest ON sl.school_id = latest.school_id
         AND sl.year = latest.max_year
         AND sl.batch = '统一招生'`
    )
    .bind(...ids)
    .all<Record<string, unknown>>();

  const linesBySchool = new Map<string, (typeof schema.scoreLines.$inferSelect)[]>();
  for (const row of latestLines || []) {
    const line = mapScoreLineRow(row);
    linesBySchool.set(line.schoolId, [line]);
  }

  return schoolRows.map((row) =>
    rowToSchool(mapSchoolRow(row), linesBySchool.get(row.id as string) || [])
  );
}

export interface ScoreRecordFilter {
  district?: string;
  batch?: string;
  year?: number;
  minScore?: number;
  maxScore?: number;
  schoolIds?: string[];
  limit?: number;
}

export interface D1ScoreRecord {
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

export async function queryScoreRecordsD1(
  d1: D1Database,
  options: ScoreRecordFilter = {}
): Promise<D1ScoreRecord[]> {
  let sql = `
    SELECT s.id AS school_id, s.name AS school_name, s.short_name, s.district, s.type,
           sl.year, sl.batch, sl.min_score, sl.max_score, sl.district_rank, sl.note
    FROM score_lines sl
    JOIN schools s ON s.id = sl.school_id
    WHERE 1=1`;
  const binds: unknown[] = [];

  if (options.district && options.district !== "全部") {
    sql += ` AND s.district = ?`;
    binds.push(options.district);
  }
  if (options.batch && options.batch !== "全部") {
    sql += ` AND sl.batch = ?`;
    binds.push(options.batch);
  }
  if (options.year) {
    sql += ` AND sl.year = ?`;
    binds.push(options.year);
  }
  if (options.minScore) {
    sql += ` AND sl.min_score >= ?`;
    binds.push(options.minScore);
  }
  if (options.maxScore) {
    sql += ` AND sl.min_score <= ?`;
    binds.push(options.maxScore);
  }
  if (options.schoolIds?.length) {
    sql += ` AND s.id IN (${options.schoolIds.map(() => "?").join(",")})`;
    binds.push(...options.schoolIds);
  } else if (options.schoolIds && options.schoolIds.length === 0) {
    return [];
  }

  sql += ` ORDER BY sl.year DESC, sl.min_score DESC LIMIT ?`;
  binds.push(options.limit ?? 1000);

  const { results } = await d1.prepare(sql).bind(...binds).all<{
    school_id: string;
    school_name: string;
    short_name: string;
    district: string;
    type: string;
    year: number;
    batch: string;
    min_score: number;
    max_score: number | null;
    district_rank: number | null;
    note: string | null;
  }>();

  return (results || []).map((row) => ({
    schoolId: row.school_id,
    schoolName: row.school_name,
    shortName: row.short_name,
    district: row.district,
    type: row.type,
    year: row.year,
    batch: row.batch as AdmissionBatch,
    minScore: row.min_score,
    maxScore: row.max_score ?? undefined,
    districtRank: row.district_rank ?? undefined,
    note: row.note ?? undefined,
  }));
}

/** 拼音搜索用：仅加载学校基本信息 */
export async function querySchoolSearchIndexD1(
  d1: D1Database
): Promise<{ id: string; name: string; shortName: string; district: string }[]> {
  const { results } = await d1
    .prepare(`SELECT id, name, short_name, district FROM schools`)
    .all<{ id: string; name: string; short_name: string; district: string }>();
  return (results || []).map((r) => ({
    id: r.id,
    name: r.name,
    shortName: r.short_name,
    district: r.district,
  }));
}
