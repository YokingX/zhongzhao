import { sqliteTable, text, integer, uniqueIndex } from "drizzle-orm/sqlite-core";

export const schools = sqliteTable("schools", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  shortName: text("short_name").notNull(),
  district: text("district").notNull(),
  type: text("type").notNull(),
  description: text("description").notNull(),
  features: text("features").notNull().default("[]"),
  admissionTypes: text("admission_types").notNull().default("[]"),
  isKeySchool: integer("is_key_school", { mode: "boolean" }).default(false),
  address: text("address"),
  website: text("website"),
  updatedAt: text("updated_at"),
});

export const scoreLines = sqliteTable(
  "score_lines",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    schoolId: text("school_id")
      .notNull()
      .references(() => schools.id, { onDelete: "cascade" }),
    year: integer("year").notNull(),
    batch: text("batch").notNull(),
    minScore: integer("min_score").notNull(),
    maxScore: integer("max_score"),
    districtRank: integer("district_rank"),
    note: text("note"),
    source: text("source"),
  },
  (table) => [
    uniqueIndex("score_lines_school_year_batch").on(
      table.schoolId,
      table.year,
      table.batch
    ),
  ]
);

export const syncLogs = sqliteTable("sync_logs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  startedAt: text("started_at").notNull(),
  finishedAt: text("finished_at"),
  status: text("status").notNull(),
  schoolsCount: integer("schools_count"),
  schoolsWithScores: integer("schools_with_scores"),
  fetchedCount: integer("fetched_count"),
  sources: text("sources"),
  errors: text("errors"),
});

export const fetchSources = sqliteTable("fetch_sources", {
  id: text("id").primaryKey(),
  url: text("url").notNull(),
  district: text("district"),
  lastSuccessAt: text("last_success_at"),
  lastCount: integer("last_count"),
  lastError: text("last_error"),
});
