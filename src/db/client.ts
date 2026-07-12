import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import path from "path";
import fs from "fs";
import * as schema from "./schema";

const DB_DIR = path.join(process.cwd(), "data");
const DB_PATH = process.env.DATABASE_PATH || path.join(DB_DIR, "zhongzhao.db");

let sqlite: Database.Database | null = null;
let db: ReturnType<typeof drizzle<typeof schema>> | null = null;

export function getDbPath() {
  return DB_PATH;
}

export function getSqlite() {
  if (!sqlite) {
    fs.mkdirSync(DB_DIR, { recursive: true });
    sqlite = new Database(DB_PATH);
    sqlite.pragma("journal_mode = WAL");
    sqlite.pragma("foreign_keys = ON");
  }
  return sqlite;
}

export function getDb() {
  if (!db) {
    db = drizzle(getSqlite(), { schema });
  }
  return db;
}

export function closeDb() {
  if (sqlite) {
    sqlite.close();
    sqlite = null;
    db = null;
  }
}
