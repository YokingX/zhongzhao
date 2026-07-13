import { drizzle } from "drizzle-orm/d1";
import type { School, ScoreLine, AdmissionBatch, SchoolType } from "@/types/school";
import { D1_MAX_BINDS, SCORES_QUERY_MAX_ROWS } from "@/lib/d1-limits";
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

export async function queryDistrictSchoolCountsD1(
  d1: D1Database
): Promise<{ district: string; count: number }[]> {
  const { results } = await d1
    .prepare(`SELECT district, COUNT(*) AS count FROM schools GROUP BY district ORDER BY district`)
    .all<{ district: string; count: number }>();
  return (results || []).map((r) => ({ district: r.district, count: r.count }));
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
  limit?: number;
  offset?: number;
}

const D1_MAX_BINDS_LOCAL = D1_MAX_BINDS;

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

async function queryLatestUnifiedScoresMapD1(
  d1: D1Database
): Promise<Map<string, (typeof schema.scoreLines.$inferSelect)[]>> {
  const { results: latestLines } = await d1
    .prepare(
      `SELECT sl.* FROM score_lines sl
       INNER JOIN (
         SELECT school_id, MAX(year) AS max_year
         FROM score_lines
         WHERE batch = '统一招生'
         GROUP BY school_id
       ) latest ON sl.school_id = latest.school_id
         AND sl.year = latest.max_year
         AND sl.batch = '统一招生'`
    )
    .all<Record<string, unknown>>();

  const linesBySchool = new Map<string, (typeof schema.scoreLines.$inferSelect)[]>();
  for (const row of latestLines || []) {
    const line = mapScoreLineRow(row);
    linesBySchool.set(line.schoolId, [line]);
  }
  return linesBySchool;
}

function buildSchoolListSql(options: SchoolListFilter, schoolIds?: string[]) {
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
  if (schoolIds?.length) {
    sql += ` AND id IN (${schoolIds.map(() => "?").join(",")})`;
    binds.push(...schoolIds);
  }

  return { sql, binds };
}

async function querySchoolRowsD1(
  d1: D1Database,
  options: SchoolListFilter
): Promise<Record<string, unknown>[]> {
  if (options.schoolIds && options.schoolIds.length === 0) return [];

  const base = { district: options.district, type: options.type, hasScores: options.hasScores };
  let rows: Record<string, unknown>[] = [];

  if (options.schoolIds?.length) {
    for (const ids of chunk(options.schoolIds, D1_MAX_BINDS_LOCAL)) {
      const { sql, binds } = buildSchoolListSql(base, ids);
      const { results } = await d1
        .prepare(`${sql} ORDER BY district, short_name`)
        .bind(...binds)
        .all<Record<string, unknown>>();
      rows.push(...(results || []));
    }
    const seen = new Set<string>();
    rows = rows.filter((r) => {
      const id = r.id as string;
      if (seen.has(id)) return false;
      seen.add(id);
      return true;
    });
    rows.sort((a, b) => {
      const d = String(a.district).localeCompare(String(b.district), "zh");
      if (d !== 0) return d;
      return String(a.short_name).localeCompare(String(b.short_name), "zh");
    });
  } else {
    const { sql, binds } = buildSchoolListSql(base);
    let query = `${sql} ORDER BY district, short_name`;
    if (options.limit != null) {
      query += ` LIMIT ?`;
      binds.push(options.limit);
      if (options.offset != null) {
        query += ` OFFSET ?`;
        binds.push(options.offset);
      }
    }
    const { results } = await d1.prepare(query).bind(...binds).all<Record<string, unknown>>();
    rows = results || [];
  }

  if (options.limit != null && options.schoolIds?.length) {
    const start = options.offset ?? 0;
    rows = rows.slice(start, start + options.limit);
  }

  return rows;
}

export async function countSchoolsD1(
  d1: D1Database,
  options: Omit<SchoolListFilter, "limit" | "offset"> = {}
): Promise<number> {
  if (options.schoolIds && options.schoolIds.length === 0) return 0;

  if (options.schoolIds?.length) {
    const rows = await querySchoolRowsD1(d1, { ...options, limit: undefined, offset: undefined });
    return rows.length;
  }

  const { sql, binds } = buildSchoolListSql(options);
  const row = await d1
    .prepare(`SELECT COUNT(*) AS count FROM (${sql})`)
    .bind(...binds)
    .first<{ count: number }>();
  return row?.count ?? 0;
}

/** 学校列表：仅附带最新统招线；分数线一次查全表，避免 D1 100 参数上限 */
export async function querySchoolsForListD1(
  d1: D1Database,
  options: SchoolListFilter = {}
): Promise<School[]> {
  const schoolRows = await querySchoolRowsD1(d1, options);
  if (!schoolRows.length) return [];

  const linesBySchool = await queryLatestUnifiedScoresMapD1(d1);

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
  offset?: number;
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

function buildScoreRecordsWhere(options: ScoreRecordFilter) {
  let sql = `
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
  if (options.year != null) {
    sql += ` AND sl.year = ?`;
    binds.push(options.year);
  }
  if (options.minScore != null) {
    sql += ` AND sl.min_score >= ?`;
    binds.push(options.minScore);
  }
  if (options.maxScore != null) {
    sql += ` AND sl.min_score <= ?`;
    binds.push(options.maxScore);
  }
  if (options.schoolIds?.length) {
    sql += ` AND s.id IN (${options.schoolIds.map(() => "?").join(",")})`;
    binds.push(...options.schoolIds);
  }

  return { sql, binds };
}

function mapScoreRecordRow(row: {
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
}): D1ScoreRecord {
  return {
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
  };
}

export async function countScoreRecordsD1(
  d1: D1Database,
  options: ScoreRecordFilter = {}
): Promise<number> {
  if (options.schoolIds && options.schoolIds.length === 0) return 0;

  if (options.schoolIds && options.schoolIds.length > D1_MAX_BINDS_LOCAL) {
    let total = 0;
    for (const ids of chunk(options.schoolIds, D1_MAX_BINDS_LOCAL)) {
      total += await countScoreRecordsD1(d1, { ...options, schoolIds: ids });
    }
    return total;
  }

  const { sql, binds } = buildScoreRecordsWhere(options);
  const row = await d1
    .prepare(`SELECT COUNT(*) AS count ${sql}`)
    .bind(...binds)
    .first<{ count: number }>();
  return row?.count ?? 0;
}

export async function queryScoreRecordsD1(
  d1: D1Database,
  options: ScoreRecordFilter = {}
): Promise<D1ScoreRecord[]> {
  if (options.schoolIds && options.schoolIds.length === 0) return [];

  const pageLimit = Math.min(options.limit ?? SCORES_QUERY_MAX_ROWS, SCORES_QUERY_MAX_ROWS);

  if (options.schoolIds && options.schoolIds.length > D1_MAX_BINDS_LOCAL) {
    const allRecords: D1ScoreRecord[] = [];
    for (const ids of chunk(options.schoolIds, D1_MAX_BINDS_LOCAL)) {
      const batch = await queryScoreRecordsD1(d1, {
        ...options,
        schoolIds: ids,
        limit: undefined,
        offset: undefined,
      });
      allRecords.push(...batch);
    }
    const sorted = allRecords.sort((a, b) => b.year - a.year || b.minScore - a.minScore);
    const offset = options.offset ?? 0;
    return sorted.slice(offset, offset + pageLimit);
  }

  const { sql, binds } = buildScoreRecordsWhere(options);
  let query = `
    SELECT s.id AS school_id, s.name AS school_name, s.short_name, s.district, s.type,
           sl.year, sl.batch, sl.min_score, sl.max_score, sl.district_rank, sl.note
    ${sql}
    ORDER BY sl.year DESC, sl.min_score DESC
    LIMIT ?`;
  binds.push(pageLimit);

  if (options.offset != null && options.offset > 0) {
    query += ` OFFSET ?`;
    binds.push(options.offset);
  }

  const { results } = await d1.prepare(query).bind(...binds).all<{
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

  return (results || []).map(mapScoreRecordRow);
}

/** 中文名称 SQL 搜索 */
export async function querySchoolIdsByTextD1(
  d1: D1Database,
  query: string
): Promise<string[]> {
  const q = query.trim();
  if (!q) return [];
  const pattern = `%${q}%`;
  const { results } = await d1
    .prepare(
      `SELECT id FROM schools
       WHERE name LIKE ? OR short_name LIKE ? OR district LIKE ?
       ORDER BY district, short_name`
    )
    .bind(pattern, pattern, pattern)
    .all<{ id: string }>();
  return (results || []).map((r) => r.id);
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
