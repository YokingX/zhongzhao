/**
 * 全站冒烟测试
 * 用法：npm run smoke:test
 */
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SITE_URL =
  process.env.SITE_URL ?? "https://zhongzhao-web.zhaixiuchen.workers.dev";
const TIMEOUT = 45000;

const schools = JSON.parse(
  readFileSync(join(__dirname, "../src/data/schools.json"), "utf8")
);

function getDistricts() {
  const counts = new Map();
  for (const s of schools) {
    counts.set(s.district, (counts.get(s.district) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([district, count]) => ({ district, count }))
    .sort((a, b) => a.district.localeCompare(b.district, "zh"));
}

function filterSchoolsJson({ district, type, query, hasScores, page = 1, pageSize = 24 }) {
  let list = schools;
  if (district && district !== "全部") {
    const d = district.replace(/区$/, "");
    list = list.filter((s) => s.district === d);
  }
  if (type && type !== "全部") list = list.filter((s) => s.type === type);
  if (hasScores) list = list.filter((s) => s.scoreLines?.length > 0);
  if (query) {
    const q = query.trim().toLowerCase();
    list = list.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.shortName.toLowerCase().includes(q) ||
        s.district.toLowerCase().includes(q)
    );
  }
  const total = list.length;
  const offset = (page - 1) * pageSize;
  return { total, schools: list.slice(offset, offset + pageSize) };
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

// URL 构建逻辑（与 src/lib/schools-url.ts 对齐）
function buildSchoolsDistrictUrl(params, district) {
  const sp = new URLSearchParams();
  if (district) sp.set("district", district);
  if (params.type && params.type !== "全部") sp.set("type", params.type);
  if (params.query) sp.set("query", params.query);
  if (params.hasScores === "1") sp.set("hasScores", "1");
  const qs = sp.toString();
  return qs ? `/schools?${qs}` : "/schools";
}

console.log("=== 本地逻辑 ===");
const districts = getDistricts();
for (const { district, count } of districts) {
  const { total } = filterSchoolsJson({ district });
  assert(total === count, `${district}: 期望 ${count} 实际 ${total}`);
}
console.log(`✓ ${districts.length} 个行政区计数`);

// 切换行政区不应携带旧 district
const href = buildSchoolsDistrictUrl({ type: "示范" }, "西城");
assert(href.includes("district=%E8%A5%BF%E5%9F%8E") || href.includes("district=西城"), href);
assert(!href.includes("海淀"), `切换行政区 URL 含旧区: ${href}`);
console.log("✓ 行政区 URL 构建");

const withSuffix = filterSchoolsJson({ district: "海淀区" });
assert(withSuffix.total === 73, "海淀区后缀应正常匹配");
console.log("✓ 行政区后缀归一化");

async function fetchRoute(path) {
  const url = `${SITE_URL}${path}`;
  const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT) });
  const text = await res.text();
  return { status: res.status, ok: res.ok, text, len: text.length };
}

const routes = [
  "/",
  "/schools",
  "/compare",
  "/compare?ids=hd-1yv0spl,xc-36caut,dc-354hnq",
  "/scores",
  "/scores?year=2025&batch=统一招生",
  "/scores?district=海淀&year=2025&batch=统一招生",
  "/scores?district=朝阳&year=2025&batch=统一招生",
  "/policies",
  "/guide",
  "/assist",
  "/faq",
  "/timeline",
  "/rank",
  "/rank?score=480&year=2025&district=海淀",
  "/data",
  "/feedback",
  "/open",
  "/fallback.html",
  "/api/health",
];

console.log("\n=== 线上页面 ===");
let failed = 0;
for (const path of routes) {
  try {
    const { status, ok, len, text } = await fetchRoute(path);
    const pass = ok && len > 50 && !text.includes("Application error");
    console.log(`${pass ? "✓" : "✗"} ${path}: HTTP ${status}`);
    if (!pass) failed++;
  } catch (e) {
    console.log(`✗ ${path}: ${e.message}`);
    failed++;
  }
}

console.log("\n=== 行政区页面 ===");
for (const { district, count } of districts) {
  const path = `/schools?district=${encodeURIComponent(district)}`;
  try {
    const { ok, text } = await fetchRoute(path);
    const titleOk = text.includes(`${district}区学校`);
    const err = text.includes("Application error") || text.includes("加载失败");
    const pass = ok && titleOk && !err;
    console.log(`${pass ? "✓" : "✗"} ${district} (${count})`);
    if (!pass) failed++;
  } catch (e) {
    console.log(`✗ ${district}: ${e.message}`);
    failed++;
  }
}

if (failed > 0) {
  console.error(`\n${failed} 项未通过`);
  process.exit(1);
}
console.log("\n全部冒烟测试通过 ✓");
