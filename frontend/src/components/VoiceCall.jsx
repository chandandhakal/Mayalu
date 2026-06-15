import React, { useEffect } from 'react';

export default function VoiceCall({ T, theme: t, onEnd }) {
  useEffect(() => {
    // Open voice assistant in new window
    const w = window.open('/voice.html', 'MayaluVoice', 'width=480,height=700');
    if (w) {
      // Poll to check if window closed
      const timer = setInterval(() => {
        if (w.closed) { clearInterval(timer); onEnd?.(); }
      }, 500);
    }
    // Close the React overlay immediately
    onEnd?.();
  }, [onEnd]);

  return null;
}
