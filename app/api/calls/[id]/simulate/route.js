export const dynamic = 'force-dynamic';

import { getDb, run, get, all } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { generateTranscript, analyzeSentiment, generateSummary, extractLeadInfo } from '@/lib/services/ai';

export async function POST(request, { params }) {
  await getDb();
  const call = get('SELECT * FROM calls WHERE id = ?', [params.id]);
  if (!call) return Response.json({ error: 'Call not found' }, { status: 404 });

  const body = await request.json().catch(() => ({}));
  const { interest = 'General Inquiry' } = body;

  const transcript = await generateTranscript({
    callerName: call.caller_name,
    callerNumber: call.caller_number,
    language: call.language,
    interest,
  });

  const sentiment = await analyzeSentiment(transcript);
  const summary = await generateSummary(transcript);

  const duration = Math.floor(transcript.length * 0.4) + 60 + Math.floor(Math.random() * 60);

  run(`UPDATE calls SET status = 'completed', duration = ?, transcript = ?, summary = ?, sentiment = ?, ended_at = datetime('now') WHERE id = ?`,
    [duration, transcript, summary, sentiment, params.id]);

  const leadInfo = await extractLeadInfo(transcript, call.caller_name, call.caller_number);
  if (leadInfo && leadInfo.name && leadInfo.phone) {
    const existingLead = get('SELECT id FROM leads WHERE call_id = ?', [params.id]);
    if (!existingLead) {
      const leadId = uuidv4();
      run(`INSERT INTO leads (id, call_id, name, phone, email, interest, source, score, status, notes, follow_up_date) VALUES (?, ?, ?, ?, ?, ?, 'call', ?, ?, ?, ?)`,
        [leadId, params.id, leadInfo.name, leadInfo.phone, leadInfo.email || '', leadInfo.interest || interest, leadInfo.score || 50, leadInfo.score >= 70 ? 'qualified' : 'new', leadInfo.notes || '', leadInfo.followUpNeeded ? new Date(Date.now() + 86400000).toISOString() : null]);
    }
  }

  const updated = get('SELECT * FROM calls WHERE id = ?', [params.id]);
  const leads = all('SELECT * FROM leads WHERE call_id = ?', [params.id]);
  return Response.json({ ...updated, leads });
}
