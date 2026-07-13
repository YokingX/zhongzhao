/**
 * 抓取核心逻辑（无文件系统依赖，可在 Cloudflare Worker 中使用）
 */
import { FETCH_NAME_ALIASES } from "./score-aliases.mjs";

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
    id: "dongcheng-24-25",
    url: "https://www.zhongkaobj.cn/lqfsx/dcq/2025081311825.html",
    district: "东城",
    parser: "haidianCompare",
  },
  {
    id: "dongcheng-2024",
    url: "https://www.zhongkaobj.cn/lqfsx/dcq/202410212391.html",
    district: "东城",
    parser: "simple2024",
  },
  {
    id: "fengtai-2025",
    url: "https://www.zhongkaobj.cn/lqfsx/ftq/2025080111680.html",
    district: "丰台",
    parser: "singleDistrict2025",
  },
  {
    id: "outer-districts-2024-ranks",
    url: "https://www.zhongkaobj.cn/lqfsx/qitaqu/202409251260.html",
    district: "外围",
    parser: "outerThreeYear2024",
  },
  {
    id: "tongzhou-2024-bj",
    url: "https://www.zhongkaobj.cn/lqfsx/qitaqu/202410222442.html",
    district: "通州",
    parser: "numberedDistrict2024",
  },
  {
    id: "daxing-2024-bj",
    url: "https://www.zhongkaobj.cn/lqfsx/qitaqu/202410222463.html",
    district: "大兴",
    parser: "districtTable",
  },
  {
    id: "jingkai-2024-bj",
    url: "https://www.zhongkaobj.cn/lqfsx/qitaqu/202410222476.html",
    district: "经开",
    parser: "districtTable",
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

function isValidSchoolLabel(label) {
  if (!label || isHeaderCell(label)) return false;
  if (/^\d{2,3}$/.test(label)) return false;
  if (/实验班$|^创新班|^科学班|^人文班|^砺学班/.test(label)) return false;
  if (/^莲葩园\d*$/.test(label)) return false;
  if (label.includes("职业学校")) return false;
  if (label.includes("对海淀招生") || label.includes("&mdash;")) return false;
  return true;
}

function normalizeSchoolName(raw) {
  const name = raw
    .replace(/&mdash;|&nbsp;/gi, "")
    .replace(/\s+/g, "")
    .replace(/（.*?）|\(.*?\)/g, "")
    .trim();
  if (!name || !isValidSchoolLabel(name)) return null;
  if (FETCH_NAME_ALIASES[name]) return FETCH_NAME_ALIASES[name];

  const numbered = name.match(/^北京(?!市)(第)?([一二三四五六七八九十百零〇两\d]+)(中学|中)$/);
  if (numbered) return `北京市第${numbered[2]}中学`;

  if (name.startsWith("北京市")) return name;

  if (name.startsWith("北京")) {
    const rest = name.slice(2);
    const universityLike = /大学|师范|传媒|地质|农业|外国语|实验|教科|民族|科学|航空航天|交通|理工|工业|化工|财经|经贸|中医|电影|舞蹈|体育|政法|语言|第二外国语|金融街|景山|汇文|陈经纶|钱学森|赵登禹|牛栏山|潞河|运河|永乐店|张家湾|良乡|牛栏山|育新|翠微|志清|建华|八一|育英|中关村|人朝|十一学校|一零一|一〇一|零一|101/.test(
      rest
    );
    if (!universityLike && (rest.includes("中学") || rest.includes("学校"))) {
      return `北京市${rest}`;
    }
    return name;
  }

  if (name.includes("中学") || name.includes("学校")) return `北京市${name}`;
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
    if (!isValidSchoolLabel(cells[0])) continue;
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

function parseSingleDistrict2025(html) {
  const schools = {};
  for (const row of parseHtmlTableRows(html)) {
    const cells = row.split("|").map((c) => c.trim()).filter(Boolean);
    if (cells.length < 4) continue;

    let label;
    let major;
    let score;
    let rank;

    if (cells.length >= 5 && /^\d{2}$/.test(cells[1])) {
      label = cells[0];
      major = cells[2];
      score = Number(cells[3]);
      rank = Number(cells[4]);
    } else if (cells.length >= 3) {
      label = cells[0];
      score = Number(cells[1]);
      rank = Number(cells[2]);
    } else {
      continue;
    }

    if (isHeaderCell(label) || !score) continue;
    if (major && !major.includes("普通") && major.includes("班")) continue;

    const official = normalizeSchoolName(label);
    if (!official) continue;
    schools[official] = schools[official] || {};
    schools[official][2025] = [score, rank];
  }
  return schools;
}

function parseDistrictYearCompare(html) {
  const schools = {};
  for (const row of parseHtmlTableRows(html)) {
    const cells = row.split("|").map((c) => c.trim()).filter(Boolean);
    if (cells.length < 3) continue;
    if (cells[0].includes("城区") || cells[0].includes("录取分数")) continue;

    let label;
    let y2024;
    let y2025;

    if (
      cells.length >= 4 &&
      (cells[0].includes("区") || cells[0] === "通州" || cells[0] === "怀柔")
    ) {
      label = cells[1];
      y2024 = parseScoreOnly(cells[2]);
      y2025 = parseScoreOnly(cells[3]);
    } else if (cells.length >= 3) {
      label = cells[0];
      y2024 = parseScoreOnly(cells[1]);
      y2025 = parseScoreOnly(cells[2]);
    } else {
      continue;
    }

    if (isHeaderCell(label) || !y2024 || !y2025) continue;

    const official = normalizeSchoolName(label);
    if (!official) continue;
    schools[official] = schools[official] || {};
    if (!schools[official][2024]) schools[official][2024] = [y2024, null];
    if (!schools[official][2025]) schools[official][2025] = [y2025, null];
  }
  return schools;
}

function parseScoreOnly(text) {
  const m = String(text).replace(/\s+/g, "").match(/(\d{3})/);
  return m ? Number(m[1]) : NaN;
}

const OUTER_DISTRICT_MARKERS = [
  "区",
  "石景山",
  "顺义",
  "房山",
  "门头沟",
  "怀柔",
  "经开",
];

function parseOuterThreeYear2024(html) {
  const schools = {};
  for (const row of parseHtmlTableRows(html)) {
    const cells = row.split("|").map((c) => c.trim()).filter(Boolean);
    if (cells.length < 3) continue;
    if (
      cells.some(
        (c) =>
          c.includes("近三年") ||
          c.includes("所在区") ||
          (c.includes("录取") && c.includes("排名") && c.length < 12)
      )
    ) {
      continue;
    }

    const isDistrictRow = OUTER_DISTRICT_MARKERS.some(
      (m) => cells[0] === m || cells[0].includes(m)
    );

    let label;
    let scoreRaw;
    let rankRaw;

    if (isDistrictRow && cells.length >= 5) {
      label = cells[1];
      scoreRaw = cells[2];
      rankRaw = cells[4];
    } else if (!/^\d+$/.test(cells[0]) && cells.length >= 4) {
      label = cells[0];
      scoreRaw = cells[1];
      rankRaw = cells[3];
    } else {
      continue;
    }

    if (isHeaderCell(label)) continue;
    const score = parseScoreOnly(scoreRaw);
    const rankMatch = String(rankRaw || "").match(/(\d+)/);
    const rank = rankMatch ? Number(rankMatch[1]) : null;
    if (!score) continue;

    const official = normalizeSchoolName(label);
    if (!official) continue;
    schools[official] = schools[official] || {};
    schools[official][2024] = [score, rank];
  }
  return schools;
}

function parseNumberedDistrict2024(html) {
  const schools = {};
  for (const row of parseHtmlTableRows(html)) {
    const cells = row.split("|").map((c) => c.trim()).filter(Boolean);
    if (cells.length < 4) continue;
    if (!/^\d+$/.test(cells[0])) continue;

    const label = cells[1];
    const score = parseScoreOnly(cells[2]);
    const rank = Number(String(cells[3]).match(/(\d+)/)?.[1]);
    if (isHeaderCell(label) || !score) continue;

    const official = normalizeSchoolName(label);
    if (!official) continue;
    schools[official] = schools[official] || {};
    schools[official][2024] = [score, Number.isNaN(rank) ? null : rank];
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
  if (source.parser === "singleDistrict2025") return parseSingleDistrict2025(html);
  if (source.parser === "districtYearCompare") return parseDistrictYearCompare(html);
  if (source.parser === "outerThreeYear2024") return parseOuterThreeYear2024(html);
  if (source.parser === "numberedDistrict2024") return parseNumberedDistrict2024(html);
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
