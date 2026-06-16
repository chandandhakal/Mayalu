export const dynamic = 'force-dynamic';

import { getDb, run, get, all } from '@/lib/db';

export async function GET(request, { params }) {
  await getDb();
  const lead = get('SELECT * FROM leads WHERE id = ?', [params.id]);
  if (!lead) return Response.json({ error: 'Lead not found' }, { status: 404 });
  const call = get('SELECT * FROM calls WHERE id = ?', [lead.call_id]);
  return Response.json({ ...lead, call });
}

export async function PATCH(request, { params }) {
  await getDb();
  const lead = get('SELECT * FROM leads WHERE id = ?', [params.id]);
  if (!lead) return Response.json({ error: 'Lead not found' }, { status: 404 });

  const body = await request.json();
  const fields = ['name', 'phone', 'email', 'interest', 'score', 'status', 'notes', 'follow_up_date'];
  const updates = [];
  const updateParams = [];
  for (const f of fields) {
    if (body[f] !== undefined) { updates.push(`${f} = ?`); updateParams.push(body[f]); }
  }
  if (updates.length === 0) return Response.json(lead);

  updates.push("updated_at = datetime('now')");
  updateParams.push(params.id);
  run(`UPDATE leads SET ${updates.join(', ')} WHERE id = ?`, updateParams);

  const updated = get('SELECT * FROM leads WHERE id = ?', [params.id]);
  return Response.json(updated);
}

export async function DELETE(request, { params }) {
  await getDb();
  run('DELETE FROM leads WHERE id = ?', [params.id]);
  return Response.json({ deleted: true });
}
