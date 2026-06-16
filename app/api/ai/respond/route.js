export const dynamic = 'force-dynamic';

import { respond } from '@/lib/services/ai-chat';

export async function POST(request) {
  const body = await request.json();
  const { text, language = 'en', sessionId } = body;
  if (!text || !text.trim()) {
    return Response.json({ error: 'text is required' }, { status: 400 });
  }
  const result = await respond(text, language, sessionId);
  return Response.json(result);
}
