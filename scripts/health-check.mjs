/**
 * 线上健康检查（网站 + Sync Worker）
 * 用法：npm run health:check
 * 环境变量：
 *   SITE_URL（默认 workers.dev 网站）
 *   SYNC_URL（默认 workers.dev sync）
 *   HEALTH_STRICT=1 时 degraded 也视为失败
 */
const SITE_URL =
  process.env.SITE_URL ?? "https://zhongzhao-web.zhaixiuchen.workers.dev";
const SYNC_URL =
  process.env.SYNC_URL ?? "https://zhongzhao-sync.zhaixiuchen.workers.dev";
const STRICT = process.env.HEALTH_STRICT === "1";

async function checkEndpoint(name, url) {
  const res = await fetch(url, { signal: AbortSignal.timeout(15000) });
  const body = await res.json().catch(() => ({}));
  const status = body.status ?? (body.ok ? "healthy" : "unhealthy");
  const ok = res.ok && body.ok !== false;
  const pass = STRICT ? ok && status === "healthy" : res.ok;

  console.log(`${pass ? "✓" : "✗"} ${name}: HTTP ${res.status}, status=${status}`);
  if (body.issues?.length) {
    for (const issue of body.issues) {
      console.log(`    [${issue.severity}] ${issue.code}: ${issue.message}`);
    }
  }
  if (!pass) {
    console.log(`    ${JSON.stringify(body).slice(0, 300)}`);
  }
  return pass;
}

async function main() {
  console.log("健康检查…");
  const results = await Promise.all([
    checkEndpoint("网站 /api/health", `${SITE_URL}/api/health`),
    checkEndpoint("Sync /health", `${SYNC_URL}/health`),
  ]);

  if (results.every(Boolean)) {
    console.log("\n全部通过 ✓");
    return;
  }
  console.error("\n健康检查未通过");
  process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
