/**
 * 从公开页面抓取最新分数线，写入 scores-fetched.json
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { runFetch } from "./fetch-core.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "scores-fetched.json");
const MANIFEST = path.join(__dirname, "../src/data/data-manifest.json");

function loadExisting() {
  try {
    return JSON.parse(fs.readFileSync(OUT, "utf-8"));
  } catch {
    return { fetchedAt: null, sources: [], schools: {} };
  }
}

async function main() {
  const existing = loadExisting();
  const payload = await runFetch({ existingSchools: existing.schools });

  fs.writeFileSync(OUT, JSON.stringify(payload, null, 2), "utf-8");

  const manifest = {
    lastUpdated: payload.fetchedAt,
    lastSync: payload.fetchedAt,
    schoolCount: Object.keys(payload.schools).length,
    fetchSources: payload.sources.map((s) => s.id),
    autoSync: true,
  };
  fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2), "utf-8");

  console.log(`\n抓取完成: ${Object.keys(payload.schools).length} 所学校有远程数据`);
  if (payload.failed.length > 0) {
    console.log(`部分源失败 ${payload.failed.length} 个，已保留历史数据`);
  }
}

main().catch((err) => {
  console.error("抓取脚本异常:", err);
  process.exit(0);
});
