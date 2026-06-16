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

  let query = 'SELECT * FROM calls WHERE 1=1';
  const params = [];

  if (status) { query += ' AND status = ?'; params.push(status); }
  if (search) { query += ' AND (caller_name LIKE ? OR caller_number LIKE ? OR transcript LIKE ?)'; const s = `%${search}%`; params.push(s, s, s); }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  const calls = all(query, params);
  const totalRow = get('SELECT COUNT(*) as count FROM calls');
  return Response.json({ calls, total: totalRow ? totalRow.count : 0, limit, offset });
}

export async function POST(request) {
  await getDb();
  const body = await request.json();
  const id = uuidv4();
  const { caller_number, caller_name = 'Unknown', language = 'en' } = body;

  run(`INSERT INTO calls (id, caller_number, caller_name, language) VALUES (?, ?, ?, ?)`,
    [id, caller_number, caller_name, language]);

  const call = get('SELECT * FROM calls WHERE id = ?', [id]);
  return Response.json(call, { status: 201 });
}

