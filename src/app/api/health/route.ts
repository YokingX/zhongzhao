import { evaluateDataHealth } from "@/lib/health";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const { getCloudflareContext } = await import("@opennextjs/cloudflare");
    const { env } = getCloudflareContext();

    if (!env?.DB) {
      return Response.json(
        {
          ok: false,
          service: "zhongzhao-web",
          status: "unhealthy",
          issues: [{ code: "no_db", message: "D1 未绑定", severity: "error" }],
        },
        { status: 503 }
      );
    }

    const stats = await env.DB.prepare(
      `SELECT
        (SELECT COUNT(*) FROM schools) AS schools,
        (SELECT COUNT(DISTINCT school_id) FROM score_lines) AS schools_with_scores,
        (SELECT COUNT(*) FROM score_lines) AS score_lines,
        (SELECT COUNT(*) FROM fetch_sources WHERE last_error IS NOT NULL) AS failed_sources`
    ).first<{
      schools: number;
      schools_with_scores: number;
      score_lines: number;
      failed_sources: number;
    }>();

    const lastSync = await env.DB.prepare(
      `SELECT finished_at FROM sync_logs ORDER BY id DESC LIMIT 1`
    ).first<{ finished_at: string | null }>();

    const evaluation = evaluateDataHealth({
      schools: stats?.schools ?? 0,
      schoolsWithScores: stats?.schools_with_scores ?? 0,
      scoreLines: stats?.score_lines ?? 0,
      failedSources: stats?.failed_sources ?? 0,
      lastSyncFinishedAt: lastSync?.finished_at,
    });

    return Response.json(
      {
        service: "zhongzhao-web",
        ...evaluation,
        schools: stats?.schools ?? 0,
        schoolsWithScores: stats?.schools_with_scores ?? 0,
        scoreLines: stats?.score_lines ?? 0,
        failedSources: stats?.failed_sources ?? 0,
        checkedAt: new Date().toISOString(),
      },
      { status: evaluation.ok ? 200 : 503 }
    );
  } catch (error) {
    return Response.json(
      {
        ok: false,
        service: "zhongzhao-web",
        status: "unhealthy",
        issues: [
          {
            code: "internal_error",
            message: error instanceof Error ? error.message : String(error),
            severity: "error",
          },
        ],
      },
      { status: 503 }
    );
  }
}
