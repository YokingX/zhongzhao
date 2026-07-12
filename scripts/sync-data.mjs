/**
 * 一键同步：抓取 → 生成 JSON → 导入本地 D1 → 更新元信息
 */
import { spawnSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const startedAt = new Date().toISOString();

function run(cmd, args, label) {
  const res = spawnSync(cmd, args, {
    cwd: root,
    stdio: "inherit",
    env: process.env,
  });
  if (res.status !== 0) {
    console.error(`失败: ${label || cmd}`);
    process.exit(res.status || 1);
  }
}

run(process.execPath, [path.join(__dirname, "fetch-scores.mjs")], "fetch-scores");
run(process.execPath, [path.join(__dirname, "generate-schools.mjs")], "generate-schools");
run(process.execPath, [path.join(__dirname, "d1-seed.mjs")], "d1:seed");

const metaPath = path.join(root, "src/data/meta.json");
const manifestPath = path.join(root, "src/data/data-manifest.json");
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
meta.database = "d1";

fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2), "utf-8");

const scoreCount = schools.reduce((n, s) => n + (s.scoreLines?.length || 0), 0);

console.log(`\n同步完成: ${schools.length} 所学校, ${withScores} 所有分数线`);
console.log(`本地 D1（测试）已更新 → .wrangler/state/`);
console.log(`  分数线记录: ${scoreCount} 条`);
console.log(`  远程生产 D1 请用: D1_REMOTE_CONFIRM=1 npm run d1:seed:remote`);
console.log(`  开始: ${startedAt}`);
console.log(`  结束: ${finishedAt}`);
