import Link from 'next/link';
import { ArrowRight, ShieldCheck } from 'lucide-react';

export default function Home() {
  return (
    <main className="flex-1 bg-[#f6f1e7]">
      {/* 1. Hero Section */}
      <section className="relative overflow-hidden border-b border-[#e4dccb] bg-[#f6f1e7] pt-16 pb-20 sm:pt-24 sm:pb-28">
        <div aria-hidden="true" className="pointer-events-none absolute -right-28 -top-28 h-96 w-96 rounded-full bg-[#f4b942] opacity-40" />
        <div aria-hidden="true" className="pointer-events-none absolute -left-16 bottom-8 h-32 w-32 rounded-full bg-[#e8553d] opacity-20" />
        <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7 space-y-6 animate-fade-up">
              <p className="text-sm font-medium uppercase tracking-widest text-[#14594a]">
                Student loan decision support
              </p>
              <h1 className="font-head text-5xl sm:text-6xl lg:text-7xl font-bold leading-[1.02] tracking-[-0.04em] text-[#231f1b]">
                Take control of your <span className="box-decoration-clone rounded-xl bg-[#f4b942] px-2">student loans.</span>
              </h1>
              <p className="text-lg text-[#4a4239] leading-relaxed max-w-xl">
                Understand your debt, compare repayment strategies, and explore refinancing scenarios, all in one place.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Link href="/register" className="cp-btn-primary px-6">
                  <span>Start managing loans</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
                <a href="#features" className="cp-btn-secondary px-6">
                  Explore features
                </a>
              </div>
            </div>

            {/* What the tools produce: descriptive only, no sample figures */}
            <div className="lg:col-span-5 animate-fade-up animation-delay-150">
              <div className="rounded-2xl bg-[#12332b] p-6 sm:p-8 space-y-5">
                <h2 className="text-sm font-semibold uppercase tracking-widest text-[#f4b942]">Your results show</h2>
                <ul className="space-y-4 text-base text-[#e4dccb]">
                  <li className="flex gap-3"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#f4b942]" aria-hidden="true" /><span>Months to debt-free under minimum payments, Avalanche and Snowball</span></li>
                  <li className="flex gap-3"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#f4b942]" aria-hidden="true" /><span>Total interest paid, and what extra payments save</span></li>
                  <li className="flex gap-3"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#f4b942]" aria-hidden="true" /><span>Refinancing cost versus keeping your current loans, with federal-protection warnings</span></li>
                </ul>
                <p className="text-sm text-[#d6ccb8] border-t border-[#2d5a4e] pt-4">
                  Calculated from the loans you enter. No bank linking, no credit check, no lender commissions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Features Section (High-Density Analytical Showcase) */}
      <section id="features" className="py-20 bg-[#f6f1e7] border-b border-[#e4dccb]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-2xl mb-12">
            <h2 className="font-head text-3xl sm:text-4xl font-semibold tracking-tight text-[#231f1b]">
              Built for precision, not sales pitches.
            </h2>
            <p className="mt-2 text-sm sm:text-base text-[#62594e]">
              Every tool in ClearPath solves a real friction point in student loan management.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Feature 1 */}
            <div className="cp-card p-6 sm:p-7 space-y-3">
              <span className="font-mono text-xs font-medium text-[#14594a]">01</span>
              <h3 className="font-display text-lg font-bold text-[#231f1b]">
                Multi-Loan Portfolio Consolidation
              </h3>
              <p className="text-sm text-[#4a4239] leading-relaxed">
                Organise loan balances, interest rates, and minimum payments in one place. Categorise accounts as Federal or Private to monitor loan protections and balance-weighted interest exposure.
              </p>
              <div className="pt-3 border-t border-[#efe8d8] text-xs text-[#62594e] flex justify-between">
                <span>Combined monthly minimum</span>
                <span className="font-medium text-[#231f1b]">True weighted portfolio APR</span>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="cp-card p-6 sm:p-7 space-y-3">
              <span className="font-mono text-xs font-medium text-[#14594a]">02</span>
              <h3 className="font-display text-lg font-bold text-[#231f1b]">
                Avalanche vs. Snowball Comparison
              </h3>
              <p className="text-sm text-[#4a4239] leading-relaxed">
                Compare minimum payments, Debt Avalanche (highest APR first), and Debt Snowball (smallest balance first). Exact month-by-month principal reduction and rollover cascading show your debt-free date.
              </p>
              <div className="pt-3 border-t border-[#efe8d8] text-xs text-[#62594e] flex justify-between">
                <span>Month-by-month schedules</span>
                <span className="font-medium text-[#231f1b]">Debt-free month projections</span>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="cp-card p-6 sm:p-7 space-y-3">
              <span className="font-mono text-xs font-medium text-[#14594a]">03</span>
              <h3 className="font-display text-lg font-bold text-[#231f1b]">
                Hypothetical Refinancing Evaluator
              </h3>
              <p className="text-sm text-[#4a4239] leading-relaxed">
                Estimate hypothetical refinancing payments, interest, and total repayment costs. Detect the &ldquo;lower payment trap&rdquo; where extended terms lower monthly cash outflow but dramatically increase total interest.
              </p>
              <div className="pt-3 border-t border-[#efe8d8] text-xs text-[#62594e] flex justify-between">
                <span>Closing fee treatment</span>
                <span className="font-medium text-[#231f1b]">Federal relief warnings</span>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="cp-card p-6 sm:p-7 space-y-3">
              <span className="font-mono text-xs font-medium text-[#14594a]">04</span>
              <h3 className="font-display text-lg font-bold text-[#231f1b]">
                Saved Scenarios & Modeling Archives
              </h3>
              <p className="text-sm text-[#4a4239] leading-relaxed">
                Save customized repayment and refinancing scenarios to your account. Reload past simulations anytime to review assumptions, budget changes, or extra payment milestones without re-entering data.
              </p>
              <div className="pt-3 border-t border-[#efe8d8] text-xs text-[#62594e] flex justify-between">
                <span>Single-click scenario restore</span>
                <span className="font-medium text-[#231f1b]">Account-isolated models</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. How ClearPath Works */}
      <section id="how-it-works" className="py-20 bg-[#fffdf8] border-b border-[#e4dccb]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-2xl mb-14">
            <h2 className="font-head text-3xl sm:text-4xl font-semibold tracking-tight text-[#231f1b]">
              How ClearPath works.
            </h2>
            <p className="mt-2 text-sm sm:text-base text-[#62594e]">
              Get started in three simple steps without linking bank accounts or running credit checks.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-3">
              <div className="text-xs font-mono font-semibold text-[#14594a]">Step 1</div>
              <h3 className="font-display text-base font-bold text-[#231f1b]">
                Create your account
              </h3>
              <p className="text-sm text-[#4a4239] leading-relaxed">
                Set up a secure login with your email address. Your loan portfolio and simulation data are encrypted and kept private.
              </p>
            </div>

            <div className="space-y-3">
              <div className="text-xs font-mono font-semibold text-[#14594a]">Step 2</div>
              <h3 className="font-display text-base font-bold text-[#231f1b]">
                Enter your student loans
              </h3>
              <p className="text-sm text-[#4a4239] leading-relaxed">
                Add balances, APRs, and minimum payments for each loan account. We compute your combined baseline and weighted APR.
              </p>
            </div>

            <div className="space-y-3">
              <div className="text-xs font-mono font-semibold text-[#14594a]">Step 3</div>
              <h3 className="font-display text-base font-bold text-[#231f1b]">
                Compare strategies & explore refinancing
              </h3>
              <p className="text-sm text-[#4a4239] leading-relaxed">
                Test extra monthly payments to see your exact payoff acceleration and evaluate whether refinancing quotes save money.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Disclaimers & Trust Notice */}
      <section className="py-14 bg-[#f6f1e7] border-b border-[#e4dccb]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="rounded-lg border border-[#d6ccb8] bg-[#fffdf8] p-6 space-y-3 text-xs leading-relaxed text-[#62594e]">
            <div className="flex items-center gap-2 font-display font-semibold text-[#231f1b] text-sm">
              <ShieldCheck className="h-4 w-4 text-[#14594a]" />
              <span>Independent Decision-Support & Educational Planning Notice</span>
            </div>
            <p>
              ClearPath is an educational mathematical calculator designed to help borrowers evaluate debt repayment strategies. ClearPath is not a lender, loan broker, credit underwriter, loan servicer, or certified financial adviser.
            </p>
            <p>
              All computations, timelines, and interest figures are simulations based on user-entered values. ClearPath does not guarantee savings or offer loan approvals. Refinancing federal loans with a private lender permanently forfeits federal protections, including Public Service Loan Forgiveness (PSLF), Income-Driven Repayment (IDR/SAVE), and federal forbearance.
            </p>
          </div>
        </div>
      </section>

      {/* 5. Final Call to Action */}
      <section className="py-20 bg-[#fffdf8] text-center">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 space-y-5">
          <h2 className="font-head text-3xl sm:text-4xl font-semibold tracking-tight text-[#231f1b]">
            Your next step towards a clearer repayment plan.
          </h2>
          <p className="text-sm sm:text-base text-[#62594e]">
            Create a free account to organize your loans and start modeling accelerated payoff strategies today.
          </p>
          <div className="pt-2">
            <Link
              href="/register"
              className="cp-btn-primary text-sm px-6 py-3"
            >
              <span>Get started</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
