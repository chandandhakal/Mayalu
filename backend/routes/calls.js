const express = require('express');
const router = express.Router();
const { run, get, all } = require('../db');
const { v4: uuidv4 } = require('uuid');
const { generateTranscript, analyzeSentiment, generateSummary, extractLeadInfo } = require('../services/ai');

router.get('/', (req, res) => {
  const { status, search, limit = 50, offset = 0 } = req.query;
  let query = 'SELECT * FROM calls WHERE 1=1';
  const params = [];

  if (status) { query += ' AND status = ?'; params.push(status); }
  if (search) { query += ' AND (caller_name LIKE ? OR caller_number LIKE ? OR transcript LIKE ?)'; const s = `%${search}%`; params.push(s, s, s); }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(Number(limit), Number(offset));

  const calls = all(query, params);
  const totalRow = get('SELECT COUNT(*) as count FROM calls');
  res.json({ calls, total: totalRow ? totalRow.count : 0, limit: Number(limit), offset: Number(offset) });
});

router.get('/:id', (req, res) => {
  const call = get('SELECT * FROM calls WHERE id = ?', [req.params.id]);
  if (!call) return res.status(404).json({ error: 'Call not found' });
  const leads = all('SELECT * FROM leads WHERE call_id = ?', [req.params.id]);
  res.json({ ...call, leads });
});

router.post('/', (req, res) => {
  const id = uuidv4();
  const { caller_number, caller_name = 'Unknown', language = 'en' } = req.body;

  run(`INSERT INTO calls (id, caller_number, caller_name, language) VALUES (?, ?, ?, ?)`,
    [id, caller_number, caller_name, language]);

  const call = get('SELECT * FROM calls WHERE id = ?', [id]);
  res.status(201).json(call);
});

router.post('/:id/simulate', async (req, res) => {
  const call = get('SELECT * FROM calls WHERE id = ?', [req.params.id]);
  if (!call) return res.status(404).json({ error: 'Call not found' });

  const { interest = 'General Inquiry' } = req.body;

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
    [duration, transcript, summary, sentiment, req.params.id]);

  const leadInfo = await extractLeadInfo(transcript, call.caller_name, call.caller_number);
  if (leadInfo && leadInfo.name && leadInfo.phone) {
    const existingLead = get('SELECT id FROM leads WHERE call_id = ?', [req.params.id]);
    if (!existingLead) {
      const leadId = uuidv4();
      run(`INSERT INTO leads (id, call_id, name, phone, email, interest, source, score, status, notes, follow_up_date) VALUES (?, ?, ?, ?, ?, ?, 'call', ?, ?, ?, ?)`,
        [leadId, req.params.id, leadInfo.name, leadInfo.phone, leadInfo.email || '', leadInfo.interest || interest, leadInfo.score || 50, leadInfo.score >= 70 ? 'qualified' : 'new', leadInfo.notes || '', leadInfo.followUpNeeded ? new Date(Date.now() + 86400000).toISOString() : null]);
    }
  }

  const updated = get('SELECT * FROM calls WHERE id = ?', [req.params.id]);
  const leads = all('SELECT * FROM leads WHERE call_id = ?', [req.params.id]);
  res.json({ ...updated, leads });
});

router.patch('/:id', (req, res) => {
  const call = get('SELECT * FROM calls WHERE id = ?', [req.params.id]);
  if (!call) return res.status(404).json({ error: 'Call not found' });

  const { caller_name, status, language } = req.body;
  const updates = [];
  const params = [];
  if (caller_name !== undefined) { updates.push('caller_name = ?'); params.push(caller_name); }
  if (status !== undefined) { updates.push('status = ?'); params.push(status); }
  if (language !== undefined) { updates.push('language = ?'); params.push(language); }
  if (updates.length === 0) return res.json(call);

  params.push(req.params.id);
  run(`UPDATE calls SET ${updates.join(', ')} WHERE id = ?`, params);

  const updated = get('SELECT * FROM calls WHERE id = ?', [req.params.id]);
  res.json(updated);
});

module.exports = router;
