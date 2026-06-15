const OpenAI = require('openai');

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

function isAiAvailable() {
  return !!getClient();
}

async function generateTranscript({ callerName, callerNumber, language, interest, previousContext }) {
  const client = getClient();
  if (!client) return fallbackTranscript(callerName, language, interest);

  const langName = language === 'ne' ? 'Nepali' : 'English';
  const prompt = language === 'ne'
    ? `तपाईं एक फोन कलर हुनुहुन्छ जसले "${interest || 'सेवा'}" बारे सोध्दै हुनुहुन्छ। तपाईंको नाम ${callerName} हो। एक यथार्थपूर्ण नेपाली टेलिफोन कुराकानी उत्पन्न गर्नुहोस्। कुराकानी प्राकृतिक हुनुपर्छ, नमस्तेबाट सुरु गर्नुहोस्। 4-6 वाक्य मात्र लेख्नुहोस्। कुनै स्टेज निर्देशन वा कोष्ठक नलेख्नुहोस्।`
    : `You are a phone caller named ${callerName} calling a service company about "${interest || 'their services'}". Generate a realistic English telephone conversation script. Keep it natural, 4-6 sentences starting with a greeting. Do not include stage directions or brackets. Just the caller's dialogue.`;

  try {
    const response = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'You generate realistic phone call transcripts. Output only the dialogue, no commentary.' },
        { role: 'user', content: prompt }
      ],
      max_tokens: 300,
      temperature: 0.8,
    });
    return response.choices[0].message.content.trim();
  } catch (err) {
    console.error('AI transcript generation failed:', err.message);
    return fallbackTranscript(callerName, language, interest);
  }
}

async function analyzeSentiment(transcript) {
  const client = getClient();
  if (!client) return fallbackSentiment(transcript);

  try {
    const response = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Analyze the sentiment of this phone call transcript. Reply with exactly one word: positive, neutral, or negative.' },
        { role: 'user', content: transcript }
      ],
      max_tokens: 10,
      temperature: 0.1,
    });
    const sentiment = response.choices[0].message.content.trim().toLowerCase();
    return ['positive', 'neutral', 'negative'].includes(sentiment) ? sentiment : 'neutral';
  } catch (err) {
    console.error('AI sentiment analysis failed:', err.message);
    return fallbackSentiment(transcript);
  }
}

async function generateSummary(transcript) {
  const client = getClient();
  if (!client) return fallbackSummary(transcript);

  try {
    const response = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: 'Summarize this phone call transcript in 1-2 sentences. Be concise.' },
        { role: 'user', content: transcript }
      ],
      max_tokens: 150,
      temperature: 0.4,
    });
    return response.choices[0].message.content.trim();
  } catch (err) {
    console.error('AI summary generation failed:', err.message);
    return fallbackSummary(transcript);
  }
}

async function extractLeadInfo(transcript, callerName, callerNumber) {
  const client = getClient();
  if (!client) return fallbackLeadInfo(transcript, callerName, callerNumber);

  try {
    const response = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [
        { role: 'system', content: `Extract lead information from this call transcript. Return ONLY valid JSON with these fields:
{
  "name": "customer name or null",
  "phone": "phone number or null",
  "email": "email or null",
  "interest": "what they are interested in (e.g. Web Development, Painting, SEO, etc.)",
  "score": number 0-100 indicating lead quality,
  "notes": "brief follow-up notes",
  "followUpNeeded": true/false
}` },
        { role: 'user', content: `Caller: ${callerName} (${callerNumber})\n\nTranscript: ${transcript}` }
      ],
      max_tokens: 300,
      temperature: 0.3,
    });
    const content = response.choices[0].message.content.trim();
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return fallbackLeadInfo(transcript, callerName, callerNumber);
  } catch (err) {
    console.error('AI lead extraction failed:', err.message);
    return fallbackLeadInfo(transcript, callerName, callerNumber);
  }
}

function fallbackTranscript(callerName, language, interest) {
  const topic = interest || 'services';
  if (language === 'ne') {
    const templates = [
      `नमस्ते, म ${callerName} बोल्दै छु। मलाई ${topic} को बारेमा जानकारी चाहियो। कृपया मलाई यसको बारेमा बताउन सक्नुहुन्छ? म केही समयदेखि यो सेवा खोजिरहेको थिएँ। तपाईंको मूल्य र समयावधि कति होला?`,
      `नमस्कार! मेरो नाम ${callerName} हो। म ${topic} सेवा लिन चाहन्छु। मसँग केही प्रश्नहरू छन्। के तपाईं मलाई उपलब्ध प्याकेजहरू बारे बताउन सक्नुहुन्छ?`,
      `हजुर, म ${callerName}। मलाई ${topic} को लागि कोटेशन चाहिएको थियो। मेरो प्रोजेक्टको बारेमा केही विवरण दिन चाहन्छु। के तपाईं मद्दत गर्न सक्नुहुन्छ?`,
    ];
    return templates[Math.floor(Math.random() * templates.length)];
  }
  const templates = [
    `Hi, this is ${callerName} speaking. I'm calling to inquire about your ${topic} services. I've been looking for a reliable provider and came across your company. Could you tell me more about what you offer and your pricing?`,
    `Hello! My name is ${callerName}. I'm interested in ${topic} and would like to discuss how your team could help. I have a project in mind and would love to get an estimate.`,
    `Good morning, this is ${callerName}. I need some ${topic} work done and was wondering if you could walk me through your process and typical timelines. I've heard good things about your company.`,
  ];
  return templates[Math.floor(Math.random() * templates.length)];
}

function fallbackSentiment(transcript) {
  const positive = ['interested', 'great', 'good', 'excellent', 'thank', 'thanks', 'looking forward', 'excited', 'impressed', 'helpful'];
  const negative = ['disappointed', 'expensive', 'not interested', 'sorry', 'cancelled', 'too much', 'bad', 'poor', 'unhappy'];
  const lower = transcript.toLowerCase();
  let score = 0;
  positive.forEach(w => { if (lower.includes(w)) score += 1; });
  negative.forEach(w => { if (lower.includes(w)) score -= 1; });
  if (score > 0) return 'positive';
  if (score < 0) return 'negative';
  return 'neutral';
}

function fallbackSummary(transcript) {
  const short = transcript.length > 150 ? transcript.slice(0, 150) + '...' : transcript;
  return `Customer called inquiring about services. ${short}`;
}

function fallbackLeadInfo(transcript, callerName, callerNumber) {
  const interestPatterns = [
    { keywords: ['paint', 'painting', 'color', 'wall'], interest: 'House Painting' },
    { keywords: ['web', 'website', 'development', 'app'], interest: 'Web Development' },
    { keywords: ['seo', 'ranking', 'google', 'search'], interest: 'SEO Optimization' },
    { keywords: ['mobile', 'app', 'android', 'ios'], interest: 'Mobile App' },
    { keywords: ['renovation', 'renovate', 'repair', 'shop'], interest: 'Renovation' },
    { keywords: ['digital', 'marketing', 'social media'], interest: 'Digital Marketing' },
    { keywords: ['content', 'writing', 'blog'], interest: 'Content Writing' },
  ];
  const lower = transcript.toLowerCase();
  let interest = 'General Inquiry';
  let topScore = 0;
  interestPatterns.forEach(p => {
    const matchCount = p.keywords.filter(k => lower.includes(k)).length;
    if (matchCount > topScore) { topScore = matchCount; interest = p.interest; }
  });

  const positivity = fallbackSentiment(transcript);
  const baseScore = positivity === 'positive' ? 70 : positivity === 'neutral' ? 50 : 30;
  const transcriptLengthBonus = Math.min(transcript.length / 20, 20);
  const score = Math.min(95, Math.round(baseScore + transcriptLengthBonus));

  return {
    name: callerName || null,
    phone: callerNumber || null,
    email: null,
    interest,
    score,
    notes: `Caller inquired about ${interest}. ${positivity === 'positive' ? 'Showed strong interest.' : positivity === 'neutral' ? 'Neutral response.' : 'May need follow-up.'}`,
    followUpNeeded: true,
  };
}

module.exports = {
  isAiAvailable,
  generateTranscript,
  analyzeSentiment,
  generateSummary,
  extractLeadInfo,
};
