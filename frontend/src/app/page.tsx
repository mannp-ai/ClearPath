import Link from 'next/link';
import { ArrowRight, ShieldCheck } from 'lucide-react';

export default function Home() {
  return (
    <main className="flex-1 bg-[#f8fafc]">
      {/* 1. Hero Section */}
      <section className="border-b border-[#e2e8f0] bg-white pt-14 pb-16 sm:pt-20 sm:pb-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Column: Value Prop */}
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-[#bfdbfe] bg-[#eff6ff] px-3 py-1 text-xs font-medium text-[#1d4ed8]">
                <span className="h-1.5 w-1.5 rounded-full bg-[#2563eb]" />
                <span>Deterministic debt modeling</span>
              </div>

              <h1 className="font-display text-4xl sm:text-5xl lg:text-[3.25rem] font-bold tracking-tight text-[#0f172a] leading-[1.1]">
                Take control of your student loans.
              </h1>

              <p className="text-base sm:text-lg text-[#475569] leading-relaxed max-w-xl">
                Understand your debt, compare repayment strategies, and explore refinancing scenarios — all in one place.
              </p>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
                <Link
                  href="/register"
                  className="cp-btn-primary text-sm px-6 py-3"
                >
                  <span>Start managing loans</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <a
                  href="#features"
                  className="cp-btn-secondary text-sm px-6 py-3"
                >
                  Explore features
                </a>
              </div>

              {/* Institutional Assurances */}
              <div className="pt-4 border-t border-[#f1f5f9] grid grid-cols-3 gap-4 text-xs text-[#64748b]">
                <div>
                  <strong className="block font-semibold text-[#0f172a]">$0 Fee</strong>
                  <span>Free educational tool</span>
                </div>
                <div>
                  <strong className="block font-semibold text-[#0f172a]">Zero Bias</strong>
                  <span>No lender commissions</span>
                </div>
                <div>
                  <strong className="block font-semibold text-[#0f172a]">Exact Math</strong>
                  <span>Actuarial amortization</span>
                </div>
              </div>
            </div>

            {/* Right Column: Grounded Financial Comparison Preview */}
            <div className="lg:col-span-6">
              <div className="rounded-xl border border-[#cbd5e1] bg-white shadow-sm overflow-hidden">
                {/* Header Strip */}
                <div className="border-b border-[#e2e8f0] bg-[#f8fafc] px-5 py-3.5 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-xs font-semibold text-[#0f172a]">Illustrative Portfolio Model</span>
                    <p className="text-[11px] text-[#64748b]">4 student loans totaling $48,500.00 at 5.85% APR</p>
                  </div>
                  <span className="rounded-md border border-[#cbd5e1] bg-white px-2 py-0.5 text-[11px] font-mono text-[#475569]">
                    Sample data
                  </span>
                </div>

                {/* Strategy Comparison Matrix */}
                <div className="p-5 space-y-4">
                  {/* Baseline Row */}
                  <div className="rounded-lg border border-[#e2e8f0] p-4 bg-[#f8fafc] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-semibold text-[#475569]">Minimum Payments (Baseline)</div>
                      <div className="text-xs text-[#64748b] mt-0.5">$540/month required minimums</div>
                    </div>
                    <div className="text-right sm:text-right">
                      <div className="font-mono text-sm font-semibold text-[#0f172a] tabular-nums">120 months</div>
                      <div className="text-[11px] text-[#64748b] tabular-nums">$15,480 lifetime interest</div>
                    </div>
                  </div>

                  {/* Avalanche Row (Hero Strategy) */}
                  <div className="rounded-lg border-2 border-[#2563eb] p-4 bg-[#eff6ff]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 relative">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-[#1d4ed8]">Debt Avalanche (+ $150/mo extra)</span>
                        <span className="rounded-full bg-[#dcfce7] px-2 py-0.5 text-[10px] font-semibold text-[#15803d]">
                          Saves most money
                        </span>
                      </div>
                      <div className="text-xs text-[#475569] mt-0.5">Focus extra funds on highest APR first</div>
                    </div>
                    <div className="text-right sm:text-right">
                      <div className="font-mono text-sm font-semibold text-[#15803d] tabular-nums">78 months (-3.5 yrs)</div>
                      <div className="text-[11px] font-semibold text-[#15803d] tabular-nums">Saves $4,320 in interest</div>
                    </div>
                  </div>

                  {/* Snowball Row */}
                  <div className="rounded-lg border border-[#e2e8f0] p-4 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-semibold text-[#475569]">Debt Snowball (+ $150/mo extra)</div>
                      <div className="text-xs text-[#64748b] mt-0.5">Eliminate smallest balance first for early wins</div>
                    </div>
                    <div className="text-right sm:text-right">
                      <div className="font-mono text-sm font-semibold text-[#0f172a] tabular-nums">82 months</div>
                      <div className="text-[11px] text-[#475569] tabular-nums">Saves $3,640 in interest</div>
                    </div>
                  </div>

                  {/* Summary Footer */}
                  <div className="pt-2 flex items-center justify-between text-xs text-[#64748b] border-t border-[#f1f5f9]">
                    <span>Rollover cascading automatically modeled</span>
                    <Link href="/register" className="font-medium text-[#2563eb] hover:underline">
                      Model your loans →
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Features Section (High-Density Analytical Showcase) */}
      <section id="features" className="py-20 bg-[#f8fafc] border-b border-[#e2e8f0]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-2xl mb-12">
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#0f172a]">
              Built for precision, not sales pitches.
            </h2>
            <p className="mt-2 text-sm sm:text-base text-[#64748b]">
              Every tool in ClearPath solves a real friction point in student loan management.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Feature 1 */}
            <div className="cp-card p-6 sm:p-7 space-y-3">
              <span className="font-mono text-xs font-medium text-[#2563eb]">01</span>
              <h3 className="font-display text-lg font-bold text-[#0f172a]">
                Multi-Loan Portfolio Consolidation
              </h3>
              <p className="text-sm text-[#475569] leading-relaxed">
                Organise loan balances, interest rates, and minimum payments in one place. Categorise accounts as Federal or Private to monitor loan protections and balance-weighted interest exposure.
              </p>
              <div className="pt-3 border-t border-[#f1f5f9] text-xs text-[#64748b] flex justify-between">
                <span>Combined monthly minimum</span>
                <span className="font-medium text-[#0f172a]">True weighted portfolio APR</span>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="cp-card p-6 sm:p-7 space-y-3">
              <span className="font-mono text-xs font-medium text-[#2563eb]">02</span>
              <h3 className="font-display text-lg font-bold text-[#0f172a]">
                Avalanche vs. Snowball Comparison
              </h3>
              <p className="text-sm text-[#475569] leading-relaxed">
                Compare minimum payments, Debt Avalanche (highest APR first), and Debt Snowball (smallest balance first). Exact month-by-month principal reduction and rollover cascading show your debt-free date.
              </p>
              <div className="pt-3 border-t border-[#f1f5f9] text-xs text-[#64748b] flex justify-between">
                <span>Month-by-month schedules</span>
                <span className="font-medium text-[#0f172a]">Debt-free month projections</span>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="cp-card p-6 sm:p-7 space-y-3">
              <span className="font-mono text-xs font-medium text-[#2563eb]">03</span>
              <h3 className="font-display text-lg font-bold text-[#0f172a]">
                Hypothetical Refinancing Evaluator
              </h3>
              <p className="text-sm text-[#475569] leading-relaxed">
                Estimate hypothetical refinancing payments, interest, and total repayment costs. Detect the &ldquo;lower payment trap&rdquo; where extended terms lower monthly cash outflow but dramatically increase total interest.
              </p>
              <div className="pt-3 border-t border-[#f1f5f9] text-xs text-[#64748b] flex justify-between">
                <span>Closing fee treatment</span>
                <span className="font-medium text-[#0f172a]">Federal relief warnings</span>
              </div>
            </div>

            {/* Feature 4 */}
            <div className="cp-card p-6 sm:p-7 space-y-3">
              <span className="font-mono text-xs font-medium text-[#2563eb]">04</span>
              <h3 className="font-display text-lg font-bold text-[#0f172a]">
                Saved Scenarios & Modeling Archives
              </h3>
              <p className="text-sm text-[#475569] leading-relaxed">
                Save customized repayment and refinancing scenarios to your account. Reload past simulations anytime to review assumptions, budget changes, or extra payment milestones without re-entering data.
              </p>
              <div className="pt-3 border-t border-[#f1f5f9] text-xs text-[#64748b] flex justify-between">
                <span>Single-click scenario restore</span>
                <span className="font-medium text-[#0f172a]">Account-isolated models</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. How ClearPath Works */}
      <section id="how-it-works" className="py-20 bg-white border-b border-[#e2e8f0]">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="max-w-2xl mb-14">
            <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#0f172a]">
              How ClearPath works.
            </h2>
            <p className="mt-2 text-sm sm:text-base text-[#64748b]">
              Get started in three simple steps without linking bank accounts or running credit checks.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-3">
              <div className="text-xs font-mono font-semibold text-[#2563eb]">Step 1</div>
              <h3 className="font-display text-base font-bold text-[#0f172a]">
                Create your account
              </h3>
              <p className="text-sm text-[#475569] leading-relaxed">
                Set up a secure login with your email address. Your loan portfolio and simulation data are encrypted and kept private.
              </p>
            </div>

            <div className="space-y-3">
              <div className="text-xs font-mono font-semibold text-[#2563eb]">Step 2</div>
              <h3 className="font-display text-base font-bold text-[#0f172a]">
                Enter your student loans
              </h3>
              <p className="text-sm text-[#475569] leading-relaxed">
                Add balances, APRs, and minimum payments for each loan account. We compute your combined baseline and weighted APR.
              </p>
            </div>

            <div className="space-y-3">
              <div className="text-xs font-mono font-semibold text-[#2563eb]">Step 3</div>
              <h3 className="font-display text-base font-bold text-[#0f172a]">
                Compare strategies & explore refinancing
              </h3>
              <p className="text-sm text-[#475569] leading-relaxed">
                Test extra monthly payments to see your exact payoff acceleration and evaluate whether refinancing quotes save money.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Disclaimers & Trust Notice */}
      <section className="py-14 bg-[#f8fafc] border-b border-[#e2e8f0]">
        <div className="mx-auto max-w-4xl px-4 sm:px-6">
          <div className="rounded-lg border border-[#cbd5e1] bg-white p-6 space-y-3 text-xs leading-relaxed text-[#64748b]">
            <div className="flex items-center gap-2 font-display font-semibold text-[#0f172a] text-sm">
              <ShieldCheck className="h-4 w-4 text-[#2563eb]" />
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
      <section className="py-20 bg-white text-center">
        <div className="mx-auto max-w-2xl px-4 sm:px-6 space-y-5">
          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-[#0f172a]">
            Your next step towards a clearer repayment plan.
          </h2>
          <p className="text-sm sm:text-base text-[#64748b]">
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
