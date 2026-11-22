import type { Metadata } from "next";
import Link from "next/link";
import Navigation from "./navigation";
import "./globals.css";

export const metadata: Metadata = {
  title: "ClearPath | Independent Student Debt & Repayment Engine",
  description: "Deterministic student debt modeling. Compare Debt Avalanche and Debt Snowball with exact rollover math, and stress-test refinancing scenarios.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[#f8fafc] text-[#0f172a] antialiased selection:bg-[#eff6ff] selection:text-[#1d4ed8]">
        <Navigation />
        <div className="flex-1 flex flex-col">
          {children}
        </div>
        <footer className="border-t border-[#e2e8f0] bg-white py-10 text-xs text-[#64748b]">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-1 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2 font-display font-semibold text-[#0f172a]">
                <span>ClearPath</span>
                <span className="text-[#94a3b8]">/</span>
                <span className="text-xs font-normal text-[#64748b]">Debt Modeling Engine</span>
              </div>
              <p className="text-[#64748b]">
                Deterministic student debt calculation tool. Zero lender commissions.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-5 text-[#475569]">
              <Link href="/loans" className="hover:text-[#0f172a] transition-colors">Portfolio</Link>
              <Link href="/repayment" className="hover:text-[#0f172a] transition-colors">Repayment Strategies</Link>
              <Link href="/refinancing" className="hover:text-[#0f172a] transition-colors">Refinancing</Link>
              <Link href="/login" className="hover:text-[#0f172a] transition-colors">Sign in</Link>
              <Link href="/register" className="hover:text-[#0f172a] transition-colors">Create account</Link>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
