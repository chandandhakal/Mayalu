'use client';

import { useApp } from '@/lib/contexts';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Phone, Users, BarChart3, Menu, X, Globe, Sun, Moon } from 'lucide-react';
import { locales } from '@/lib/i18n';

export function SidebarLayout({ children }) {
  const { theme, themeMode, setThemeMode, locale, setLocale, T, sidebarOpen, setSidebarOpen } = useApp();
  const pathname = usePathname();
  const t = theme;
  const isDark = themeMode === 'dark';

  const act = (p) => p === '/' ? pathname === '/' : pathname.startsWith(p);
  const navItems = [
    { path: '/', icon: LayoutDashboard, label: T('dashboard') },
    { path: '/calls', icon: Phone, label: T('calls') },
    { path: '/leads', icon: Users, label: T('leads') },
    { path: '/analytics', icon: BarChart3, label: T('analytics') },
  ];

  const s = (path) => ({
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '10px 14px',
    borderRadius: 10,
    fontSize: 14,
    fontWeight: 500,
    textDecoration: 'none',
    marginBottom: 3,
    transition: 'all .15s',
    background: act(path) ? (isDark ? 'rgba(96,165,250,.1)' : '#eff6ff') : 'transparent',
    color: act(path) ? t.accent : t.textMuted,
    border: act(path) ? `1px solid ${isDark ? 'rgba(96,165,250,.25)' : '#bfdbfe'}` : '1px solid transparent',
  });

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: t.bg }}>
      {sidebarOpen && (
        <div
          style={{ position: 'fixed', inset: 0, zIndex: 40, background: t.overlay }}
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <aside
        style={{
          position: 'fixed', top: 0, left: 0, bottom: 0, zIndex: 50, width: 250,
          background: t.sidebar, borderRight: `1px solid ${t.sidebarBorder}`,
          display: 'flex', flexDirection: 'column',
          transform: sidebarOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform .25s',
          boxShadow: isDark ? '2px 0 30px rgba(0,0,0,.5)' : '2px 0 20px rgba(0,0,0,.06)',
        }}
      >
        <div style={{ padding: '20px', borderBottom: `1px solid ${t.sidebarBorder}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'linear-gradient(135deg, #2563eb, #7c3aed)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 17, color: '#fff', boxShadow: '0 4px 15px rgba(37,99,235,.35)',
            }}>&#9733;</div>
            <h1 style={{
              fontSize: 16, fontWeight: 700, margin: 0,
              background: 'linear-gradient(90deg, #2563eb, #8b5cf6)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            }}>{T('appName')}</h1>
          </div>
        </div>
        <nav style={{ flex: 1, padding: '12px 10px' }}>
          {navItems.map(i => (
            <Link key={i.path} href={i.path} style={s(i.path)} onClick={() => setSidebarOpen(false)}>
              <i.icon size={18} />
              {i.label}
            </Link>
          ))}
        </nav>
        <div style={{ padding: '12px 10px 10px', borderTop: `1px solid ${t.sidebarBorder}`, margin: '0 8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
            <Globe size={15} color={t.textMuted} />
            <select
              value={locale}
              onChange={e => setLocale(e.target.value)}
              style={{
                flex: 1, background: t.inputBg, border: `1px solid ${t.inputBorder}`,
                borderRadius: 8, padding: '7px 10px', fontSize: 13, color: t.text,
                outline: 'none', cursor: 'pointer',
              }}
            >
              {locales.map(l => (
                <option key={l.code} value={l.code} style={{ background: t.surface, color: t.text }}>{l.nativeLabel}</option>
              ))}
            </select>
          </div>
          <button
            onClick={() => setThemeMode(isDark ? 'light' : 'dark')}
            style={{
              width: '100%', display: 'flex', alignItems: 'center', gap: 8,
              padding: '9px 14px', borderRadius: 10, border: `1px solid ${t.inputBorder}`,
              background: t.inputBg, color: t.textSecondary, cursor: 'pointer',
              fontSize: 13, fontWeight: 500, transition: 'all .15s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = t.surfaceHover}
            onMouseLeave={e => e.currentTarget.style.background = t.inputBg}
          >
            {isDark ? <><Sun size={15} color={t.amber} /> Light Mode</> : <><Moon size={15} color={t.violet} /> Dark Mode</>}
          </button>
        </div>
      </aside>

      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <header style={{
          height: 56, borderBottom: `1px solid ${t.sidebarBorder}`,
          display: 'flex', alignItems: 'center', padding: '0 20px', gap: 12,
          background: t.header,
        }}>
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              padding: 8, borderRadius: 8, background: 'transparent',
              border: 'none', color: t.textMuted, cursor: 'pointer', display: 'flex',
            }}
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div style={{ flex: 1 }} />
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '4px 12px', borderRadius: 20,
            background: isDark ? 'rgba(52,211,153,.1)' : '#ecfdf5',
            border: `1px solid ${isDark ? 'rgba(52,211,153,.25)' : '#a7f3d0'}`,
          }}>
            <span style={{
              width: 7, height: 7, borderRadius: '50%', background: t.teal,
              boxShadow: `0 0 8px ${t.teal}80`, animation: 'pulse 2s infinite',
            }} />
            <span style={{ fontSize: 12, color: isDark ? '#34d399' : '#059669', fontWeight: 500 }}>
              2 active calls
            </span>
          </div>
        </header>
        <div style={{ flex: 1, overflow: 'auto', padding: '24px 20px' }}>
          {children}
        </div>
      </main>
    </div>
  );
}
