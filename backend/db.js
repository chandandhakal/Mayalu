const initSqlJs = require('sql.js');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');

const dbPath = path.join(__dirname, 'data', 'assistant.db');
let db = null;

async function getDb() {
  if (db) return db;

  const SQL = await initSqlJs();
  const dir = path.dirname(dbPath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath);
    db = new SQL.Database(fileBuffer);
  } else {
    db = new SQL.Database();
  }
  return db;
}

function saveDb() {
  if (!db) return;
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath, buffer);
}

function run(sql, params = []) {
  db.run(sql, params);
  saveDb();
}

function get(sql, params = []) {
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
  const stmt = db.prepare(sql);
  if (params.length > 0) stmt.bind(params);
  const rows = [];
  while (stmt.step()) {
    rows.push(stmt.getAsObject());
  }
  stmt.free();
  return rows;
}

async function initDb() {
  await getDb();

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

  saveDb();

  saveDb();
}

function seedData() {
  const now = new Date();
  const callsToInsert = [
    { id: uuidv4(), number: '+977-9841234567', name: 'Ram Shrestha', lang: 'ne', status: 'completed', dur: 245, transcript: '[Nepali] Namaste, ma ghar painting ko barema sodhna chahanchu...', summary: 'Customer inquired about house painting service. Gave estimate of Rs. 50,000. Customer interested.', sentiment: 'positive', created: new Date(now - 86400000 * 3).toISOString(), ended: new Date(now - 86400000 * 3 + 245000).toISOString() },
    { id: uuidv4(), number: '+977-9852345678', name: 'Sita Gurung', lang: 'ne', status: 'completed', dur: 180, transcript: '[Nepali] Mero shop renovation garna parne thyo. Price kati lagcha?', summary: 'Shop renovation inquiry. Shared pricing packages. Will visit site tomorrow.', sentiment: 'positive', created: new Date(now - 86400000 * 2).toISOString(), ended: new Date(now - 86400000 * 2 + 180000).toISOString() },
    { id: uuidv4(), number: '+1-555-0123', name: 'John Smith', lang: 'en', status: 'completed', dur: 320, transcript: "Hi, I'm looking for website development services. Can you tell me about your packages?", summary: 'Web development inquiry. Discussed packages starting at $2000. Customer requested a proposal.', sentiment: 'positive', created: new Date(now - 86400000 * 1.5).toISOString(), ended: new Date(now - 86400000 * 1.5 + 320000).toISOString() },
    { id: uuidv4(), number: '+977-9863456789', name: 'Bikash Adhikari', lang: 'ne', status: 'completed', dur: 150, transcript: '[Nepali] Mobile app banauna milcha? Kati din lagcha?', summary: 'Mobile app development inquiry. Explained 4-6 week timeline. Customer will get back.', sentiment: 'neutral', created: new Date(now - 86400000 * 1).toISOString(), ended: new Date(now - 86400000 * 1 + 150000).toISOString() },
    { id: uuidv4(), number: '+1-555-0456', name: 'Sarah Johnson', lang: 'en', status: 'completed', dur: 280, transcript: 'I need SEO optimization for my e-commerce store. What results can I expect?', summary: 'SEO service inquiry. Detailed package discussion. Lead is hot - budget confirmed.', sentiment: 'positive', created: new Date(now - 43200000).toISOString(), ended: new Date(now - 43200000 + 280000).toISOString() },
    { id: uuidv4(), number: '+977-9874567890', name: 'Maya Tamang', lang: 'ne', status: 'completed', dur: 95, transcript: '[Nepali] Hjrko service ko barema thaha pauna man lagyo.', summary: 'General service inquiry. Gave overview and sent brochure via SMS.', sentiment: 'neutral', created: new Date(now - 21600000).toISOString(), ended: new Date(now - 21600000 + 95000).toISOString() },
    { id: uuidv4(), number: '+977-9801234567', name: 'Prakash Rai', lang: 'ne', status: 'in_progress', dur: 0, transcript: '', summary: '', sentiment: 'neutral', created: new Date(now - 600000).toISOString(), ended: null },
    { id: uuidv4(), number: '+1-555-0789', name: 'Mike Wilson', lang: 'en', status: 'active', dur: 0, transcript: '', summary: '', sentiment: 'neutral', created: new Date().toISOString(), ended: null },
  ];

  const callIds = [];
  for (const c of callsToInsert) {
    db.run(
      `INSERT INTO calls (id, caller_number, caller_name, language, status, duration, transcript, summary, sentiment, created_at, ended_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [c.id, c.number, c.name, c.lang, c.status, c.dur, c.transcript, c.summary, c.sentiment, c.created, c.ended]
    );
    callIds.push(c.id);
  }

  const leadsToInsert = [
    { call_id: callIds[0], name: 'Ram Shrestha', phone: '+977-9841234567', email: 'ram@email.com', interest: 'House Painting', score: 85, status: 'qualified', notes: 'Ready to proceed. Send contract.', follow_up: new Date(now + 86400000).toISOString() },
    { call_id: callIds[1], name: 'Sita Gurung', phone: '+977-9852345678', email: 'sita@email.com', interest: 'Shop Renovation', score: 72, status: 'contacted', notes: 'Site visit scheduled for tomorrow.', follow_up: new Date(now + 86400000).toISOString() },
    { call_id: callIds[2], name: 'John Smith', phone: '+1-555-0123', email: 'john@company.com', interest: 'Web Development', score: 90, status: 'qualified', notes: 'Proposal sent. Follow up in 2 days.', follow_up: new Date(now + 172800000).toISOString() },
    { call_id: callIds[4], name: 'Sarah Johnson', phone: '+1-555-0456', email: 'sarah@shop.com', interest: 'SEO Optimization', score: 95, status: 'qualified', notes: 'Hot lead! Budget $3000 confirmed.', follow_up: new Date(now + 86400000).toISOString() },
    { call_id: callIds[5], name: 'Maya Tamang', phone: '+977-9874567890', email: '', interest: 'General Inquiry', score: 45, status: 'new', notes: 'Sent brochure. Awaiting response.', follow_up: new Date(now + 259200000).toISOString() },
  ];

  const nowIso = now.toISOString();
  for (const l of leadsToInsert) {
    db.run(
      `INSERT INTO leads (id, call_id, name, phone, email, interest, source, score, status, notes, follow_up_date, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 'call', ?, ?, ?, ?, ?, ?)`,
      [uuidv4(), l.call_id, l.name, l.phone, l.email, l.interest, l.score, l.status, l.notes, l.follow_up, nowIso, nowIso]
    );
  }

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

  saveDb();
}

module.exports = { getDb, initDb, run, get, all, saveDb };
