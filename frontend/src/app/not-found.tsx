import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-xl flex-1 flex-col items-start justify-center px-4 py-24">
      <p className="text-sm font-semibold text-[#0f3d32]">Error 404</p>
      <h1 className="font-editorial mt-2 text-4xl">This path leads nowhere</h1>
      <p className="mt-3 text-[#55606e]">The page you asked for does not exist or has moved.</p>
      <Link href="/" className="cp-btn-primary mt-6">Back to home</Link>
    </main>
  );
}
