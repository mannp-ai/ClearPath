from decimal import Decimal
import pytest
from app.calculations.models import LoanInput, LoanType, StrategyType
from app.calculations.repayment import (
    calculate_baseline_schedule,
    calculate_accelerated_schedule,
    compare_repayment_strategies,
    check_loan_sufficiency,
    calculate_weighted_average_rate,
)

def test_single_loan_zero_interest():
    """Loan with $1,200 balance, 0% interest, $100 min payment should pay off in exactly 12 months with $0 interest."""
    loan = LoanInput(
        id="loan-zero",
        name="Zero Interest Loan",
        balance=Decimal("1200.00"),
        interest_rate=Decimal("0.00"),
        minimum_payment=Decimal("100.00"),
        loan_type=LoanType.PRIVATE
    )
    summary = calculate_baseline_schedule([loan])
    assert summary.is_amortizing is True
    assert summary.payoff_months == 12
    assert summary.total_interest_paid == Decimal("0.00")
    assert summary.total_amount_repaid == Decimal("1200.00")
    assert summary.schedule[-1].remaining_balance == Decimal("0.00")


def test_single_loan_positive_interest():
    """
    Loan with $10,000 balance at 6.0% annual interest, $200 min payment.
    Monthly rate = 0.06 / 12 = 0.005.
    Month 1 interest = $10,000 * 0.005 = $50.00.
    Principal paid = $200 - $50 = $150.00.
    Closing balance = $9,850.00.
    """
    loan = LoanInput(
        id="loan-1",
        name="Direct Subsidized",
        balance=Decimal("10000.00"),
        interest_rate=Decimal("6.00"),
        minimum_payment=Decimal("200.00"),
        loan_type=LoanType.FEDERAL
    )
    summary = calculate_baseline_schedule([loan])
    assert summary.is_amortizing is True
    assert len(summary.schedule) > 0
    m1 = summary.schedule[0]
    assert m1.total_interest == Decimal("50.00")
    assert m1.total_principal == Decimal("150.00")
    assert m1.remaining_balance == Decimal("9850.00")
    # Verified payoff months: ln(200 / (200 - 10000*0.005)) / ln(1.005) = ln(200 / 150) / ln(1.005) ≈ 57.68 -> 58 months
    assert summary.payoff_months == 58


def test_insufficient_payment_non_amortizing():
    """
    Loan with $10,000 balance at 6% interest ($50 monthly interest).
    Minimum payment is $40 (less than monthly interest).
    Must be detected as non-amortizing.
    """
    loan = LoanInput(
        id="loan-underpaid",
        name="Underpaid Loan",
        balance=Decimal("10000.00"),
        interest_rate=Decimal("6.00"),
        minimum_payment=Decimal("40.00"),
        loan_type=LoanType.PRIVATE
    )
    sufficient, init_int = check_loan_sufficiency(loan)
    assert sufficient is False
    assert init_int == Decimal("50.00")

    summary = calculate_baseline_schedule([loan])
    assert summary.is_amortizing is False
    assert "loan-underpaid" in summary.non_amortizing_loan_ids
    assert summary.payoff_months is None


def test_payment_capped_at_payoff_amount():
    """
    Loan with $100 balance, 0% interest, but minimum payment is $150.
    Should only pay $100 and close in 1 month without overpayment.
    """
    loan = LoanInput(
        id="loan-small",
        name="Small Loan",
        balance=Decimal("100.00"),
        interest_rate=Decimal("0.00"),
        minimum_payment=Decimal("150.00"),
        loan_type=LoanType.PRIVATE
    )
    summary = calculate_baseline_schedule([loan])
    assert summary.is_amortizing is True
    assert summary.payoff_months == 1
    assert summary.total_amount_repaid == Decimal("100.00")
    assert summary.schedule[0].total_payment == Decimal("100.00")
    assert summary.schedule[0].remaining_balance == Decimal("0.00")


def test_avalanche_vs_snowball_sorting_and_rollover():
    """
    Two loans:
    - Loan A: Balance $5,000, 8.0% interest, $100 min payment (High rate, higher balance)
    - Loan B: Balance $2,000, 4.0% interest, $100 min payment (Low rate, small balance)
    Extra payment: $200. Total budget = $100 + $100 + $200 = $400/month.
    
    Avalanche: Targets Loan A first (8.0% > 4.0%).
    Snowball: Targets Loan B first ($2,000 < $5,000).
    """
    loan_a = LoanInput(
        id="loan-a",
        name="Loan A (High Rate)",
        balance=Decimal("5000.00"),
        interest_rate=Decimal("8.00"),
        minimum_payment=Decimal("100.00")
    )
    loan_b = LoanInput(
        id="loan-b",
        name="Loan B (Small Balance)",
        balance=Decimal("2000.00"),
        interest_rate=Decimal("4.00"),
        minimum_payment=Decimal("100.00")
    )
    loans = [loan_a, loan_b]

    # Avalanche
    avalanche = calculate_accelerated_schedule(
        loans, strategy=StrategyType.AVALANCHE, extra_monthly_payment=Decimal("200.00")
    )
    # Snowball
    snowball = calculate_accelerated_schedule(
        loans, strategy=StrategyType.SNOWBALL, extra_monthly_payment=Decimal("200.00")
    )

    # In Avalanche, Loan A should receive the extra $200 in month 1:
    m1_avalanche_loan_a = next(d for d in avalanche.schedule[0].loans_detail if d.loan_id == "loan-a")
    m1_avalanche_loan_b = next(d for d in avalanche.schedule[0].loans_detail if d.loan_id == "loan-b")
    assert m1_avalanche_loan_a.payment_applied == Decimal("300.00")  # 100 min + 200 extra
    assert m1_avalanche_loan_b.payment_applied == Decimal("100.00")  # 100 min

    # In Snowball, Loan B should receive the extra $200 in month 1:
    m1_snowball_loan_a = next(d for d in snowball.schedule[0].loans_detail if d.loan_id == "loan-a")
    m1_snowball_loan_b = next(d for d in snowball.schedule[0].loans_detail if d.loan_id == "loan-b")
    assert m1_snowball_loan_a.payment_applied == Decimal("100.00")  # 100 min
    assert m1_snowball_loan_b.payment_applied == Decimal("300.00")  # 100 min + 200 extra

    # Avalanche saves more interest mathematically
    assert avalanche.total_interest_paid < snowball.total_interest_paid


def test_tie_breaking_rules():
    """
    Test tie breaks:
    1. Equal interest rates: Avalanche prioritizes smaller balance first.
    2. Equal balances: Snowball prioritizes higher interest rate first.
    """
    loan1 = LoanInput(
        id="l1",
        name="Loan 1",
        balance=Decimal("5000.00"),
        interest_rate=Decimal("6.00"),
        minimum_payment=Decimal("100.00")
    )
    loan2 = LoanInput(
        id="l2",
        name="Loan 2",
        balance=Decimal("2000.00"),
        interest_rate=Decimal("6.00"),
        minimum_payment=Decimal("100.00")
    )
    # Equal rate (6.00% vs 6.00%): Avalanche should prioritize l2 (smaller balance)
    avalanche = calculate_accelerated_schedule([loan1, loan2], StrategyType.AVALANCHE, Decimal("100.00"))
    m1_l2 = next(d for d in avalanche.schedule[0].loans_detail if d.loan_id == "l2")
    assert m1_l2.payment_applied == Decimal("200.00")  # got extra $100

    # Equal balance ($3000 vs $3000): Snowball should prioritize higher interest rate
    loan3 = LoanInput(
        id="l3",
        name="Loan 3",
        balance=Decimal("3000.00"),
        interest_rate=Decimal("5.00"),
        minimum_payment=Decimal("100.00")
    )
    loan4 = LoanInput(
        id="l4",
        name="Loan 4",
        balance=Decimal("3000.00"),
        interest_rate=Decimal("7.00"),
        minimum_payment=Decimal("100.00")
    )
    snowball = calculate_accelerated_schedule([loan3, loan4], StrategyType.SNOWBALL, Decimal("100.00"))
    m1_l4 = next(d for d in snowball.schedule[0].loans_detail if d.loan_id == "l4")
    assert m1_l4.payment_applied == Decimal("200.00")  # got extra $100


def test_strategy_comparison_with_savings():
    """Verify compare_repayment_strategies returns all 3 summaries with computed savings."""
    loans = [
        LoanInput(
            id="l1",
            name="Federal Direct",
            balance=Decimal("6000.00"),
            interest_rate=Decimal("5.00"),
            minimum_payment=Decimal("100.00")
        ),
        LoanInput(
            id="l2",
            name="Private Consolidation",
            balance=Decimal("12000.00"),
            interest_rate=Decimal("8.00"),
            minimum_payment=Decimal("200.00")
        )
    ]
    res = compare_repayment_strategies(loans, extra_monthly_payment=Decimal("150.00"))
    assert res.total_debt == Decimal("18000.00")
    assert res.total_minimum_payment == Decimal("300.00")
    assert res.baseline.is_amortizing is True
    assert res.avalanche.is_amortizing is True
    assert res.snowball.is_amortizing is True
    assert res.avalanche.interest_saved_vs_baseline > Decimal("0.00")
    assert res.avalanche.time_saved_months_vs_baseline > 0
    assert res.snowball.interest_saved_vs_baseline > Decimal("0.00")
    assert res.snowball.time_saved_months_vs_baseline > 0
