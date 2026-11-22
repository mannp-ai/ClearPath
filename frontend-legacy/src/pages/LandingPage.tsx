import React from 'react';
import { ArrowRight, Check, ShieldCheck, Sparkles } from 'lucide-react';

interface LandingPageProps {
  onStart: () => void;
  onLoadSample: () => void;
  hasLoans: boolean;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onStart, onLoadSample, hasLoans }) => (
  <div className="landing-page">
    <section className="landing-hero max-w-6xl mx-auto px-4 sm:px-6 pt-14 sm:pt-24 pb-20">
      <div className="landing-copy">
        <p className="section-kicker"><Sparkles size={14} /> A clearer way forward</p>
        <h1>Make your next payment a turning point.</h1>
        <p className="landing-lede">Map every loan, compare payoff paths, and pressure-test refinancing offers—without an account or a sales pitch.</p>
        <div className="flex flex-col sm:flex-row items-start gap-3">
          <button onClick={onStart} className="button-primary">{hasLoans ? 'Open your plan' : 'Build your plan'} <ArrowRight size={16} /></button>
          <button onClick={onLoadSample} className="button-secondary">Explore an example</button>
        </div>
        <ul className="trust-list">
          <li><Check size={14} /> No account</li><li><Check size={14} /> No marketing forms</li><li><Check size={14} /> No server-side loan storage</li>
        </ul>
      </div>
      <aside className="path-preview" aria-label="Example payoff projection">
        <div className="preview-label">Your path, in one view</div>
        <div className="preview-topline"><span>Current balance</span><strong>$38,420</strong></div>
        <div className="preview-curve" aria-hidden="true"><span /><i /><b /></div>
        <div className="preview-outcome"><div><span>With $200 more / month</span><strong>3y 8m sooner</strong></div><div><span>Interest avoided</span><strong>$4,860</strong></div></div>
        <p><ShieldCheck size={15} /> An estimate based on the terms you enter.</p>
      </aside>
    </section>
    <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-20 space-y-7">
      <div><p className="section-kicker">Find the approach you can keep</p><h2 className="editorial-heading">Two ways to accelerate payoff</h2><p className="text-sm text-zinc-500 mt-2 max-w-xl">Both methods pay minimums on every loan, then concentrate extra funds on one target at a time.</p></div>
      <div className="strategy-intro-grid">
        <div className="strategy-intro-card"><div className="strategy-number">01</div><div className="text-sm font-semibold text-zinc-900">Debt Avalanche</div><p>Target the highest interest rate first. It normally costs the least over the life of your loans.</p></div>
        <div className="strategy-intro-card"><div className="strategy-number">02</div><div className="text-sm font-semibold text-zinc-900">Debt Snowball</div><p>Target the smallest balance first. Closing accounts sooner can make progress feel tangible.</p></div>
      </div>
    </section>
    <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-8 landing-refinance">
      <p className="section-kicker">Refinance with context</p><h2 className="editorial-heading">A lower payment is not always a lower cost.</h2><p className="text-sm text-zinc-500 mt-2 leading-relaxed max-w-xl">Test a hypothetical offer against your current loans, including the repayment term and fees—not just the monthly bill.</p>
      <div className="journey-list">
        {['Enter your loans|Balances, annual rates, and monthly minimums.','Choose a payment path|See where extra money has the most impact.','Inspect the schedule|Review principal, interest, and rollover month by month.','Test an offer|Compare a refinance scenario with your current plan.'].map((item, index) => { const [step, description] = item.split('|'); return <div key={step}><span>{index + 1}</span><div>{step}</div><div>{description}</div></div>; })}
      </div>
      <button onClick={onStart} className="button-primary">{hasLoans ? 'Open your plan' : 'Start planning'} <ArrowRight size={16} /></button>
    </section>
    <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-4"><p className="text-xs text-zinc-500 leading-relaxed max-w-xl">ClearPath provides estimates from the information you enter, not financial advice or a lender quote. Refinancing federal loans into private loans may permanently remove federal protections.</p></section>
  </div>
);
