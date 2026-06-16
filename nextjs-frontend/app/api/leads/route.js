export const dynamic = 'force-dynamic';

import { getDb, run, get, all } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export async function GET(request) {
  await getDb();
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const search = searchParams.get('search');
  const limit = Number(searchParams.get('limit')) || 50;
  const offset = Number(searchParams.get('offset')) || 0;

  let query = 'SELECT * FROM leads WHERE 1=1';
  const params = [];

  if (status) { query += ' AND status = ?'; params.push(status); }
  if (search) { query += ' AND (name LIKE ? OR phone LIKE ? OR email LIKE ? OR interest LIKE ?)'; const s = `%${search}%`; params.push(s, s, s, s); }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const leads = all(query, params);
  const totalRow = get('SELECT COUNT(*) as count FROM leads');
  return Response.json({ leads, total: totalRow ? totalRow.count : 0, limit, offset });
}

export async function POST(request) {
  await getDb();
  const body = await request.json();
  const id = uuidv4();
  const { call_id, name, phone, email = '', interest = '', score = 50, status = 'new', notes = '', follow_up_date } = body;

  if (!name || !phone) return Response.json({ error: 'name and phone are required' }, { status: 400 });

  run(`INSERT INTO leads (id, call_id, name, phone, email, interest, source, score, status, notes, follow_up_date) VALUES (?, ?, ?, ?, ?, ?, 'call', ?, ?, ?, ?)`,
    [id, call_id || null, name, phone, email, interest, score, status, notes, follow_up_date || null]);

  const lead = get('SELECT * FROM leads WHERE id = ?', [id]);
  return Response.json(lead, { status: 201 });
}

