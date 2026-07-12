import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { OFFICIAL_SCHOOLS, KEY_SCHOOLS, PRIVATE_KEYWORDS } from "./school-list.mjs";
import { SCORE_DATA, SCORE_SCALES } from "./score-data.mjs";
import { SCORE_ALIASES } from "./score-aliases.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "../src/data/schools.json");

const SHORT_NAMES = {
  "中国人民大学附属中学": "人大附中",
  "北京大学附属中学": "北大附中",
  "清华大学附属中学": "清华附中",
  "首都师范大学附属中学": "首师大附中",
  "北京市第一〇一中学": "一零一中学",
  "北京理工大学附属中学": "理工附中",
  "北京交通大学附属中学": "交大附中",
  "北京市十一学校": "十一学校",
  "北京市八一学校": "八一学校",
  "北京市中关村中学": "中关村中学",
  "北京市第二十中学": "二十中",
  "北京市第四中学": "北京四中",
  "北京市第八中学": "北京八中",
  "北京师范大学附属实验中学": "北师大实验",
  "北京师范大学附属中学": "北师大附中",
  "北京师范大学第二附属中学": "北师大二附",
  "北京市第八十中学": "八十中",
  "北京市陈经纶中学": "陈经纶中学",
  "北京市第二中学": "北京二中",
  "北京市第五中学": "北京五中",
  "北京市第一七一中学": "一七一中学",
  "北京汇文中学": "汇文中学",
  "北京市第十二中学": "丰台十二中",
  "北京市顺义牛栏山第一中学": "牛栏山一中",
  "北京市大兴区第一中学": "大兴一中",
  "北京市通州区潞河中学": "潞河中学",
  "北京市延庆区第一中学": "延庆一中",
  "北京市密云区第二中学": "密云二中",
  "北京市昌平区第二中学": "昌平二中",
  "北京市昌平区第一中学": "昌平一中",
  "中国人民大学附属中学朝阳学校": "人朝",
  "清华大学附属中学朝阳学校": "清朝",
  "清华大学附属中学望京学校": "清望",
  "北京中学": "北京中学",
  "北京市京源学校": "京源学校",
  "北京市第九中学": "九中",
  "北京钱学森中学": "钱学森中学",
  "人大附中北京经济技术开发区学校": "人开",
};

function toId(name, district) {
  const prefix = {
    东城: "dc", 西城: "xc", 朝阳: "cy", 海淀: "hd", 丰台: "ft",
    石景山: "sjs", 门头沟: "mtg", 房山: "fs", 燕山: "ys", 昌平: "cp",
    大兴: "dx", 通州: "tz", 顺义: "sy", 怀柔: "hr", 平谷: "pg",
    延庆: "yq", 密云: "my", 经开: "jk",
  }[district] || "bj";
  const slug = name
    .replace(/北京市|北京|（.*?）|\(.*?\)/g, "")
    .replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, "")
    .slice(0, 12);
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
  return `${prefix}-${hash.toString(36).slice(0, 8)}`;
}

function getShortName(name) {
  if (SHORT_NAMES[name]) return SHORT_NAMES[name];
  return name
    .replace(/^北京市/, "")
    .replace(/（.*?）|\(.*?\)/g, "")
    .replace(/^北京/, "")
    .slice(0, 10);
}

function getType(name) {
  if (PRIVATE_KEYWORDS.some((k) => name.includes(k))) return "民办";
  if (KEY_SCHOOLS.has(name)) return "示范";
  return "普通公办";
}

function resolveScoreData(name) {
  if (SCORE_DATA[name]) return SCORE_DATA[name];
  const aliasTarget = SCORE_ALIASES[name];
  if (aliasTarget && SCORE_DATA[aliasTarget]) return SCORE_DATA[aliasTarget];
  for (const [alias, target] of Object.entries(SCORE_ALIASES)) {
    if (name.includes(alias) || alias.includes(name)) {
      if (SCORE_DATA[target]) return SCORE_DATA[target];
    }
  }
  return null;
}

function buildScoreLines(name) {
  const data = resolveScoreData(name);
  if (!data) return [];
  const lines = [];
  for (const [yearStr, vals] of Object.entries(data)) {
    const year = Number(yearStr);
    const [minScore, districtRank] = vals;
    lines.push({
      year,
      batch: "统一招生",
      minScore,
      maxScore: SCORE_SCALES[year],
      districtRank,
      source: "北京中考信息网等网传数据",
    });
  }
  return lines.sort((a, b) => b.year - a.year);
}

function buildDescription(name, district, type, hasScores) {
  const key = KEY_SCHOOLS.has(name) ? "北京市示范性普通高中" : "北京市具有招生资格的普通高中";
  const scoreNote = hasScores ? "已收录近年统招录取分数线。" : "暂无公开统招录取分数线数据。";
  return `${district}区${key}，${scoreNote}`;
}

const schools = [];
let withScores = 0;

for (const [district, names] of Object.entries(OFFICIAL_SCHOOLS)) {
  for (const name of names) {
  if (name.includes("培智")) continue;
    const scoreLines = buildScoreLines(name);
    if (scoreLines.length > 0) withScores++;
    const type = getType(name);
    schools.push({
      id: toId(name, district),
      name,
      shortName: getShortName(name),
      district,
      type,
      description: buildDescription(name, district, type, scoreLines.length > 0),
      features: KEY_SCHOOLS.has(name) ? ["示范性高中", "区重点"] : [],
      admissionTypes: type === "贯通" ? ["提前招生"] : ["指标分配", "统一招生"],
      isKeySchool: KEY_SCHOOLS.has(name),
      scoreLines,
    });
  }
}

fs.writeFileSync(OUT, JSON.stringify(schools, null, 2), "utf-8");

console.log(`Generated ${schools.length} schools (${withScores} with score data)`);
console.log(`Output: ${OUT}`);
