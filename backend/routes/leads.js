const express = require('express');
const router = express.Router();
const { run, get, all } = require('../db');
const { v4: uuidv4 } = require('uuid');

router.get('/', (req, res) => {
  const { status, search, limit = 50, offset = 0 } = req.query;
  let query = 'SELECT * FROM leads WHERE 1=1';
  const params = [];

  if (status) { query += ' AND status = ?'; params.push(status); }
  if (search) { query += ' AND (name LIKE ? OR phone LIKE ? OR email LIKE ? OR interest LIKE ?)'; const s = `%${search}%`; params.push(s, s, s, s); }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(Number(limit), Number(offset));

  const leads = all(query, params);
  const totalRow = get('SELECT COUNT(*) as count FROM leads');
  res.json({ leads, total: totalRow ? totalRow.count : 0, limit: Number(limit), offset: Number(offset) });
});

router.get('/:id', (req, res) => {
  const lead = get('SELECT * FROM leads WHERE id = ?', [req.params.id]);
  if (!lead) return res.status(404).json({ error: 'Lead not found' });
  const call = get('SELECT * FROM calls WHERE id = ?', [lead.call_id]);
  res.json({ ...lead, call });
});

router.post('/', (req, res) => {
  const id = uuidv4();
  const { call_id, name, phone, email = '', interest = '', score = 50, status = 'new', notes = '', follow_up_date } = req.body;

  if (!name || !phone) return res.status(400).json({ error: 'name and phone are required' });

  run(`INSERT INTO leads (id, call_id, name, phone, email, interest, source, score, status, notes, follow_up_date) VALUES (?, ?, ?, ?, ?, ?, 'call', ?, ?, ?, ?)`,
    [id, call_id || null, name, phone, email, interest, score, status, notes, follow_up_date || null]);

  const lead = get('SELECT * FROM leads WHERE id = ?', [id]);
  res.status(201).json(lead);
});

router.patch('/:id', (req, res) => {
  const lead = get('SELECT * FROM leads WHERE id = ?', [req.params.id]);
  if (!lead) return res.status(404).json({ error: 'Lead not found' });

  const fields = ['name', 'phone', 'email', 'interest', 'score', 'status', 'notes', 'follow_up_date'];
  const updates = [];
  const params = [];
  for (const f of fields) {
    if (req.body[f] !== undefined) { updates.push(`${f} = ?`); params.push(req.body[f]); }
  }
  if (updates.length === 0) return res.json(lead);

  updates.push("updated_at = datetime('now')");
  params.push(req.params.id);
  run(`UPDATE leads SET ${updates.join(', ')} WHERE id = ?`, params);

  const updated = get('SELECT * FROM leads WHERE id = ?', [req.params.id]);
  res.json(updated);
});

router.delete('/:id', (req, res) => {
  run('DELETE FROM leads WHERE id = ?', [req.params.id]);
  res.json({ deleted: true });
});

module.exports = router;
