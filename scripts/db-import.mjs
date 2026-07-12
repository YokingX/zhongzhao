/**
 * 将 schools.json 导入 SQLite 数据库
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import {
  openDb,
  initSchema,
  importSchoolsJson,
  getDbPath,
  getDbStats,
} from "./db.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const schoolsPath = path.join(root, "src/data/schools.json");

function main() {
  if (!fs.existsSync(schoolsPath)) {
    console.error("未找到 schools.json，请先运行 generate:schools");
    process.exit(1);
  }

  const schools = JSON.parse(fs.readFileSync(schoolsPath, "utf-8"));
  const db = openDb();
  initSchema(db);
  importSchoolsJson(db, schools);
  const stats = getDbStats(db);
  db.close();

  console.log(`数据库已更新: ${getDbPath()}`);
  console.log(`  学校: ${stats.schoolsCount} 所`);
  console.log(`  有分数线: ${stats.withScores} 所`);
  console.log(`  分数线记录: ${stats.scoreCount} 条`);
}

main();
