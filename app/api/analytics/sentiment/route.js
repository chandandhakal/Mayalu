export const dynamic = 'force-dynamic';
import { getDb, get, all } from '@/lib/db';

export async function GET() {
  await getDb();
  const positive = get("SELECT COUNT(*) as count FROM calls WHERE sentiment = 'positive'").count;
  const neutral = get("SELECT COUNT(*) as count FROM calls WHERE sentiment = 'neutral'").count;
  const negative = get("SELECT COUNT(*) as count FROM calls WHERE sentiment = 'negative'").count;
  return Response.json({ positive, neutral, negative });
}

