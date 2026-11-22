'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Menu, X, ShieldCheck, LogOut, User as UserIcon, ArrowRight } from 'lucide-react';
import {
  fetchCurrentUser,
  getApiErrorMessage,
  logout,
  type SessionUser,
} from '@/lib/api';

export default function Navigation() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let active = true;
    fetchCurrentUser()
      .then((currentUser) => {
        if (active) {
          setUser(currentUser);
          setStatus('ready');
        }
      })
      .catch((loadError: unknown) => {
        if (!active) return;
        if (typeof loadError === 'object' && loadError !== null && 'response' in loadError) {
          const response = loadError.response;
          if (typeof response === 'object' && response !== null && 'status' in response && response.status === 401) {
            setStatus('ready');
            return;
          }
        }
        setStatus('error');
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 8);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const signOut = async () => {
    try {
      await logout();
      setUser(null);
      setMobileMenuOpen(false);
      router.push('/');
    } catch (logoutError: unknown) {
      console.error(getApiErrorMessage(logoutError));
    }
  };

  const authenticatedLinks = [
    { href: '/loans', label: 'Portfolio' },
    { href: '/repayment', label: 'Repayment Strategies' },
    { href: '/refinancing', label: 'Refinancing' },
  ];

  const unauthenticatedLinks = [
    { href: '/#features', label: 'Features' },
    { href: '/#how-it-works', label: 'How it works' },
  ];

  const isAdmin = user && (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN');

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    if (href.startsWith('/#')) return false;
    return pathname.startsWith(href);
  };

  return (
    <header
      className={`sticky top-0 z-40 w-full transition-all duration-150 backdrop-blur-md ${
        scrolled
          ? 'border-b border-[#cbd5e1] bg-white/95 shadow-xs'
          : 'border-b border-[#e2e8f0] bg-white/90'
      }`}
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Brand */}
        <Link
          href="/"
          className="flex items-center gap-2 font-display text-base font-bold tracking-tight text-[#0f172a] hover:opacity-90 active:scale-[0.98] transition-all"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[#0f172a] text-white">
            <svg
              className="h-3.5 w-3.5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
              <polyline points="16 7 22 7 22 13" />
            </svg>
          </span>
          <span>ClearPath</span>
        </Link>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1" aria-label="Main Navigation">
          {user ? (
            <>
              {authenticatedLinks.map((link) => {
                const active = isActive(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                      active
                        ? 'bg-[#f1f5f9] text-[#0f172a] font-semibold'
                        : 'text-[#475569] hover:bg-[#f8fafc] hover:text-[#0f172a]'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}

              {isAdmin && (
                <Link
                  href="/admin"
                  className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    isActive('/admin')
                      ? 'bg-[#f1f5f9] text-[#0f172a] font-semibold'
                      : 'text-[#475569] hover:bg-[#f8fafc] hover:text-[#0f172a]'
                  }`}
                >
                  <ShieldCheck className="h-3.5 w-3.5 text-[#2563eb]" />
                  <span>Admin</span>
                </Link>
              )}
            </>
          ) : (
            <>
              {unauthenticatedLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-md px-3 py-1.5 text-xs font-medium text-[#475569] hover:text-[#0f172a] transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </>
          )}
        </nav>

        {/* Desktop Auth Controls */}
        <div className="hidden md:flex items-center gap-2.5">
          {status === 'loading' ? (
            <div className="h-7 w-20 animate-pulse rounded-md bg-[#f1f5f9]" />
          ) : user ? (
            <div className="flex items-center gap-2.5">
              <span className="flex items-center gap-1.5 rounded-full border border-[#e2e8f0] bg-[#f8fafc] px-2.5 py-0.5 text-xs font-mono text-[#334155]">
                <UserIcon className="h-3 w-3 text-[#64748b]" />
                <span className="max-w-[130px] truncate">{user.email}</span>
              </span>
              <button
                type="button"
                onClick={signOut}
                className="interactive-tap flex items-center gap-1 rounded-md px-2 py-1 text-xs text-[#64748b] hover:bg-[#fef2f2] hover:text-[#dc2626]"
                title="Log out"
              >
                <LogOut className="h-3 w-3" />
                <span>Log out</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="interactive-tap rounded-md px-3 py-1.5 text-xs font-medium text-[#475569] hover:text-[#0f172a]"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="interactive-tap inline-flex items-center justify-center rounded-md bg-[#0f172a] px-3.5 py-1.5 text-xs font-medium text-white hover:bg-[#1e293b]"
              >
                <span>Get Started</span>
                <ArrowRight className="ml-1 h-3 w-3" />
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Hamburger Button */}
        <div className="flex items-center md:hidden">
          <button
            type="button"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="interactive-tap inline-flex items-center justify-center rounded-md p-1.5 text-[#475569] hover:bg-[#f1f5f9] hover:text-[#0f172a]"
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="border-b border-[#e2e8f0] bg-white px-4 pt-2 pb-5 md:hidden shadow-md">
          <nav className="flex flex-col space-y-1" aria-label="Mobile Navigation">
            {user ? (
              <>
                {authenticatedLinks.map((link) => {
                  const active = isActive(link.href);
                  return (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                        active
                          ? 'bg-[#f1f5f9] text-[#0f172a] font-semibold'
                          : 'text-[#334155] hover:bg-[#f8fafc]'
                      }`}
                    >
                      <span>{link.label}</span>
                      {active && <span className="h-1.5 w-1.5 rounded-full bg-[#0f172a]" />}
                    </Link>
                  );
                })}

                {isAdmin && (
                  <Link
                    href="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                      isActive('/admin')
                        ? 'bg-[#f1f5f9] text-[#0f172a] font-semibold'
                        : 'text-[#334155] hover:bg-[#f8fafc]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-[#2563eb]" />
                      <span>Admin</span>
                    </div>
                  </Link>
                )}

                <div className="mt-3 pt-3 border-t border-[#f1f5f9] space-y-2">
                  <div className="px-3 text-xs text-[#64748b]">
                    Signed in as <strong className="text-[#0f172a] font-medium">{user.email}</strong>
                  </div>
                  <button
                    type="button"
                    onClick={signOut}
                    className="interactive-tap flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-[#dc2626] hover:bg-[#fef2f2]"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Log out</span>
                  </button>
                </div>
              </>
            ) : (
              <>
                {unauthenticatedLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center justify-between rounded-md px-3 py-2 text-sm font-medium text-[#334155] hover:bg-[#f8fafc] transition-colors"
                  >
                    <span>{link.label}</span>
                  </Link>
                ))}

                <div className="mt-3 pt-3 border-t border-[#f1f5f9] flex flex-col gap-2">
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="interactive-tap flex items-center justify-center rounded-md border border-[#e2e8f0] bg-white px-3 py-2 text-center text-xs font-medium text-[#0f172a] hover:bg-[#f8fafc]"
                  >
                    Log in
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="interactive-tap flex items-center justify-center rounded-md bg-[#0f172a] px-3 py-2 text-center text-xs font-medium text-white hover:bg-[#1e293b]"
                  >
                    Get Started
                  </Link>
                </div>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}
