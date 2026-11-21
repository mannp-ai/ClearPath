import { calculateBaseline } from '../src/services/finance/repayment';

describe('repayment', () => {
  it('baseline 10k 6% 200', () => {
    const r = calculateBaseline([{ id: 'a', name: 'A', balance: 10000, interest_rate: 6, minimum_payment: 200 } as any]);
    expect(r.payoff_months).toBe(58);
    expect(r.total_interest_paid?.toString()).toBe('1536.16');
  });
});
