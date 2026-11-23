// Localhost defaults are for development only; production must configure real URLs.
export function requireUrl(name: 'FRONTEND_URL' | 'GOOGLE_CALLBACK_URL', devDefault: string): string {
  const prod = process.env.NODE_ENV === 'production';
  const value = process.env[name] || (prod ? '' : devDefault);
  let url: URL | undefined;
  try { url = new URL(value); } catch { /* handled below */ }
  if (!url || (prod && (url.protocol !== 'https:' || ['localhost', '127.0.0.1', '[::1]'].includes(url.hostname)))) {
    throw new Error(`${name} must be set to a valid https URL in production`);
  }
  return value;
}
