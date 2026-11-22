import React, { useState, useEffect } from 'react';
import { LoanInput, StrategyComparisonResult } from './types';
import { SAMPLE_LOANS } from './utils/sampleData';
import { apiService } from './services/api';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { DisclaimerBanner } from './components/DisclaimerBanner';
import { LandingPage } from './pages/LandingPage';
import { LoanEntryPage } from './pages/LoanEntryPage';
import { DashboardPage } from './pages/DashboardPage';
import { StrategyComparisonPage } from './pages/StrategyComparisonPage';
import { RefinancingPage } from './pages/RefinancingPage';

const STORAGE_KEY_LOANS = 'clearpath_mvp_loans';
const STORAGE_KEY_EXTRA = 'clearpath_mvp_extra';
const LEGACY_STORAGE_KEY_LOANS = 'loanoptima_mvp_loans';
const LEGACY_STORAGE_KEY_EXTRA = 'loanoptima_mvp_extra';

export const App: React.FC = () => {
  const [loans, setLoans] = useState<LoanInput[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_LOANS) ?? localStorage.getItem(LEGACY_STORAGE_KEY_LOANS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Failed to parse saved loans from localStorage', e);
    }
    return [];
  });

  const [extraPayment, setExtraPayment] = useState<number>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_EXTRA) ?? localStorage.getItem(LEGACY_STORAGE_KEY_EXTRA);
      if (saved) return parseFloat(saved) || 0;
    } catch (error) {
      console.warn('Failed to read saved payment from localStorage', error);
    }
    return 0;
  });

  const [currentTab, setCurrentTab] = useState<string>('landing');
  const [comparison, setComparison] = useState<StrategyComparisonResult | null>(null);
  const [apiStatus, setApiStatus] = useState<string>('checking');
  const [calculationError, setCalculationError] = useState<string | null>(null);
  const [calculationRetry, setCalculationRetry] = useState(0);
  const [isCalculationPending, setIsCalculationPending] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState<boolean>(false);

  // Check backend health
  useEffect(() => {
    apiService.getHealth().then((res) => {
      setApiStatus(res.status);
    });
  }, []);

  // Persist to local storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_LOANS, JSON.stringify(loans));
    } catch (e) {
      console.error('LocalStorage write error', e);
    }
  }, [loans]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_EXTRA, extraPayment.toString());
    } catch (e) {
      console.error('LocalStorage write error', e);
    }
  }, [extraPayment]);

  // Recalculate strategies whenever loans or extra payment changes
  useEffect(() => {
    if (loans.length === 0) {
      setComparison(null);
      setCalculationError(null);
      setIsCalculationPending(false);
      return;
    }

    let isCurrent = true;
    setComparison(null);
    setCalculationError(null);
    setIsCalculationPending(true);
    apiService.compareStrategies(loans, extraPayment).then((result) => {
      if (isCurrent) {
        setComparison(result);
        setIsCalculationPending(false);
      }
    }).catch((error: unknown) => {
      if (isCurrent) {
        console.error('Strategy calculation failed:', error);
        setCalculationError('We could not calculate this plan. Retry or review the loan details.');
        setIsCalculationPending(false);
      }
    });

    return () => {
      isCurrent = false;
    };
  }, [loans, extraPayment, calculationRetry]);

  // Loan Management Handlers
  const handleAddLoan = (newLoan: LoanInput) => {
    setLoans((prev) => [...prev, newLoan]);
  };

  const handleEditLoan = (updatedLoan: LoanInput) => {
    setLoans((prev) => prev.map((l) => (l.id === updatedLoan.id ? updatedLoan : l)));
  };

  const handleDeleteLoan = (loanId: string) => {
    setLoans((prev) => prev.filter((l) => l.id !== loanId));
  };

  const handleLoadSample = () => {
    setLoans(SAMPLE_LOANS);
    setExtraPayment(150);
    setCurrentTab('dashboard');
  };

  const handleResetData = () => {
    setLoans([]);
    setExtraPayment(0);
    setComparison(null);
    try {
      localStorage.removeItem(STORAGE_KEY_LOANS);
      localStorage.removeItem(STORAGE_KEY_EXTRA);
      localStorage.removeItem(LEGACY_STORAGE_KEY_LOANS);
      localStorage.removeItem(LEGACY_STORAGE_KEY_EXTRA);
    } catch (error) {
      console.error('LocalStorage data removal failed', error);
    }
    setIsResetConfirmOpen(false);
    setCurrentTab('loans');
  };

  const totalDebt = loans.reduce((acc, l) => acc + l.balance, 0);
  const hasFederalLoans = loans.some((l) => l.loan_type === 'Federal');

  return (
    <div className="app-shell min-h-screen flex flex-col">
      <a href="#main-content" className="skip-link">Skip to main content</a>
      <DisclaimerBanner hasFederalLoans={hasFederalLoans} />

      <Header
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        loanCount={loans.length}
        totalDebt={totalDebt}
        onReset={() => setIsResetConfirmOpen(true)}
        apiStatus={apiStatus}
      />

      <main id="main-content" className="flex-1" tabIndex={-1}>
        {isCalculationPending && currentTab !== 'landing' && (
          <p className="sr-only" role="status">Calculating repayment scenarios.</p>
        )}
        {calculationError && (
          <div className="mx-auto mt-6 max-w-6xl px-4 sm:px-6" role="alert">
            <div className="flex flex-col gap-3 rounded border border-rose-200 bg-rose-50 p-4 text-sm text-rose-900 sm:flex-row sm:items-center sm:justify-between">
              <p>{calculationError}</p>
              <button
                type="button"
                onClick={() => setCalculationRetry((retry) => retry + 1)}
                className="rounded border border-rose-300 px-3 py-2 font-semibold hover:bg-rose-100"
              >
                Retry calculation
              </button>
            </div>
          </div>
        )}
        <div key={currentTab} className="page-transition">
          {currentTab === 'landing' && (
            <LandingPage
              onStart={() => setCurrentTab(loans.length > 0 ? 'dashboard' : 'loans')}
              onLoadSample={handleLoadSample}
              hasLoans={loans.length > 0}
            />
          )}

          {currentTab === 'loans' && (
            <LoanEntryPage
              loans={loans}
              onAddLoan={handleAddLoan}
              onEditLoan={handleEditLoan}
              onDeleteLoan={handleDeleteLoan}
              onLoadSample={handleLoadSample}
              onClearAll={() => setIsResetConfirmOpen(true)}
              onProceed={() => setCurrentTab('dashboard')}
            />
          )}

          {currentTab === 'dashboard' && (
            <DashboardPage
              loans={loans}
              comparison={comparison}
              extraPayment={extraPayment}
              setExtraPayment={setExtraPayment}
              onNavigate={setCurrentTab}
              onOpenAddLoan={() => setCurrentTab('loans')}
            />
          )}

          {currentTab === 'strategies' && (
            <StrategyComparisonPage
              comparison={comparison}
              extraPayment={extraPayment}
              setExtraPayment={setExtraPayment}
              onNavigate={setCurrentTab}
              calculationError={calculationError}
              isCalculating={isCalculationPending}
            />
          )}

          {currentTab === 'refinance' && (
            <RefinancingPage loans={loans} onNavigate={setCurrentTab} />
          )}
        </div>
      </main>

      <Footer />

      {/* Confirmation Modal for Resetting / Clearing Data */}
      {isResetConfirmOpen && (
        <div className="modal-overlay-enter fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="modal-panel-enter bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <h3 className="text-lg font-bold text-slate-900">Clear All Entered Data?</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              This will remove all entered loans, custom monthly payments, and local browser storage. You can enter new
              loans or reload the sample portfolio anytime.
            </p>
            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setIsResetConfirmOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
              >
                Cancel
              </button>
              <button
                onClick={handleResetData}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-rose-600 text-white hover:bg-rose-700"
              >
                Yes, Clear All Data
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
