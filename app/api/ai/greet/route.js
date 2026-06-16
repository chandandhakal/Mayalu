export const dynamic = 'force-dynamic';

import { greet } from '@/lib/services/ai-chat';

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const { language = 'en' } = body;
  const result = await greet(language);
  return Response.json(result);
}
