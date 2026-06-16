export const dynamic = 'force-dynamic';
import { getDb, run, get, all } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

const firstNames = ['Alice', 'Bob', 'Charlie', 'Diana', 'Eve', 'Frank', 'Grace', 'Hari', 'Isha', 'Jack', 'Kiran', 'Luna', 'Mohan', 'Nina', 'Oscar', 'Priya'];
const lastNames = ['Sharma', 'Smith', 'Gurung', 'Johnson', 'Tamang', 'Brown', 'Rai', 'Davis', 'Magar', 'Wilson'];
const interests = ['House Painting', 'Web Development', 'SEO Optimization', 'Mobile App', 'Shop Renovation', 'Digital Marketing'];
const numberPrefixes = ['+977-984', '+977-985', '+1-555', '+977-986'];

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

export async function POST() {
  await getDb();

  const firstName = pick(firstNames);
  const lastName = pick(lastNames);
  const name = `${firstName} ${lastName}`;
  const phone = `${pick(numberPrefixes)}${String(Math.floor(1000 + Math.random() * 9000))}`;
  const interest = pick(interests);
  const lang = Math.random() > 0.5 ? 'en' : 'ne';
  const statuses = ['completed'];
  const sentiments = ['positive', 'positive', 'neutral'];
  const sentiment = pick(sentiments);
  const duration = Math.floor(120 + Math.random() * 200);

  const callId = uuidv4();
  const now = new Date();
  const created = new Date(now - Math.random() * 86400000 * 3).toISOString();
  const ended = new Date(new Date(created).getTime() + duration * 1000).toISOString();

  const templates = {
    en: [
      `Hi, this is ${name} calling about your ${interest} services. I've been looking for a reliable provider and would like to know more about your packages and pricing. Can you help me with that?`,
      `Hello! My name is ${name}. I'm interested in getting ${interest} done for my project. Could you tell me about the process and how soon you can start?`,
      `Good morning, this is ${name}. I need some ${interest} work and heard great things about your company. Would love to discuss my requirements and get a quote.`,
    ],
    ne: [
      `नमस्ते, म ${name} बोल्दै छु। मलाई ${interest} को बारेमा जानकारी चाहियो। कृपया मलाई तपाईंको प्याकेज र मूल्यको बारेमा बताउन सक्नुहुन्छ?`,
      `नमस्कार! मेरो नाम ${name} हो। म ${interest} सेवा लिन चाहन्छु। कृपया प्रक्रिया र समयावधि बारे बताउनुहोस्।`,
      `हजुर, म ${name}। मलाई ${interest} को लागि कोटेशन चाहिएको थियो। के तपाईं मद्दत गर्न सक्नुहुन्छ?`,
    ],
  };

  const transcript = pick(templates[lang]);
  const summary = `Customer ${name} called inquiring about ${interest}. ${sentiment === 'positive' ? 'Showed strong interest and requested a quote.' : 'Had some questions about services and pricing.'}`;

  run(`INSERT INTO calls (id, caller_number, caller_name, language, status, duration, transcript, summary, sentiment, created_at, ended_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [callId, phone, name, lang, 'completed', duration, transcript, summary, sentiment, created, ended]);

  const leadId = uuidv4();
  const score = sentiment === 'positive' ? Math.floor(70 + Math.random() * 25) : Math.floor(40 + Math.random() * 30);
  const leadStatus = score >= 70 ? 'qualified' : 'new';
  const followUp = new Date(now.getTime() + 86400000 * (1 + Math.floor(Math.random() * 3))).toISOString();

  run(`INSERT INTO leads (id, call_id, name, phone, email, interest, source, score, status, notes, follow_up_date, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, 'call', ?, ?, ?, ?, ?, ?)`,
    [leadId, callId, name, phone, '', interest, score, leadStatus,
     `Customer inquired about ${interest}. ${sentiment === 'positive' ? 'Hot lead - follow up soon.' : 'Neutral interest - send info.'}`,
     followUp, now.toISOString(), now.toISOString()]);

  const call = get('SELECT * FROM calls WHERE id = ?', [callId]);
  const lead = get('SELECT * FROM leads WHERE id = ?', [leadId]);
  const leads = all('SELECT * FROM leads WHERE call_id = ?', [callId]);

  return Response.json({ call: { ...call, leads }, lead });
}
