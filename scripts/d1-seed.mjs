/**
 * 将 schools.json 导入 Cloudflare D1（本地或远程）
 * 用法: npm run d1:seed [-- --remote]
 */
import fs from "fs";
import path from "path";
import { spawnSync } from "child_process";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const schoolsPath = path.join(root, "src/data/schools.json");
const seedSqlPath = path.join(root, "data/d1-seed.sql");

function sqlEscape(value) {
  return String(value ?? "").replace(/'/g, "''");
}

function generateSeedSql(schools) {
  const lines = ["PRAGMA foreign_keys = OFF;", "DELETE FROM score_lines;", "DELETE FROM schools;"];

  for (const school of schools) {
    lines.push(
      `INSERT INTO schools (id, name, short_name, district, type, description, features, admission_types, is_key_school, address, website, updated_at) VALUES (` +
        `'${sqlEscape(school.id)}',` +
        `'${sqlEscape(school.name)}',` +
        `'${sqlEscape(school.shortName)}',` +
        `'${sqlEscape(school.district)}',` +
        `'${sqlEscape(school.type)}',` +
        `'${sqlEscape(school.description)}',` +
        `'${sqlEscape(JSON.stringify(school.features || []))}',` +
        `'${sqlEscape(JSON.stringify(school.admissionTypes || []))}',` +
        `${school.isKeySchool ? 1 : 0},` +
        `${school.address ? `'${sqlEscape(school.address)}'` : "NULL"},` +
        `${school.website ? `'${sqlEscape(school.website)}'` : "NULL"},` +
        `'${new Date().toISOString()}'` +
        `);`
    );

    for (const line of school.scoreLines || []) {
      lines.push(
        `INSERT INTO score_lines (school_id, year, batch, min_score, max_score, district_rank, note, source) VALUES (` +
          `'${sqlEscape(school.id)}',` +
          `${line.year},` +
          `'${sqlEscape(line.batch)}',` +
          `${line.minScore},` +
          `${line.maxScore ?? "NULL"},` +
          `${line.districtRank ?? "NULL"},` +
          `${line.note ? `'${sqlEscape(line.note)}'` : "NULL"},` +
          `${line.source ? `'${sqlEscape(line.source)}'` : "NULL"}` +
          `);`
      );
    }
  }

  lines.push("PRAGMA foreign_keys = ON;");
  return lines.join("\n");
}

function main() {
  if (!fs.existsSync(schoolsPath)) {
    console.error("未找到 schools.json，请先运行 npm run sync:data");
    process.exit(1);
  }

  const schools = JSON.parse(fs.readFileSync(schoolsPath, "utf-8"));
  fs.mkdirSync(path.dirname(seedSqlPath), { recursive: true });
  fs.writeFileSync(seedSqlPath, generateSeedSql(schools), "utf-8");

  const remote = process.argv.includes("--remote");
  if (remote && process.env.D1_REMOTE_CONFIRM !== "1") {
    console.error(
      "拒绝写入远程 D1：这是生产数据库。\n" +
        "若确认操作，请设置环境变量 D1_REMOTE_CONFIRM=1 后重试。\n" +
        "示例: D1_REMOTE_CONFIRM=1 npm run d1:seed:remote"
    );
    process.exit(1);
  }
  const target = remote ? "--remote" : "--local";

  console.log(
    remote
      ? "⚠️  目标：远程 D1（生产 zhongzhao-db）"
      : "📦 目标：本地 D1（测试，.wrangler/state/）"
  );
  console.log(`生成种子 SQL: ${schools.length} 所学校 → ${seedSqlPath}`);

  const migrate = spawnSync(
    "npx",
    ["wrangler", "d1", "migrations", "apply", "zhongzhao-db", target, "-c", "wrangler.sync.jsonc"],
    { cwd: root, stdio: "inherit" }
  );
  if (migrate.status !== 0) process.exit(migrate.status || 1);

  const seed = spawnSync(
    "npx",
    ["wrangler", "d1", "execute", "zhongzhao-db", target, "--file", seedSqlPath, "-c", "wrangler.sync.jsonc"],
    { cwd: root, stdio: "inherit" }
  );
  if (seed.status !== 0) process.exit(seed.status || 1);

  console.log(`D1 种子数据已导入 (${remote ? "远程 · 生产" : "本地 · 测试"})`);
}

main();
