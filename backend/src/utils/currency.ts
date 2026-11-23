// Currency is metadata only: amounts are never converted, so mixed-currency calculations are refused.
const CODES = new Set(Intl.supportedValuesOf('currency'));

export const isIsoCurrency = (code: string): boolean => CODES.has(code);

export function mixedCurrencies(loans: Array<{ currency?: string }>): boolean {
  return new Set(loans.map((l) => l.currency ?? 'USD')).size > 1;
}

export const MIXED_CURRENCY_ERROR =
  'Loans use different currencies. ClearPath does not convert currencies, so calculate each currency separately.';
