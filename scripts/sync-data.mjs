/**
 * 一键同步：抓取 → 生成 JSON → 写入数据库 → 更新元信息
 */
import { spawnSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  openDb,
  initSchema,
  logSync,
  updateFetchSources,
  getDbStats,
  getDbPath,
} from "./db.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const startedAt = new Date().toISOString();

function run(script) {
  const res = spawnSync(process.execPath, [path.join(__dirname, script)], {
    cwd: root,
    stdio: "inherit",
    env: process.env,
  });
  if (res.status !== 0) {
    console.error(`脚本失败: ${script}`);
    process.exit(res.status || 1);
  }
}

run("fetch-scores.mjs");
run("generate-schools.mjs");
run("db-import.mjs");

const metaPath = path.join(root, "src/data/meta.json");
const manifestPath = path.join(root, "src/data/data-manifest.json");
const fetchedPath = path.join(root, "scripts/scores-fetched.json");
const meta = JSON.parse(fs.readFileSync(metaPath, "utf-8"));
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));

const schools = JSON.parse(
  fs.readFileSync(path.join(root, "src/data/schools.json"), "utf-8")
);
const withScores = schools.filter((s) => s.scoreLines.length > 0).length;
const finishedAt = manifest.lastUpdated || new Date().toISOString();

meta.lastUpdated = finishedAt;
meta.schoolsWithScores = withScores;
meta.totalSchools = schools.length;
meta.database = true;

fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2), "utf-8");

let fetched = { schools: {}, sources: [], failed: [] };
try {
  fetched = JSON.parse(fs.readFileSync(fetchedPath, "utf-8"));
} catch {
  // ignore
}

const db = openDb();
initSchema(db);
logSync(db, {
  startedAt,
  finishedAt,
  status: "success",
  schoolsCount: schools.length,
  schoolsWithScores: withScores,
  fetchedCount: Object.keys(fetched.schools || {}).length,
  sources: manifest.fetchSources || fetched.sources || [],
  errors: fetched.failed || [],
});
updateFetchSources(db, fetched.sources || [], fetched.failed || []);
const stats = getDbStats(db);
db.close();

console.log(`\n同步完成: ${schools.length} 所学校, ${withScores} 所有分数线`);
console.log(`数据库: ${getDbPath()}`);
console.log(`  分数线记录: ${stats.scoreCount} 条`);
console.log(`更新时间: ${meta.lastUpdated}`);
