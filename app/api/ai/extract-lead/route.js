export const dynamic = 'force-dynamic';

import { extractLead } from '@/lib/services/ai-chat';

export async function POST(request) {
  const body = await request.json().catch(() => ({}));
  const { sessionId } = body;
  const result = await extractLead(sessionId);
  return Response.json(result);
}
