export const dynamic = 'force-dynamic';

import { getDb, run } from '@/lib/db';
import { getCallSessions, deleteCallSession } from '@/lib/twilio-sessions';

function escapeXml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export async function POST(request) {
  await getDb();
  const formData = await request.formData();
  const speechResult = formData.get('SpeechResult') || '';
  const callSid = formData.get('CallSid');
  const from = formData.get('From');

  console.log(`\n SPEECH: "${speechResult}"`);

  const callSessions = getCallSessions();
  const session = callSessions[callSid];
  if (!session) {
    return new Response(`<Response><Say>Sorry, session expired. Please call back.</Say><Hangup/></Response>`, {
      headers: { 'Content-Type': 'text/xml' },
    });
  }

  session.history.push({ role: 'user', text: speechResult });

  let aiResponse = '';
  let isComplete = false;

  try {
    const url = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}/api/ai/respond`
      : `http://localhost:${process.env.PORT || 3000}/api/ai/respond`;

    const aiRes = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: speechResult,
        language: 'en',
      }),
    });

    if (aiRes.ok) {
      const aiData = await aiRes.json();
      aiResponse = aiData.response || 'Thank you for your interest.';
      isComplete = aiData.isComplete || false;

      session.history.push({ role: 'assistant', text: aiResponse });

      if (session.callId) {
        run(`UPDATE calls SET transcript = ?, summary = ?, status = 'completed', duration = 45, ended_at = datetime('now') WHERE id = ?`,
          [speechResult, aiResponse, session.callId]);
      }
    } else {
      aiResponse = 'Thank you for calling. We will follow up with you soon.';
      isComplete = true;
    }
  } catch (e) {
    console.error('AI error:', e.message);
    aiResponse = 'I had trouble processing that. Someone will call you back shortly.';
    isComplete = true;
  }

  if (isComplete) {
    deleteCallSession(callSid);
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">${escapeXml(aiResponse)}</Say>
  <Say voice="Polly.Joanna">Thank you for calling. Have a great day!</Say>
  <Hangup/>
</Response>`;
    return new Response(twiml, { headers: { 'Content-Type': 'text/xml' } });
  }

  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">${escapeXml(aiResponse)}</Say>
  <Gather input="speech" speechTimeout="auto" action="/api/twilio/continue" method="POST" language="en-US" timeout="4">
    <Say voice="Polly.Joanna">Please continue, I'm listening.</Say>
  </Gather>
  <Redirect>/api/twilio/continue</Redirect>
</Response>`;

  return new Response(twiml, { headers: { 'Content-Type': 'text/xml' } });
}
