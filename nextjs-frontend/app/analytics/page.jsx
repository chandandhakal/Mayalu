'use client';

import { useState, useEffect } from 'react';
import { useApp } from '@/lib/contexts';
import { TrendingUp, Globe, PieChart, BarChart3 } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart as RPie, Pie, Cell, Legend,
} from 'recharts';

export default function AnalyticsPage() {
  const { theme: t, T } = useApp();
  const [ov, setOv] = useState(null);
  const [tr, setTr] = useState([]);
  const [se, setSe] = useState(null);
  const [it, setIt] = useState([]);
  const [lg, setLg] = useState([]);
  const [sd, setSd] = useState([]);
  const [l, setL] = useState(true);
  const C = [t.chartPink, t.chartTeal, t.chartAmber, t.chartViolet, t.chartBlue, t.pink];

  useEffect(() => {
    (async () => {
      try {
        const [a, b, c, d, e, f] = await Promise.all([
          fetch('/api/analytics/overview').then(r => r.json()),
          fetch('/api/analytics/trends?days=7').then(r => r.json()),
          fetch('/api/analytics/sentiment').then(r => r.json()),
          fetch('/api/analytics/interests').then(r => r.json()),
          fetch('/api/analytics/languages').then(r => r.json()),
          fetch('/api/analytics/leads-by-score').then(r => r.json()),
        ]);
        setOv(a);
        setTr(Array.isArray(b) ? b : []);
        setSe(c);
        setIt(Array.isArray(d) ? d : []);
        setLg(Array.isArray(e) ? e : []);
        setSd(Array.isArray(f) ? f : []);
      } catch (e) { console.error(e); }
      setL(false);
    })();
  }, []);

  if (l) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 64 }}>
        <div style={{ width: 32, height: 32, border: `2px solid ${t.pink}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
      </div>
    );
  }

  const sd2 = se
    ? [
      { name: T('positive'), value: se.positive, color: t.teal },
      { name: T('neutral'), value: se.neutral, color: t.amber },
      { name: T('negative'), value: se.negative, color: t.red },
    ]
    : [];

  const B = { background: t.card, border: `1px solid ${t.border}`, borderRadius: 14, padding: 24, boxShadow: t.shadow };
  const K = { background: t.surfaceHover, border: `1px solid ${t.border}`, borderRadius: 12, padding: 16, textAlign: 'center' };
  const TT2 = { background: t.surface, border: `1px solid ${t.border}`, borderRadius: 8, color: t.text, boxShadow: t.shadowMd };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <h2 style={{ fontSize: 24, fontWeight: 700, color: t.text, margin: 0 }}>{T('analyticsOverview')}</h2>
        <div style={{ fontSize: 13, color: t.textMuted, marginTop: 4 }}>Deep insights into call performance</div>
      </div>

      {ov && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
          {[
            { l: T('totalCalls'), v: ov.totalCalls, s: `${ov.completedCalls || 0} completed` },
            { l: T('totalLeads'), v: ov.totalLeads, s: `${ov.qualifiedLeads || 0} qualified` },
            { l: T('conversionRate'), v: `${ov.conversionRate || 0}%`, s: `${ov.newLeads || 0} new` },
            { l: T('avgCallDuration'), v: `${ov.avgDuration || 0}s`, s: `score ${ov.avgScore || 0}` },
            { l: T('avgSentiment'), v: `${ov.avgSentimentScore ? (ov.avgSentimentScore * 100).toFixed(0) : 0}%`, s: 'Positive ratio' },
          ].map((k, i) => (
            <div key={i} style={K}>
              <div style={{ fontSize: 11, color: t.textMuted, marginBottom: 4 }}>{k.l}</div>
              <div style={{ fontSize: 24, fontWeight: 700, color: t.text }}>{k.v}</div>
              <div style={{ fontSize: 11, color: t.textPlaceholder, marginTop: 2 }}>{k.s}</div>
            </div>
          ))}
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(440px, 1fr))', gap: 24 }}>
        <div style={B}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: t.textSecondary, margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
            <TrendingUp size={16} color={t.chartPink} />{T('callTrends')}
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={tr}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.border} />
              <XAxis dataKey="date" tick={{ fill: t.textMuted, fontSize: 11 }}
                tickFormatter={d => new Date(d).toLocaleDateString('en', { month: 'short', day: 'numeric' })} />
              <YAxis tick={{ fill: t.textMuted, fontSize: 11 }} />
              <Tooltip contentStyle={TT2} />
              <Legend />
              <Line type="monotone" dataKey="totalCalls" stroke={t.chartPink} strokeWidth={2.5} dot={{ r: 3 }} name="Calls" />
              <Line type="monotone" dataKey="leadsGenerated" stroke={t.chartTeal} strokeWidth={2.5} dot={{ r: 3 }} name="Leads" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div style={B}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: t.textSecondary, margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Globe size={16} color={t.chartTeal} />{T('languageDistribution')}
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <RPie>
              <Pie data={lg} dataKey="count" nameKey="label" cx="50%" cy="50%" outerRadius={90}
                label={({ label, count }) => `${label} (${count})`}>
                {lg.map((_, i) => <Cell key={i} fill={C[i % C.length]} />)}
              </Pie>
              <Tooltip contentStyle={TT2} />
            </RPie>
          </ResponsiveContainer>
        </div>

        <div style={B}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: t.textSecondary, margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
            <PieChart size={16} color={t.chartViolet} />{T('sentimentDistribution')}
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <RPie>
              <Pie data={sd2} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={55} outerRadius={90}
                label={({ name, value }) => `${name}: ${value}`}>
                {sd2.map(e => <Cell key={e.name} fill={e.color} />)}
              </Pie>
              <Tooltip contentStyle={TT2} />
            </RPie>
          </ResponsiveContainer>
        </div>

        <div style={B}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: t.textSecondary, margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
            <BarChart3 size={16} color={t.chartAmber} />{T('leadScoreDistribution')}
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={sd}>
              <CartesianGrid strokeDasharray="3 3" stroke={t.border} />
              <XAxis dataKey="label" tick={{ fill: t.textMuted, fontSize: 10 }} />
              <YAxis tick={{ fill: t.textMuted, fontSize: 11 }} />
              <Tooltip contentStyle={TT2} />
              <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                {sd.map((_, i) => <Cell key={i} fill={C[i]} />)}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div style={B}>
        <h3 style={{ fontSize: 14, fontWeight: 600, color: t.textSecondary, margin: '0 0 16px 0' }}>{T('topInterests')}</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 12 }}>
          {it.map((m, i) => (
            <div key={i} style={K}>
              <div style={{ fontSize: 20, fontWeight: 700, color: t.text }}>{m.count}</div>
              <div style={{ fontSize: 12, color: t.textSecondary, marginTop: 4 }}>{m.interest}</div>
              <div style={{ fontSize: 11, color: t.pink, marginTop: 2 }}>avg {m.avg_score}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
