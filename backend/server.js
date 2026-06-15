const express = require('express');
const cors = require('cors');
const { initDb } = require('./db');
const callsRouter = require('./routes/calls');
const leadsRouter = require('./routes/leads');
const analyticsRouter = require('./routes/analytics');
const aiRouter = require('./routes/ai');
const twilioRouter = require('./routes/twilio');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use('/api/calls', callsRouter);
app.use('/api/leads', leadsRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/ai', aiRouter);
app.use('/api/twilio', twilioRouter);

app.get('/api/stats', async (req, res) => {
  const { get } = require('./db');
  const totalCalls = get('SELECT COUNT(*) as count FROM calls').count;
  const activeCalls = get("SELECT COUNT(*) as count FROM calls WHERE status IN ('active', 'in_progress')").count;
  const totalLeads = get('SELECT COUNT(*) as count FROM leads').count;
  const qualifiedLeads = get("SELECT COUNT(*) as count FROM leads WHERE status = 'qualified'").count;
  const avgScoreRow = get('SELECT ROUND(AVG(score), 1) as avg FROM leads');
  const avgScore = avgScoreRow ? avgScoreRow.avg : 0;
  const today = new Date().toISOString().split('T')[0];
  const todaySnapshot = get('SELECT * FROM analytics_snapshots WHERE date = ?', [today]);
  res.json({
    totalCalls, activeCalls, totalLeads, qualifiedLeads,
    avgLeadScore: avgScore,
    todayCalls: todaySnapshot ? todaySnapshot.total_calls : totalCalls,
    todayLeads: todaySnapshot ? todaySnapshot.leads_generated : totalLeads,
    avgCallDuration: todaySnapshot ? todaySnapshot.avg_duration : 0,
    avgSentiment: todaySnapshot ? todaySnapshot.avg_sentiment_score : 0,
  });
});

async function start() {
  await initDb();
  app.listen(PORT, () => {
    console.log(`Backend running on http://localhost:${PORT}`);

    // Try to start ngrok for phone calling
    try {
      const ngrok = require('ngrok');
      ngrok.connect({ addr: PORT, authtoken: process.env.NGROK_AUTH_TOKEN || undefined })
        .then(url => {
          twilioRouter.setNgrokUrl(url);
        })
        .catch(() => {
          console.log('ngrok: not configured (phone calling unavailable)');
          console.log('To enable phone calls: npx ngrok http ' + PORT);
        });
    } catch (e) {
      console.log('Phone calling: run "npx ngrok http ' + PORT + '" to get a public URL');
    }
  });
}

start();
