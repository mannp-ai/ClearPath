// Pure helpers (no imports) so backend Jest can cover them. Currency is display metadata only; amounts are never converted.
const EUROZONE = ['AT', 'BE', 'CY', 'DE', 'EE', 'ES', 'FI', 'FR', 'GR', 'HR', 'IE', 'IT', 'LT', 'LU', 'LV', 'MT', 'NL', 'PT', 'SI', 'SK'];

// shortcut: curated country -> ISO 4217 table, not exhaustive; unknown countries fall back to USD until the user picks a currency.
export const COUNTRY_CURRENCY: Record<string, string> = {
  IN: 'INR', US: 'USD', GB: 'GBP', CA: 'CAD', AU: 'AUD', NZ: 'NZD', JP: 'JPY', CN: 'CNY', SG: 'SGD', HK: 'HKD',
  AE: 'AED', SA: 'SAR', ZA: 'ZAR', NG: 'NGN', KE: 'KES', EG: 'EGP', CH: 'CHF', SE: 'SEK', NO: 'NOK', DK: 'DKK',
  PL: 'PLN', CZ: 'CZK', HU: 'HUF', RO: 'RON', TR: 'TRY', BR: 'BRL', MX: 'MXN', AR: 'ARS', CL: 'CLP', CO: 'COP',
  KR: 'KRW', TH: 'THB', MY: 'MYR', ID: 'IDR', PH: 'PHP', VN: 'VND', PK: 'PKR', BD: 'BDT', LK: 'LKR', NP: 'NPR',
  IL: 'ILS', UA: 'UAH', RU: 'RUB', IS: 'ISK',
  ...Object.fromEntries(EUROZONE.map((c) => [c, 'EUR'])),
};

export const DEFAULT_CURRENCY = 'USD';

export function defaultCurrencyForCountry(country?: string | null): string {
  return (country && COUNTRY_CURRENCY[country.toUpperCase()]) || DEFAULT_CURRENCY;
}

export function countryFromLocale(locale?: string | null): string | undefined {
  try {
    const region = locale ? new Intl.Locale(locale).maximize().region : undefined;
    return region && COUNTRY_CURRENCY[region] ? region : undefined;
  } catch {
    return undefined;
  }
}

export function allCurrencies(): string[] {
  return Intl.supportedValuesOf('currency');
}

export function isSupportedCurrency(code: string): boolean {
  return allCurrencies().includes(code);
}

export function localeFor(country?: string | null, browserLocale = 'en-US'): string {
  return country ? `en-${country.toUpperCase()}` : browserLocale;
}

const cache = new Map<string, Intl.NumberFormat>();
export function formatMoney(
  value: number | string | null | undefined,
  currency: string = DEFAULT_CURRENCY,
  locale = 'en-US',
  decimals = 2,
): string {
  if (value == null || value === '') return '—';
  const key = `${locale}|${currency}|${decimals}`;
  let nf = cache.get(key);
  if (!nf) {
    nf = new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    });
    cache.set(key, nf);
  }
  return nf.format(Number(value));
}

export function currencySymbol(currency: string, locale = 'en-US'): string {
  const parts = new Intl.NumberFormat(locale, { style: 'currency', currency }).formatToParts(0);
  return parts.find((p) => p.type === 'currency')?.value ?? currency;
}

// Currency shared by a loan list: undefined when empty, 'MIXED' when loans disagree (legacy loans without a currency are USD).
export function portfolioCurrency(loans: Array<{ currency?: string }>): string | undefined {
  const set = new Set(loans.map((l) => l.currency ?? DEFAULT_CURRENCY));
  return set.size === 0 ? undefined : set.size === 1 ? [...set][0] : 'MIXED';
}
