/** 学校对比：最多对比 3 所，通过 URL ?ids=a,b,c 传递 */

export const MAX_COMPARE_SCHOOLS = 3;

export function parseCompareIds(raw: string | string[] | undefined): string[] {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value?.trim()) return [];
  const seen = new Set<string>();
  const ids: string[] = [];
  for (const part of value.split(",")) {
    const id = part.trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
    if (ids.length >= MAX_COMPARE_SCHOOLS) break;
  }
  return ids;
}

export function buildCompareUrl(ids: string[]): string {
  const unique = parseCompareIds(ids.join(","));
  if (unique.length === 0) return "/compare";
  return `/compare?ids=${unique.map(encodeURIComponent).join(",")}`;
}

/** 加入对比：已存在则原样；已满则替换最后一所 */
export function addCompareId(current: string[], id: string): string[] {
  if (current.includes(id)) return current.slice(0, MAX_COMPARE_SCHOOLS);
  if (current.length < MAX_COMPARE_SCHOOLS) return [...current, id];
  return [...current.slice(0, MAX_COMPARE_SCHOOLS - 1), id];
}

export function removeCompareId(current: string[], id: string): string[] {
  return current.filter((x) => x !== id);
}
