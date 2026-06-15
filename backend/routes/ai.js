const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const OpenAI = require('openai');

const sessions = {};

let openai = null;
function getClient() {
  if (openai) return openai;
  if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your-api-key-here') {
    const config = { apiKey: process.env.OPENAI_API_KEY };
    if (process.env.OPENAI_BASE_URL) {
      config.baseURL = process.env.OPENAI_BASE_URL;
    }
    openai = new OpenAI(config);
  }
  return openai;
}

function isAiReady() {
  return !!getClient();
}

const STAGES = [
  'greeting',
  'discovery',
  'qualification',
  'contact',
  'confirmation',
  'goodbye',
];

const STAGE_PROMPTS = {
  en: {
    greeting: 'You are Mayalu, a friendly AI call assistant for a service company offering: House Painting, Shop Renovation, Web Development, SEO Optimization, Mobile Apps, Digital Marketing, Content Writing. Greet the caller warmly and ask how you can help. Keep it under 2 sentences.',
    discovery: 'Ask what specific service or project they need help with. Listen carefully. Keep it under 2 sentences.',
    qualification: 'Understand their requirements better. Ask about budget, timeline, or specific needs for this project. Keep it natural and conversational. Under 2 sentences.',
    contact: 'Ask for their name and phone number so the team can follow up with a personalized quote. Be polite.',
    confirmation: 'Summarize what they need and confirm the contact details. Tell them someone from the team will reach out within 24 hours. Be warm and professional.',
    goodbye: 'Thank them for calling. End the conversation politely. Say goodbye.',
  },
  ne: {
    greeting: 'तपाईं मायालु हुनुहुन्छ, एउटा मैत्रीपूर्ण AI कल सहायक जसले यी सेवाहरू प्रदान गर्ने कम्पनीको लागि काम गर्नुहुन्छ: घर पेन्टिङ, पसल नवीकरण, वेब विकास, SEO, मोबाइल एप, डिजिटल मार्केटिङ। कलरलाई नमस्ते भन्नुहोस् र सोध्नुहोस् कसरी मद्दत गर्न सकिन्छ। २ वाक्य भन्दा कम।',
    discovery: 'उनीहरूलाई कुन सेवा वा प्रोजेक्ट चाहिएको छ भनेर सोध्नुहोस्। ध्यान दिएर सुन्नुहोस्। २ वाक्य भन्दा कम।',
    qualification: 'उनीहरूको आवश्यकता राम्रोसँग बुझ्नुहोस्। बजेट, समयावधि वा विशेष आवश्यकताको बारेमा सोध्नुहोस्। प्राकृतिक र कुराकानी शैलीमा। २ वाक्य भन्दा कम।',
    contact: 'उनीहरूको नाम र फोन नम्बर सोध्नुहोस् ताकि टोलीले व्यक्तिगत कोटेशन सहित फलोअप गर्न सकोस्। शिष्ट हुनुहोस्।',
    confirmation: 'उनीहरूको आवश्यकताको सारांश दिनुहोस् र सम्पर्क विवरण पुष्टि गर्नुहोस्। टोलीबाट २४ घण्टा भित्र सम्पर्क गरिने बताउनुहोस्।',
    goodbye: 'कलको लागि धन्यवाद दिनुहोस्। शिष्ट तरिकाले बिदाइ गर्नुहोस्।',
  },
};

const COMPLETION_TRIGGERS = ['goodbye', 'thank', 'thanks', 'bye', 'धन्यवाद', 'नमस्कार', 'bye bye', 'ok bye'];

function getStageIndex(stage) {
  const idx = STAGES.indexOf(stage);
  return idx >= 0 ? idx : 0;
}

function getNextStage(stage) {
  const idx = getStageIndex(stage);
  if (idx < STAGES.length - 1) return STAGES[idx + 1];
  return 'goodbye';
}

function shouldAdvanceStage(stage, text) {
  const lower = text.toLowerCase().trim();
  const length = lower.length;

  switch (stage) {
    case 'greeting':
      return lower.length > 3;
    case 'discovery':
      return lower.length > 10;
    case 'qualification':
      return lower.length > 15 &&
        (lower.includes('budget') || lower.includes('price') || lower.includes('cost') ||
         lower.includes('time') || lower.includes('week') || lower.includes('month') ||
         lower.includes('need') || lower.includes('want') || lower.includes('looking for') ||
         lower.includes('बजेट') || lower.includes('मूल्य') || lower.includes('समय') ||
         lower.includes('चाहि') || lower.includes('पर्ने') || length > 40);
    case 'contact':
      const hasPhone = /\d{7,}/.test(lower) || lower.includes('+') || lower.includes('phone') || lower.includes('number') || lower.includes('नम्बर') || lower.includes('फोन');
      return hasPhone || lower.includes('email') || lower.includes('@') || lower.includes('इमेल') || length > 25;
    case 'confirmation':
      return lower.includes('yes') || lower.includes('ok') || lower.includes('thank') || lower.includes('हो') || lower.includes('ठिक') || lower.includes('हुन्छ') || lower.includes('धन्यवाद');
    default:
      return true;
  }
}

function extractLeadFromHistory(messages, language) {
  const userMessages = messages.filter(m => !m.isAI && (m.role === 'user' || m.isAI === false));
  const allText = userMessages.map(m => m.text || m.content || '').join(' ').trim();
  const lower = allText.toLowerCase();

  let name = null;
  const namePatterns = [
    /(?:my name is|i am|i'm|this is|name is|naam|नाम)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i,
    /(?:mero naam|mero nam|मेरो\s+नाम)\s+([A-Za-z\u0900-\u097F]+(?:\s+[A-Za-z\u0900-\u097F]+)?)/i,
    /(?:ma|म)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s+(?:hu|हुँ|ho|हो)/i,
    /(?:my name|name)\s*(?::|is|,)?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/i,
  ];
  for (const p of namePatterns) {
    const m = allText.match(p);
    if (m) {
      const candidate = m[1].trim();
      const isCommon = /^(the|a|an|is|are|was|were|my|your|our|they|that|this|have|has|want|need|can|will|for|and|but|or|not|with|from|about|like|just|know|think|ok|okay|yes|yeah|no|hi|hello|hey|help|please|thanks|thank|good|great|bad|fine|now|then|also|only|very|much|some|any|each|every|all|both)$/i.test(candidate);
      if (!isCommon && candidate.length > 1 && candidate.length < 40) {
        name = candidate; break;
      }
    }
  }

  let phone = null;
  const phoneMatch = allText.match(/(\+?[\d\-\(\)\s]{7,15})/);
  if (phoneMatch) phone = phoneMatch[1].replace(/[\s\-\(\)]/g, '');

  let email = null;
  const emailMatch = allText.match(/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/);
  if (emailMatch) email = emailMatch[0];

  const interestPatterns = [
    { k: ['paint', 'painting', 'color', 'wall', 'पेन्ट', 'रङ'], v: 'House_Painting' },
    { k: ['web', 'website', 'development', 'site', 'वेब', 'डेभलप', 'ডেভেলপ'], v: 'Web_Development' },
    { k: ['seo', 'ranking', 'google', 'search'], v: 'SEO_Optimization' },
    { k: ['mobile', 'app', 'android', 'ios', 'एप'], v: 'Mobile_App' },
    { k: ['renovation', 'renovate', 'repair', 'shop', 'नवीकरण', 'मर्मत'], v: 'Shop_Renovation' },
    { k: ['digital', 'marketing', 'social', 'मार्केटिङ'], v: 'Digital_Marketing' },
    { k: ['content', 'writing', 'blog', 'लेखन'], v: 'Content_Writing' },
    { k: ['house', 'ghar', 'घर', 'apartment', 'building', 'घरको', 'home'], v: 'House_Painting' },
  ];
  let interest = null;
  let bestScore = 0;
  for (const p of interestPatterns) {
    const s = p.k.filter(k => allText.includes(k)).length;
    if (s > bestScore) { bestScore = s; interest = p.v; }
  }

  const requirements = allText.length > 30 ? allText.slice(0, 200) : null;

  if (name) name = name.charAt(0).toUpperCase() + name.slice(1).toLowerCase();

  return { name, phone, email: email || '', interest: interest || '', requirements: requirements || '' };
}

async function generateAIReply(systemPrompt, history, language) {
  const client = getClient();
  if (!client) return null;

  const langName = language === 'ne' ? 'Nepali' : 'English';
  const messages = [
    { role: 'system', content: `${systemPrompt}\n\nAlways respond in ${langName}. Keep responses brief (1-2 sentences). Never use markdown.` },
    ...history.map(m => ({
      role: m.role || (m.isAI ? 'assistant' : 'user'),
      content: m.content || m.text || '',
    })),
  ];

  try {
    const response = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages,
      max_tokens: 120,
      temperature: 0.7,
    });
    return response.choices[0].message.content.trim();
  } catch (err) {
    console.error('AI reply failed:', err.message);
    return null;
  }
}

function generateFallbackReply(stage, text, language) {
  if (language === 'ne') {
    const replies = {
      greeting: 'नमस्ते! म मायालु बोल्दै छु। हामी घर पेन्टिङ, वेब डेभलपमेन्ट, SEO लगायत विभिन्न सेवाहरू प्रदान गर्छौं। म तपाईंलाई कसरी मद्दत गर्न सक्छु?',
      discovery: 'कस्तो सेवा वा प्रोजेक्टको लागि सहयोग चाहिन्छ? कृपया विस्तारमा बताउनुहोस्।',
      qualification: 'बुझें। तपाईंको बजेट र समयावधि कस्तो छ? कुनै विशेष आवश्यकता छ?',
      contact: 'धन्यवाद! टोलीले व्यक्तिगत कोटेशन पठाउनको लागि, कृपया आफ्नो नाम र फोन नम्बर दिनुहोस्।',
      confirmation: 'हुन्छ! तपाईंको आवश्यकता अनुसार टोलीले २४ घण्टा भित्र सम्पर्क गर्नेछ। केही अन्य प्रश्न छ?',
      goodbye: 'कल गर्नुभएकोमा धेरै धेरै धन्यवाद! राम्रो दिनको शुभकामना। नमस्ते!',
    };
    return replies[stage] || replies.greeting;
  }

  const replies = {
    greeting: "Hello! I'm Mayalu from the service team. We offer house painting, web development, SEO, mobile apps, and more. How can I help you today?",
    discovery: "That sounds interesting! Could you tell me a bit more about what you're looking for? What specific service or project do you need?",
    qualification: "I see. To give you the best recommendation — what's your approximate budget and timeline for this?",
    contact: "Great! So we can send you a personalized quote, could you share your name and phone number?",
    confirmation: "Perfect, I've noted everything down. Our team will reach out within 24 hours with a detailed proposal. Is there anything else I can help with?",
    goodbye: "Thank you so much for calling! Have a wonderful day. Goodbye!",
  };
  return replies[stage] || replies.greeting;
}

function isConversationComplete(stage, text) {
  const lower = text.toLowerCase().trim();
  if (stage === 'goodbye') return true;
  return COMPLETION_TRIGGERS.some(t => lower.includes(t));
}

router.post('/greet', async (req, res) => {
  const { language = 'en' } = req.body;
  const sessionId = uuidv4();
  const stage = 'greeting';
  const langKey = language === 'ne' ? 'ne' : 'en';
  const prompt = STAGE_PROMPTS[langKey].greeting;

  const history = [];
  let response;

  const aiReply = await generateAIReply(prompt, history, language);
  if (aiReply) {
    response = aiReply;
  } else {
    response = generateFallbackReply(stage, '', language);
  }

  const session = {
    id: sessionId,
    language,
    stage,
    messages: [
      { role: 'assistant', content: response, isAI: true, text: response },
    ],
    lead: null,
    createdAt: Date.now(),
  };
  sessions[sessionId] = session;

  res.json({
    response,
    sessionId,
    stage,
    isComplete: false,
    lead: null,
  });
});

router.post('/respond', async (req, res) => {
  const { text, language = 'en', sessionId } = req.body;

  if (!text || !text.trim()) {
    return res.status(400).json({ error: 'text is required' });
  }

  let session = sessionId ? sessions[sessionId] : null;
  if (!session) {
    session = {
      id: uuidv4(),
      language,
      stage: 'greeting',
      messages: [],
      lead: null,
      createdAt: Date.now(),
    };
    sessions[session.id] = session;
  }

  session.messages.push({ role: 'user', content: text, isAI: false, text });

  let { stage } = session;
  const langKey = language === 'ne' ? 'ne' : 'en';
  let isComplete = false;
  let response;

  if (shouldAdvanceStage(stage, text)) {
    stage = getNextStage(stage);
    if (stage === 'goodbye') isComplete = true;
    session.stage = stage;
  }

  const prompt = STAGE_PROMPTS[langKey][stage] || STAGE_PROMPTS[langKey].greeting;

  if (isComplete || isConversationComplete(stage, text)) {
    isComplete = true;
    stage = 'goodbye';
    session.stage = stage;
    const byePrompt = STAGE_PROMPTS[langKey].goodbye;
    response = await generateAIReply(byePrompt, session.messages, language) ||
      generateFallbackReply('goodbye', text, language);
  } else {
    response = await generateAIReply(prompt, session.messages, language) ||
      generateFallbackReply(stage, text, language);
  }

  session.messages.push({ role: 'assistant', content: response, isAI: true, text: response });

  let lead = extractLeadFromHistory(session.messages, language);
  if (!lead.name || !lead.phone) lead = null;
  else session.lead = lead;

  setTimeout(() => {
    if (sessions[session.id] && Date.now() - sessions[session.id].createdAt > 30 * 60 * 1000) {
      delete sessions[session.id];
    }
  }, 31 * 60 * 1000);

  res.json({
    response,
    sessionId: session.id,
    stage,
    isComplete,
    lead,
  });
});

router.post('/extract-lead', (req, res) => {
  const { sessionId } = req.body;
  const session = sessionId ? sessions[sessionId] : null;
  if (!session) return res.json({ lead: null });

  const lead = extractLeadFromHistory(session.messages, session.language);
  if (!lead.name && !lead.phone) return res.json({ lead: null });

  session.lead = lead;
  res.json({ lead });
});

module.exports = router;
