export const dynamic = 'force-dynamic';

import { getDb, run } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { setCallSession } from '@/lib/twilio-sessions';

export async function POST(request) {
  await getDb();
  const formData = await request.formData();
  const from = formData.get('From') || 'Unknown';
  const callSid = formData.get('CallSid');
  const fromCity = formData.get('FromCity') || '';
  const fromCountry = formData.get('FromCountry') || '';

  console.log(`\n INCOMING CALL from ${from} (${fromCity}, ${fromCountry})`);

  const callId = uuidv4();
  run(`INSERT INTO calls (id, caller_number, caller_name, language, status)
       VALUES (?, ?, ?, 'en', 'active')`,
    [callId, from, `Caller ${from.slice(-4)}`]);

  setCallSession(callSid, { from, callId, createdAt: Date.now(), history: [], stage: 'greeting' });

  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">Hello! This is Mayalu, the AI assistant. Thank you for calling. I can help you with painting, renovation, web development, SEO, mobile apps, and more. What service are you interested in?</Say>
  <Gather input="speech" speechTimeout="auto" action="/api/twilio/continue" method="POST" language="en-US" timeout="4">
    <Say voice="Polly.Joanna">I'm listening. Please tell me what you need.</Say>
  </Gather>
  <Redirect>/api/twilio/incoming</Redirect>
</Response>`;

  return new Response(twiml, {
    headers: { 'Content-Type': 'text/xml' },
  });
}
