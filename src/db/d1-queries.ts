import { drizzle } from "drizzle-orm/d1";
import type { School, ScoreLine, AdmissionBatch, SchoolType } from "@/types/school";
import * as schema from "./schema";

function parseJsonArray<T>(value: string | null | undefined, fallback: T[] = []): T[] {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T[];
  } catch {
    return fallback;
  }
}

function rowToSchool(
  row: typeof schema.schools.$inferSelect,
  lines: (typeof schema.scoreLines.$inferSelect)[]
): School {
  return {
    id: row.id,
    name: row.name,
    shortName: row.shortName,
    district: row.district,
    type: row.type as SchoolType,
    description: row.description,
    features: parseJsonArray<string>(row.features),
    admissionTypes: parseJsonArray<AdmissionBatch>(row.admissionTypes),
    isKeySchool: row.isKeySchool ?? false,
    address: row.address ?? undefined,
    website: row.website ?? undefined,
    scoreLines: lines
      .map(
        (line): ScoreLine => ({
          year: line.year,
          batch: line.batch as AdmissionBatch,
          minScore: line.minScore,
          maxScore: line.maxScore ?? undefined,
          districtRank: line.districtRank ?? undefined,
          note: line.note ?? undefined,
          source: line.source ?? undefined,
        })
      )
      .sort((a, b) => b.year - a.year || b.minScore - a.minScore),
  };
}

export async function queryAllSchoolsD1(d1: D1Database): Promise<School[]> {
  const db = drizzle(d1, { schema });
  const schoolRows = await db.select().from(schema.schools).all();
  const lineRows = await db.select().from(schema.scoreLines).all();

  const linesBySchool = new Map<string, (typeof schema.scoreLines.$inferSelect)[]>();
  for (const line of lineRows) {
    const list = linesBySchool.get(line.schoolId) || [];
    list.push(line);
    linesBySchool.set(line.schoolId, list);
  }

  return schoolRows.map((row) => rowToSchool(row, linesBySchool.get(row.id) || []));
}
