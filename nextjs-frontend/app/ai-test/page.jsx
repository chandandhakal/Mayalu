'use client';

import { useEffect } from 'react';
import Head from 'next/head';

export default function AITestPage() {
  useEffect(() => {
    let sessionId = null;
    const $ = id => document.getElementById(id);

    const addMsg = (text, isAI) => {
      const d = document.createElement('div');
      d.className = 'msg ' + (isAI ? 'ai' : 'user');
      d.textContent = text;
      $('chat').appendChild(d);
      $('chat').scrollTop = $('chat').scrollHeight;
    };

    const init = async () => {
      $('status').textContent = 'Connecting to Mayalu...';
      $('btn').disabled = true;
      try {
        const r = await fetch('/api/ai/greet', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ language: 'en' }) });
        const d = await r.json();
        sessionId = d.sessionId;
        $('stage').textContent = 'Stage: ' + d.stage;
        addMsg(d.response, true);
        $('status').textContent = 'Connected';
        $('btn').disabled = false;
      } catch (e) {
        $('error').textContent = 'FAILED: ' + e.message + ' — Is backend running?';
        $('status').textContent = 'Disconnected';
      }
    };

    window.send = async function send() {
      const input = $('input');
      const text = input.value.trim();
      if (!text) return false;
      input.value = '';
      addMsg(text, false);
      $('status').textContent = 'Thinking...';
      $('btn').disabled = true;
      try {
        const r = await fetch('/api/ai/respond', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text, language: 'en', sessionId }) });
        const d = await r.json();
        sessionId = d.sessionId;
        $('stage').textContent = 'Stage: ' + d.stage;
        addMsg(d.response, true);
        $('status').textContent = 'Connected';
        $('btn').disabled = false;
      } catch (e) {
        addMsg('Error: ' + e.message, true);
        $('status').textContent = 'Error';
        $('btn').disabled = false;
      }
      $('input').focus();
      return false;
    };

    init();
  }, []);

  return (
    <>
      <Head>
        <title>Mayalu AI Test</title>
      </Head>
      <style>{`
        *{margin:0;padding:0;box-sizing:border-box;font-family:system-ui,sans-serif}
        body{background:#0a0a14;color:#f1f5f9;display:flex;align-items:center;justify-content:center;min-height:100vh}
        .box{width:100%;max-width:500px;background:#13131a;border:1px solid #1e1e2e;border-radius:16px;overflow:hidden}
        .top{padding:16px 20px;border-bottom:1px solid #1e1e2e;display:flex;align-items:center;gap:12px}
        .av{width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,#2563eb,#7c3aed);display:flex;align-items:center;justify-content:center;font-weight:700;color:#fff}
        .top h2{font-size:16px}.top p{font-size:12px;color:#64748b}
        #chat{height:400px;overflow:auto;padding:16px;display:flex;flex-direction:column;gap:10px}
        .msg{max-width:80%;padding:10px 16px;border-radius:14px;font-size:14px;line-height:1.5}
        .ai{background:#1a1a24;border:1px solid #1e1e2e;align-self:flex-start;border-top-left-radius:4px}
        .user{background:#1a2a1f;border:1px solid #1e2e22;align-self:flex-end;border-top-right-radius:4px}
        #inputWrap{display:flex;padding:12px 16px;border-top:1px solid #1e1e2e;gap:8px}
        #input{flex:1;padding:10px 16px;border-radius:24px;border:1px solid #1e1e2e;background:#0e0e14;color:#f1f5f9;font-size:14px;outline:none}
        button{padding:10px 20px;border-radius:24px;border:none;background:#2563eb;color:#fff;font-size:14px;font-weight:600;cursor:pointer}
        button:disabled{opacity:.5;cursor:default}
        .status{text-align:center;font-size:11px;color:#64748b;padding:4px}
        .error{color:#f87171;text-align:center;font-size:12px;padding:8px}
      `}</style>
      <div className="box">
        <div className="top">
          <div className="av">M</div>
          <div><h2>Mayalu - AI Test</h2><p id="stage"></p></div>
        </div>
        <div id="chat"></div>
        <div id="status" className="status">Ready</div>
        <div id="error" className="error"></div>
        <form id="inputWrap" onSubmit={e => { e.preventDefault(); return window.send?.(); }}>
          <input id="input" placeholder="Type a message..." autoFocus />
          <button type="submit" id="btn">Send</button>
        </form>
      </div>
    </>
  );
}
