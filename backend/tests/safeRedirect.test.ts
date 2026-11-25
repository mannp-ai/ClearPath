// The frontend's post-sign-in redirect guard (pure function, tested here like the currency helpers).
import { safeRedirect } from '../../frontend/src/lib/safe-redirect';

describe('safeRedirect', () => {
  it('keeps paths on this site', () => {
    expect(safeRedirect('/loans')).toBe('/loans');
    expect(safeRedirect('/repayment?extra=100#plan')).toBe('/repayment?extra=100#plan');
  });

  it.each([
    null,
    '',
    'loans',
    'https://evil.example',
    '//evil.example',
    '/\\evil.example',
    '/\\/evil.example',
    '/\t/evil.example',
    '/\n/evil.example',
    '/.//evil.example',
    'javascript:alert(1)',
  ])('falls back for %p', (value) => {
    expect(safeRedirect(value)).toBe('/overview');
  });
});
