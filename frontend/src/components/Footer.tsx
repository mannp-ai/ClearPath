import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="site-footer text-zinc-500 text-xs mt-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 text-[13px] leading-relaxed">
          <div>
            <div className="font-semibold text-zinc-900 mb-2">Calculation Model</div>
            <p className="text-zinc-500">
              Assumes monthly compounding on opening loan balances with payments applied at period end.
              Figures are estimates and may differ from servicer statements and payoff quotes. Loan details
              are saved in your browser and sent to the configured calculation API when one is enabled;
              this application does not persist loan records on its server.
            </p>
          </div>

          <div>
            <div className="font-semibold text-zinc-900 mb-2">Federal Protections</div>
            <p className="text-zinc-500">
              Refinancing federal loans into a private loan permanently forfeits federal protections,
              including Income-Driven Repayment (IDR), Public Service Loan Forgiveness (PSLF), and forbearance.
            </p>
          </div>

          <div>
            <div className="font-semibold text-zinc-900 mb-2">Disclaimers</div>
            <p className="text-zinc-500">
              This planner is strictly an educational calculation tool and does not provide financial,
              legal, or tax advice. Manually entered refinancing terms are hypothetical.
            </p>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-zinc-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-400">
          <div>ClearPath • Educational financial modelling</div>
          <div>All calculations run client-side or on dedicated API</div>
        </div>
      </div>
    </footer>
  );
};
