export const dynamic = 'force-dynamic';
import { getDb, get, all } from '@/lib/db';

export async function GET(request) {
  await getDb();
  const { searchParams } = new URL(request.url);
  const days = parseInt(searchParams.get('days')) || 7;
  const snapshots = all('SELECT * FROM analytics_snapshots ORDER BY date DESC LIMIT ?', [days]).reverse();

  return Response.json(snapshots.map(s => ({
    date: s.date,
    totalCalls: s.total_calls,
    leadsGenerated: s.leads_generated,
    avgDuration: s.avg_duration,
    avgSentimentScore: s.avg_sentiment_score,
    topInterests: JSON.parse(s.top_interests || '[]'),
    callsByHour: JSON.parse(s.calls_by_hour || '[]'),
    languageDistribution: JSON.parse(s.language_distribution || '[]'),
  })));
}

