/**
 * SQLite 数据库初始化与数据导入
 */
import fs from "fs";
import path from "path";
import Database from "better-sqlite3";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const DB_DIR = path.join(root, "data");
const DB_PATH = process.env.DATABASE_PATH || path.join(DB_DIR, "zhongzhao.db");

export function getDbPath() {
  return DB_PATH;
}

export function openDb() {
  fs.mkdirSync(DB_DIR, { recursive: true });
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  return db;
}

export function initSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS schools (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      short_name TEXT NOT NULL,
      district TEXT NOT NULL,
      type TEXT NOT NULL,
      description TEXT NOT NULL,
      features TEXT NOT NULL DEFAULT '[]',
      admission_types TEXT NOT NULL DEFAULT '[]',
      is_key_school INTEGER DEFAULT 0,
      address TEXT,
      website TEXT,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS score_lines (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      school_id TEXT NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
      year INTEGER NOT NULL,
      batch TEXT NOT NULL,
      min_score INTEGER NOT NULL,
      max_score INTEGER,
      district_rank INTEGER,
      note TEXT,
      source TEXT,
      UNIQUE(school_id, year, batch)
    );

    CREATE TABLE IF NOT EXISTS sync_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      started_at TEXT NOT NULL,
      finished_at TEXT,
      status TEXT NOT NULL,
      schools_count INTEGER,
      schools_with_scores INTEGER,
      fetched_count INTEGER,
      sources TEXT,
      errors TEXT
    );

    CREATE TABLE IF NOT EXISTS fetch_sources (
      id TEXT PRIMARY KEY,
      url TEXT NOT NULL,
      district TEXT,
      last_success_at TEXT,
      last_count INTEGER,
      last_error TEXT
    );
  `);
}

export function importSchoolsJson(db, schools, { syncedAt } = {}) {
  const now = syncedAt || new Date().toISOString();

  const upsertSchool = db.prepare(`
    INSERT INTO schools (
      id, name, short_name, district, type, description,
      features, admission_types, is_key_school, address, website, updated_at
    ) VALUES (
      @id, @name, @shortName, @district, @type, @description,
      @features, @admissionTypes, @isKeySchool, @address, @website, @updatedAt
    )
    ON CONFLICT(id) DO UPDATE SET
      name = excluded.name,
      short_name = excluded.short_name,
      district = excluded.district,
      type = excluded.type,
      description = excluded.description,
      features = excluded.features,
      admission_types = excluded.admission_types,
      is_key_school = excluded.is_key_school,
      address = excluded.address,
      website = excluded.website,
      updated_at = excluded.updated_at
  `);

  const upsertScore = db.prepare(`
    INSERT INTO score_lines (
      school_id, year, batch, min_score, max_score, district_rank, note, source
    ) VALUES (
      @schoolId, @year, @batch, @minScore, @maxScore, @districtRank, @note, @source
    )
    ON CONFLICT(school_id, year, batch) DO UPDATE SET
      min_score = excluded.min_score,
      max_score = excluded.max_score,
      district_rank = excluded.district_rank,
      note = excluded.note,
      source = excluded.source
  `);

  const deleteScores = db.prepare("DELETE FROM score_lines WHERE school_id = ?");
  const importTx = db.transaction((items) => {
    const incomingIds = new Set();
    for (const school of items) {
      incomingIds.add(school.id);
      upsertSchool.run({
        id: school.id,
        name: school.name,
        shortName: school.shortName,
        district: school.district,
        type: school.type,
        description: school.description,
        features: JSON.stringify(school.features || []),
        admissionTypes: JSON.stringify(school.admissionTypes || []),
        isKeySchool: school.isKeySchool ? 1 : 0,
        address: school.address || null,
        website: school.website || null,
        updatedAt: now,
      });

      deleteScores.run(school.id);
      for (const line of school.scoreLines || []) {
        upsertScore.run({
          schoolId: school.id,
          year: line.year,
          batch: line.batch,
          minScore: line.minScore,
          maxScore: line.maxScore ?? null,
          districtRank: line.districtRank ?? null,
          note: line.note ?? null,
          source: line.source ?? null,
        });
      }
    }

    const existing = db.prepare("SELECT id FROM schools").all();
    const removeSchool = db.prepare("DELETE FROM schools WHERE id = ?");
    for (const row of existing) {
      if (!incomingIds.has(row.id)) {
        removeSchool.run(row.id);
      }
    }
  });

  importTx(schools);
}

export function logSync(db, payload) {
  db.prepare(`
    INSERT INTO sync_logs (
      started_at, finished_at, status, schools_count, schools_with_scores,
      fetched_count, sources, errors
    ) VALUES (
      @startedAt, @finishedAt, @status, @schoolsCount, @schoolsWithScores,
      @fetchedCount, @sources, @errors
    )
  `).run({
    startedAt: payload.startedAt,
    finishedAt: payload.finishedAt,
    status: payload.status,
    schoolsCount: payload.schoolsCount ?? null,
    schoolsWithScores: payload.schoolsWithScores ?? null,
    fetchedCount: payload.fetchedCount ?? null,
    sources: payload.sources ? JSON.stringify(payload.sources) : null,
    errors: payload.errors ? JSON.stringify(payload.errors) : null,
  });
}

export function updateFetchSources(db, sources = [], failed = []) {
  const upsert = db.prepare(`
    INSERT INTO fetch_sources (id, url, district, last_success_at, last_count, last_error)
    VALUES (@id, @url, @district, @lastSuccessAt, @lastCount, @lastError)
    ON CONFLICT(id) DO UPDATE SET
      url = excluded.url,
      district = excluded.district,
      last_success_at = excluded.last_success_at,
      last_count = excluded.last_count,
      last_error = excluded.last_error
  `);

  const failedMap = Object.fromEntries(failed.map((f) => [f.id, f.error]));
  for (const source of sources) {
    upsert.run({
      id: source.id,
      url: source.url,
      district: source.district || null,
      lastSuccessAt: new Date().toISOString(),
      lastCount: source.count ?? null,
      lastError: null,
    });
  }
  for (const item of failed) {
    const existing = db.prepare("SELECT url, district FROM fetch_sources WHERE id = ?").get(item.id);
    upsert.run({
      id: item.id,
      url: existing?.url || "",
      district: existing?.district || null,
      lastSuccessAt: null,
      lastCount: null,
      lastError: item.error || String(item),
    });
  }
}

export function getDbStats(db) {
  const schoolsCount = db.prepare("SELECT COUNT(*) AS c FROM schools").get().c;
  const withScores = db
    .prepare(
      `SELECT COUNT(DISTINCT school_id) AS c FROM score_lines`
    )
    .get().c;
  const scoreCount = db.prepare("SELECT COUNT(*) AS c FROM score_lines").get().c;
  const lastSync = db
    .prepare("SELECT * FROM sync_logs ORDER BY id DESC LIMIT 1")
    .get();
  return { schoolsCount, withScores, scoreCount, lastSync };
}
