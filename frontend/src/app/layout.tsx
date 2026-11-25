import type { Metadata } from "next";
import Link from "next/link";
import { Fraunces, Inter } from "next/font/google";
import Navigation from "./navigation";
import { Logo, LogoMark } from "@/components/logo";
import { PreferencesProvider } from "@/lib/preferences";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter", display: "swap" });
const fraunces = Fraunces({ subsets: ["latin"], variable: "--font-fraunces", display: "swap" });

export const metadata: Metadata = {
  title: "ClearPath | Student loan repayment planning",
  description: "Put your student loans in one place, compare Avalanche and Snowball repayment, and test a refinance rate. Estimates only. Not a lender.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`h-full antialiased ${inter.variable} ${fraunces.variable}`}>
      <body className="min-h-full flex flex-col bg-[#fafbf9] text-[#0b0f1a] antialiased selection:bg-[#d8f2a7] selection:text-[#0b0f1a]">
        <a href="#main-content" className="skip-link">Skip to main content</a>
        <PreferencesProvider>
        <Navigation />
        <div id="main-content" tabIndex={-1} className="flex-1 flex flex-col outline-none">
          {children}
        </div>
        </PreferencesProvider>
        <footer className="cp-site-footer relative overflow-hidden border-t border-white/15 bg-[#0f3d32] text-[#c9d8d1]">
          <LogoMark className="pointer-events-none absolute -bottom-16 -right-8 h-72 w-72 text-[#d8f2a7] opacity-[0.07]" />
          <div className="relative mx-auto max-w-6xl px-4 pb-8 pt-14 sm:px-6 lg:pt-16">
            <div className="flex flex-col gap-10 md:flex-row md:items-end md:justify-between">
              <div>
                <Logo className="text-white" />
                <p className="font-editorial mt-5 text-4xl leading-tight text-[#d8f2a7] sm:text-5xl">Clarity for what&rsquo;s next.</p>
              </div>
              <nav aria-label="Footer">
                <ul className="flex flex-col sm:flex-row sm:gap-2">
                  {[
                    ['/#features', 'What you get'],
                    ['/#how-it-works', 'How it works'],
                    ['/#questions', 'Questions'],
                  ].map(([href, label]) => (
                    <li key={href}>
                      <Link href={href} className="inline-flex min-h-11 items-center rounded-lg font-medium text-white underline-offset-8 hover:text-[#d8f2a7] hover:underline sm:px-3">
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            </div>
            <div className="mt-10 flex flex-col gap-3 border-t border-white/15 pt-6 text-sm sm:flex-row sm:justify-between sm:gap-8">
              <p className="max-w-2xl">ClearPath gives estimates from the figures you enter. It is not a lender, loan servicer or financial adviser.</p>
              <p className="shrink-0">&copy; 2026 ClearPath</p>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
