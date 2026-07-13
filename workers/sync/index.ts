/**
 * Cloudflare Cron Worker：定时抓取分数线并写入 D1
 */
import { runFetch, normalizeSchoolName } from "../../scripts/fetch-core.mjs";

const SCORE_SCALES: Record<number, number> = {
  2025: 510,
  2024: 670,
  2023: 660,
  2022: 660,
};

interface Env {
  DB: D1Database;
  CRON_SECRET?: string;
}

interface DbSchool {
  id: string;
  name: string;
}

function buildSchoolIndex(rows: DbSchool[]) {
  const index = new Map<string, string>();
  for (const row of rows) {
    index.set(row.name, row.id);
    const normalized = normalizeSchoolName(row.name);
    if (normalized) index.set(normalized, row.id);
  }
  return index;
}

function resolveSchoolId(name: string, index: Map<string, string>) {
  const official = normalizeSchoolName(name);
  if (!official) return null;
  return index.get(official) || index.get(name) || null;
}

async function applyFetchedScores(
  db: D1Database,
  fetched: Record<string, Record<string, [number, number]>>
) {
  const { results } = await db.prepare("SELECT id, name FROM schools").all<DbSchool>();
  const index = buildSchoolIndex(results || []);
  const now = new Date().toISOString();
  let updated = 0;
  const unmatched: string[] = [];

  for (const [name, years] of Object.entries(fetched)) {
    const schoolId = resolveSchoolId(name, index);
    if (!schoolId) {
      unmatched.push(name);
      continue;
    }

    for (const [yearStr, [minScore, districtRank]] of Object.entries(years)) {
      const year = Number(yearStr);
      const maxScore = SCORE_SCALES[year] ?? null;
      const rank =
        districtRank != null && !Number.isNaN(districtRank) ? districtRank : null;
      await db
        .prepare(
          `INSERT INTO score_lines (school_id, year, batch, min_score, max_score, district_rank, source)
           VALUES (?, ?, '统一招生', ?, ?, ?, '自动抓取更新')
           ON CONFLICT(school_id, year, batch) DO UPDATE SET
             min_score = excluded.min_score,
             max_score = excluded.max_score,
             district_rank = COALESCE(excluded.district_rank, score_lines.district_rank),
             source = excluded.source`
        )
        .bind(schoolId, year, minScore, maxScore, rank)
        .run();
      updated++;
    }

    await db
      .prepare("UPDATE schools SET updated_at = ? WHERE id = ?")
      .bind(now, schoolId)
      .run();
  }

  return { updated, unmatched };
}

async function getDataQuality(db: D1Database) {
  const stats = await db
    .prepare(
      `SELECT
        (SELECT COUNT(*) FROM schools) AS schools_count,
        (SELECT COUNT(DISTINCT school_id) FROM score_lines) AS schools_with_scores,
        (SELECT COUNT(*) FROM score_lines) AS score_lines_count,
        (SELECT COUNT(*) FROM fetch_sources WHERE last_error IS NOT NULL) AS failed_sources`
    )
    .first<{
      schools_count: number;
      schools_with_scores: number;
      score_lines_count: number;
      failed_sources: number;
    }>();

  const { results: failedSourceRows } = await db
    .prepare(
      `SELECT id, district, last_error, last_success_at
       FROM fetch_sources WHERE last_error IS NOT NULL ORDER BY id`
    )
    .all<{
      id: string;
      district: string | null;
      last_error: string;
      last_success_at: string | null;
    }>();

  const { results: sourceRows } = await db
    .prepare(
      `SELECT id, district, last_success_at, last_count, last_error
       FROM fetch_sources ORDER BY id`
    )
    .all<{
      id: string;
      district: string | null;
      last_success_at: string | null;
      last_count: number | null;
      last_error: string | null;
    }>();

  return {
    schools: stats?.schools_count ?? 0,
    schoolsWithScores: stats?.schools_with_scores ?? 0,
    scoreLines: stats?.score_lines_count ?? 0,
    failedSources: stats?.failed_sources ?? 0,
    failedSourceDetails: failedSourceRows || [],
    sources: sourceRows || [],
  };
}

async function logSync(
  db: D1Database,
  payload: {
    startedAt: string;
    finishedAt: string;
    status: string;
    schoolsCount: number;
    schoolsWithScores: number;
    fetchedCount: number;
    sources: unknown[];
    errors: unknown[];
  }
) {
  await db
    .prepare(
      `INSERT INTO sync_logs (
        started_at, finished_at, status, schools_count, schools_with_scores,
        fetched_count, sources, errors
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .bind(
      payload.startedAt,
      payload.finishedAt,
      payload.status,
      payload.schoolsCount,
      payload.schoolsWithScores,
      payload.fetchedCount,
      JSON.stringify(payload.sources),
      JSON.stringify(payload.errors)
    )
    .run();
}

async function updateFetchSources(
  db: D1Database,
  sources: { id: string; url: string; district?: string; count?: number }[],
  failed: { id: string; error: string }[]
) {
  const now = new Date().toISOString();
  for (const source of sources) {
    await db
      .prepare(
        `INSERT INTO fetch_sources (id, url, district, last_success_at, last_count, last_error)
         VALUES (?, ?, ?, ?, ?, NULL)
         ON CONFLICT(id) DO UPDATE SET
           url = excluded.url,
           district = excluded.district,
           last_success_at = excluded.last_success_at,
           last_count = excluded.last_count,
           last_error = NULL`
      )
      .bind(source.id, source.url, source.district || null, now, source.count ?? null)
      .run();
  }
  for (const item of failed) {
    await db
      .prepare(
        `INSERT INTO fetch_sources (id, url, last_error)
         VALUES (?, '', ?)
         ON CONFLICT(id) DO UPDATE SET last_error = excluded.last_error`
      )
      .bind(item.id, item.error)
      .run();
  }
}

export async function runCloudflareSync(env: Env) {
  const startedAt = new Date().toISOString();

  const { results: existingFetched } = await env.DB.prepare(
    "SELECT s.name, sl.year, sl.min_score, sl.district_rank FROM schools s JOIN score_lines sl ON sl.school_id = s.id WHERE sl.source = '自动抓取更新'"
  ).all<{ name: string; year: number; min_score: number; district_rank: number }>();

  const existingSchools: Record<string, Record<string, [number, number]>> = {};
  for (const row of existingFetched || []) {
    existingSchools[row.name] = existingSchools[row.name] || {};
    existingSchools[row.name][row.year] = [row.min_score, row.district_rank];
  }

  const payload = await runFetch({ existingSchools });
  const { updated: scoreUpdates, unmatched } = await applyFetchedScores(
    env.DB,
    payload.schools
  );
  await updateFetchSources(env.DB, payload.sources, payload.failed);

  const stats = await env.DB.prepare(
    `SELECT
      (SELECT COUNT(*) FROM schools) AS schools_count,
      (SELECT COUNT(DISTINCT school_id) FROM score_lines) AS with_scores`
  ).first<{ schools_count: number; with_scores: number }>();

  const finishedAt = new Date().toISOString();
  await logSync(env.DB, {
    startedAt,
    finishedAt,
    status: "success",
    schoolsCount: stats?.schools_count ?? 0,
    schoolsWithScores: stats?.with_scores ?? 0,
    fetchedCount: Object.keys(payload.schools).length,
    sources: payload.sources,
    errors: [
      ...payload.failed,
      ...(unmatched.length
        ? [{ type: "unmatched_schools", count: unmatched.length, names: unmatched.slice(0, 50) }]
        : []),
    ],
  });

  return {
    ok: true,
    fetchedSchools: Object.keys(payload.schools).length,
    scoreUpdates,
    unmatched: unmatched.length,
    failed: payload.failed.length,
    finishedAt,
  };
}

export default {
  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext) {
    ctx.waitUntil(runCloudflareSync(env));
  },

  async fetch(request: Request, env: Env) {
    const url = new URL(request.url);

    if (url.pathname === "/sync") {
      const auth = request.headers.get("authorization");
      if (env.CRON_SECRET && auth !== `Bearer ${env.CRON_SECRET}`) {
        return Response.json({ error: "Unauthorized" }, { status: 401 });
      }
      const result = await runCloudflareSync(env);
      return Response.json(result);
    }

    if (url.pathname === "/health") {
      const quality = await getDataQuality(env.DB);
      const lastSync = await env.DB.prepare(
        `SELECT started_at, finished_at, status, schools_count, schools_with_scores,
                fetched_count, sources, errors
         FROM sync_logs ORDER BY id DESC LIMIT 1`
      ).first<{
        started_at: string;
        finished_at: string | null;
        status: string;
        schools_count: number | null;
        schools_with_scores: number | null;
        fetched_count: number | null;
        sources: string;
        errors: string;
      }>();
      return Response.json({
        ok: true,
        ...quality,
        lastSync: lastSync
          ? {
              ...lastSync,
              sources: JSON.parse(lastSync.sources || "[]"),
              errors: JSON.parse(lastSync.errors || "[]"),
            }
          : null,
      });
    }

    if (url.pathname === "/logs") {
      const limit = Math.min(Number(url.searchParams.get("limit") || 10), 50);
      const { results } = await env.DB.prepare(
        `SELECT id, started_at, finished_at, status, schools_count, schools_with_scores,
                fetched_count, sources, errors
         FROM sync_logs ORDER BY id DESC LIMIT ?`
      )
        .bind(limit)
        .all<{
          id: number;
          started_at: string;
          finished_at: string | null;
          status: string;
          schools_count: number | null;
          schools_with_scores: number | null;
          fetched_count: number | null;
          sources: string;
          errors: string;
        }>();
      return Response.json({
        logs: (results || []).map((row) => ({
          ...row,
          sources: JSON.parse(row.sources || "[]"),
          errors: JSON.parse(row.errors || "[]"),
        })),
      });
    }

    return Response.json({
      service: "zhongzhao-sync",
      endpoints: ["/sync", "/health", "/logs"],
    });
  },
};
