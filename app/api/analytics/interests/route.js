export const dynamic = 'force-dynamic';
import { getDb, get, all } from '@/lib/db';

export async function GET() {
  await getDb();
  const interests = all("SELECT interest, COUNT(*) as count, ROUND(AVG(score), 1) as avg_score FROM leads WHERE interest != '' GROUP BY interest ORDER BY count DESC");
  return Response.json(interests);
}

