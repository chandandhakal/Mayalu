'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/contexts';
import {
  Phone, Users, TrendingUp, Clock, ThumbsUp, BarChart3, Headphones, Sparkles, Plus, Loader2
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import { VoiceCall } from '@/components/VoiceCall';

export default function DashboardPage() {
  const { theme: t, T } = useApp();
  const [stats, setStats] = useState(null);
  const [trends, setTrends] = useState([]);
  const [sent, setSent] = useState(null);
  const [err, setErr] = useState(false);
  const [vc, setVc] = useState(false);
  const [gen, setGen] = useState(false);
  const router = useRouter();

  const fd = async () => {
    setErr(false);
    try {
      const [s, tr, se] = await Promise.all([
        fetch('/api/stats').then(r => r.json()),
        fetch('/api/analytics/trends?days=7').then(r => r.json()),
        fetch('/api/analytics/sentiment').then(r => r.json()),
      ]);
      setStats(s);
      setTrends(Array.isArray(tr) ? tr : []);
      setSent(se);
    } catch (e) {
      console.error(e);
      setErr(true);
    }
  };

  const genTest = async () => {
    setGen(true);
    try {
      await fetch('/api/test/generate', { method: 'POST' });
      await fd();
    } catch (e) {
      console.error(e);
      setErr(true);
    }
    setGen(false);
  };

  useEffect(() => { fd(); }, []);

  if (!stats && !err) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
        <div style={{
          width: 32, height: 32, border: `3px solid ${t.pink}`,
          borderTopColor: 'transparent', borderRadius: '50%',
          animation: 'spin .7s linear infinite',
        }} />
      </div>
    );
  }

  const cr = stats
    ? ((stats.totalLeads / Math.max(stats.totalCalls - (stats.activeCalls || 0), 1)) * 100).toFixed(1)
    : '0';

  const meta = stats ? [
    { icon: Phone, label: T('totalCalls'), value: stats.totalCalls, sub: `${stats.activeCalls || 0} active`, c: t.pink, bg: t.pinkBg, br: t.pinkBorder },
    { icon: Users, label: T('totalLeads'), value: stats.totalLeads, sub: `${stats.qualifiedLeads || 0} qualified`, c: t.teal, bg: t.tealBg, br: t.tealBorder },
    { icon: TrendingUp, label: T('conversionRate'), value: `${cr}%`, sub: `Score: ${stats.avgLeadScore || 0}`, c: t.amber, bg: t.amberBg, br: t.amberBorder },
    { icon: Clock, label: T('avgCallDuration'), value: `${stats.avgCallDuration || 0}s`, sub: `Sent: ${stats.avgSentiment ? (stats.avgSentiment * 100).toFixed(0) : 0}%`, c: t.violet, bg: t.violetBg, br: t.violetBorder },
  ] : [];

  const btnBase = {
    display: 'flex', alignItems: 'center', gap: 7,
    padding: '10px 20px', borderRadius: 10, border: 'none',
    cursor: 'pointer', color: '#fff', fontSize: 14, fontWeight: 600,
    boxShadow: '0 4px 20px rgba(37,99,235,.3)', transition: 'all .2s',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24, animation: 'fadeUp .3s' }}>
      {vc && <VoiceCall T={T} theme={t} onEnd={() => { setVc(false); fd(); }} />}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 26, fontWeight: 700, color: t.text, margin: 0 }}>{T('dashboard')}</h2>
          <div style={{ fontSize: 13, color: t.textMuted, marginTop: 4 }}>Welcome back</div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={() => setVc(true)}
            style={{
              ...btnBase,
              background: 'linear-gradient(135deg,#2563eb,#1d4ed8)',
            }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 25px rgba(37,99,235,.4)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(37,99,235,.3)'; }}
          >
            <Headphones size={16} /> Voice Demo
          </button>
          <button
            onClick={genTest}
            disabled={gen}
            style={{
              display: 'flex', alignItems: 'center', gap: 7, padding: '10px 18px',
              borderRadius: 10, border: 'none', cursor: gen ? 'wait' : 'pointer',
              background: 'linear-gradient(135deg,#10b981,#059669)', color: '#fff',
              fontSize: 13, fontWeight: 600, opacity: gen ? 0.7 : 1,
            }}
          >{gen ? <><Loader2 size={14} style={{animation: 'spin .7s linear infinite'}} /> Generating...</> : <><Plus size={14} /> Test Call</>}</button>
          <button
            onClick={fd}
            style={{
              padding: '10px 18px', borderRadius: 10, cursor: 'pointer', fontSize: 13,
              fontWeight: 500, background: t.btnGhostBg, border: `1px solid ${t.btnGhostBorder}`,
              color: t.btnGhostColor,
            }}
          >{T('refresh')}</button>
        </div>
      </div>

      {err && (
        <div style={{
          background: t.redBg, border: `1px solid ${t.redBorder}`, borderRadius: 10,
          padding: 14, color: t.red, fontSize: 13, display: 'flex', alignItems: 'center', gap: 8,
        }}>
          <Sparkles size={16} /> Backend not connected — start the server on port 3001
        </div>
      )}

      {stats && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            {meta.map((m, i) => (
              <div key={i} style={{
                background: t.card, border: `1px solid ${m.br}`, borderRadius: 14,
                padding: 22, boxShadow: t.shadow, transition: 'all .2s',
                animation: `fadeUp .3s ease-out ${i * .05}s both`,
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                  <span style={{ fontSize: 11, color: t.textMuted, fontWeight: 600, textTransform: 'uppercase', letterSpacing: .5 }}>{m.label}</span>
                  <div style={{ width: 36, height: 36, borderRadius: 10, background: m.bg, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <m.icon size={18} color={m.c} />
                  </div>
                </div>
                <div style={{ fontSize: 28, fontWeight: 700, color: t.text }}>{m.value}</div>
                <div style={{ fontSize: 12, color: t.textMuted, marginTop: 6 }}>{m.sub}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
            <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 14, padding: 24, boxShadow: t.shadow }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: t.textSecondary, margin: '0 0 18px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                <BarChart3 size={16} color={t.chartPink} />{T('callTrends')}
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <AreaChart data={trends}>
                  <defs>
                    <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={t.chartPink} stopOpacity={.3} />
                      <stop offset="95%" stopColor={t.chartPink} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={t.chartTeal} stopOpacity={.3} />
                      <stop offset="95%" stopColor={t.chartTeal} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={t.border} />
                  <XAxis dataKey="date" tick={{ fill: t.textMuted, fontSize: 11 }}
                    tickFormatter={d => new Date(d).toLocaleDateString('en', { month: 'short', day: 'numeric' })} />
                  <YAxis tick={{ fill: t.textMuted, fontSize: 11 }} />
                  <Tooltip contentStyle={{
                    background: t.surface, border: `1px solid ${t.border}`,
                    borderRadius: 8, color: t.text, boxShadow: t.shadowMd,
                  }} />
                  <Area dataKey="totalCalls" stroke={t.chartPink} fill="url(#g1)" strokeWidth={2.5} name="Calls" />
                  <Area dataKey="leadsGenerated" stroke={t.chartTeal} fill="url(#g2)" strokeWidth={2.5} name="Leads" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 14, padding: 24, boxShadow: t.shadow }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: t.textSecondary, margin: '0 0 18px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
                <ThumbsUp size={16} color={t.chartTeal} />{T('sentimentDistribution')}
              </h3>
              {sent && (() => {
                const total = (sent.positive || 0) + (sent.neutral || 0) + (sent.negative || 0) || 1;
                return [
                  { k: 'positive', v: sent.positive, c: t.teal },
                  { k: 'neutral', v: sent.neutral, c: t.amber },
                  { k: 'negative', v: sent.negative, c: t.red },
                ].map(s => (
                  <div key={s.k} style={{ marginBottom: 18 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 6 }}>
                      <span style={{ color: t.textMuted }}>{T(s.k)}</span>
                      <span style={{ color: t.textSecondary, fontWeight: 500 }}>{s.v} ({((s.v / total) * 100).toFixed(0)}%)</span>
                    </div>
                    <div style={{ height: 10, background: t.borderLight, borderRadius: 5, overflow: 'hidden' }}>
                      <div style={{
                        height: '100%', borderRadius: 5, transition: 'width .6s',
                        width: `${(s.v / total) * 100}%`, background: s.c,
                      }} />
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>

          <div style={{
            background: t.card, border: `1px solid ${t.tealBorder}`, borderRadius: 14,
            padding: 20, boxShadow: t.shadow, display: 'flex', alignItems: 'center', gap: 16,
          }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12, background: t.tealBg,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Phone size={22} color={t.teal} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: t.text }}>Phone Calling Available</div>
              <div style={{ fontSize: 12, color: t.textMuted, marginTop: 2 }}>
                Open <a href="/voice" style={{ color: t.accent }}>voice chat</a> or set up Twilio for real phone calls.
              </div>
            </div>
            <button
              onClick={() => setVc(true)}
              style={{
                ...btnBase, flexShrink: 0, background: 'linear-gradient(135deg,#2563eb,#1d4ed8)',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)'; e.currentTarget.style.boxShadow = '0 6px 25px rgba(37,99,235,.4)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 20px rgba(37,99,235,.3)'; }}
            >
              <Headphones size={16} /> Voice Demo
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
            {[
              { icon: Phone, label: T('liveCallMonitor'), sub: T('simulateCall'), c: t.pink, bg: t.pinkBg, br: t.pinkBorder, path: '/calls' },
              { icon: Users, label: T('leads'), sub: T('viewManage'), c: t.teal, bg: t.tealBg, br: t.tealBorder, path: '/leads' },
              { icon: BarChart3, label: T('analytics'), sub: T('deepInsights'), c: t.violet, bg: t.violetBg, br: t.violetBorder, path: '/analytics' },
            ].map((m, i) => (
              <button
                key={i}
                onClick={() => router.push(m.path)}
                style={{
                  background: m.bg, border: `1px solid ${m.br}`, borderRadius: 12,
                  padding: 18, textAlign: 'left', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 14, transition: 'all .2s',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = t.shadowMd; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <div style={{
                  width: 42, height: 42, borderRadius: 10, background: m.bg,
                  border: `1px solid ${m.br}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <m.icon size={20} color={m.c} />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: t.text }}>{m.label}</div>
                  <div style={{ fontSize: 12, color: t.textMuted, marginTop: 2 }}>{m.sub}</div>
                </div>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
