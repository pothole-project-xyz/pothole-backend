'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const [dark, setDark] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('srm_theme');
    const isDark = stored === 'dark';
    setDark(isDark);
    document.documentElement.classList.toggle('dark', isDark);
  }, []);

  function toggleTheme() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle('dark', next);
    localStorage.setItem('srm_theme', next ? 'dark' : 'light');
  }

  const links = [
    { href: '/map', label: 'Live Map' },
    { href: '/report', label: 'Report Pothole' },
    { href: '/#features', label: 'Features' },
    { href: '/#about', label: 'About' },
    { href: '/#contact', label: 'Contact' },
  ];

  return (
    <header className="fixed top-0 z-50 w-full border-b border-slate-100 bg-white/80 backdrop-blur-lg dark:border-slate-800 dark:bg-slate-950/80">
      <div className="mx-auto flex h-[72px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-lg font-bold text-white">S</span>
          <span className="text-lg font-bold tracking-tight">Smart<span className="text-brand-600">Road</span></span>
        </Link>

        <nav className="hidden items-center gap-7 md:flex">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="text-sm font-medium text-slate-600 transition hover:text-brand-600 dark:text-slate-300">
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <button
            onClick={toggleTheme}
            aria-label="Toggle dark mode"
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            {dark ? '☀️' : '🌙'}
          </button>

          {user ? (
            <div className="hidden items-center gap-3 md:flex">
              <Link
                href={user.role === 'admin' || user.role === 'authority' ? '/dashboard/admin' : '/dashboard'}
                className="text-sm font-semibold text-brand-600"
              >
                {user.role === 'admin' ? 'Admin Dashboard' : 'My Dashboard'}
              </Link>
              <button onClick={logout} className="btn-secondary !px-4 !py-2 text-sm">Logout</button>
            </div>
          ) : (
            <div className="hidden items-center gap-3 md:flex">
              <Link href="/login" className="btn-secondary !px-4 !py-2 text-sm">Login</Link>
              <Link href="/register" className="btn-primary !px-4 !py-2 text-sm">Get Started</Link>
            </div>
          )}

          <button className="md:hidden" onClick={() => setOpen(!open)} aria-label="Toggle menu">
            <span className="block h-0.5 w-6 bg-slate-700 dark:bg-slate-200" />
            <span className="my-1.5 block h-0.5 w-6 bg-slate-700 dark:bg-slate-200" />
            <span className="block h-0.5 w-6 bg-slate-700 dark:bg-slate-200" />
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-slate-100 bg-white px-4 py-4 md:hidden dark:border-slate-800 dark:bg-slate-950">
          <div className="flex flex-col gap-3">
            {links.map((l) => (
              <Link key={l.href} href={l.href} onClick={() => setOpen(false)} className="text-sm font-medium text-slate-600 dark:text-slate-300">
                {l.label}
              </Link>
            ))}
            {user ? (
              <button onClick={logout} className="btn-secondary text-sm">Logout</button>
            ) : (
              <div className="flex gap-3">
                <Link href="/login" className="btn-secondary flex-1 text-center text-sm">Login</Link>
                <Link href="/register" className="btn-primary flex-1 text-center text-sm">Get Started</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
