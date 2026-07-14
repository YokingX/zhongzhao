import { filterScoreRecords, filterSchools } from "@/lib/schools";
import { SCORE_SCALES } from "@/types/school";
import { STATIC_KNOWLEDGE } from "@/lib/assist/prompt";

export type AssistProfile = {
  score?: number;
  year?: 2024 | 2025;
  district?: string;
};

type ScaleYear = 2024 | 2025;

function to2025Scale(score: number, scaleYear: ScaleYear): number {
  if (scaleYear === 2025) return score;
  return Math.round((score / SCORE_SCALES[2024]) * SCORE_SCALES[2025]);
}

function from2025Scale(score2025: number, scaleYear: ScaleYear): number {
  if (scaleYear === 2025) return score2025;
  return Math.round((score2025 / SCORE_SCALES[2025]) * SCORE_SCALES[2024]);
}

function bandsForScore(score: number, scaleYear: ScaleYear) {
  const score2025 = to2025Scale(score, scaleYear);
  const max = SCORE_SCALES[scaleYear];
  const defs = [
    { label: "冲刺", tip: "略高于估分", lo: score2025 + 10, hi: score2025 + 25 },
    { label: "稳妥", tip: "贴近估分", lo: score2025 - 5, hi: score2025 + 10 },
    { label: "保底", tip: "低于估分约 5–20", lo: score2025 - 20, hi: score2025 - 5 },
    { label: "兜底", tip: "更保守", lo: score2025 - 35, hi: score2025 - 20 },
  ] as const;

  return defs.map((d) => ({
    label: d.label,
    tip: d.tip,
    minScore: Math.max(1, from2025Scale(d.lo, scaleYear)),
    maxScore: Math.min(max, from2025Scale(d.hi, scaleYear)),
  }));
}

/** 从用户话里粗略抽出可能的校名关键词（中文 2–12 字片段） */
function extractSchoolHints(text: string): string[] {
  const hints = new Set<string>();
  const cleaned = text.replace(/[，。！？、；：""''（）()\s]/g, " ");
  for (const part of cleaned.split(" ")) {
    const t = part.trim();
    if (
      t.length >= 2 &&
      t.length <= 12 &&
      /[\u4e00-\u9fff]/.test(t) &&
      !/^(你好|请问|怎么|如何|志愿|填报|分数|区排|统招|校额|到校|批次|指标|提前|保底|冲刺|稳妥|兜底|海淀|西城|东城|朝阳|丰台|我的|我们|孩子|考生)$/.test(
        t
      )
    ) {
      hints.add(t);
    }
  }
  // 「附中」「一中」单独过短，跳过；保留「人大附中」等
  return [...hints].slice(0, 3);
}

export async function buildAssistEvidence(
  profile: AssistProfile,
  lastUserMessage: string
): Promise<string> {
  const parts: string[] = [STATIC_KNOWLEDGE.trim()];
  const year = (profile.year === 2024 ? 2024 : 2025) as ScaleYear;
  const district =
    profile.district && profile.district !== "全部"
      ? profile.district.replace(/区$/, "")
      : undefined;

  if (profile.score && profile.score > 0) {
    parts.push(
      `\n## 用户画像\n估分 ${profile.score} 分（${year} 年 ${SCORE_SCALES[year]} 分制）${district ? ` · 意向区：${district}` : " · 未限定区"}`
    );

    const bands = bandsForScore(profile.score, year);
    const bandBlocks = await Promise.all(
      bands.map(async (band) => {
        const { records, total } = await filterScoreRecords({
          year,
          batch: "统一招生",
          district,
          minScore: band.minScore,
          maxScore: band.maxScore,
          page: 1,
          pageSize: 6,
        });
        const seen = new Set<string>();
        const lines = records
          .filter((r) => {
            if (seen.has(r.schoolId)) return false;
            seen.add(r.schoolId);
            return true;
          })
          .slice(0, 5)
          .map(
            (r) =>
              `- ${r.schoolName}（${r.district}）统招约 ${r.minScore}，区排 ${r.districtRank ?? "—"}${r.schoolId ? `，详情 /schools/${r.schoolId}` : ""}`
          );
        return `### ${band.label} ${band.minScore}–${band.maxScore}（${band.tip}）· 匹配约 ${total} 条\n${lines.length ? lines.join("\n") : "（该区间暂无匹配）"}`;
      })
    );
    parts.push("\n## 按估分匹配的统招学校（参考清单）\n" + bandBlocks.join("\n\n"));
  } else {
    parts.push("\n## 用户画像\n尚未提供估分；请在回答中引导用户填写估分、年份与行政区。");
  }

  const hints = extractSchoolHints(lastUserMessage);
  if (hints.length > 0) {
    const searchBlocks: string[] = [];
    for (const q of hints) {
      const [{ schools }, { records }] = await Promise.all([
        filterSchools({ query: q, page: 1, pageSize: 4 }),
        filterScoreRecords({
          query: q,
          year,
          batch: "统一招生",
          page: 1,
          pageSize: 6,
        }),
      ]);
      if (schools.length) {
        searchBlocks.push(
          `学校库「${q}」：\n` +
            schools
              .map((s) => `- ${s.shortName || s.name}（${s.district}）${s.type} · /schools/${s.id}`)
              .join("\n")
        );
      }
      if (records.length) {
        searchBlocks.push(
          `分数线「${q}」${year} 统招：\n` +
            records
              .slice(0, 5)
              .map(
                (r) =>
                  `- ${r.schoolName}（${r.district}）${r.minScore} 分 · 区排 ${r.districtRank ?? "—"}`
              )
              .join("\n")
        );
      }
    }
    if (searchBlocks.length) {
      parts.push("\n## 根据用户提问检索到的学校/分数\n" + searchBlocks.join("\n\n"));
    }
  }

  parts.push(
    "\n## 回答提醒\n请基于以上资料作答；清单仅为统招最低分区间参考，实际填报请结合招生计划、专业限制、区排名与官方系统。"
  );

  // 控制上下文长度，避免超模型上下文
  const text = parts.join("\n");
  return text.length > 12000 ? text.slice(0, 12000) + "\n…（资料已截断）" : text;
}
