import { LoanInput } from '../types';

export const SAMPLE_LOANS: LoanInput[] = [
  {
    id: 'sample-loan-1',
    name: 'Federal Direct Subsidized',
    balance: 6500,
    interest_rate: 4.99,
    minimum_payment: 70,
    loan_type: 'Federal',
  },
  {
    id: 'sample-loan-2',
    name: 'Federal Direct Unsubsidized',
    balance: 9500,
    interest_rate: 6.54,
    minimum_payment: 110,
    loan_type: 'Federal',
  },
  {
    id: 'sample-loan-3',
    name: 'Federal Grad PLUS Loan',
    balance: 18000,
    interest_rate: 8.05,
    minimum_payment: 220,
    loan_type: 'Federal',
  },
  {
    id: 'sample-loan-4',
    name: 'Private Undergraduate Loan',
    balance: 14000,
    interest_rate: 9.25,
    minimum_payment: 180,
    loan_type: 'Private',
  },
];
