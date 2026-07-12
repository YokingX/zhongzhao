/**
 * 一键同步：抓取远程数据 → 生成 schools.json → 更新元信息
 */
import { spawnSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

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

const metaPath = path.join(root, "src/data/meta.json");
const manifestPath = path.join(root, "src/data/data-manifest.json");
const meta = JSON.parse(fs.readFileSync(metaPath, "utf-8"));
const manifest = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));

const schools = JSON.parse(
  fs.readFileSync(path.join(root, "src/data/schools.json"), "utf-8")
);
const withScores = schools.filter((s) => s.scoreLines.length > 0).length;

meta.lastUpdated = manifest.lastUpdated || new Date().toISOString();
meta.schoolsWithScores = withScores;
meta.totalSchools = schools.length;

fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2), "utf-8");
console.log(`\n同步完成: ${schools.length} 所学校, ${withScores} 所有分数线`);
console.log(`更新时间: ${meta.lastUpdated}`);
