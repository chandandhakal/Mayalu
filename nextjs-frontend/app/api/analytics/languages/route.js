export const dynamic = 'force-dynamic';
import { getDb, get, all } from '@/lib/db';

export async function GET() {
  await getDb();
  const langs = all('SELECT language, COUNT(*) as count FROM calls GROUP BY language ORDER BY count DESC');
  return Response.json(langs.map(l => ({ lang: l.language, label: l.language === 'ne' ? 'Nepali' : l.language === 'en' ? 'English' : l.language, count: l.count })));
}

