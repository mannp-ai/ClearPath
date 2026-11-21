import { calculateRefinance } from '../src/services/finance/refinancing';

describe('refinancing', () => {
  it('computes monthly payment', () => {
    const r = calculateRefinance([{ id: 'a', name: 'A', balance: 10000, interest_rate: 6, minimum_payment: 200, loan_type: 'Private' } as any], {
      proposed_interest_rate: 5, term_months: 60, fees: 0, fee_treatment: 'upfront',
    } as any);
    expect(r.proposed_monthly_payment.toString()).toBe('188.71');
  });
});
