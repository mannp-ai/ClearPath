'use client';

import { Suspense, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Mail, Lock, Eye, EyeOff, ArrowLeft, AlertCircle, CheckCircle2 } from 'lucide-react';
import { getApiErrorMessage, requestPasswordReset, resetPassword } from '@/lib/api';

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitting(true);
    setError('');
    setMessage('');
    try {
      const result = token
        ? await resetPassword(token, password)
        : await requestPasswordReset(email);
      setMessage(result.message);
    } catch (resetError: unknown) {
      setError(getApiErrorMessage(resetError));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="cp-card p-6 sm:p-8 space-y-6">
        <div className="text-center space-y-1">
          <h1 className="font-head text-3xl font-semibold tracking-tight text-[#0b0f1a]">
            {token ? 'Set New Password' : 'Reset Password'}
          </h1>
          <p className="text-xs sm:text-sm text-[#55606e]">
            {token
              ? 'Enter a new password for your ClearPath account.'
              : "Enter your registered email address and we'll send a password recovery link."}
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="flex items-start gap-2.5 rounded-lg border border-[#fecaca] bg-[#fef2f2] p-3.5 text-xs text-[#b91c1c]"
          >
            <AlertCircle className="h-4 w-4 shrink-0 text-[#b91c1c] mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {message ? (
          <div
            role="status"
            className="rounded-lg border border-[#a7f3d0] bg-[#ecfdf5] p-5 text-center space-y-3"
          >
            <CheckCircle2 className="h-8 w-8 text-[#0f6b53] mx-auto" />
            <div className="text-sm font-semibold text-[#0f6b53]">
              {message}
            </div>
            <div className="pt-2">
              <Link
                href="/login"
                className="cp-btn-primary text-xs w-full"
              >
                Back to Sign In
              </Link>
            </div>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            {token ? (
              <div>
                <label
                  htmlFor="new-password"
                  className="block text-xs font-semiboldr text-[#55606e] mb-1.5"
                >
                  New password (at least 8 characters)
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#55606e]">
                    <Lock className="h-4 w-4" />
                  </span>
                  <input
                    id="new-password"
                    className="cp-input pl-9 pr-10"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    minLength={8}
                    maxLength={128}
                    required
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-1 top-1/2 -translate-y-1/2 p-2 text-[#55606e] hover:text-[#2b3140]"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            ) : (
              <div>
                <label
                  htmlFor="reset-email"
                  className="block text-xs font-semiboldr text-[#55606e] mb-1.5"
                >
                  Email address
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#55606e]">
                    <Mail className="h-4 w-4" />
                  </span>
                  <input
                    id="reset-email"
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
            )}

            <button
              disabled={submitting}
              type="submit"
              className="cp-btn-primary w-full mt-2"
            >
              {submitting ? (
                <span>Please wait…</span>
              ) : (
                <>
                  <span>{token ? 'Update Password' : 'Send Recovery Link'}</span>
                </>
              )}
            </button>
          </form>
        )}

        <div className="pt-4 border-t border-[#eef0ec] text-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-1 py-2 text-sm text-[#55606e] hover:text-[#0b0f1a]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to login</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <main className="flex-1 flex items-center justify-center px-4 py-12 sm:py-16">
      <Suspense
        fallback={
          <div className="cp-card p-8 text-center text-sm text-[#55606e]">
            Loading password reset…
          </div>
        }
      >
        <ResetPasswordForm />
      </Suspense>
    </main>
  );
}

