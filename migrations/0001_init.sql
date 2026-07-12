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

CREATE INDEX IF NOT EXISTS idx_schools_district ON schools(district);
CREATE INDEX IF NOT EXISTS idx_score_lines_school ON score_lines(school_id);
CREATE INDEX IF NOT EXISTS idx_score_lines_year ON score_lines(year);
