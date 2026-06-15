'use client';

import { useEffect } from 'react';

export function VoiceCall({ T, theme: t, onEnd }) {
  useEffect(() => {
    const w = window.open('/voice', 'MayaluVoice', 'width=480,height=700');
    if (w) {
      const timer = setInterval(() => {
        if (w.closed) { clearInterval(timer); onEnd?.(); }
      }, 500);
    }
    onEnd?.();
  }, [onEnd]);

  return null;
}
