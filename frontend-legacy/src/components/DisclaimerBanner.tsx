import React from 'react';

interface DisclaimerBannerProps {
  hasFederalLoans?: boolean;
}

export const DisclaimerBanner: React.FC<DisclaimerBannerProps> = ({ hasFederalLoans }) => {
  return (
    <div className="bg-zinc-900 text-zinc-300 text-xs py-2 px-4 border-b border-zinc-800">
      <div className="max-w-6xl mx-auto flex items-center justify-between text-[12px]">
        <div>
          <span className="font-medium text-white">Notice:</span> Model estimates are for planning only.
          {hasFederalLoans && (
            <span className="ml-2 text-zinc-300 hidden sm:inline">
              Refinancing federal loans permanently forfeits federal protections (IDR, PSLF).
            </span>
          )}
        </div>
        <span className="text-[11px] font-mono text-zinc-400 hidden md:inline">
          Amounts rounded to cents
        </span>
      </div>
    </div>
  );
};
