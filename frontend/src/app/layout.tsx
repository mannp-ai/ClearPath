import type { Metadata } from "next";
import Link from "next/link";
import { Fraunces, Inter } from "next/font/google";
import Navigation from "./navigation";
import { Logo } from "@/components/logo";
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
        <footer className="cp-site-footer bg-[#0b0f1a] py-10 text-sm text-[#c3cad5]">
          <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 sm:flex-row sm:items-start sm:justify-between sm:px-6">
            <div className="max-w-md space-y-2">
              <Logo className="text-white" />
              <p>Clarity for what&rsquo;s next.</p>
              <p className="text-[#9aa3af]">ClearPath gives estimates from the figures you enter. It is not a lender, loan servicer or financial adviser.</p>
            </div>
            <nav aria-label="Footer" className="flex flex-wrap gap-x-6">
              <Link href="/#features" className="inline-flex min-h-11 items-center hover:text-white">What you get</Link>
              <Link href="/#how-it-works" className="inline-flex min-h-11 items-center hover:text-white">How it works</Link>
              <Link href="/#questions" className="inline-flex min-h-11 items-center hover:text-white">Questions</Link>
            </nav>
          </div>
        </footer>
      </body>
    </html>
  );
}
