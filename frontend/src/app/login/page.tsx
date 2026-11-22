'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Lock, Mail, ArrowRight, AlertCircle, Info } from 'lucide-react';
import { getApiErrorMessage, login, getGoogleLoginUrl } from '@/lib/api';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  // Safely extract redirect destination preventing open-redirect vulnerability
  const rawRedirect = searchParams.get('redirect');
  const safeRedirect =
    rawRedirect && rawRedirect.startsWith('/') && !rawRedirect.startsWith('//')
      ? rawRedirect
      : '/loans';

  const oauthError = searchParams.get('error');
  const oauthErrorMessage = (() => {
    if (oauthError === 'google_not_configured') {
      return 'Google sign-in is not configured yet. Please sign in with email and password.';
    }
    if (oauthError === 'google_cancelled') {
      return 'Google sign-in was cancelled.';
    }
    if (oauthError === 'invalid_state') {
      return 'Google sign-in session expired. Please try again.';
    }
    if (oauthError === 'auth_failed') {
      return 'Authentication with Google failed. Please try again or use your password.';
    }
    return '';
  })();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError('');
    try {
      await login(email, password);
      router.push(safeRedirect);
    } catch (loginError: unknown) {
      setError(getApiErrorMessage(loginError));
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignIn = () => {
    window.location.href = getGoogleLoginUrl(safeRedirect);
  };

  return (
    <div className="w-full max-w-md animate-fade-up">
      {/* Auth Card */}
      <div className="cp-card p-6 sm:p-8 space-y-6">
        <div className="text-center space-y-1">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-[#0f172a] text-white shadow-xs mb-3">
            <Lock className="h-5 w-5" />
          </div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-[#0f172a]">
            Welcome back
          </h1>
          <p className="text-xs sm:text-sm text-[#64748b]">
            Sign in to access your saved loans and repayment scenarios.
          </p>
        </div>

        {rawRedirect && (
          <div className="animate-fade-in rounded-lg bg-[#eff6ff] border border-[#bfdbfe] p-3 text-xs text-[#1e40af] flex items-center gap-2">
            <Info className="h-4 w-4 shrink-0 text-[#2563eb]" />
            <span>Please sign in to access that protected page.</span>
          </div>
        )}

        {oauthErrorMessage && (
          <div
            role="status"
            className="animate-fade-in flex items-start gap-2.5 rounded-lg border border-[#fed7aa] bg-[#fff7ed] p-3.5 text-xs text-[#9a3412]"
          >
            <Info className="h-4 w-4 shrink-0 text-[#ea580c] mt-0.5" />
            <span>{oauthErrorMessage}</span>
          </div>
        )}

        {error && (
          <div
            role="alert"
            className="animate-fade-in flex items-start gap-2.5 rounded-lg border border-[#fecaca] bg-[#fef2f2] p-3.5 text-xs text-[#dc2626]"
          >
            <AlertCircle className="h-4 w-4 shrink-0 text-[#dc2626] mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Continue with Google button */}
        <div>
          <button
            type="button"
            onClick={handleGoogleSignIn}
            className="interactive-tap w-full flex items-center justify-center gap-3 rounded-lg border border-[#e2e8f0] bg-white px-4 py-2.5 text-sm font-medium text-[#0f172a] shadow-xs hover:bg-[#f8fafc] hover:border-[#cbd5e1] transition-all"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
              <path
                fill="#4285F4"
                d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.65v3.03h3.88c2.27-2.09 3.665-5.17 3.665-9.12z"
              />
              <path
                fill="#34A853"
                d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.03c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.13C3.27 21.43 7.34 24 12 24z"
              />
              <path
                fill="#FBBC05"
                d="M5.28 14.29c-.25-.72-.38-1.49-.38-2.29s.13-1.57.38-2.29V6.58H1.25C.45 8.18 0 10.03 0 12s.45 3.82 1.25 5.42l4.03-3.13z"
              />
              <path
                fill="#EA4335"
                d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.27 2.57 1.25 6.58l4.03 3.13c.95-2.83 3.6-4.96 6.72-4.96z"
              />
            </svg>
            <span>Continue with Google</span>
          </button>
        </div>

        <div className="relative flex items-center justify-center">
          <div className="border-t border-[#e2e8f0] w-full" />
          <span className="bg-white px-3 text-xs text-[#94a3b8] absolute">or continue with email</span>
        </div>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label
              htmlFor="email-input"
              className="block text-xs font-medium text-[#475569] mb-1.5"
            >
              Email address
            </label>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-[#94a3b8]">
                <Mail className="h-4 w-4" />
              </span>
              <input
                id="email-input"
                className="cp-input pl-9"
                type="email"
                autoComplete="email"
                required
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label
                htmlFor="password-input"
                className="text-xs font-medium text-[#475569]"
              >
                Password
              </label>
              <Link
                href="/reset-password"
                className="text-xs text-[#2563eb] hover:underline"
              >
                Forgot password?
              </Link>
            </div>

            <div className="relative">
              <span className="absolute left-3 top-2.5 text-[#94a3b8]">
                <Lock className="h-4 w-4" />
              </span>
              <input
                id="password-input"
                className="cp-input pl-9 pr-10"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="interactive-tap absolute right-3 top-2.5 text-[#94a3b8] hover:text-[#334155] p-0.5 rounded"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <button
            disabled={submitting}
            type="submit"
            className="cp-btn-primary w-full mt-2"
          >
            {submitting ? (
              <span className="flex items-center gap-2">
                <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Signing in…</span>
              </span>
            ) : (
              <>
                <span>Sign In</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </form>

        <div className="pt-4 border-t border-[#f1f5f9] text-center text-xs text-[#64748b]">
          Don&apos;t have an account yet?{' '}
          <Link
            href={rawRedirect ? `/register?redirect=${encodeURIComponent(safeRedirect)}` : '/register'}
            className="font-semibold text-[#2563eb] hover:underline"
          >
            Create free account
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="flex-1 flex items-center justify-center px-4 py-12 sm:py-16">
      <Suspense fallback={<div className="cp-card p-8 text-center text-sm text-[#64748b]">Loading login…</div>}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
