/** 解析并规范化列表页 URL 查询参数 */

export function firstParam(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) return value[0];
  return value;
}

export function normalizeDistrict(value: string | undefined): string | undefined {
  const raw = value?.trim();
  if (!raw || raw === "全部") return undefined;
  return raw.replace(/区$/, "");
}

export function parsePage(value: string | undefined, fallback = 1): number {
  const n = Number(firstParam(value));
  if (!Number.isFinite(n) || n < 1) return fallback;
  return Math.floor(n);
}

export function parseOptionalNumber(value: string | undefined): number | undefined {
  const raw = firstParam(value);
  if (raw == null || raw === "") return undefined;
  const n = Number(raw);
  return Number.isFinite(n) ? n : undefined;
}

export function parseBooleanFlag(value: string | undefined): boolean {
  return firstParam(value) === "1";
}
