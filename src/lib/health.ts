/** 健康检查阈值（网站与 Sync Worker 共用） */
export const HEALTH_THRESHOLDS = {
  minSchools: 300,
  minSchoolsWithScores: 250,
  maxFailedSources: 3,
  /** 超过该天数未同步视为过期（周同步 + 缓冲） */
  maxSyncAgeDays: 8,
} as const;

export type HealthSeverity = "error" | "warn";

export interface HealthIssue {
  code: string;
  message: string;
  severity: HealthSeverity;
}

export interface DataQualityMetrics {
  schools: number;
  schoolsWithScores: number;
  scoreLines: number;
  failedSources: number;
  lastSyncFinishedAt?: string | null;
}

export function evaluateDataHealth(metrics: DataQualityMetrics): {
  ok: boolean;
  status: "healthy" | "degraded" | "unhealthy";
  issues: HealthIssue[];
} {
  const issues: HealthIssue[] = [];
  const { minSchools, minSchoolsWithScores, maxFailedSources, maxSyncAgeDays } =
    HEALTH_THRESHOLDS;

  if (metrics.schools < minSchools) {
    issues.push({
      code: "low_school_count",
      message: `学校数 ${metrics.schools} 低于阈值 ${minSchools}`,
      severity: "error",
    });
  }

  if (metrics.schoolsWithScores < minSchoolsWithScores) {
    issues.push({
      code: "low_score_coverage",
      message: `有分数线学校 ${metrics.schoolsWithScores} 低于阈值 ${minSchoolsWithScores}`,
      severity: "warn",
    });
  }

  if (metrics.failedSources > maxFailedSources) {
    issues.push({
      code: "too_many_failed_sources",
      message: `失败抓取源 ${metrics.failedSources} 超过阈值 ${maxFailedSources}`,
      severity: "error",
    });
  } else if (metrics.failedSources > 0) {
    issues.push({
      code: "failed_fetch_sources",
      message: `${metrics.failedSources} 个抓取源最近失败`,
      severity: "warn",
    });
  }

  if (metrics.lastSyncFinishedAt) {
    const ageMs = Date.now() - new Date(metrics.lastSyncFinishedAt).getTime();
    const ageDays = ageMs / (1000 * 60 * 60 * 24);
    if (ageDays > maxSyncAgeDays) {
      issues.push({
        code: "stale_sync",
        message: `上次同步距今 ${Math.floor(ageDays)} 天，超过 ${maxSyncAgeDays} 天`,
        severity: "warn",
      });
    }
  }

  const hasError = issues.some((i) => i.severity === "error");
  const ok = !hasError;
  const status = hasError ? "unhealthy" : issues.length > 0 ? "degraded" : "healthy";

  return { ok, status, issues };
}
