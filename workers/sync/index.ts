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

  for (const [name, years] of Object.entries(fetched)) {
    const schoolId = resolveSchoolId(name, index);
    if (!schoolId) continue;

    for (const [yearStr, [minScore, districtRank]] of Object.entries(years)) {
      const year = Number(yearStr);
      const maxScore = SCORE_SCALES[year] ?? null;
      await db
        .prepare(
          `INSERT INTO score_lines (school_id, year, batch, min_score, max_score, district_rank, source)
           VALUES (?, ?, '统一招生', ?, ?, ?, '自动抓取更新')
           ON CONFLICT(school_id, year, batch) DO UPDATE SET
             min_score = excluded.min_score,
             max_score = excluded.max_score,
             district_rank = excluded.district_rank,
             source = excluded.source`
        )
        .bind(schoolId, year, minScore, maxScore, districtRank)
        .run();
      updated++;
    }

    await db
      .prepare("UPDATE schools SET updated_at = ? WHERE id = ?")
      .bind(now, schoolId)
      .run();
  }

  return updated;
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
  const scoreUpdates = await applyFetchedScores(env.DB, payload.schools);
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
    errors: payload.failed,
  });

  return {
    ok: true,
    fetchedSchools: Object.keys(payload.schools).length,
    scoreUpdates,
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
      const stats = await env.DB.prepare(
        "SELECT COUNT(*) AS c FROM schools"
      ).first<{ c: number }>();
      return Response.json({ ok: true, schools: stats?.c ?? 0 });
    }

    return Response.json({
      service: "zhongzhao-sync",
      endpoints: ["/sync", "/health"],
    });
  },
};
