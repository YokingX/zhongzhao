import type { TimelineEvent } from "@/types/school";

/** 2026 中招关键节点（以考试院当年通知为准，供日历页展示） */
export const TIMELINE_EVENTS_2026: TimelineEvent[] = [
  {
    id: "2026-register",
    date: "2026-03-01",
    title: "中考报名（参考）",
    description: "各区组织中考报名与资格审核，具体时间以本区教委/考试中心通知为准。",
    category: "报名",
  },
  {
    id: "2026-physical",
    date: "2026-04-15",
    title: "体育与实验考查（参考）",
    description: "体育现场考试、实验操作等考查一般安排在 4–5 月，请关注本区通知。",
    category: "考试",
  },
  {
    id: "2026-exam",
    date: "2026-06-24",
    title: "文化课考试",
    description: "预计 6 月 24–25 日举行文化课考试（以当年考试院公告为准）。",
    category: "考试",
  },
  {
    id: "2026-score",
    date: "2026-07-09",
    title: "成绩公布",
    description: "知分后即可对照区排名与近年统招线，开始整理冲稳保志愿思路。",
    category: "其他",
  },
  {
    id: "2026-volunteer-start",
    date: "2026-07-13",
    title: "网上志愿填报开始",
    description: "提前招生、指标分配、统一招生分阶段填报，请按时登录官方系统。",
    category: "志愿",
  },
  {
    id: "2026-volunteer-end",
    date: "2026-07-17",
    title: "志愿填报截止",
    description: "截止前务必核对志愿顺序与资格条件；逾期一般无法补报。",
    category: "志愿",
  },
  {
    id: "2026-admit-early",
    date: "2026-07-20",
    title: "提前招生录取（参考）",
    description: "提前批次录取后通常不再参加后续批次，请关注官方录取查询通道。",
    category: "录取",
  },
  {
    id: "2026-admit-quota",
    date: "2026-07-23",
    title: "指标分配录取（参考）",
    description: "校额到校/市级统筹录取阶段，资格与校内竞争规则以当年简章为准。",
    category: "录取",
  },
  {
    id: "2026-admit-unified",
    date: "2026-07-26",
    title: "统一招生录取（参考）",
    description: "统招批次按志愿顺序与分数录取，结果以考试院/本区查询系统为准。",
    category: "录取",
  },
];

export function getTimelineEvents(): TimelineEvent[] {
  return [...TIMELINE_EVENTS_2026].sort((a, b) => a.date.localeCompare(b.date));
}
