import type { Metadata } from "next";
import Link from "next/link";
import { Bricolage_Grotesque } from "next/font/google";
import Navigation from "./navigation";
import { PreferencesProvider } from "@/lib/preferences";
import "./globals.css";

const serif = Bricolage_Grotesque({ subsets: ["latin"], weight: ["500","600","700"], variable: "--font-bricolage", display: "swap" });

export const metadata: Metadata = {
  title: "ClearPath | Independent Student Debt & Repayment Engine",
  description: "Deterministic student debt modeling. Compare Debt Avalanche and Debt Snowball with exact rollover math, and stress-test refinancing scenarios.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`h-full antialiased ${serif.variable}`}>
      <body className="min-h-full flex flex-col bg-[#f6f1e7] text-[#231f1b] antialiased selection:bg-[#e6f0e9] selection:text-[#0f4a3d]">
        <a href="#main-content" className="skip-link">Skip to main content</a>
        <PreferencesProvider>
        <Navigation />
        <div id="main-content" tabIndex={-1} className="flex-1 flex flex-col outline-none">
          {children}
        </div>
        </PreferencesProvider>
        <footer className="bg-[#12332b] py-10 text-sm text-[#d6ccb8]">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="space-y-1 text-center sm:text-left">
              <div className="flex items-center justify-center sm:justify-start gap-2 font-display font-semibold text-white">
                <span>ClearPath</span>
                <span aria-hidden="true" className="text-[#d6ccb8]">/</span>
                <span className="text-sm font-normal text-[#d6ccb8]">Debt Modeling Engine</span>
              </div>
              <p className="text-[#d6ccb8]">
                Deterministic student debt calculation tool. Zero lender commissions.
              </p>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-5 text-[#e4dccb]">
              <Link href="/loans" className="inline-block py-2 hover:text-white underline-offset-4 hover:underline transition-colors">Portfolio</Link>
              <Link href="/repayment" className="inline-block py-2 hover:text-white underline-offset-4 hover:underline transition-colors">Repayment Strategies</Link>
              <Link href="/refinancing" className="inline-block py-2 hover:text-white underline-offset-4 hover:underline transition-colors">Refinancing</Link>
              <Link href="/login" className="inline-block py-2 hover:text-white underline-offset-4 hover:underline transition-colors">Sign in</Link>
              <Link href="/register" className="inline-block py-2 hover:text-white underline-offset-4 hover:underline transition-colors">Create account</Link>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
