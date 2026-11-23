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
    { href: '/settings', label: 'Settings' },
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
      className={`sticky top-0 z-40 w-full transition-all duration-150 ${
        scrolled
          ? 'border-b border-[#d6ccb8] bg-[#fffdf8] shadow-xs'
          : 'border-b border-[#e4dccb] bg-[#fffdf8]'
      }`}
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Brand */}
        <Link
          href="/"
          className="flex items-center gap-2 font-display text-base font-bold tracking-tight text-[#231f1b] hover:opacity-90 active:scale-[0.98] transition-all"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#f4b942] text-[#231f1b]">
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
        <nav className="hidden md:flex items-center gap-1" aria-label="Main">
          {user ? (
            <>
              {authenticatedLinks.map((link) => {
                const active = isActive(link.href);
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    aria-current={active ? 'page' : undefined}
                    className={`rounded-md whitespace-nowrap px-3 py-2 text-sm font-medium transition-colors ${
                      active
                        ? 'bg-[#efe8d8] text-[#231f1b] font-semibold'
                        : 'text-[#4a4239] hover:bg-[#f6f1e7] hover:text-[#231f1b]'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}

              {isAdmin && (
                <Link
                  href="/admin"
                  className={`flex items-center gap-1.5 rounded-md whitespace-nowrap px-3 py-2 text-sm font-medium transition-colors ${
                    isActive('/admin')
                      ? 'bg-[#efe8d8] text-[#231f1b] font-semibold'
                      : 'text-[#4a4239] hover:bg-[#f6f1e7] hover:text-[#231f1b]'
                  }`}
                >
                  <ShieldCheck className="h-3.5 w-3.5 text-[#14594a]" />
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
                  className="rounded-md whitespace-nowrap px-3 py-2 text-sm font-medium text-[#4a4239] hover:text-[#231f1b] transition-colors"
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
            <div className="h-7 w-20 animate-pulse rounded-md bg-[#efe8d8]" />
          ) : user ? (
            <div className="flex items-center gap-2.5">
              <span className="hidden lg:flex items-center gap-1.5 rounded-full border border-[#e4dccb] bg-[#f6f1e7] px-2.5 py-0.5 text-xs font-mono text-[#3d3630]">
                <UserIcon className="h-3 w-3 text-[#62594e]" />
                <span className="max-w-[130px] truncate">{user.email}</span>
              </span>
              <button
                type="button"
                onClick={signOut}
                className="interactive-tap flex items-center gap-1 whitespace-nowrap rounded-md px-3 py-2 text-sm text-[#4a4239] hover:bg-[#fef2f2] hover:text-[#b91c1c]"
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
                className="interactive-tap rounded-md whitespace-nowrap px-3 py-2 text-sm font-medium text-[#4a4239] hover:text-[#231f1b]"
              >
                Log in
              </Link>
              <Link
                href="/register"
                className="interactive-tap inline-flex items-center justify-center rounded-md bg-[#14594a] px-4 py-2 text-sm font-medium text-white hover:bg-[#0f4a3d]"
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
            className="interactive-tap inline-flex items-center justify-center rounded-md p-2.5 text-[#4a4239] hover:bg-[#efe8d8] hover:text-[#231f1b]"
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="border-b border-[#e4dccb] bg-[#fffdf8] px-4 pt-2 pb-5 md:hidden shadow-md">
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
                      className={`flex items-center justify-between rounded-md whitespace-nowrap px-3 py-2 text-sm font-medium transition-colors ${
                        active
                          ? 'bg-[#efe8d8] text-[#231f1b] font-semibold'
                          : 'text-[#3d3630] hover:bg-[#f6f1e7]'
                      }`}
                    >
                      <span>{link.label}</span>
                      {active && <span className="h-1.5 w-1.5 rounded-full bg-[#14594a]" />}
                    </Link>
                  );
                })}

                {isAdmin && (
                  <Link
                    href="/admin"
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center justify-between rounded-md whitespace-nowrap px-3 py-2 text-sm font-medium transition-colors ${
                      isActive('/admin')
                        ? 'bg-[#efe8d8] text-[#231f1b] font-semibold'
                        : 'text-[#3d3630] hover:bg-[#f6f1e7]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-[#14594a]" />
                      <span>Admin</span>
                    </div>
                  </Link>
                )}

                <div className="mt-3 pt-3 border-t border-[#efe8d8] space-y-2">
                  <div className="px-3 text-xs text-[#62594e]">
                    Signed in as <strong className="text-[#231f1b] font-medium">{user.email}</strong>
                  </div>
                  <button
                    type="button"
                    onClick={signOut}
                    className="interactive-tap flex w-full items-center gap-2 rounded-md whitespace-nowrap px-3 py-2 text-sm font-medium text-[#b91c1c] hover:bg-[#fef2f2]"
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
                    className="flex items-center justify-between rounded-md whitespace-nowrap px-3 py-2 text-sm font-medium text-[#3d3630] hover:bg-[#f6f1e7] transition-colors"
                  >
                    <span>{link.label}</span>
                  </Link>
                ))}

                <div className="mt-3 pt-3 border-t border-[#efe8d8] flex flex-col gap-2">
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="interactive-tap flex items-center justify-center rounded-md border border-[#e4dccb] bg-[#fffdf8] px-3 py-2 text-center text-xs font-medium text-[#231f1b] hover:bg-[#f6f1e7]"
                  >
                    Log in
                  </Link>
                  <Link
                    href="/register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="interactive-tap flex items-center justify-center rounded-md bg-[#14594a] px-3 py-2 text-center text-xs font-medium text-white hover:bg-[#0f4a3d]"
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
