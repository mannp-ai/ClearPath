// Two offset slabs: the ClearPath mark from the brand board. Colour comes from `currentColor`.
export function LogoMark({ className = 'h-6 w-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M13 4h17l-7 10H6z" />
      <path d="M9 18h17l-7 10H2z" />
    </svg>
  );
}

export function Logo({ className = '' }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 text-lg font-semibold tracking-tight ${className}`}>
      <LogoMark />
      ClearPath
    </span>
  );
}
