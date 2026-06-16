export const dynamic = 'force-dynamic';
import { getDb, get, all } from '@/lib/db';

export async function GET() {
  await getDb();
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

  return Response.json(result);
}

