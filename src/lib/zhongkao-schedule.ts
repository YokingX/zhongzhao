/**
 * 北京中考文化课日程（相对固定：每年约 6 月下旬，通常两天）。
 * 具体以考试院当年通知为准；此处仅用于首页倒计时展示。
 */

export const ZHONGKAO_EXAM_MONTH = 6; // 1–12
export const ZHONGKAO_EXAM_START_DAY = 24;
export const ZHONGKAO_EXAM_DAYS = 2; // 如 24–25 日

export type ZhongkaoHeroStatus =
  | {
      phase: "countdown";
      /** 距离考试开始还有几天 */
      days: number;
      /** 是否指向明年（当年已考完） */
      nextYear: boolean;
      title: string;
      subtitle: string;
    }
  | {
      phase: "ongoing";
      title: string;
      subtitle: string;
    };

function shanghaiYmd(date = new Date()): { y: number; m: number; d: number } {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Shanghai",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const get = (type: string) =>
    Number(parts.find((p) => p.type === type)?.value ?? 0);
  return { y: get("year"), m: get("month"), d: get("day") };
}

/** 把上海日历日表示成可比较的整数 YYYYMMDD */
function ymdKey(y: number, m: number, d: number): number {
  return y * 10000 + m * 100 + d;
}

function daysBetween(from: { y: number; m: number; d: number }, to: { y: number; m: number; d: number }): number {
  const a = Date.UTC(from.y, from.m - 1, from.d);
  const b = Date.UTC(to.y, to.m - 1, to.d);
  return Math.round((b - a) / (1000 * 60 * 60 * 24));
}

function examWindowForYear(year: number) {
  const start = {
    y: year,
    m: ZHONGKAO_EXAM_MONTH,
    d: ZHONGKAO_EXAM_START_DAY,
  };
  const endDay = ZHONGKAO_EXAM_START_DAY + ZHONGKAO_EXAM_DAYS - 1;
  // 不跨月（6 月 24+1 仍在 6 月）
  const end = { y: year, m: ZHONGKAO_EXAM_MONTH, d: endDay };
  return { start, end };
}

/** 首页 Hero：中考未开始倒计时 / 考试中祝福 / 考后滚到下次 */
export function getZhongkaoHeroStatus(now = new Date()): ZhongkaoHeroStatus {
  const today = shanghaiYmd(now);
  const todayKey = ymdKey(today.y, today.m, today.d);

  const thisYear = examWindowForYear(today.y);
  const startKey = ymdKey(thisYear.start.y, thisYear.start.m, thisYear.start.d);
  const endKey = ymdKey(thisYear.end.y, thisYear.end.m, thisYear.end.d);

  if (todayKey < startKey) {
    const days = daysBetween(today, thisYear.start);
    return {
      phase: "countdown",
      days,
      nextYear: false,
      title: String(days),
      subtitle: "距离中考（天）",
    };
  }

  if (todayKey <= endKey) {
    return {
      phase: "ongoing",
      title: "正在中考",
      subtitle: "祝考生金榜题名",
    };
  }

  const next = examWindowForYear(today.y + 1);
  const days = daysBetween(today, next.start);
  return {
    phase: "countdown",
    days,
    nextYear: true,
    title: String(days),
    subtitle: "距离下次中考（天）",
  };
}
