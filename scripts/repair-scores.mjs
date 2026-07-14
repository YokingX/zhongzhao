/**
 * 清理 D1 中不合理分数线，并按 schools.json 回填有效数据。
 * 用法：
 *   node scripts/repair-scores.mjs --local
 *   D1_REMOTE_CONFIRM=1 node scripts/repair-scores.mjs --remote
 */
import { spawnSync } from "child_process";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { isPlausibleMinScore } from "./score-validate.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const schools = JSON.parse(
  fs.readFileSync(path.join(root, "src/data/schools.json"), "utf-8")
);

const remote = process.argv.includes("--remote");
if (remote && process.env.D1_REMOTE_CONFIRM !== "1") {
  console.error("远程修复需设置 D1_REMOTE_CONFIRM=1");
  process.exit(1);
}

function wranglerSql(sql) {
  const args = [
    "wrangler",
    "d1",
    "execute",
    "zhongzhao-db",
    remote ? "--remote" : "--local",
    "-c",
    "wrangler.jsonc",
    "--command",
    sql,
  ];
  const res = spawnSync("npx", args, { cwd: root, encoding: "utf-8", maxBuffer: 20 * 1024 * 1024 });
  if (res.status !== 0) {
    console.error(res.stdout || "");
    console.error(res.stderr || "");
    throw new Error("wrangler d1 execute failed");
  }
  return res.stdout;
}

console.log(`清理不合理分数线（${remote ? "remote" : "local"}）…`);
wranglerSql(
  `DELETE FROM score_lines WHERE
    min_score < 100
    OR (year >= 2025 AND (min_score < 200 OR min_score > 510))
    OR (year = 2024 AND (min_score < 300 OR min_score > 670))
    OR (year <= 2023 AND (min_score < 300 OR min_score > 680))`
);

// 仅回填 D1 已有学校，避免 FOREIGN KEY 失败
const idListOut = wranglerSql(`SELECT id FROM schools`);
const existingIds = new Set(
  [...idListOut.matchAll(/"id"\s*:\s*"([^"]+)"/g)].map((m) => m[1])
);
if (existingIds.size === 0) {
  // 兼容表格输出：每行一个 id
  for (const line of idListOut.split("\n")) {
    const id = line.trim();
    if (/^[a-z]{2}-[a-z0-9]+$/i.test(id)) existingIds.add(id);
  }
}
console.log(`D1 学校数：${existingIds.size}`);

const values = [];
for (const school of schools) {
  if (!existingIds.has(school.id)) continue;
  for (const line of school.scoreLines || []) {
    if (line.batch !== "统一招生") continue;
    if (!isPlausibleMinScore(line.year, line.minScore)) continue;
    const note = line.note ? `'${String(line.note).replace(/'/g, "''")}'` : "NULL";
    const source = line.source ? `'${String(line.source).replace(/'/g, "''")}'` : "NULL";
    const rank = line.districtRank != null ? line.districtRank : "NULL";
    const max = line.maxScore != null ? line.maxScore : "NULL";
    values.push(
      `('${school.id}', ${line.year}, '统一招生', ${line.minScore}, ${max}, ${rank}, ${note}, ${source})`
    );
  }
}

const CHUNK = 40;
console.log(`回填有效统招分数 ${values.length} 条…`);
for (let i = 0; i < values.length; i += CHUNK) {
  const chunk = values.slice(i, i + CHUNK);
  const sql = `INSERT INTO score_lines (school_id, year, batch, min_score, max_score, district_rank, note, source) VALUES ${chunk.join(",")}
    ON CONFLICT(school_id, year, batch) DO UPDATE SET
      min_score = excluded.min_score,
      max_score = excluded.max_score,
      district_rank = COALESCE(excluded.district_rank, score_lines.district_rank),
      note = excluded.note,
      source = excluded.source`;
  wranglerSql(sql);
  process.stdout.write(`\r  ${Math.min(i + CHUNK, values.length)}/${values.length}`);
}
console.log("\n完成。");
