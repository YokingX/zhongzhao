/**
 * 审计抓取校名与官方校名库的映射缺口
 * 用法：npm run audit:aliases
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { runFetch, normalizeSchoolName } from "./fetch-core.mjs";
import { OFFICIAL_SCHOOLS } from "./school-list.mjs";
import { FETCH_NAME_ALIASES, SCORE_ALIASES } from "./score-aliases.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SCHOOLS_JSON = path.join(__dirname, "../src/data/schools.json");

function loadOfficialNames() {
  const names = new Set();
  for (const list of Object.values(OFFICIAL_SCHOOLS)) {
    for (const name of list) names.add(name);
  }
  try {
    const data = JSON.parse(fs.readFileSync(SCHOOLS_JSON, "utf-8"));
    for (const school of data.schools || []) {
      if (school.name) names.add(school.name);
    }
  } catch {
    // schools.json 可能尚未生成
  }
  return names;
}

function findDuplicateKeys(obj, label) {
  const seen = new Map();
  const text = fs.readFileSync(
    path.join(__dirname, "score-aliases.mjs"),
    "utf-8"
  );
  const re = /"([^"]+)":\s*"/g;
  let match;
  let section = "";
  const duplicates = [];
  for (const line of text.split("\n")) {
    if (line.includes(`export const ${label}`)) section = label;
    if (section && line.startsWith("export const ") && !line.includes(label)) {
      section = "";
    }
    if (!section) continue;
    const m = line.match(/^\s*"([^"]+)":/);
    if (m) {
      const key = m[1];
      if (seen.has(key)) duplicates.push(key);
      else seen.set(key, true);
    }
  }
  return duplicates;
}

async function main() {
  console.log("抓取中…");
  const payload = await runFetch({ existingSchools: {} });
  const officialNames = loadOfficialNames();
  const officialIndex = new Map();
  for (const name of officialNames) {
    officialIndex.set(name, true);
    const normalized = normalizeSchoolName(name);
    if (normalized) officialIndex.set(normalized, true);
  }

  const unmatched = [];
  const matched = [];

  for (const rawName of Object.keys(payload.schools)) {
    const official = normalizeSchoolName(rawName);
    if (official && officialIndex.has(official)) {
      matched.push({ raw: rawName, official });
    } else {
      unmatched.push({ raw: rawName, normalized: official });
    }
  }

  const dupExtra = findDuplicateKeys(FETCH_NAME_ALIASES, "FETCH_EXTRA_ALIASES");
  const aliasKeys = new Set(Object.keys(FETCH_NAME_ALIASES));
  const scoreOnly = Object.keys(SCORE_ALIASES).filter((k) => !aliasKeys.has(k));

  console.log("\n=== 别名审计 ===");
  console.log(`抓取源：${payload.sources.length} 成功，${payload.failed.length} 失败`);
  console.log(`抓取校名：${Object.keys(payload.schools).length}`);
  console.log(`已映射：${matched.length}，未映射：${unmatched.length}`);
  console.log(`FETCH_NAME_ALIASES 条目：${Object.keys(FETCH_NAME_ALIASES).length}`);
  console.log(`SCORE_ALIASES 条目：${Object.keys(SCORE_ALIASES).length}`);

  if (dupExtra.length) {
    console.log("\n重复别名 key（FETCH_EXTRA_ALIASES）：");
    for (const key of [...new Set(dupExtra)]) console.log(`  - ${key}`);
  }

  if (unmatched.length) {
    console.log("\n未映射校名（建议加入 score-aliases.mjs）：");
    for (const item of unmatched.sort((a, b) => a.raw.localeCompare(b.raw, "zh"))) {
      console.log(`  - ${item.raw} → ${item.normalized || "(null)"}`);
    }
    process.exitCode = 1;
  } else {
    console.log("\n全部校名均已映射 ✓");
  }

  if (payload.failed.length) {
    console.log("\n失败抓取源：");
    for (const f of payload.failed) console.log(`  - ${f.id}: ${f.error}`);
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
