const light = {
  mode: 'light',
  bg: '#f1f5f9', surface: '#ffffff', surfaceHover: '#f8fafc',
  sidebar: '#ffffff', sidebarBorder: '#e2e8f0', header: '#ffffff',
  card: '#ffffff', cardHover: '#fafafa', border: '#e2e8f0', borderLight: '#f1f5f9',
  text: '#0f172a', textSecondary: '#334155', textMuted: '#94a3b8', textPlaceholder: '#cbd5e1',
  accent: '#2563eb', accentBg: '#eff6ff', accentBorder: '#bfdbfe',
  teal: '#10b981', tealBg: '#ecfdf5', tealBorder: '#a7f3d0',
  amber: '#f59e0b', amberBg: '#fffbeb', amberBorder: '#fde68a',
  violet: '#8b5cf6', violetBg: '#f5f3ff', violetBorder: '#ddd6fe',
  blue: '#3b82f6', blueBg: '#eff6ff', blueBorder: '#bfdbfe',
  red: '#ef4444', redBg: '#fef2f2', redBorder: '#fecaca',
  chart1: '#2563eb', chart2: '#10b981', chart3: '#f59e0b', chart4: '#8b5cf6', chart5: '#3b82f6',
  inputBg: '#f8fafc', inputBorder: '#e2e8f0',
  timelineLine: '#e2e8f0', codeBg: '#f8fafc', emptyBorder: '#e2e8f0',
  shadow: '0 1px 3px rgba(0,0,0,.04)', shadowMd: '0 4px 15px rgba(0,0,0,.06)',
  overlay: 'rgba(0,0,0,.4)',
  voiceBg: 'linear-gradient(150deg, #eff6ff 0%, #f8fafc 30%, #ede9fe 60%, #f8fafc 100%)',
  voiceBubbleAI: '#eff6ff', voiceBubbleUser: '#ecfdf5',
  voiceBubbleAIBorder: '#bfdbfe', voiceBubbleUserBorder: '#a7f3d0',
  btnGhostBg: '#f1f5f9', btnGhostColor: '#64748b', btnGhostBorder: '#e2e8f0',
};

const dark = {
  mode: 'dark',
  bg: '#0a0a0f', surface: '#13131a', surfaceHover: '#1a1a24',
  sidebar: '#0e0e14', sidebarBorder: '#1e1e2e', header: '#0e0e14',
  card: '#13131a', cardHover: '#1a1a24', border: '#1e1e2e', borderLight: '#1a1a24',
  text: '#f1f5f9', textSecondary: '#cbd5e1', textMuted: '#64748b', textPlaceholder: '#475569',
  accent: '#60a5fa', accentBg: 'rgba(96,165,250,0.1)', accentBorder: 'rgba(96,165,250,0.2)',
  teal: '#34d399', tealBg: 'rgba(52,211,153,0.1)', tealBorder: 'rgba(52,211,153,0.2)',
  amber: '#fbbf24', amberBg: 'rgba(251,191,36,0.1)', amberBorder: 'rgba(251,191,36,0.2)',
  violet: '#a78bfa', violetBg: 'rgba(167,139,250,0.1)', violetBorder: 'rgba(167,139,250,0.2)',
  blue: '#60a5fa', blueBg: 'rgba(96,165,250,0.1)', blueBorder: 'rgba(96,165,250,0.2)',
  red: '#f87171', redBg: 'rgba(248,113,113,0.1)', redBorder: 'rgba(248,113,113,0.2)',
  chart1: '#60a5fa', chart2: '#34d399', chart3: '#fbbf24', chart4: '#a78bfa', chart5: '#60a5fa',
  inputBg: '#1a1a24', inputBorder: '#1e1e2e',
  timelineLine: '#1e1e2e', codeBg: '#1a1a24', emptyBorder: '#1e1e2e',
  shadow: '0 1px 3px rgba(0,0,0,.3)', shadowMd: '0 4px 15px rgba(0,0,0,.4)',
  overlay: 'rgba(0,0,0,.7)',
  voiceBg: 'linear-gradient(150deg, #0a0f1a 0%, #0a0a12 30%, #0f0a1a 60%, #0a0a0f 100%)',
  voiceBubbleAI: 'rgba(96,165,250,0.08)', voiceBubbleUser: 'rgba(52,211,153,0.08)',
  voiceBubbleAIBorder: 'rgba(96,165,250,0.15)', voiceBubbleUserBorder: 'rgba(52,211,153,0.15)',
  btnGhostBg: '#1a1a24', btnGhostColor: '#94a3b8', btnGhostBorder: '#1e1e2e',
};

light.pink = light.accent; light.pinkBg = light.accentBg; light.pinkBorder = light.accentBorder;
light.chartPink = light.chart1; light.chartTeal = light.chart2; light.chartAmber = light.chart3; light.chartViolet = light.chart4; light.chartBlue = light.chart5;

dark.pink = dark.accent; dark.pinkBg = dark.accentBg; dark.pinkBorder = dark.accentBorder;
dark.chartPink = dark.chart1; dark.chartTeal = dark.chart2; dark.chartAmber = dark.chart3; dark.chartViolet = dark.chart4; dark.chartBlue = dark.chart5;

export { light, dark };

export function getTheme(mode) {
  return mode === 'dark' ? dark : light;
}
