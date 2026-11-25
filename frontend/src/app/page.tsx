import Link from 'next/link';
import { PayoffDemo } from '@/components/payoff-demo';
import { ProductTabs } from '@/components/product-tabs';

const wrap = 'mx-auto w-full max-w-6xl px-4 sm:px-6';
const primary = 'inline-flex min-h-12 items-center justify-center rounded-lg bg-[#d8f2a7] px-6 font-semibold text-[#0b0f1a] hover:bg-[#e8f9c8]';

const STEPS = [
  ['Find your loan details', 'Each balance, interest rate and minimum payment, from your statement or servicer account.'],
  ['Type them in', 'Create a free account. No bank login and no credit check.'],
  ['Compare and decide', 'Try extra amounts, check a refinance rate and save the plan you like.'],
];

const LOST = ['Income-driven repayment', 'Public Service Loan Forgiveness', 'Federal deferment and forbearance', 'Disability and death discharge'];

const QUESTIONS = [
  ['Who is ClearPath for?', 'People repaying student loans, mainly in the United States, who want to see what their choices could cost before making them.'],
  ['What does ClearPath not do?', 'It does not lend money, arrange refinancing, take or move payments, or connect to your bank or loan servicer.'],
  ['Does it cost anything?', 'Creating an account and using the calculators is free today.'],
  ['What do I need to start?', 'The balance, interest rate and minimum monthly payment for each loan. No account numbers or Social Security number.'],
  ['Does it cover federal repayment plans?', 'Not yet. It does not model income-driven plans such as the Repayment Assistance Plan, or loan forgiveness. Check StudentAid.gov for those.'],
  ['Are the results guaranteed?', 'No. They are estimates from the figures you enter. Your loan servicer decides your actual terms.'],
];

export default function Home() {
  return (
    <main>
      <section className="cp-lines overflow-hidden bg-[#0f3d32] text-white">
        <div className={`${wrap} grid items-center gap-12 py-12 lg:grid-cols-[1fr_1.05fr] lg:py-16`}>
          <div className="cp-rise">
            <h1 className="font-editorial text-[2.5rem] leading-[1.06] sm:text-5xl lg:text-[3.5rem]">Know when your student loans will be paid off.</h1>
            <p className="mt-6 max-w-md text-lg leading-relaxed text-[#d5ded9]">
              ClearPath is a free planning tool. Type in your loans to see your debt-free date, the interest you will pay, and how paying a little extra changes both.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/register" className={primary}>Check my loans</Link>
              <a href="#example" className="inline-flex min-h-12 items-center justify-center rounded-lg border border-white/25 px-6 font-medium text-white hover:bg-white/10 lg:hidden">
                Try the example
              </a>
            </div>
            <p className="mt-6 text-sm text-[#a9bdb4]">Not a lender. No bank linking. No credit check.</p>
          </div>
          <PayoffDemo />
        </div>
      </section>

      <section id="features" className="scroll-mt-16 py-16 lg:py-20">
        <div className={wrap}>
          <h2 className="font-editorial mb-8 text-3xl sm:text-4xl">Three questions it answers</h2>
          <ProductTabs />
        </div>
      </section>

      <section id="how-it-works" className="scroll-mt-16 border-y border-[#e5e8ee] bg-white py-12">
        <div className={wrap}>
          <h2 className="font-editorial text-3xl">How you use it</h2>
          <ol className="mt-8 grid gap-8 md:grid-cols-3">
            {STEPS.map(([title, body], i) => (
              <li key={title} className="flex gap-4">
                <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#d8f2a7] font-semibold tabular-nums text-[#0b0f1a]">{i + 1}</span>
                <div>
                  <h3 className="text-lg font-semibold">{title}</h3>
                  <p className="mt-1 text-[#4a5361]">{body}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="bg-[#f3efe7] py-16 lg:py-20">
        <div className={`${wrap} grid gap-10 lg:grid-cols-2 lg:items-center`}>
          <div>
            <h2 className="font-editorial text-3xl sm:text-4xl">Before you refinance federal loans</h2>
            <p className="mt-4 max-w-md text-lg text-[#4a5361]">
              A lower rate can look like an easy win. Moving federal loans to a private lender gives up these protections for good, and ClearPath says so before it shows any saving.
            </p>
          </div>
          <ul className="grid gap-px overflow-hidden rounded-2xl bg-[#e3ddd0] sm:grid-cols-2">
            {LOST.map((item) => (
              <li key={item} className="bg-white p-5 text-lg font-semibold">{item}</li>
            ))}
          </ul>
        </div>
      </section>

      <section id="questions" className="scroll-mt-16 py-16 lg:py-20">
        <div className="mx-auto w-full max-w-3xl px-4 sm:px-6">
          <h2 className="font-editorial text-3xl sm:text-4xl">Questions</h2>
          <div className="mt-6 divide-y divide-[#e5e8ee] border-y border-[#e5e8ee]">
            {QUESTIONS.map(([question, answer]) => (
              <details key={question}>
                <summary className="flex min-h-14 cursor-pointer items-center py-3 text-lg font-semibold">{question}</summary>
                <p className="pb-5 text-[#4a5361]">{answer}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      <section className="cp-lines bg-[#0f3d32] py-16 text-center text-white">
        <div className={wrap}>
          <h2 className="font-editorial text-3xl sm:text-4xl">See your own debt-free date</h2>
          <p className="mx-auto mt-3 max-w-md text-[#d5ded9]">Have your balances, rates and minimum payments ready.</p>
          <Link href="/register" className={`${primary} mt-7`}>Check my loans</Link>
        </div>
      </section>
    </main>
  );
}
