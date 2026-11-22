import React, { useRef, useState } from 'react';
import { Menu, X } from 'lucide-react';
import { formatCurrency } from '../utils/formatters';

interface HeaderProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  loanCount: number;
  totalDebt: number;
  onReset: () => void;
  apiStatus: string;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  setCurrentTab,
  loanCount,
  totalDebt,
  onReset,
  apiStatus,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null);
  const navItems = [
    { id: 'landing', label: 'Overview' },
    { id: 'loans', label: `Loans${loanCount > 0 ? ` (${loanCount})` : ''}` },
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'strategies', label: 'Strategies' },
    { id: 'refinance', label: 'Refinancing' },
  ];

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
    mobileMenuButtonRef.current?.focus();
  };

  const handleMobileMenuKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
    if (event.key === 'Escape' && isMobileMenuOpen) {
      event.preventDefault();
      closeMobileMenu();
    }
  };

  return (
    <header className="site-header sticky top-0 z-30" onKeyDown={handleMobileMenuKeyDown}>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-2">
        {/* Brand */}
        <button
          type="button"
          onClick={() => setCurrentTab('landing')}
          className="brand-mark flex items-center gap-2.5 select-none"
        >
          <span className="brand-orbit" />
          <span className="font-semibold text-zinc-950 text-[17px] tracking-tight">
            ClearPath
          </span>
          <span className="brand-plan text-[10px] font-semibold text-zinc-400 tracking-[0.14em]">PLAN</span>
        </button>

        {/* Minimal Navigation */}
        <nav aria-label="Primary navigation" className="hidden md:flex items-center gap-1 nav-rail">
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setCurrentTab(item.id)}
                aria-current={isActive ? 'page' : undefined}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-[color,background-color,box-shadow] duration-150 ease-out ${
                  isActive
                    ? 'bg-white text-zinc-950 shadow-xs'
                    : 'text-zinc-600 hover:text-zinc-900'
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Right Info */}
        <div className="flex items-center gap-2 text-xs sm:gap-4">
          {totalDebt > 0 && (
            <div className="hidden sm:flex items-baseline gap-1.5 font-mono">
              <span className="text-zinc-400 text-[11px]">Debt:</span>
              <span className="font-semibold text-zinc-900 tabular-nums">
                {formatCurrency(totalDebt)}
              </span>
            </div>
          )}

          <button
            onClick={() => {
              setIsMobileMenuOpen(false);
              onReset();
            }}
            className="text-zinc-400 hover:text-rose-600 transition-colors text-xs font-medium"
            title="Clear all stored loans"
          >
            Reset
          </button>

          <button
            ref={mobileMenuButtonRef}
            type="button"
            className="md:hidden inline-flex min-h-11 items-center justify-center gap-1.5 rounded-lg px-2.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-100 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700"
            aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isMobileMenuOpen}
            aria-controls="mobile-primary-navigation"
            onClick={() => setIsMobileMenuOpen((isOpen) => !isOpen)}
          >
            {isMobileMenuOpen ? (
              <X aria-hidden="true" size={16} />
            ) : (
              <Menu aria-hidden="true" size={16} />
            )}
            <span>{isMobileMenuOpen ? 'Close' : 'Menu'}</span>
          </button>

          <span
            title={apiStatus === 'healthy' ? 'API connected' : 'Local calculation mode'}
            aria-label={apiStatus === 'healthy' ? 'API connected' : 'Local calculation mode'}
            role="status"
            className={`w-2 h-2 rounded-full ${
              apiStatus === 'healthy' ? 'bg-emerald-500' : 'bg-zinc-300'
            }`}
          />
        </div>
      </div>

      <nav
        id="mobile-primary-navigation"
        aria-label="Mobile navigation"
        hidden={!isMobileMenuOpen}
        className={`md:hidden mobile-nav px-4 py-2 gap-1 text-xs ${
          isMobileMenuOpen ? 'grid' : 'hidden'
        }`}
      >
        {navItems.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => {
              setCurrentTab(item.id);
              closeMobileMenu();
            }}
            aria-current={currentTab === item.id ? 'page' : undefined}
            className={`min-h-11 w-full rounded-lg px-3 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-700 ${
              currentTab === item.id
                ? 'bg-zinc-900 text-white font-semibold'
                : 'text-zinc-700 hover:bg-zinc-100'
            }`}
          >
            {item.label}
          </button>
        ))}
      </nav>
    </header>
  );
};
