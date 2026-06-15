const express = require('express');
const router = express.Router();
const { get, all } = require('../db');

router.get('/overview', (req, res) => {
  const totalCalls = get('SELECT COUNT(*) as count FROM calls').count;
  const completedCalls = get("SELECT COUNT(*) as count FROM calls WHERE status = 'completed'").count;
  const totalLeads = get('SELECT COUNT(*) as count FROM leads').count;
  const qualifiedLeads = get("SELECT COUNT(*) as count FROM leads WHERE status = 'qualified'").count;
  const contactedLeads = get("SELECT COUNT(*) as count FROM leads WHERE status = 'contacted'").count;
  const newLeads = get("SELECT COUNT(*) as count FROM leads WHERE status = 'new'").count;
  const avgDurRow = get("SELECT ROUND(AVG(duration), 0) as avg FROM calls WHERE status = 'completed'");
  const avgDuration = avgDurRow ? avgDurRow.avg : 0;
  const avgScoreRow = get('SELECT ROUND(AVG(score), 1) as avg FROM leads');
  const avgScore = avgScoreRow ? avgScoreRow.avg : 0;
  const conversionRate = totalCalls > 0 ? ((completedCalls > 0 ? (totalLeads / completedCalls) : 0) * 100).toFixed(1) : '0';

  const avgSentimentRow = get("SELECT ROUND(AVG(CASE WHEN sentiment = 'positive' THEN 1.0 WHEN sentiment = 'neutral' THEN 0.5 ELSE 0.0 END), 2) as avg FROM calls WHERE status = 'completed'");
  const avgSentimentScore = avgSentimentRow ? avgSentimentRow.avg : 0;

  res.json({
    totalCalls, completedCalls, totalLeads, qualifiedLeads,
    contactedLeads, newLeads, avgDuration, avgScore, conversionRate, avgSentimentScore
  });
});

router.get('/trends', (req, res) => {
  const days = parseInt(req.query.days) || 7;
  const snapshots = all('SELECT * FROM analytics_snapshots ORDER BY date DESC LIMIT ?', [days]).reverse();

  res.json(snapshots.map(s => ({
    date: s.date,
    totalCalls: s.total_calls,
    leadsGenerated: s.leads_generated,
    avgDuration: s.avg_duration,
    avgSentimentScore: s.avg_sentiment_score,
    topInterests: JSON.parse(s.top_interests || '[]'),
    callsByHour: JSON.parse(s.calls_by_hour || '[]'),
    languageDistribution: JSON.parse(s.language_distribution || '[]'),
  })));
});

router.get('/sentiment', (req, res) => {
  const positive = get("SELECT COUNT(*) as count FROM calls WHERE sentiment = 'positive'").count;
  const neutral = get("SELECT COUNT(*) as count FROM calls WHERE sentiment = 'neutral'").count;
  const negative = get("SELECT COUNT(*) as count FROM calls WHERE sentiment = 'negative'").count;
  res.json({ positive, neutral, negative });
});

router.get('/interests', (req, res) => {
  const interests = all("SELECT interest, COUNT(*) as count, ROUND(AVG(score), 1) as avg_score FROM leads WHERE interest != '' GROUP BY interest ORDER BY count DESC");
  res.json(interests);
});

router.get('/languages', (req, res) => {
  const langs = all('SELECT language, COUNT(*) as count FROM calls GROUP BY language ORDER BY count DESC');
  res.json(langs.map(l => ({ lang: l.language, label: l.language === 'ne' ? 'Nepali' : l.language === 'en' ? 'English' : l.language, count: l.count })));
});

router.get('/leads-by-score', (req, res) => {
  const ranges = [
    { label: '90-100 (Hot)', min: 90, max: 100 },
    { label: '70-89 (Warm)', min: 70, max: 89 },
    { label: '50-69 (Cool)', min: 50, max: 69 },
    { label: '0-49 (Cold)', min: 0, max: 49 },
  ];

  const result = ranges.map(r => ({
    ...r,
    count: get('SELECT COUNT(*) as count FROM leads WHERE score >= ? AND score <= ?', [r.min, r.max]).count
  }));

  res.json(result);
});

module.exports = router;
