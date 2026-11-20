from decimal import Decimal
import pytest
from app.calculations.models import LoanInput, StrategyType, RefinanceInput, FeeTreatment
from app.calculations.repayment import (
    calculate_accelerated_schedule,
    compare_repayment_strategies,
    calculate_baseline_schedule,
)
from app.calculations.refinancing import calculate_refinance_scenario

def test_extra_payment_larger_than_total_balance():
    """Borrower owes $500 total, minimum payment is $50, but pays $1000 extra."""
    loan = LoanInput(
        id="l-small",
        name="Small Loan",
        balance=Decimal("500.00"),
        interest_rate=Decimal("5.00"),
        minimum_payment=Decimal("50.00")
    )
    res = calculate_accelerated_schedule([loan], StrategyType.AVALANCHE, extra_monthly_payment=Decimal("1000.00"))
    assert res.payoff_months == 1
    assert res.is_amortizing is True
    # Payoff needed was 500 + 500*(0.05/12) = 500 + 2.08 = 502.08
    assert res.total_amount_repaid == Decimal("502.08")
    assert res.schedule[0].remaining_balance == Decimal("0.00")


def test_loan_payoff_midway_rollover():
    """
    3 loans:
    - Loan 1: $300 balance, 10% rate, $100 min
    - Loan 2: $1,000 balance, 8% rate, $100 min
    - Loan 3: $2,000 balance, 6% rate, $100 min
    Total budget = $300 min + $100 extra = $400/mo.
    Loan 1 will be completely paid off in Month 1!
    The leftover from Loan 1 should immediately roll into Loan 2 in Month 1 itself!
    """
    loans = [
        LoanInput(id="l1", name="L1", balance=Decimal("300.00"), interest_rate=Decimal("10.00"), minimum_payment=Decimal("100.00")),
        LoanInput(id="l2", name="L2", balance=Decimal("1000.00"), interest_rate=Decimal("8.00"), minimum_payment=Decimal("100.00")),
        LoanInput(id="l3", name="L3", balance=Decimal("2000.00"), interest_rate=Decimal("6.00"), minimum_payment=Decimal("100.00")),
    ]
    summary = calculate_accelerated_schedule(loans, StrategyType.AVALANCHE, extra_monthly_payment=Decimal("100.00"))
    m1 = summary.schedule[0]
    # L1 payoff needed: 300 + 2.50 = 302.50.
    # L1 gets min 100 + extra 202.50 = 302.50 -> balance 0.00!
    # Extra pool originally was: budget 400 - mins 300 = 100.
    # Wait, total budget is 400. Mins spent: L1: 100, L2: 100, L3: 100 -> total 300.
    # Extra pool = 100.
    # L1 needed 202.50 more. It took all 100 extra. So L1 balance closes at 302.50 - 200 = 102.50 in Month 1.
    # In Month 2: L1 opening balance 102.50 + 0.85 = 103.35.
    # L1 takes min 100 + 3.35 extra = 103.35 and is PAID OFF!
    # Remaining extra pool in Month 2: (budget 400 - mins spent) - 3.35 -> rolls directly into L2 in Month 2!
    m2 = summary.schedule[1]
    l1_detail = next(d for d in m2.loans_detail if d.loan_id == "l1")
    assert l1_detail.is_paid_off is True
    assert l1_detail.closing_balance == Decimal("0.00")

    # L2 in Month 2 should receive the rolled over amount!
    l2_detail = next(d for d in m2.loans_detail if d.loan_id == "l2")
    assert l2_detail.payment_applied > Decimal("100.00")


def test_snowball_rolls_same_month_leftover_into_next_loan():
    loans = [
        LoanInput(
            id="small",
            name="Small loan",
            balance=Decimal("100.00"),
            interest_rate=Decimal("0.00"),
            minimum_payment=Decimal("10.00"),
        ),
        LoanInput(
            id="large",
            name="Large loan",
            balance=Decimal("500.00"),
            interest_rate=Decimal("0.00"),
            minimum_payment=Decimal("10.00"),
        ),
    ]

    summary = calculate_accelerated_schedule(
        loans, StrategyType.SNOWBALL, extra_monthly_payment=Decimal("100.00")
    )
    month_one = summary.schedule[0]
    small_payment = next(detail.payment_applied for detail in month_one.loans_detail if detail.loan_id == "small")
    large_payment = next(detail.payment_applied for detail in month_one.loans_detail if detail.loan_id == "large")

    assert small_payment == Decimal("100.00")
    assert large_payment == Decimal("20.00")


def test_equal_rates_and_equal_balances_stable_order():
    """Two loans with identical balance and rate; creation_index ensures deterministic ordering."""
    l1 = LoanInput(id="first", name="First", balance=Decimal("1000.00"), interest_rate=Decimal("5.00"), minimum_payment=Decimal("50.00"))
    l2 = LoanInput(id="second", name="Second", balance=Decimal("1000.00"), interest_rate=Decimal("5.00"), minimum_payment=Decimal("50.00"))
    avalanche = calculate_accelerated_schedule([l1, l2], StrategyType.AVALANCHE, Decimal("50.00"))
    # First should get the extra $50 in Month 1
    m1_first = next(d for d in avalanche.schedule[0].loans_detail if d.loan_id == "first")
    m1_second = next(d for d in avalanche.schedule[0].loans_detail if d.loan_id == "second")
    assert m1_first.payment_applied == Decimal("100.00")
    assert m1_second.payment_applied == Decimal("50.00")
