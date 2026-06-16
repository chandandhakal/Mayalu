let initSqlJs = null;
const globalForDb = globalThis;

async function getDb() {
  if (globalForDb.__db) return globalForDb.__db;
  if (globalForDb.__dbPromise) return globalForDb.__dbPromise;

  globalForDb.__dbPromise = (async () => {
    if (!initSqlJs) {
      const sqlModule = await import('sql.js/dist/sql-asm.js');
      initSqlJs = sqlModule.default;
    }
    const SQL = await initSqlJs();
    const db = new SQL.Database();
    globalForDb.__db = db;
    initSchema(db);
    seedAnalytics(db);
    return db;
  })();

  return globalForDb.__dbPromise;
}

function initSchema(db) {
  db.run(`
    CREATE TABLE IF NOT EXISTS calls (
      id TEXT PRIMARY KEY,
      caller_number TEXT NOT NULL DEFAULT '',
      caller_name TEXT DEFAULT 'Unknown',
      language TEXT DEFAULT 'en',
      status TEXT DEFAULT 'active',
      duration INTEGER DEFAULT 0,
      transcript TEXT DEFAULT '',
      summary TEXT DEFAULT '',
      sentiment TEXT DEFAULT 'neutral',
      created_at TEXT DEFAULT (datetime('now')),
      ended_at TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS leads (
      id TEXT PRIMARY KEY,
      call_id TEXT,
      name TEXT NOT NULL DEFAULT '',
      phone TEXT NOT NULL DEFAULT '',
      email TEXT DEFAULT '',
      interest TEXT DEFAULT '',
      source TEXT DEFAULT 'call',
      score INTEGER DEFAULT 50,
      status TEXT DEFAULT 'new',
      notes TEXT DEFAULT '',
      follow_up_date TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS analytics_snapshots (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      date TEXT NOT NULL,
      total_calls INTEGER DEFAULT 0,
      leads_generated INTEGER DEFAULT 0,
      avg_duration INTEGER DEFAULT 0,
      avg_sentiment_score REAL DEFAULT 0,
      top_interests TEXT DEFAULT '[]',
      calls_by_hour TEXT DEFAULT '[]',
      language_distribution TEXT DEFAULT '[]'
    )
  `);
}

function seedAnalytics(db) {
  const now = new Date();
  const days = 7;
  for (let i = days; i >= 0; i--) {
    const d = new Date(now - 86400000 * i);
    const dateStr = d.toISOString().split('T')[0];
    const totalCalls = Math.floor(Math.random() * 10) + 3 + (i === 0 ? 2 : 0);
    const leadsGen = Math.floor(totalCalls * (0.3 + Math.random() * 0.4));
    const avgDur = Math.floor(120 + Math.random() * 200);
    const avgSent = (0.5 + Math.random() * 0.5).toFixed(2);
    const interests = JSON.stringify(['House Painting', 'Web Development', 'SEO', 'Mobile App', 'Renovation'].sort(() => Math.random() - 0.5).slice(0, 3));
    const hours = JSON.stringify(Array.from({ length: 8 }, (_, h) => ({ hour: 9 + h * 2, calls: Math.floor(Math.random() * 3) + 1 })));
    const langDist = JSON.stringify([{ lang: 'ne', label: 'Nepali', count: Math.floor(totalCalls * 0.6) }, { lang: 'en', label: 'English', count: totalCalls - Math.floor(totalCalls * 0.6) }]);
    db.run(
      `INSERT INTO analytics_snapshots (date, total_calls, leads_generated, avg_duration, avg_sentiment_score, top_interests, calls_by_hour, language_distribution)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [dateStr, totalCalls, leadsGen, avgDur, avgSent, interests, hours, langDist]
    );
  }
}

function run(sql, params = []) {
  const db = globalForDb.__db;
  if (!db) throw new Error('Database not initialized');
  db.run(sql, params);
}

function get(sql, params = []) {
  const db = globalForDb.__db;
  if (!db) throw new Error('Database not initialized');
  const stmt = db.prepare(sql);
  if (params.length > 0) stmt.bind(params);
  let row = null;
  if (stmt.step()) {
    row = stmt.getAsObject();
  }
  stmt.free();
  return row;
}

function all(sql, params = []) {
  const db = globalForDb.__db;
  if (!db) throw new Error('Database not initialized');
  const stmt = db.prepare(sql);
  if (params.length > 0) stmt.bind(params);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

export { getDb, run, get, all };
