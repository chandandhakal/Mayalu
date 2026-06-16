'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/contexts';
import { Search, Plus, Play, Clock, User, MessageSquare, ChevronRight, RefreshCw } from 'lucide-react';

export default function CallsPage() {
  const { theme: t, T } = useApp();
  const [calls, setCalls] = useState([]);
  const [l, setL] = useState(true);
  const [s, setS] = useState('');
  const [sf, setSf] = useState('');
  const [sh, setSh] = useState(false);
  const [f, setF] = useState({ cn: '+977-', cnm: '', lg: 'en', d: 120, st: 'positive' });
  const router = useRouter();

  const fc = async () => {
    setL(true);
    try {
      const p = new URLSearchParams();
      if (sf) p.set('status', sf);
      if (s) p.set('search', s);
      const r = await fetch('/api/calls?' + p);
      const d = await r.json();
      setCalls(Array.isArray(d.calls) ? d.calls : []);
    } catch (e) { console.error(e); }
    setL(false);
  };

  useEffect(() => { fc(); }, [sf]);

  const sc = async () => {
    if (!f.cn) return;
    try {
      await fetch('/api/calls', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caller_number: f.cn, caller_name: f.cnm || 'Unknown', language: f.lg }),
      });
      fc();
      setSh(false);
      setF({ cn: '+977-', cnm: '', lg: 'en', d: 120, st: 'positive' });
    } catch (e) { console.error(e); }
  };

  const rs = async (id) => {
    try {
      await fetch(`/api/calls/${id}/simulate`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          duration: f.d,
          transcript: 'Customer called about services. Discussed requirements & pricing.',
          summary: 'Service inquiry. Requirements & pricing discussed. Lead info requested.',
          sentiment: f.st,
        }),
      });
      fc();
    } catch (e) { console.error(e); }
  };

  const ac = calls.filter(c => c.status === 'active' || c.status === 'in_progress').length;

  const ST = {
    active: { l: 'Active', c: t.teal, bg: t.tealBg, br: t.tealBorder },
    in_progress: { l: 'In Progress', c: t.amber, bg: t.amberBg, br: t.amberBorder },
    completed: { l: 'Completed', c: t.blue, bg: t.blueBg, br: t.blueBorder },
    missed: { l: 'Missed', c: t.red, bg: t.redBg, br: t.redBorder },
  };

  const IS = {
    width: '100%', background: t.inputBg, border: `1px solid ${t.inputBorder}`,
    borderRadius: 10, padding: '10px 14px', color: t.text, fontSize: 13,
    outline: 'none', boxSizing: 'border-box',
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h2 style={{ fontSize: 24, fontWeight: 700, color: t.text, margin: 0 }}>{T('calls')}</h2>
          <div style={{ fontSize: 13, color: t.textMuted, marginTop: 4 }}>{calls.length} total · {ac} active</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={fc} style={{
            padding: '9px 16px', borderRadius: 10, cursor: 'pointer', fontSize: 13,
            fontWeight: 500, background: t.btnGhostBg, border: `1px solid ${t.btnGhostBorder}`, color: t.btnGhostColor,
          }}><RefreshCw size={13} /> {T('refresh')}</button>
          <button onClick={() => setSh(true)} style={{
            display: 'flex', alignItems: 'center', gap: 7, padding: '9px 18px',
            borderRadius: 10, border: 'none', cursor: 'pointer',
            background: 'linear-gradient(135deg,#2563eb,#1d4ed8)', color: '#fff',
            fontSize: 13, fontWeight: 600, boxShadow: '0 3px 15px rgba(37,99,235,.25)',
          }}><Plus size={15} /> {T('newCall')}</button>
        </div>
      </div>

      {sh && (
        <div style={{
          position: 'fixed', inset: 0, zIndex: 100, display: 'flex',
          alignItems: 'center', justifyContent: 'center', background: t.overlay,
          backdropFilter: 'blur(4px)',
        }} onClick={() => setSh(false)}>
          <div style={{
            background: t.surface, border: `1px solid ${t.border}`, borderRadius: 16,
            padding: 24, width: '90%', maxWidth: 420, boxShadow: t.shadowMd,
          }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 700, color: t.text, margin: '0 0 16px 0' }}>{T('simulateCall')}</h3>
            <div style={{ gap: 12, display: 'flex', flexDirection: 'column' }}>
              <input placeholder={T('callerNumber')} value={f.cn} onChange={e => setF(p => ({ ...p, cn: e.target.value }))} style={IS} />
              <input placeholder={T('callerName')} value={f.cnm} onChange={e => setF(p => ({ ...p, cnm: e.target.value }))} style={IS} />
              <select value={f.lg} onChange={e => setF(p => ({ ...p, lg: e.target.value }))} style={IS}>
                <option value="en">English</option>
                <option value="ne">Nepali</option>
              </select>
              <button onClick={sc} style={{
                justifyContent: 'center', padding: '12px', borderRadius: 10, border: 'none',
                cursor: 'pointer', background: 'linear-gradient(135deg,#10b981,#059669)',
                color: '#fff', fontSize: 14, fontWeight: 600, display: 'flex',
                alignItems: 'center', gap: 8,
              }}><Play size={16} /> {T('startCall')}</button>
              <button onClick={() => setSh(false)} style={{
                background: 'none', border: 'none', color: t.textMuted, fontSize: 13, cursor: 'pointer', padding: 8,
              }}>{T('cancel')}</button>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
          <Search size={15} color={t.textMuted} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }} />
          <input value={s} onChange={e => setS(e.target.value)} onKeyDown={e => e.key === 'Enter' && fc()}
            placeholder={T('searchPlaceholder')} style={{ ...IS, paddingLeft: 38 }} />
        </div>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {[{ k: '', l: T('all') }, { k: 'active', l: 'Active' }, { k: 'in_progress', l: 'In Progress' },
            { k: 'completed', l: 'Completed' }, { k: 'missed', l: 'Missed' }].map(st => (
            <button key={st.k} onClick={() => setSf(st.k)} style={{
              padding: '6px 14px', borderRadius: 20,
              border: `1px solid ${sf === st.k ? (ST[st.k]?.br || t.border) : t.border}`,
              background: sf === st.k ? (ST[st.k]?.bg || t.btnGhostBg) : 'transparent',
              color: sf === st.k ? (ST[st.k]?.c || t.text) : t.textMuted,
              fontSize: 12, fontWeight: 500, cursor: 'pointer',
            }}>{st.l}</button>
          ))}
        </div>
      </div>

      {l ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 56 }}>
          <div style={{ width: 30, height: 30, border: `2px solid ${t.pink}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin .7s linear infinite' }} />
        </div>
      ) : calls.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 56, color: t.textMuted }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>&#x1F4DE;</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: t.textSecondary }}>{T('noCalls')}</div>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {calls.map(call => {
            const st = ST[call.status] || ST.completed;
            const iv = call.status === 'active' || call.status === 'in_progress';
            return (
              <div key={call.id} style={{
                background: t.card, border: `1px solid ${t.border}`, borderRadius: 12,
                padding: '14px 20px', cursor: 'pointer', display: 'flex',
                alignItems: 'center', gap: 16, transition: 'all .15s',
              }}
                onClick={() => router.push(`/calls/${call.id}`)}
                onMouseEnter={e => { e.currentTarget.style.borderColor = t.textPlaceholder; e.currentTarget.style.boxShadow = t.shadow; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = t.border; e.currentTarget.style.boxShadow = 'none'; }}
              >
                <div style={{
                  width: 40, height: 40, borderRadius: '50%',
                  background: `linear-gradient(135deg,${st.c},${st.c}88)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <User size={18} color="#fff" />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: t.text }}>{call.caller_name}</div>
                  <div style={{ fontSize: 12, color: t.textMuted, fontFamily: 'monospace', marginTop: 2 }}>{call.caller_number}</div>
                  {call.transcript && (
                    <div style={{ fontSize: 11, color: t.textPlaceholder, marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 280 }}>
                      <MessageSquare size={10} style={{ verticalAlign: 'middle', marginRight: 4 }} />
                      {call.transcript.substring(0, 60)}...
                    </div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexShrink: 0, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 12, color: t.textMuted, display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Clock size={11} />{call.duration > 0 ? `${Math.floor(call.duration / 60)}m` : '—'}
                  </span>
                  <span style={{ padding: '2px 8px', borderRadius: 20, fontSize: 11, fontWeight: 500, background: st.bg, border: `1px solid ${st.br}`, color: st.c }}>
                    <span style={{ width: 5, height: 5, borderRadius: '50%', background: st.c, display: 'inline-block', marginRight: 4 }} />
                    {st.l}
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  {iv && (
                    <button onClick={e => { e.stopPropagation(); rs(call.id); }} style={{
                      padding: '4px 10px', borderRadius: 6, border: `1px solid ${t.tealBorder}`,
                      background: t.tealBg, color: t.teal, fontSize: 11, cursor: 'pointer',
                    }}><Play size={10} /> Complete</button>
                  )}
                  <button onClick={e => { e.stopPropagation(); router.push(`/calls/${call.id}`); }} style={{
                    padding: '4px 10px', borderRadius: 6, border: `1px solid ${t.pinkBorder}`,
                    background: t.pinkBg, color: t.pink, fontSize: 11, cursor: 'pointer',
                  }}>Details <ChevronRight size={10} /></button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
