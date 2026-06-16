export const dynamic = 'force-dynamic';
import { getDb, get, all } from '@/lib/db';

export async function GET() {
  await getDb();
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

  return Response.json({
    totalCalls, completedCalls, totalLeads, qualifiedLeads,
    contactedLeads, newLeads, avgDuration, avgScore, conversionRate, avgSentimentScore
  });
}

