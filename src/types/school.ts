export type SchoolType = "示范" | "普通公办" | "民办" | "国际部" | "贯通";
export type AdmissionBatch = "提前招生" | "指标分配" | "统一招生";

export interface ScoreLine {
  year: number;
  batch: AdmissionBatch;
  minScore: number;
  maxScore?: number;
  districtRank?: number;
  note?: string;
  source?: string;
}

export const SCORE_SCALES: Record<number, number> = {
  2022: 660,
  2023: 660,
  2024: 670,
  2025: 510,
};

export interface School {
  id: string;
  name: string;
  shortName: string;
  district: string;
  type: SchoolType;
  address?: string;
  website?: string;
  description: string;
  features: string[];
  admissionTypes: AdmissionBatch[];
  scoreLines: ScoreLine[];
  isKeySchool?: boolean;
}

export interface TimelineEvent {
  id: string;
  date: string;
  title: string;
  description: string;
  category: "报名" | "考试" | "志愿" | "录取" | "其他";
}

export interface PolicyMeta {
  slug: string;
  title: string;
  description: string;
  date: string;
  category: string;
}

export const BEIJING_DISTRICTS = [
  "东城", "西城", "朝阳", "海淀", "丰台", "石景山",
  "通州", "顺义", "昌平", "大兴", "房山", "门头沟",
  "怀柔", "平谷", "密云", "延庆",
] as const;

export const SCHOOL_TYPES: SchoolType[] = [
  "示范", "普通公办", "民办", "国际部", "贯通",
];

export const ADMISSION_BATCHES: AdmissionBatch[] = [
  "提前招生", "指标分配", "统一招生",
];
