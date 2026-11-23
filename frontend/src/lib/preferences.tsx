'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState, useSyncExternalStore, type ReactNode } from 'react';
import { fetchCurrentUser, updatePreferences, type Preferences } from './api';
import { allCurrencies, countryFromLocale, defaultCurrencyForCountry, DEFAULT_CURRENCY, localeFor } from './currency';

type Ctx = {
  currency: string;
  country?: string;
  locale: string;
  ready: boolean;
  save: (p: Preferences) => Promise<void>;
};

const PreferencesContext = createContext<Ctx>({
  currency: DEFAULT_CURRENCY,
  locale: 'en-US',
  ready: false,
  save: async () => {},
});

export const usePreferences = () => useContext(PreferencesContext);

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [prefs, setPrefs] = useState<Preferences>({});
  const [ready, setReady] = useState(false);
  const hydrated = useHydrated(); // navigator.language must not affect the first (server-matching) render

  useEffect(() => {
    let active = true;
    fetchCurrentUser()
      .then(async (user) => {
        if (!active) return;
        if (user.preferences?.currency) return setPrefs(user.preferences);
        // Initial setup only: derive from the browser locale once, then persist so it is never silently overwritten.
        const country = countryFromLocale(navigator.language);
        const initial = { ...(country ? { country } : {}), currency: defaultCurrencyForCountry(country) };
        setPrefs(initial);
        try {
          await updatePreferences(initial);
        } catch {
          /* retried on next load */
        }
      })
      .catch(() => {})
      .finally(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, []);

  const save = useCallback(async (p: Preferences) => {
    const user = await updatePreferences(p);
    setPrefs(user.preferences ?? p);
  }, []);

  const value = useMemo<Ctx>(
    () => ({
      currency: prefs.currency ?? DEFAULT_CURRENCY,
      country: prefs.country,
      locale: localeFor(prefs.country, hydrated ? navigator.language : 'en-US'),
      ready,
      save,
    }),
    [prefs, ready, save, hydrated],
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

const noopSubscribe = () => () => {};

export const useHydrated = () => useSyncExternalStore(noopSubscribe, () => true, () => false);

// The ICU currency list differs between server and browser, so list every currency only after hydration.
export function useCurrencyOptions(selected: string): Array<{ code: string; name: string }> {
  const hydrated = useHydrated();
  return useMemo(() => {
    if (!hydrated) return [{ code: selected, name: selected }];
    const names = new Intl.DisplayNames(['en'], { type: 'currency' });
    const codes = allCurrencies();
    return (codes.includes(selected) ? codes : [selected, ...codes]).map((code) => ({ code, name: names.of(code) ?? code }));
  }, [hydrated, selected]);
}
