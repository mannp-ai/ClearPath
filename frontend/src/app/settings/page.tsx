'use client';

import { useMemo, useState } from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { getApiErrorMessage } from '@/lib/api';
import { useCurrencyOptions, useHydrated, usePreferences } from '@/lib/preferences';
import {
  COUNTRY_CURRENCY,
  defaultCurrencyForCountry,
  formatMoney,
} from '@/lib/currency';

export default function SettingsPage() {
  const { country: savedCountry, currency: savedCurrency, locale, ready, save } = usePreferences();
  // Drafts override the saved values only while the user is editing.
  const [draftCountry, setCountry] = useState<string | null>(null);
  const [draftCurrency, setCurrency] = useState<string | null>(null);
  const country = draftCountry ?? savedCountry ?? '';
  const currency = draftCurrency ?? savedCurrency;
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const hydrated = useHydrated(); // region names can differ between server and browser ICU data
  const countries = useMemo(() => {
    const names = hydrated ? new Intl.DisplayNames(['en'], { type: 'region' }) : null;
    return Object.keys(COUNTRY_CURRENCY)
      .map((code) => ({ code, name: names?.of(code) ?? code }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [hydrated]);

  const currencies = useCurrencyOptions(currency);

  const suggested = country ? defaultCurrencyForCountry(country) : null;

  const onSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');
    try {
      await save({ ...(country ? { country } : {}), currency });
      setCountry(null);
      setCurrency(null);
      setNotice('Preferences saved. Existing loans keep the currency they were entered in.');
    } catch (saveError: unknown) {
      setError(getApiErrorMessage(saveError));
    } finally {
      setSaving(false);
    }
  };

  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:px-6 sm:py-10 space-y-6">
      <div className="cp-masthead">
        <h1 className="font-head">Settings</h1>
        <p className="mt-1 text-sm">Choose your country and the currency ClearPath uses for new loans and amounts.</p>
      </div>

      {error && (
        <div role="alert" className="flex items-start gap-3 rounded-lg border border-[#fecaca] bg-[#fef2f2] p-4 text-sm text-[#b91c1c]">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}
      {notice && (
        <div role="status" className="flex items-start gap-3 rounded-lg border border-[#a7f3d0] bg-[#ecfdf5] p-4 text-sm text-[#0f6b53]">
          <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5" aria-hidden="true" />
          <span>{notice}</span>
        </div>
      )}

      <form onSubmit={onSave} className="cp-card p-5 sm:p-6 space-y-5">
        <div>
          <label htmlFor="settings-country" className="block text-xs font-medium text-[#2b3140] mb-1.5">Country</label>
          <select id="settings-country" className="cp-input" value={country} onChange={(e) => setCountry(e.target.value)} disabled={!ready}>
            <option value="">Not set</option>
            {countries.map((c) => (
              <option key={c.code} value={c.code}>{c.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="settings-currency" className="block text-xs font-medium text-[#2b3140] mb-1.5">Currency</label>
          <select
            id="settings-currency"
            className="cp-input"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
            disabled={!ready}
            aria-describedby="settings-currency-help"
          >
            {currencies.map((c) => (
              <option key={c.code} value={c.code}>{c.code} · {c.name}</option>
            ))}
          </select>
          <p id="settings-currency-help" className="mt-1.5 text-xs text-[#55606e]">
            Example: {formatMoney(1234567.89, currency, locale)}. Changing this never converts existing loans; each loan keeps its own currency.
          </p>
          {suggested && suggested !== currency && (
            <button type="button" className="mt-2 py-2 text-sm font-medium text-[#0f3d32] underline-offset-4 hover:underline" onClick={() => setCurrency(suggested)}>
              Use {suggested}, the usual currency for this country
            </button>
          )}
        </div>

        <button type="submit" className="cp-btn-primary" disabled={saving || !ready}>
          {saving ? 'Saving…' : 'Save preferences'}
        </button>
      </form>
    </main>
  );
}
