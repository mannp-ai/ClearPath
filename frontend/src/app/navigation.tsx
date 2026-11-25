'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { Menu, X, ShieldCheck, LogOut, LayoutGrid, Layers, ChartColumn, RefreshCw, Settings } from 'lucide-react';
import { fetchCurrentUser, getApiErrorMessage, logout, type SessionUser } from '@/lib/api';
import { Logo } from '@/components/logo';

// Routes behind the route guard get the sidebar shell; everything else gets the public header.
const APP_ROUTES = ['/overview', '/loans', '/repayment', '/refinancing', '/settings', '/admin'];

const APP_LINKS = [
  { href: '/overview', label: 'Overview', icon: LayoutGrid },
  { href: '/loans', label: 'Loans', icon: Layers },
  { href: '/repayment', label: 'Repayment', icon: ChartColumn },
  { href: '/refinancing', label: 'Refinance', icon: RefreshCw },
];

// Account-level pages sit apart from the everyday tasks, next to who is signed in.
const SETTINGS_LINK = { href: '/settings', label: 'Settings', icon: Settings };
const ADMIN_LINK = { href: '/admin', label: 'Admin', icon: ShieldCheck };

const PUBLIC_LINKS = [
  { href: '/#features', label: 'What you get' },
  { href: '/#how-it-works', label: 'How it works' },
  { href: '/#questions', label: 'Questions' },
];

export default function Navigation() {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);
  // Remembering the path the menu was opened on closes it on every navigation.
  const [openOn, setOpenOn] = useState<string | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const open = openOn === pathname;
  const isApp = APP_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`));

  useEffect(() => {
    let active = true;
    fetchCurrentUser()
      .then((currentUser) => {
        if (active) setUser(currentUser);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [pathname]);

  // Marks the header link for the section being read on the landing page.
  const [section, setSection] = useState('');
  useEffect(() => {
    if (pathname !== '/') return;
    const observer = new IntersectionObserver(
      (entries) => entries.forEach((entry) => {
        if (entry.isIntersecting) setSection(entry.target.id);
        else setSection((current) => (current === entry.target.id ? '' : current));
      }),
      { rootMargin: '-45% 0px -50% 0px' },
    );
    PUBLIC_LINKS.forEach((link) => {
      const target = document.getElementById(link.href.slice(2));
      if (target) observer.observe(target);
    });
    return () => observer.disconnect();
  }, [pathname]);

  const signOut = async () => {
    try {
      await logout();
      setUser(null);
      setOpenOn(null);
      router.push('/');
    } catch (logoutError: unknown) {
      console.error(getApiErrorMessage(logoutError));
    }
  };

  const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPER_ADMIN';
  const accountLinks = isAdmin ? [SETTINGS_LINK, ADMIN_LINK] : [SETTINGS_LINK];

  const menuButton = (
    <button
      type="button"
      onClick={() => setOpenOn(open ? null : pathname)}
      className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-white hover:bg-white/10"
      aria-expanded={open}
      aria-label="Toggle navigation menu"
    >
      {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
    </button>
  );

  const linkList = (links: typeof APP_LINKS) => (
    <ul className="space-y-0.5">
      {links.map(({ href, label, icon: Icon }) => {
        const active = pathname.startsWith(href);
        return (
          <li key={href}>
            <Link
              href={href}
              onClick={() => setOpenOn(null)}
              aria-current={active ? 'page' : undefined}
              className={`flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm lg:min-h-10 ${
                active ? 'bg-[#d8f2a7] font-semibold text-[#0b0f1a]' : 'font-medium text-[#c9d8d1] hover:bg-white/10 hover:text-white'
              }`}
            >
              <Icon className="h-[18px] w-[18px]" strokeWidth={active ? 2.25 : 1.75} aria-hidden="true" />
              {label}
            </Link>
          </li>
        );
      })}
    </ul>
  );

  const account = (
    <div className="space-y-3">
      {linkList(accountLinks)}
      <div className="flex items-center gap-2.5 border-t border-white/15 pl-1 pt-3">
        <span aria-hidden="true" className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 text-sm font-semibold text-[#d8f2a7]">
          {user?.email.charAt(0).toUpperCase()}
        </span>
        <p className="min-w-0 flex-1 leading-tight">
          <span className="block text-xs text-[#9fb5ab]">Signed in as</span>
          <span className="block truncate text-sm font-medium text-white" title={user?.email}>
            {user?.email.split('@')[0]}
          </span>
        </p>
        <button type="button" onClick={signOut} aria-label="Log out" title="Log out" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-[#c9d8d1] hover:bg-white/10 hover:text-white">
          <LogOut className="h-[18px] w-[18px]" aria-hidden="true" />
        </button>
      </div>
    </div>
  );

  if (isApp) {
    return (
      <>
        <aside className="cp-sidebar fixed inset-y-0 left-0 z-40 hidden w-60 flex-col gap-6 overflow-y-auto bg-[#0f3d32] px-3 py-5 lg:flex">
          <Link href="/" aria-label="ClearPath home" className="px-3 text-white">
            <Logo />
          </Link>
          <nav aria-label="Main" className="flex-1">
            {linkList(APP_LINKS)}
          </nav>
          {account}
        </aside>
        <header className="sticky top-0 z-40 bg-[#0f3d32] lg:hidden">
          <div className="flex h-14 items-center justify-between px-4">
            <Link href="/" aria-label="ClearPath home" className="text-white">
              <Logo />
            </Link>
            {menuButton}
          </div>
          {open && (
            <div className="space-y-6 border-t border-white/15 px-3 pb-4 pt-3">
              <nav aria-label="Mobile">{linkList(APP_LINKS)}</nav>
              {account}
            </div>
          )}
        </header>
      </>
    );
  }

  const signedIn = (
    <Link href="/overview" className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[#d8f2a7] px-4 text-sm font-semibold text-[#0b0f1a] hover:bg-[#e8f9c8]">
      Open ClearPath
    </Link>
  );
  const signedOut = (
    <>
      <Link href="/login" className="inline-flex min-h-11 items-center justify-center rounded-lg px-3 text-sm font-medium text-white hover:bg-white/10">
        Log in
      </Link>
      <Link href="/register" className="inline-flex min-h-11 items-center justify-center rounded-lg bg-[#d8f2a7] px-4 text-sm font-semibold text-[#0b0f1a] hover:bg-[#e8f9c8]">
        Check my loans
      </Link>
    </>
  );
  const publicLinks = PUBLIC_LINKS.map((link) => (
    <Link key={link.href} href={link.href} onClick={() => setOpenOn(null)} aria-current={pathname === '/' && link.href === `/#${section}` ? 'location' : undefined} className="inline-flex min-h-11 items-center rounded-lg px-3 text-sm text-[#d5ded9] underline-offset-8 hover:text-white aria-[current=location]:text-[#d8f2a7] aria-[current=location]:underline aria-[current=location]:decoration-2">
      {link.label}
    </Link>
  ));
  const auth = loading ? <span className="h-11 w-24" aria-hidden="true" /> : user ? signedIn : signedOut;

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#0f3d32]">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="text-white">
          <Logo />
        </Link>
        <nav aria-label="Main" className="hidden items-center md:flex">
          {publicLinks}
        </nav>
        <div className="hidden items-center gap-2 md:flex">{auth}</div>
        <div className="md:hidden">{menuButton}</div>
      </div>
      {open && (
        <div className="flex flex-col border-t border-white/10 px-4 pb-4 pt-2 md:hidden">
          <nav aria-label="Mobile" className="flex flex-col">
            {publicLinks}
          </nav>
          <div className="mt-2 flex flex-col gap-2">{auth}</div>
        </div>
      )}
    </header>
  );
}
