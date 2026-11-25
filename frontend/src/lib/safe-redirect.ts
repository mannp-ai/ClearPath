// Where to go after signing in. The value comes from the URL, so only paths on this site are allowed.
// Resolved the way a browser would, because "/\evil.example" and "/<tab>/evil.example" leave the site too.
export function safeRedirect(raw: string | null, fallback = '/overview'): string {
  if (!raw?.startsWith('/')) return fallback;
  const base = 'http://clearpath.invalid';
  const url = new URL(raw, base);
  const path = url.pathname + url.search + url.hash;
  return url.origin === base && !path.startsWith('//') ? path : fallback;
}
