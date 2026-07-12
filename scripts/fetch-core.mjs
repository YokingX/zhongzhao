/**
 * 抓取核心逻辑（无文件系统依赖，可在 Cloudflare Worker 中使用）
 */
import { SCORE_ALIASES } from "./score-aliases.mjs";

const SOURCES = [
  {
    id: "haidian-24-25",
    url: "https://www.zhongkaobj.cn/lqfsx/hdq/2025081311829.html",
    district: "海淀",
    parser: "haidianCompare",
  },
  {
    id: "xicheng-24-25",
    url: "https://www.zhongkaobj.cn/lqfsx/xcq/2025081311827.html",
    district: "西城",
    parser: "haidianCompare",
  },
  {
    id: "chaoyang-24-25",
    url: "https://www.zhongkaobj.cn/lqfsx/cyq/2025081311826.html",
    district: "朝阳",
    parser: "haidianCompare",
  },
  {
    id: "dongcheng-2024",
    url: "https://www.zhongkaobj.cn/lqfsx/dcq/202410212391.html",
    district: "东城",
    parser: "simple2024",
  },
  {
    id: "xicheng-2024",
    url: "https://www.gaokzx.com/gk/zhongkao/126162.html",
    district: "西城",
    parser: "gaokzxDetailed2024",
  },
  {
    id: "haidian-2024",
    url: "https://www.gaokzx.com/gk/zhongkao/126160.html",
    district: "海淀",
    parser: "simple2024",
  },
  {
    id: "fengtai-2024",
    url: "https://www.zhongkaobj.cn/lqfsx/ftq/202410212412.html",
    district: "丰台",
    parser: "simple2024",
  },
  {
    id: "chaoyang-2024",
    url: "https://www.gaokzx.com/gk/zhongkao/126165.html",
    district: "朝阳",
    parser: "simple2024",
  },
  {
    id: "shijingshan-2024",
    url: "https://www.gaokzx.com/gk/zhongkao/126167.html",
    district: "石景山",
    parser: "simple2024",
  },
  {
    id: "shijingshan-2024-bj",
    url: "https://www.zhongkaobj.cn/lqfsx/qitaqu/202410212432.html",
    district: "石景山",
    parser: "districtTable",
  },
  {
    id: "changping-2024",
    url: "https://www.zhongkaobj.cn/lqfsx/cpq/202410212418.html",
    district: "昌平",
    parser: "districtTable",
  },
  {
    id: "changping-2024-gk",
    url: "https://www.gaokzx.com/gk/zhongkao/126168.html",
    district: "昌平",
    parser: "simple2024",
  },
  {
    id: "tongzhou-2024",
    url: "https://www.gaokzx.com/gk/zhongkao/126163.html",
    district: "通州",
    parser: "simple2024",
  },
  {
    id: "daxing-2024",
    url: "https://www.gaokzx.com/gk/zhongkao/126169.html",
    district: "大兴",
    parser: "simple2024",
  },
  {
    id: "beijing-rate-2024",
    url: "https://www.zhongkaobj.cn/lqfsx/qitaqu/202411013337.html",
    district: "全市",
    parser: "rateTable",
  },
  {
    id: "outer-districts-2025",
    url: "https://www.zhongkaobj.cn/lqfsx/qitaqu/2025080111678.html",
    district: "外围",
    parser: "district2025",
  },
];

const ALIAS_TO_OFFICIAL = Object.fromEntries(
  Object.entries(SCORE_ALIASES).map(([alias, official]) => [alias, official])
);

const OFFICIAL_ALIASES = {
  "北京二中": "北京市第二中学",
  "171中": "北京市第一七一中学",
  "一七一中学": "北京市第一七一中学",
  "五中": "北京市第五中学",
  "北京五中": "北京市第五中学",
  "广渠门中学": "北京市广渠门中学",
  "汇文中学": "北京汇文中学",
  "东直门中学": "北京市东直门中学",
  "景山学校": "北京景山学校",
  "一六六中学": "北京市第一六六中学",
  "十一中学": "北京市第十一中学",
  "五十中": "北京市第五十中学",
  "五十五中": "北京市第五十五中学",
  "二十二中": "北京市第二十二中学",
  "一零九中": "北京市第一零九中学",
  "二十四中": "北京市第二十四中学",
  "九十六中": "北京市第九十六中学",
  "六十五中": "北京市第六十五中学",
  "二十七中": "北京市第二十七中学",
  "二十五中": "北京市第二十五中学",
  "人大附中": "中国人民大学附属中学",
  "十一学校": "北京市十一学校",
  "清华附中": "清华大学附属中学",
  "一零一中学": "北京市第一〇一中学",
  "首师大附中": "首都师范大学附属中学",
  "北大附中": "北京大学附属中学",
  "丰台八中": "北京市丰台区第八中学",
  "北京十八中": "北京市第十八中学",
  "北师大实验丰台学校": "北京师范大学实验中学丰台学校",
  "北师大实验中学丰台学校": "北京师范大学实验中学丰台学校",
  "人大附中丰台学校": "中国人民大学附属中学丰台学校",
  "北京十中": "北京市第十中学",
  "首师大附属丽泽中学": "北京市首都师范大学附属丽泽中学",
  "北京赵登禹学校": "北京市赵登禹学校",
  "太平桥学校": "北京市丰台区太平桥学校",
  "首经贸附中": "首都经济贸易大学附属中学",
  "潞河中学": "北京市通州区潞河中学",
  "大兴一中": "北京市大兴区第一中学",
  "牛栏山一中": "北京市顺义牛栏山第一中学",
  "北京四中": "北京市第四中学",
  "北师大实验": "北京师范大学附属实验中学",
  "北师大附中": "北京师范大学附属中学",
  "北师大二附中": "北京师范大学第二附属中学",
  "北京八中": "北京市第八中学",
  "北京三十五中": "北京市第三十五中学",
  "一六一中": "北京市第一六一中学",
  "北京十三中": "北京市第十三中学",
  "铁路二中": "北京市铁路第二中学",
  "北京十四中": "北京市第十四中学",
  "西城外国语学校": "北京市西城外国语学校",
  "四十四中": "北京市第四十四中学",
  "育才学校": "北京市育才学校",
  "三十一中": "北京市第三十一中学",
  "北京七中": "北京市第七中学",
  "北京六十六中": "北京市第六十六中学",
  "鲁迅中学": "北京市鲁迅中学",
  "回民学校": "北京市回民学校",
  "北京四十三中": "北京市第四十三中学",
  "教院附中": "北京教育学院附属中学",
  "宣武外国语": "北京市宣武外国语实验学校",
  "五十六中": "北京市第五十六中学",
  "北师大亚太实验学校": "北京师范大学亚太实验学校",
  "北京十五中": "北京市第十五中学",
  "北京八十中": "北京市第八十中学",
  "八十中睿德分校": "北京市第八十中学睿德分校",
  "陈经纶中学": "北京市陈经纶中学",
  "人大附中朝阳学校": "中国人民大学附属中学朝阳学校",
  "清华附中朝阳学校": "清华大学附属中学朝阳学校",
  "清华附中望京学校": "清华大学附属中学望京学校",
  "朝阳外国语": "北京市朝阳外国语学校",
  "北京二中朝阳学校": "北京市第二中学朝阳学校",
  "工大附中": "北京工业大学附属中学",
  "日坛中学": "北京市日坛中学",
  "和平街一中": "北京市和平街第一中学",
  "京源学校": "北京市京源学校",
  "景山远洋校": "北京景山学校远洋分校",
  "北大附石景山": "北京大学附属中学石景山学校",
  "九中": "北京市第九中学",
  "苹果园中学": "首都师范大学附属苹果园中学",
  "古城中学": "北京市古城中学",
  "昌平二中": "北京市昌平区第二中学",
  "昌平一中": "北京市昌平区第一中学",
  "昌平区第一中学": "北京市昌平区第一中学",
  "昌平区第二中学": "北京市昌平区第二中学",
  "师大二附未来城学校": "北京师范大学第二附属中学未来科技城学校",
  "师大二附中未来城学校": "北京师范大学第二附属中学未来科技城学校",
  "清华附昌平": "清华大学附属中学昌平学校",
  "161回龙观中学": "北京市第一六一中学回龙观学校",
  "首师附昌平校": "首都师范大学附属中学昌平学校",
  "亦庄实验中学": "北京亦庄实验中学",
  "顺义一中": "北京市顺义区第一中学",
  "杨镇一中": "北京市顺义区杨镇第一中学",
  "北京四中顺义校": "北京市第四中学顺义分校",
  "北京十二中": "北京市第十二中学",
  "丰台二中": "北京市丰台区第二中学",
  "北京一六一中学": "北京市第一六一中学",
  "北师大二附": "北京师范大学第二附属中学",
  "回龙观育新": "首都师范大学附属回龙观育新学校",
  "首师大附中昌平学校": "首都师范大学附属中学昌平学校",
  "北师大二附中未来科学城学校": "北京师范大学第二附属中学未来科技城学校",
  "北师大昌平附属学校": "北京师范大学昌平附属学校",
  "清华附昌平学校": "清华大学附属中学昌平学校",
  "兴华中学": "北京市大兴区兴华中学",
  "清华附中大兴校": "清华大学附属中学大兴学校",
  "清华附中大兴校(原新源学校)": "清华大学附属中学大兴学校",
  "怀柔一中": "北京市怀柔区第一中学",
  "一零一中学怀柔校": "北京市第一〇一中学怀柔分校",
  "延庆一中": "北京市延庆区第一中学",
  "人大附经开学校": "人大附中北京经济技术开发区学校",
  "景山学校远洋校": "北京景山学校远洋分校",
  "北京九中": "北京市第九中学",
  "首师大附苹果园中学": "首都师范大学附属苹果园中学",
  "永乐店中学": "北京市通州区永乐店中学",
  "运河中学": "北京市通州区运河中学",
  "北中传媒": "中国传媒大学附属中学（北京市第九十四中学）",
  "八十中睿德校": "北京市第八十中学睿德分校",
  "海淀进修实验学校": "北京市海淀区教师进修学校附属实验学校",
  "北京十九中": "北京市第十九中学",
  "顺义牛栏山第一中学": "北京市顺义牛栏山第一中学",
  "北京一零一中大兴校": "北京一零一中大兴分校",
  "大兴区第一中学": "北京市大兴区第一中学",
  "人大附通州校区": "中国人民大学附属中学通州校区",
  "北京市十一学校顺义学校": "北京师范大学附属实验中学顺义学校",
};

function normalizeSchoolName(raw) {
  const name = raw
    .replace(/\s+/g, "")
    .replace(/（.*?）|\(.*?\)/g, "")
    .trim();
  if (!name) return null;
  if (OFFICIAL_ALIASES[name]) return OFFICIAL_ALIASES[name];
  if (ALIAS_TO_OFFICIAL[name]) return ALIAS_TO_OFFICIAL[name];
  if (name.startsWith("北京市") || name.startsWith("北京")) return name;
  if (name.includes("中学") || name.includes("学校")) return `北京市${name.replace(/^北京/, "")}`;
  return name;
}

function parseScoreText(text) {
  const m = String(text).replace(/\s+/g, "").match(/(\d{3})/);
  return m ? Number(m[1]) : NaN;
}

function stripHtml(html) {
  return html
    .replace(/&nbsp;/g, " ")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]+>/g, "|")
    .replace(/\|+/g, "|")
    .replace(/分/g, "")
    .trim();
}

function parseHtmlTableRows(html) {
  return (html.match(/<tr[^>]*>[\s\S]*?<\/tr>/gi) || []).map(stripHtml);
}

function isHeaderCell(label) {
  return (
    !label ||
    label === "序号" ||
    label === "学校" ||
    label === "学校名称" ||
    label.includes("序号") && label.length <= 4 ||
    label.includes("录取数线") ||
    label.includes("录取分数线") ||
    label.includes("对应区排名") ||
    label.includes("总510") ||
    label.includes("总670")
  );
}

function parseHaidianCompare(html) {
  const schools = {};
  const rows = parseHtmlTableRows(html);
  for (const row of rows) {
    const cells = row.split("|").map((c) => c.trim()).filter(Boolean);
    if (cells.length < 5) continue;
    if (isHeaderCell(cells[0])) continue;
    const official = normalizeSchoolName(cells[0]);
    if (!official) continue;
    const y2025 = Number(cells[1]);
    const r2025 = Number(cells[2]);
    const y2024 = Number(cells[3]);
    const r2024 = Number(cells[4]);
    if (!y2025 || !y2024) continue;
    schools[official] = schools[official] || {};
    schools[official][2025] = [y2025, r2025];
    schools[official][2024] = [y2024, r2024];
  }
  return schools;
}

function parseSimple2024(html) {
  const schools = {};
  const rows = parseHtmlTableRows(html);
  for (const row of rows) {
    const cells = row.split("|").map((c) => c.trim()).filter(Boolean);
    if (cells.length < 3) continue;
    let nameIdx = 0;
    let scoreIdx = 1;
    let rankIdx = 2;
    if (/^\d+$/.test(cells[0]) && cells.length >= 4) {
      nameIdx = 1;
      scoreIdx = 2;
      rankIdx = 3;
    } else if (
      (cells[0].includes("区") || cells[0] === "经开区" || cells[0] === "石景山") &&
      cells.length >= 4
    ) {
      nameIdx = 1;
      scoreIdx = 2;
      rankIdx = 3;
    }
    const label = cells[nameIdx];
    if (isHeaderCell(label)) continue;
    const official = normalizeSchoolName(label);
    const score = Number(cells[scoreIdx]);
    const rank = Number(cells[rankIdx]);
    if (!official || !score) continue;
    schools[official] = schools[official] || {};
    schools[official][2024] = [score, rank];
  }
  return schools;
}

function parseGaokzxDetailed2024(html) {
  const schools = {};
  let currentSchool = null;
  for (const row of parseHtmlTableRows(html)) {
    const cells = row.split("|").map((c) => c.trim()).filter(Boolean);
    if (!cells.length) continue;
    if (cells.some((c) => c.includes("序号") || c.includes("专业名称"))) continue;

    if (cells.length >= 5 && /^\d+$/.test(cells[0])) {
      currentSchool = cells[1].replace(/\s+/g, "");
      const major = cells[2];
      const score = Number(cells[3]);
      const rank = Number(cells[4]);
      if (!currentSchool || !score) continue;
      const official = normalizeSchoolName(currentSchool);
      if (!official) continue;
      schools[official] = schools[official] || {};
      if (!schools[official][2024] || major.includes("普通")) {
        schools[official][2024] = [score, rank];
      }
      continue;
    }

    if (cells.length >= 3 && currentSchool && cells[0].includes("班")) {
      const major = cells[0];
      const score = Number(cells[1]);
      const rank = Number(cells[2]);
      if (!score) continue;
      const official = normalizeSchoolName(currentSchool);
      if (!official) continue;
      schools[official] = schools[official] || {};
      if (!schools[official][2024] || major.includes("普通")) {
        schools[official][2024] = [score, rank];
      }
    }
  }
  return schools;
}

function parseDistrictTable(html) {
  const schools = {};
  for (const row of parseHtmlTableRows(html)) {
    const cells = row.split("|").map((c) => c.trim()).filter(Boolean);
    if (cells.length < 3) continue;

    let label;
    let score;
    let rank;

    if (
      cells.length >= 4 &&
      (cells[0].includes("区") || cells[0] === "石景山" || cells[0] === "经开区")
    ) {
      label = cells[1];
      score = Number(cells[2]);
      rank = Number(cells[3]);
    } else if (cells.length >= 3 && !/^\d+$/.test(cells[0])) {
      label = cells[0];
      score = Number(cells[1]);
      rank = Number(cells[2]);
    } else {
      continue;
    }

    if (isHeaderCell(label) || label.includes("区排名")) continue;
    const official = normalizeSchoolName(label);
    if (!official || !score) continue;
    schools[official] = schools[official] || {};
    schools[official][2024] = [score, rank];
  }
  return schools;
}

function parseRateTable(html) {
  const schools = {};
  for (const row of parseHtmlTableRows(html)) {
    const cells = row.split("|").map((c) => c.trim()).filter(Boolean);
    if (cells.length < 4) continue;
    if (cells[0] === "区" || cells[0].includes("录取率")) continue;

    const isDistrictRow =
      cells[0].includes("区") || cells[0] === "经开区" || cells[0] === "石景山";
    if (!isDistrictRow) continue;

    const label = cells[1];
    const score = parseScoreText(cells[2]);
    const rank = Number(cells[3]);
    if (isHeaderCell(label) || !score) continue;

    const official = normalizeSchoolName(label);
    if (!official) continue;
    schools[official] = schools[official] || {};
    schools[official][2024] = [score, rank];
  }
  return schools;
}

function parseDistrict2025(html) {
  const schools = {};
  for (const row of parseHtmlTableRows(html)) {
    const cells = row.split("|").map((c) => c.trim()).filter(Boolean);
    if (cells.length < 5) continue;
    if (cells[0] === "区" || cells[0].includes("学校")) continue;

    const label = cells[1];
    const major = cells[2];
    const score = Number(cells[3]);
    const rank = Number(cells[4]);
    if (isHeaderCell(label) || !score) continue;
    if (major && !major.includes("普通") && major.includes("班")) continue;

    const official = normalizeSchoolName(label);
    if (!official) continue;
    schools[official] = schools[official] || {};
    schools[official][2025] = [score, rank];
  }
  return schools;
}

async function fetchSource(source) {
  const res = await fetch(source.url, {
    headers: { "User-Agent": "BeijingZhongkaoGuide/1.0 (data-sync)" },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const html = await res.text();
  if (source.parser === "haidianCompare") return parseHaidianCompare(html);
  if (source.parser === "simple2024") return parseSimple2024(html);
  if (source.parser === "gaokzxDetailed2024") return parseGaokzxDetailed2024(html);
  if (source.parser === "districtTable") return parseDistrictTable(html);
  if (source.parser === "rateTable") return parseRateTable(html);
  if (source.parser === "district2025") return parseDistrict2025(html);
  return {};
}

function mergeSchools(target, incoming) {
  for (const [name, years] of Object.entries(incoming)) {
    target[name] = target[name] || {};
    for (const [year, vals] of Object.entries(years)) {
      target[name][year] = vals;
    }
  }
}

async function runFetch({ existingSchools = {} } = {}) {
  const merged = { ...existingSchools };
  const succeeded = [];
  const failed = [];

  for (const source of SOURCES) {
    try {
      const parsed = await fetchSource(source);
      const count = Object.keys(parsed).length;
      if (count === 0) throw new Error("未解析到学校数据");
      mergeSchools(merged, parsed);
      succeeded.push({ id: source.id, url: source.url, count, district: source.district });
      console.log(`✓ ${source.id}: ${count} 所学校`);
    } catch (err) {
      failed.push({ id: source.id, error: String(err.message || err) });
      console.warn(`✗ ${source.id}: ${err.message || err}`);
    }
  }

  return {
    fetchedAt: new Date().toISOString(),
    sources: succeeded,
    failed,
    schools: merged,
  };
}

export { runFetch, normalizeSchoolName, SOURCES };
