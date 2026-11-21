import { calculateAccelerated } from '../src/services/finance/repayment';

describe('regression', () => {
  it('avalanche matches python fixture', () => {
    const r = calculateAccelerated([{ id: 'a', name: 'A', balance: 10000, interest_rate: 6, minimum_payment: 200 } as any], 'avalanche', 100 as any);
    expect(r.payoff_months).toBe(37);
    expect(r.total_interest_paid?.toString()).toBe('966.79');
  });
});
