'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, Lock, Mail, User, ArrowRight, AlertCircle, CheckCircle2, Info } from 'lucide-react';
import { getApiErrorMessage, register, getGoogleLoginUrl } from '@/lib/api';

function RegisterForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const searchParams = useSearchParams();

  const rawRedirect = searchParams.get('redirect');
  const safeRedirect =
    rawRedirect && rawRedirect.startsWith('/') && !rawRedirect.startsWith('//')
      ? rawRedirect
      : '/loans';

  const oauthError = searchParams.get('error');
  const oauthErrorMessage = (() => {
    if (oauthError === 'google_not_configured') {
      return 'Google sign-up is not configured yet. Please register with email and password.';
    }
    if (oauthError === 'google_cancelled') {
      return 'Google sign-up was cancelled.';
    }
    if (oauthError === 'invalid_state') {
      return 'Google sign-up session expired. Please try again.';
    }
    if (oauthError === 'auth_failed') {
      return 'Authentication with Google failed. Please try again or create an account with email.';
    }
    return '';
  })();

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    setMessage('');
    try {
      const result = await register(email, password, name || undefined);
      setMessage(result.message || 'Account created! Please check your email to verify your address.');
    } catch (registrationError: unknown) {
      setError(getApiErrorMessage(registrationError));
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignIn = () => {
    window.location.href = getGoogleLoginUrl(safeRedirect);
  };

  const loginUrl = rawRedirect ? `/login?redirect=${encodeURIComponent(safeRedirect)}` : '/login';

  return (
    <div className="w-full max-w-md animate-fade-up">
      <div className="cp-card p-6 sm:p-8 space-y-6">
        <div className="text-center space-y-1">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-xl bg-[#14594a] text-white shadow-xs mb-3">
            <User className="h-5 w-5" />
          </div>
          <h1 className="font-head text-3xl font-semibold tracking-tight text-[#231f1b]">
            Create ClearPath Account
          </h1>
          <p className="text-xs sm:text-sm text-[#62594e]">
            Save loan portfolios, custom repayment models, and scenario snapshots.
          </p>
        </div>

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
            className="animate-fade-in flex items-start gap-2.5 rounded-lg border border-[#fecaca] bg-[#fef2f2] p-3.5 text-xs text-[#b91c1c]"
          >
            <AlertCircle className="h-4 w-4 shrink-0 text-[#b91c1c] mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {message ? (
          <div
            role="status"
            className="animate-fade-in rounded-lg border border-[#a7f3d0] bg-[#ecfdf5] p-5 text-center space-y-3"
          >
            <CheckCircle2 className="h-8 w-8 text-[#15803d] mx-auto" />
            <div className="text-sm font-semibold text-[#15803d]">
              {message}
            </div>
            <p className="text-xs text-[#166534]">
              Once verified, you can sign in to access your portfolio and saved models.
            </p>
            <div className="pt-2">
              <Link
                href={loginUrl}
                className="cp-btn-primary text-xs w-full"
              >
                Proceed to Sign In
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Continue with Google button */}
            <div>
              <button
                type="button"
                onClick={handleGoogleSignIn}
                className="interactive-tap w-full flex items-center justify-center gap-3 rounded-lg border border-[#e4dccb] bg-[#fffdf8] px-4 py-2.5 text-sm font-medium text-[#231f1b] shadow-xs hover:bg-[#f6f1e7] hover:border-[#d6ccb8] transition-all"
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
              <div className="border-t border-[#e4dccb] w-full" />
              <span className="bg-[#fffdf8] px-3 text-xs text-[#62594e] absolute">or register with email</span>
            </div>

            <form onSubmit={submit} className="space-y-4">
              <div>
                <label
                  htmlFor="name-input"
                  className="block text-xs font-medium text-[#4a4239] mb-1.5"
                >
                  Full name (optional)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#62594e]">
                    <User className="h-4 w-4" />
                  </span>
                  <input
                    id="name-input"
                    className="cp-input pl-9"
                    autoComplete="name"
                    maxLength={100}
                    placeholder="Alex Smith"
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="register-email"
                  className="block text-xs font-medium text-[#4a4239] mb-1.5"
                >
                  Email address
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#62594e]">
                    <Mail className="h-4 w-4" />
                  </span>
                  <input
                    id="register-email"
                    className="cp-input pl-9"
                    type="email"
                    autoComplete="email"
                    required
                    placeholder="name@example.com"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="register-password"
                  className="block text-xs font-medium text-[#4a4239] mb-1.5"
                >
                  Password (at least 8 characters)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#62594e]">
                    <Lock className="h-4 w-4" />
                  </span>
                  <input
                    id="register-password"
                    className="cp-input pl-9 pr-10"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    minLength={8}
                    maxLength={128}
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="interactive-tap absolute right-1 top-1/2 -translate-y-1/2 text-[#62594e] hover:text-[#3d3630] p-2 rounded"
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
                    <span>Creating account…</span>
                  </span>
                ) : (
                  <>
                    <span>Create Free Account</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>
          </>
        )}

        <div className="pt-4 border-t border-[#efe8d8] text-center text-xs text-[#62594e]">
          Already have an account?{' '}
          <Link
            href={loginUrl}
            className="font-semibold text-[#14594a] hover:underline"
          >
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <main className="flex-1 flex items-center justify-center px-4 py-12 sm:py-16">
      <Suspense fallback={<div className="cp-card p-8 text-center text-sm text-[#62594e]">Loading registration…</div>}>
        <RegisterForm />
      </Suspense>
    </main>
  );
}
