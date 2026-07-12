import { eq } from "drizzle-orm";
import type { School, ScoreLine, AdmissionBatch, SchoolType } from "@/types/school";
import { getDb } from "./client";
import { schools as schoolsTable, scoreLines as scoreLinesTable } from "./schema";

function parseJsonArray<T>(value: string | null | undefined, fallback: T[] = []): T[] {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T[];
  } catch {
    return fallback;
  }
}

function rowToSchool(
  row: typeof schoolsTable.$inferSelect,
  lines: (typeof scoreLinesTable.$inferSelect)[]
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

export function queryAllSchools(): School[] {
  const db = getDb();
  const schoolRows = db.select().from(schoolsTable).all();
  const lineRows = db.select().from(scoreLinesTable).all();

  const linesBySchool = new Map<string, (typeof scoreLinesTable.$inferSelect)[]>();
  for (const line of lineRows) {
    const list = linesBySchool.get(line.schoolId) || [];
    list.push(line);
    linesBySchool.set(line.schoolId, list);
  }

  return schoolRows.map((row) => rowToSchool(row, linesBySchool.get(row.id) || []));
}

export function querySchoolById(id: string): School | undefined {
  const db = getDb();
  const row = db.select().from(schoolsTable).where(eq(schoolsTable.id, id)).get();
  if (!row) return undefined;
  const lines = db
    .select()
    .from(scoreLinesTable)
    .where(eq(scoreLinesTable.schoolId, id))
    .all();
  return rowToSchool(row, lines);
}

export function hasSchoolData(): boolean {
  const db = getDb();
  const row = db.select({ id: schoolsTable.id }).from(schoolsTable).limit(1).get();
  return Boolean(row);
}
