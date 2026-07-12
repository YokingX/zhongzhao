import { pinyin } from "pinyin-pro";

const initialsCache = new Map<string, string>();

/** 提取中文文本的拼音首字母（小写，无分隔） */
export function getPinyinInitials(text: string): string {
  const cached = initialsCache.get(text);
  if (cached) return cached;

  const initials = pinyin(text, { pattern: "first", toneType: "none", type: "array" })
    .join("")
    .toLowerCase()
    .replace(/[^a-z]/g, "");

  initialsCache.set(text, initials);
  return initials;
}

/** 判断查询词是否匹配学校名称（含拼音首字母） */
export function matchesSchoolQuery(
  query: string,
  fields: { name: string; shortName: string; district: string }
): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;

  const haystacks = [
    fields.name.toLowerCase(),
    fields.shortName.toLowerCase(),
    fields.district.toLowerCase(),
    getPinyinInitials(fields.name),
    getPinyinInitials(fields.shortName),
  ];

  return haystacks.some((h) => h.includes(q));
}
