const express = require('express');
const router = express.Router();

// Store active call sessions
const callSessions = {};

// GET /api/twilio/incoming - Twilio calls this when phone rings
router.post('/incoming', (req, res) => {
  const from = req.body.From || 'Unknown';
  const callSid = req.body.CallSid;
  const fromCity = req.body.FromCity || '';
  const fromCountry = req.body.FromCountry || '';

  console.log(`\n📞 INCOMING CALL from ${from} (${fromCity}, ${fromCountry})`);

  // Create call record in DB
  const { v4 } = require('uuid');
  const { run } = require('../db');
  const callId = v4();
  run(`INSERT INTO calls (id, caller_number, caller_name, language, status)
       VALUES (?, ?, ?, 'en', 'active')`,
    [callId, from, `Caller ${from.slice(-4)}`]);

  // Store call session
  callSessions[callSid] = { from, callId, createdAt: Date.now(), history: [], stage: 'greeting' };

  // Generate greeting TwiML
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">Hello! This is Mayalu, the AI assistant. Thank you for calling. I can help you with painting, renovation, web development, SEO, mobile apps, and more. What service are you interested in?</Say>
  <Gather input="speech" speechTimeout="auto" action="/api/twilio/continue" method="POST" language="en-US" timeout="4">
    <Say voice="Polly.Joanna">I'm listening. Please tell me what you need.</Say>
  </Gather>
  <Redirect>/api/twilio/incoming</Redirect>
</Response>`;

  res.type('text/xml');
  res.send(twiml);
});

// POST /api/twilio/continue - handles speech results and continues conversation
router.post('/continue', async (req, res) => {
  const speechResult = req.body.SpeechResult || '';
  const callSid = req.body.CallSid;
  const from = req.body.From;
  const confidence = req.body.Confidence || '0';

  console.log(`\n🗣 SPEECH: "${speechResult}" (confidence: ${confidence})`);

  const session = callSessions[callSid];
  if (!session) {
    return res.type('text/xml').send(`<Response><Say>Sorry, session expired. Please call back.</Say><Hangup/></Response>`);
  }

  session.history.push({ role: 'user', text: speechResult });

  // Get AI response
  let aiResponse = '';
  let isComplete = false;

  try {
    const aiRes = await fetch(`http://localhost:${process.env.PORT || 3001}/api/ai/respond`, {
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

      // Update call record
      const { run } = require('../db');
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
    delete callSessions[callSid];
    const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">${escapeXml(aiResponse)}</Say>
  <Say voice="Polly.Joanna">Thank you for calling. Have a great day!</Say>
  <Hangup/>
</Response>`;
    return res.type('text/xml').send(twiml);
  }

  // Continue the conversation
  const twiml = `<?xml version="1.0" encoding="UTF-8"?>
<Response>
  <Say voice="Polly.Joanna">${escapeXml(aiResponse)}</Say>
  <Gather input="speech" speechTimeout="auto" action="/api/twilio/continue" method="POST" language="en-US" timeout="4">
    <Say voice="Polly.Joanna">Please continue, I'm listening.</Say>
  </Gather>
  <Redirect>/api/twilio/continue</Redirect>
</Response>`;

  res.type('text/xml');
  res.send(twiml);
});

// GET /api/twilio/ngrok-url - returns current ngrok URL if available
let ngrokUrl = null;
router.get('/ngrok-url', (req, res) => {
  res.json({ url: ngrokUrl || null });
});

// Function to set ngrok URL (called from server startup)
function setNgrokUrl(url) {
  ngrokUrl = url;
  console.log(`\n📞 TWILIO WEBHOOK URL: ${url}/api/twilio/incoming`);
  console.log(`   Copy this URL into your Twilio phone number's voice webhook\n`);
}

function escapeXml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

module.exports = router;
module.exports.setNgrokUrl = setNgrokUrl;
