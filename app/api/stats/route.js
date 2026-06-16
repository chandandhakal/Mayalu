export const dynamic = 'force-dynamic';
import { getDb, run, get, all } from '@/lib/db';

export async function GET() {
  await getDb();
  const totalCalls = get('SELECT COUNT(*) as count FROM calls').count;
  const activeCalls = get("SELECT COUNT(*) as count FROM calls WHERE status IN ('active', 'in_progress')").count;
  const totalLeads = get('SELECT COUNT(*) as count FROM leads').count;
  const qualifiedLeads = get("SELECT COUNT(*) as count FROM leads WHERE status = 'qualified'").count;
  const avgScoreRow = get('SELECT ROUND(AVG(score), 1) as avg FROM leads');
  const avgScore = avgScoreRow ? avgScoreRow.avg : 0;
  const today = new Date().toISOString().split('T')[0];
  const todaySnapshot = get('SELECT * FROM analytics_snapshots WHERE date = ?', [today]);
  return Response.json({
    totalCalls, activeCalls, totalLeads, qualifiedLeads,
    avgLeadScore: avgScore,
    todayCalls: todaySnapshot ? todaySnapshot.total_calls : totalCalls,
    todayLeads: todaySnapshot ? todaySnapshot.leads_generated : totalLeads,
    avgCallDuration: todaySnapshot ? todaySnapshot.avg_duration : 0,
    avgSentiment: todaySnapshot ? todaySnapshot.avg_sentiment_score : 0,
  });
}

