'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useApp } from '@/lib/contexts';
import {
  ArrowLeft, Clock, MessageSquare, ThumbsUp, Phone, Mail, Calendar, Tag,
  User, Globe, Users, Plus, Edit3, Activity, AlertCircle, CheckCircle, Play, ChevronRight,
} from 'lucide-react';

export default function CallDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { theme: t, T } = useApp();
  const [call, setCall] = useState(null);
  const [l, setL] = useState(true);

  useEffect(() => {
    setL(true);
    fetch(`/api/calls/${id}`).then(r => r.json()).then(setCall).catch(console.error).finally(() => setL(false));
  }, [id]);

  const fmt = (d, s = 'full') => {
    if (!d) return '—';
    const dt = new Date(d);
    if (s === 'time') return dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    if (s === 'date') return dt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
    return dt.toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  if (l) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
        <div style={{ width: 30, height: 30, border: `2px solid ${t.pink}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
      </div>
    );
  }

  if (!call || call.error) {
    return (
      <div style={{ textAlign: 'center', padding: 80 }}>
        <div style={{ fontSize: 42, marginBottom: 12 }}>&#x1F50D;</div>
        <div style={{ fontSize: 18, fontWeight: 600, color: t.textSecondary, marginBottom: 8 }}>Call Not Found</div>
        <button onClick={() => router.push('/calls')} style={{ padding: '6px 14px', borderRadius: 8, border: `1px solid ${t.pink}30`, background: `${t.pink}10`, color: t.pink, fontSize: 12, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 }}>
          &larr; Back
        </button>
      </div>
    );
  }

  const ST = {
    active: { l: 'Active', c: t.teal, icon: Activity },
    in_progress: { l: 'In Progress', c: t.amber, icon: Activity },
    completed: { l: 'Completed', c: t.blue, icon: CheckCircle },
    missed: { l: 'Missed', c: t.red, icon: AlertCircle },
  };
  const st = ST[call.status] || ST.completed;
  const SI = st.icon;
  const iv = call.status === 'active' || call.status === 'in_progress';
  const cp = call.status === 'completed';
  const lds = call.leads || [];
  const sc = call.sentiment === 'positive' ? t.teal : call.sentiment === 'negative' ? t.red : t.amber;

  const tl = [];
  tl.push({ t: call.created_at, l: 'Call started', c: t.teal });
  if (call.transcript) tl.push({ t: call.created_at, l: 'Conversation recorded', c: t.amber });
  if (call.summary) tl.push({ t: call.ended_at || call.created_at, l: 'AI summary', c: t.violet });
  if (lds.length) tl.push({ t: call.ended_at || call.created_at, l: `${lds.length} lead(s)`, c: t.teal });
  if (call.ended_at) tl.push({ t: call.ended_at, l: `Ended (${Math.floor(call.duration / 60)}m)`, c: t.blue });
  else if (iv) tl.push({ t: new Date().toISOString(), l: 'In progress...', c: t.teal });

  const BD = c => ({ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 10px', borderRadius: 20, fontSize: 11, fontWeight: 500, background: `${c}18`, border: `1px solid ${c}30`, color: c });
  const BB = c => ({ padding: '6px 14px', borderRadius: 8, border: `1px solid ${c}30`, background: `${c}10`, color: c, fontSize: 12, fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 5 });

  return (
    <div style={{ maxWidth: 900, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
        <button onClick={() => router.push('/calls')} style={{
          background: 'none', border: 'none', color: t.textMuted, fontSize: 14,
          cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, padding: '8px 0',
        }}><ArrowLeft size={16} /> Back</button>
        <div style={{ display: 'flex', gap: 8 }}>
          {iv && <button onClick={() => router.push('/calls')} style={BB(t.teal)}><Play size={13} /> Complete</button>}
          <button onClick={() => router.push('/leads')} style={BB(t.violet)}><Users size={13} /> View Leads</button>
        </div>
      </div>

      {!cp && (
        <div style={{
          background: st.c === t.teal ? t.tealBg : st.c === t.amber ? t.amberBg : t.redBg,
          border: `1px solid ${st.c === t.teal ? t.tealBorder : st.c === t.amber ? t.amberBorder : t.redBorder}`,
          borderRadius: 12, padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <SI size={20} color={st.c} />
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: st.c }}>{st.l} Call</div>
            <div style={{ fontSize: 13, color: t.textMuted, marginTop: 2 }}>{iv ? 'Call is active. Data updates live.' : ''}</div>
          </div>
        </div>
      )}

      <div style={{ background: t.card, border: `1px solid ${t.border}`, borderRadius: 14, padding: 24, boxShadow: t.shadow }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 48, height: 48, borderRadius: '50%', background: `linear-gradient(135deg,${st.c},${st.c}88)`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <User size={22} color="#fff" />
            </div>
            <div>
              <h2 style={{ fontSize: 22, fontWeight: 700, color: t.text, margin: 0 }}>{call.caller_name || 'Unknown'}</h2>
              <div style={{ color: t.textMuted, fontFamily: 'monospace', fontSize: 14 }}>{call.caller_number}</div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span style={BD(st.c)}><span style={{ width: 5, height: 5, borderRadius: '50%', background: st.c, display: 'inline-block', marginRight: 4 }} />{st.l}</span>
            {call.sentiment && <span style={BD(sc)}><ThumbsUp size={11} />{call.sentiment}</span>}
            <span style={BD(t.textMuted)}><Globe size={11} />{call.language === 'ne' ? 'नेपाली' : 'EN'}</span>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10, marginBottom: 20 }}>
          {[
            { icon: Clock, l: 'Duration', v: call.duration > 0 ? `${Math.floor(call.duration / 60)}m ${call.duration % 60}s` : '—', sub: call.duration > 0 ? `${call.duration}s` : iv ? 'Ongoing' : '', c: t.pink },
            { icon: Calendar, l: 'Started', v: fmt(call.created_at, 'date'), sub: fmt(call.created_at, 'time'), c: t.amber },
            { icon: Calendar, l: iv ? 'Last Activity' : 'Ended', v: call.ended_at ? fmt(call.ended_at, 'date') : '—', sub: call.ended_at ? fmt(call.ended_at, 'time') : iv ? 'Active' : '', c: t.violet },
            { icon: Users, l: 'Leads', v: lds.length, sub: lds.length ? `${lds.filter(ld => ld.status === 'qualified').length} qualified` : 'None', c: t.teal },
            { icon: Globe, l: 'Language', v: call.language === 'ne' ? 'नेपाली' : 'English', sub: call.language === 'ne' ? 'Nepali' : 'English', c: t.blue },
          ].map((m, i) => (
            <div key={i} style={{ background: t.surfaceHover, border: `1px solid ${t.border}`, borderRadius: 10, padding: 14 }}>
              <div style={{ fontSize: 10, color: t.textMuted, textTransform: 'uppercase', letterSpacing: .5, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}>
                <m.icon size={11} color={m.c} />{m.l}
              </div>
              <div style={{ fontSize: 15, fontWeight: 600, color: t.text }}>{m.v}</div>
              <div style={{ fontSize: 11, color: t.textPlaceholder, marginTop: 2 }}>{m.sub}</div>
            </div>
          ))}
        </div>

        <div style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 13, fontWeight: 600, color: t.textSecondary, margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Activity size={14} color={t.pink} />Timeline
          </h3>
          <div style={{ position: 'relative', paddingLeft: 24 }}>
            <div style={{ position: 'absolute', left: 7, top: 4, bottom: 4, width: 2, background: t.timelineLine }} />
            {tl.map((e, i) => (
              <div key={i} style={{ position: 'relative', paddingBottom: 16 }}>
                <div style={{ position: 'absolute', left: -2, top: 4, width: 10, height: 10, borderRadius: '50%', background: e.c, border: `2px solid ${t.surface}` }} />
                <div style={{ fontSize: 11, color: t.textMuted, marginBottom: 2 }}>{fmt(e.t, 'time')}</div>
                <div style={{ fontSize: 13, color: t.textSecondary }}>{e.l}</div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ height: 1, background: t.border, margin: '20px 0' }} />

        <div style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 13, fontWeight: 600, color: t.textSecondary, margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
            <MessageSquare size={14} color={t.pink} />Transcript
          </h3>
          {call.transcript ? (
            <div style={{ background: t.codeBg, border: `1px solid ${t.border}`, borderRadius: 10, padding: 16, color: t.textSecondary, fontSize: 13, lineHeight: 1.7, whiteSpace: 'pre-wrap', maxHeight: 220, overflow: 'auto' }}>
              {call.transcript}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '30px 20px', color: t.textMuted, border: `1px dashed ${t.emptyBorder}`, borderRadius: 10 }}>
              <MessageSquare size={20} color={t.textPlaceholder} style={{ marginBottom: 8 }} />
              <div style={{ fontSize: 13, fontWeight: 500 }}>{iv ? 'Recording in progress...' : 'No transcript'}</div>
            </div>
          )}
        </div>

        <div style={{ marginBottom: 20 }}>
          <h3 style={{ fontSize: 13, fontWeight: 600, color: t.textSecondary, margin: '0 0 10px 0', display: 'flex', alignItems: 'center', gap: 8 }}>
            <ThumbsUp size={14} color={t.teal} />AI Summary
          </h3>
          {call.summary ? (
            <div style={{ background: t.codeBg, border: `1px solid ${t.border}`, borderRadius: 10, padding: 16, color: t.textSecondary, fontSize: 13, lineHeight: 1.7 }}>
              {call.summary}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '30px 20px', color: t.textMuted, border: `1px dashed ${t.emptyBorder}`, borderRadius: 10 }}>
              <ThumbsUp size={20} color={t.textPlaceholder} style={{ marginBottom: 8 }} />
              <div style={{ fontSize: 13, fontWeight: 500 }}>{iv ? 'Awaiting AI summary...' : 'No summary'}</div>
            </div>
          )}
        </div>
      </div>

      <div style={{ background: t.card, border: `1px solid ${lds.length ? t.tealBorder : t.border}`, borderRadius: 14, padding: 24, boxShadow: t.shadow }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: lds.length ? 14 : 0 }}>
          <h3 style={{ fontSize: 14, fontWeight: 600, color: t.textSecondary, margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Users size={14} color={t.teal} />Leads{lds.length > 0 && <span style={{ color: t.teal }}>({lds.length})</span>}
          </h3>
          {lds.length > 0 && <button onClick={() => router.push('/leads')} style={BB(t.violet)}>View All <ChevronRight size={12} /></button>}
        </div>
        {lds.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {lds.map(ld => (
              <div key={ld.id} style={{ background: t.surfaceHover, border: `1px solid ${t.border}`, borderRadius: 10, padding: '12px 16px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', transition: 'all .15s' }}
                onClick={() => router.push('/leads')}
                onMouseEnter={e => e.currentTarget.style.borderColor = t.textPlaceholder}
                onMouseLeave={e => e.currentTarget.style.borderColor = t.border}
              >
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: t.text }}>{ld.name}</div>
                  <div style={{ fontSize: 12, color: t.textMuted, marginTop: 2 }}>
                    <Phone size={10} style={{ verticalAlign: 'middle', marginRight: 3 }} />{ld.phone}
                    {ld.email && <span> · <Mail size={10} style={{ verticalAlign: 'middle', marginRight: 3 }} />{ld.email}</span>}
                  </div>
                  <div style={{ fontSize: 12, color: t.textMuted, marginTop: 2 }}>
                    <Tag size={10} style={{ verticalAlign: 'middle', marginRight: 3 }} />{ld.interest || 'General'} · <strong style={{ color: ld.score >= 80 ? t.teal : ld.score >= 50 ? t.amber : t.red }}>{ld.score}</strong>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={BD(ld.status === 'qualified' ? t.teal : ld.status === 'contacted' ? t.blue : t.textMuted)}>{T(ld.status)}</span>
                  <button onClick={e => { e.stopPropagation(); router.push('/leads'); }} style={{ padding: '4px 8px', borderRadius: 6, border: `1px solid ${t.pinkBorder}`, background: t.pinkBg, color: t.pink, fontSize: 11, cursor: 'pointer' }}>
                    <Edit3 size={10} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: '24px', color: t.textMuted }}>
            <Users size={20} color={t.textPlaceholder} style={{ marginBottom: 8 }} />
            <div style={{ fontSize: 13, fontWeight: 500 }}>{iv ? 'No leads yet — call active' : 'No leads'}</div>
            <button onClick={() => router.push('/leads')} style={{ ...BB(t.teal), marginTop: 12 }}><Plus size={12} /> Create Lead</button>
          </div>
        )}
      </div>
    </div>
  );
}
