export const dynamic = 'force-dynamic';

import { getDb, run, get, all } from '@/lib/db';

export async function GET(request, { params }) {
  await getDb();
  const call = get('SELECT * FROM calls WHERE id = ?', [params.id]);
  if (!call) return Response.json({ error: 'Call not found' }, { status: 404 });
  const leads = all('SELECT * FROM leads WHERE call_id = ?', [params.id]);
  return Response.json({ ...call, leads });
}

export async function PATCH(request, { params }) {
  await getDb();
  const call = get('SELECT * FROM calls WHERE id = ?', [params.id]);
  if (!call) return Response.json({ error: 'Call not found' }, { status: 404 });

  const body = await request.json();
  const { caller_name, status, language } = body;
  const updates = [];
  const updateParams = [];
  if (caller_name !== undefined) { updates.push('caller_name = ?'); updateParams.push(caller_name); }
  if (status !== undefined) { updates.push('status = ?'); updateParams.push(status); }
  if (language !== undefined) { updates.push('language = ?'); updateParams.push(language); }
  if (updates.length === 0) return Response.json(call);

  updateParams.push(params.id);
  run(`UPDATE calls SET ${updates.join(', ')} WHERE id = ?`, updateParams);

  const updated = get('SELECT * FROM calls WHERE id = ?', [params.id]);
  return Response.json(updated);
}
