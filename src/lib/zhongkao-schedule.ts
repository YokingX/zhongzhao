/**
 * 北京中考 / 志愿填报日程（相对固定，以考试院当年通知为准；仅用于首页倒计时）。
 */

export const ZHONGKAO_EXAM_MONTH = 6; // 1–12
export const ZHONGKAO_EXAM_START_DAY = 24;
export const ZHONGKAO_EXAM_DAYS = 2; // 如 24–25 日

/** 网上志愿填报窗口（如 7/13–7/17） */
export const VOLUNTEER_MONTH = 7;
export const VOLUNTEER_START_DAY = 13;
export const VOLUNTEER_END_DAY = 17;

export type HeroPhaseStatus =
  | {
      phase: "countdown";
      days: number;
      nextYear: boolean;
      title: string;
      subtitle: string;
    }
  | {
      phase: "ongoing";
      title: string;
      subtitle: string;
    };

export type ZhongkaoHeroStatus = HeroPhaseStatus;

type Ymd = { y: number; m: number; d: number };

function shanghaiYmd(date = new Date()): Ymd {
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

function ymdKey(y: number, m: number, d: number): number {
  return y * 10000 + m * 100 + d;
}

function daysBetween(from: Ymd, to: Ymd): number {
  const a = Date.UTC(from.y, from.m - 1, from.d);
  const b = Date.UTC(to.y, to.m - 1, to.d);
  return Math.round((b - a) / (1000 * 60 * 60 * 24));
}

function windowStatus(
  today: Ymd,
  start: Ymd,
  end: Ymd,
  nextStart: Ymd,
  labels: {
    before: string;
    duringTitle: string;
    duringSubtitle: string;
    after: string;
  }
): HeroPhaseStatus {
  const todayKey = ymdKey(today.y, today.m, today.d);
  const startKey = ymdKey(start.y, start.m, start.d);
  const endKey = ymdKey(end.y, end.m, end.d);

  if (todayKey < startKey) {
    const days = daysBetween(today, start);
    return {
      phase: "countdown",
      days,
      nextYear: false,
      title: String(days),
      subtitle: labels.before,
    };
  }

  if (todayKey <= endKey) {
    return {
      phase: "ongoing",
      title: labels.duringTitle,
      subtitle: labels.duringSubtitle,
    };
  }

  const days = daysBetween(today, nextStart);
  return {
    phase: "countdown",
    days,
    nextYear: true,
    title: String(days),
    subtitle: labels.after,
  };
}

function examWindowForYear(year: number) {
  return {
    start: { y: year, m: ZHONGKAO_EXAM_MONTH, d: ZHONGKAO_EXAM_START_DAY },
    end: {
      y: year,
      m: ZHONGKAO_EXAM_MONTH,
      d: ZHONGKAO_EXAM_START_DAY + ZHONGKAO_EXAM_DAYS - 1,
    },
  };
}

function volunteerWindowForYear(year: number) {
  return {
    start: { y: year, m: VOLUNTEER_MONTH, d: VOLUNTEER_START_DAY },
    end: { y: year, m: VOLUNTEER_MONTH, d: VOLUNTEER_END_DAY },
  };
}

/** 首页 Hero：中考未开始倒计时 / 考试中祝福 / 考后滚到下次 */
export function getZhongkaoHeroStatus(now = new Date()): ZhongkaoHeroStatus {
  const today = shanghaiYmd(now);
  const thisYear = examWindowForYear(today.y);
  const next = examWindowForYear(today.y + 1);
  return windowStatus(today, thisYear.start, thisYear.end, next.start, {
    before: "距离中考（天）",
    duringTitle: "正在中考",
    duringSubtitle: "祝考生金榜题名",
    after: "距离下次中考（天）",
  });
}

/** 首页 Hero：志愿填报未开始 / 填报中 / 截止后滚到下次 */
export function getVolunteerHeroStatus(now = new Date()): HeroPhaseStatus {
  const today = shanghaiYmd(now);
  const thisYear = volunteerWindowForYear(today.y);
  const next = volunteerWindowForYear(today.y + 1);
  return windowStatus(today, thisYear.start, thisYear.end, next.start, {
    before: "距离志愿填报（天）",
    duringTitle: "正在填报志愿",
    duringSubtitle: "请于截止前完成填报",
    after: "距离下次志愿填报（天）",
  });
}
