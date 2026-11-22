'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, AlertCircle, MailCheck, ArrowRight } from 'lucide-react';
import { getApiErrorMessage, verifyEmail } from '@/lib/api';

type VerificationState = { status: 'checking' | 'success' | 'error'; message: string };

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token');
  const [state, setState] = useState<VerificationState>({
    status: 'checking',
    message: 'Verifying your email addressâ€¦',
  });

  useEffect(() => {
    if (!token) return;
    let active = true;
    verifyEmail(token)
      .then((result) => {
        if (active) setState({ status: 'success', message: result.message });
      })
      .catch((error: unknown) => {
        if (active) setState({ status: 'error', message: getApiErrorMessage(error) });
      });
    return () => {
      active = false;
    };
  }, [token]);

  const message = token ? state.message : 'This verification link is missing its security token.';
  const status = token ? state.status : 'error';

  return (
    <div className="w-full max-w-md">
      <div className="cp-card p-6 sm:p-8 space-y-6 text-center">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-[#eff6ff] text-[#2563eb] mb-2">
          {status === 'success' ? (
            <CheckCircle2 className="h-6 w-6 text-[#168568]" />
          ) : status === 'error' ? (
            <AlertCircle className="h-6 w-6 text-[#dc2626]" />
          ) : (
            <MailCheck className="h-6 w-6 text-[#2563eb]" />
          )}
        </div>

        <h1 className="font-display text-2xl font-bold tracking-tight text-[#0f172a]">
          Email Verification
        </h1>

        <div
          role={status === 'error' ? 'alert' : 'status'}
          className={`rounded-lg p-4 text-xs sm:text-sm leading-relaxed ${
            status === 'success'
              ? 'border border-[#a7f3d0] bg-[#ecfdf5] text-[#168568]'
              : status === 'error'
              ? 'border border-[#fecaca] bg-[#fef2f2] text-[#dc2626]'
              : 'border border-[#e6eaf0] bg-[#f8fafc] text-[#64748b]'
          }`}
        >
          {message}
        </div>

        {status === 'success' && (
          <Link
            href="/login"
            className="cp-btn-primary w-full"
          >
            <span>Continue to Sign In</span>
            <ArrowRight className="h-4 w-4" />
          </Link>
        )}

        {status === 'error' && (
          <Link
            href="/login"
            className="cp-btn-secondary w-full"
          >
            Back to Sign In
          </Link>
        )}
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <main className="flex-1 flex items-center justify-center px-4 py-12 sm:py-16">
      <Suspense
        fallback={
          <div className="cp-card p-8 text-center text-sm text-[#64748b]">
            Checking verification linkâ€¦
          </div>
        }
      >
        <VerifyEmailContent />
      </Suspense>
    </main>
  );
}

