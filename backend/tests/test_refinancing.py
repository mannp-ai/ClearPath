from decimal import Decimal
import pytest
from app.calculations.models import LoanInput, LoanType, RefinanceInput, FeeTreatment
from app.calculations.refinancing import (
    calculate_amortization_payment,
    calculate_refinance_scenario,
)

def test_zero_interest_refinancing():
    """$12,000 principal at 0% for 12 months should yield exactly $1,000/mo."""
    payment = calculate_amortization_payment(Decimal("12000.00"), Decimal("0.00"), 12)
    assert payment == Decimal("1000.00")


def test_standard_amortization_payment():
    """
    $10,000 principal at 6.0% for 60 months (5 years):
    Monthly rate r = 0.06/12 = 0.005.
    Formula: 10000 * 0.005 / (1 - (1.005)^(-60)) = 50 / (1 - 0.74137219) ≈ $193.33/mo.
    """
    payment = calculate_amortization_payment(Decimal("10000.00"), Decimal("6.00"), 60)
    assert payment == Decimal("193.33")


def test_refinance_fees_upfront_vs_financed():
    """
    Loan: $20,000 at 7.0%, $250 min payment.
    Refinance: 4.5% interest, 60 months, $400 fee.
    Compare upfront vs financed.
    """
    loan = LoanInput(
        id="l1",
        name="Current Student Debt",
        balance=Decimal("20000.00"),
        interest_rate=Decimal("7.00"),
        minimum_payment=Decimal("250.00"),
        loan_type=LoanType.PRIVATE
    )

    # 1. Upfront fee
    offer_upfront = RefinanceInput(
        proposed_interest_rate=Decimal("4.50"),
        term_months=60,
        fees=Decimal("400.00"),
        fee_treatment=FeeTreatment.UPFRONT
    )
    summary_upfront = calculate_refinance_scenario([loan], offer_upfront)
    assert summary_upfront.principal_refinanced == Decimal("20000.00")
    # Payment on 20,000 at 4.5% for 60 mos ≈ $372.86
    assert summary_upfront.proposed_monthly_payment == Decimal("372.86")
    # Rounded monthly interest produces $22,371.64 in scheduled payments, including the final payoff amount.
    assert summary_upfront.proposed_total_interest == Decimal("2371.64")
    assert summary_upfront.proposed_total_cost == Decimal("22771.64")

    # 2. Financed fee
    offer_financed = RefinanceInput(
        proposed_interest_rate=Decimal("4.50"),
        term_months=60,
        fees=Decimal("400.00"),
        fee_treatment=FeeTreatment.FINANCED
    )
    summary_financed = calculate_refinance_scenario([loan], offer_financed)
    # Principal refinanced includes $400 fee = $20,400.00
    assert summary_financed.principal_refinanced == Decimal("20400.00")
    # Payment on 20,400 at 4.5% for 60 mos ≈ $380.32
    assert summary_financed.proposed_monthly_payment == Decimal("380.32")
    # Total cost = 60 * 380.32 = 22,819.20 (financing fees costs slightly more interest)
    assert summary_financed.proposed_total_cost > summary_upfront.proposed_total_cost


def test_longer_term_lower_payment_higher_cost():
    """
    Demonstrates that extending term reduces monthly payment but increases total cost.
    Current: $30,000 at 6%, paying $400/mo (approx 97 months, total cost approx $38,800).
    Offer A (60 months, 5%): monthly $566.14, total cost $33,968.40 (higher monthly, lower total cost).
    Offer B (180 months, 5.5%): monthly $245.24, total cost $44,143.20 (lower monthly, HIGHER total cost!).
    """
    loan = LoanInput(
        id="l-long",
        name="Loan",
        balance=Decimal("30000.00"),
        interest_rate=Decimal("6.00"),
        minimum_payment=Decimal("400.00")
    )
    offer_extended = RefinanceInput(
        proposed_interest_rate=Decimal("5.50"),
        term_months=180,
        fees=Decimal("0.00")
    )
    summary = calculate_refinance_scenario([loan], offer_extended)
    assert summary.monthly_payment_difference < Decimal("0.00")  # Monthly payment is lower by ~ $154.76
    assert summary.total_cost_difference > Decimal("0.00")  # BUT total cost is HIGHER by ~ $5,300+


def test_tiny_refinance_balance_has_nonzero_payment_and_nonnegative_interest():
    """A positive balance must not round to a zero payment or negative total interest."""
    loan = LoanInput(
        id="tiny",
        name="Tiny balance",
        balance=Decimal("0.01"),
        interest_rate=Decimal("100.00"),
        minimum_payment=Decimal("1.00"),
        loan_type=LoanType.PRIVATE,
    )
    offer = RefinanceInput(
        proposed_interest_rate=Decimal("99.99"),
        term_months=600,
        fees=Decimal("0.00"),
    )

    summary = calculate_refinance_scenario([loan], offer)

    assert summary.proposed_monthly_payment == Decimal("0.01")
    assert summary.proposed_total_interest == Decimal("0.00")
    assert summary.proposed_total_cost == Decimal("0.01")


def test_non_amortizing_current_loans_do_not_get_a_fabricated_total_cost():
    """Principal alone is not a valid current-cost baseline when minimum payments do not amortize."""
    loan = LoanInput(
        id="underpaid",
        name="Underpaid loan",
        balance=Decimal("10000.00"),
        interest_rate=Decimal("6.00"),
        minimum_payment=Decimal("40.00"),
        loan_type=LoanType.PRIVATE,
    )
    offer = RefinanceInput(
        proposed_interest_rate=Decimal("4.00"),
        term_months=60,
        fees=Decimal("0.00"),
    )

    summary = calculate_refinance_scenario([loan], offer)

    assert summary.current_estimated_total_cost is None
    assert summary.total_cost_difference is None
    assert summary.current_cost_warning is not None


def test_federal_loan_warning():
    """Ensure federal loan warning triggers when loan has federal type."""
    fed_loan = LoanInput(
        id="fed-1",
        name="Direct Unsubsidized",
        balance=Decimal("15000.00"),
        interest_rate=Decimal("5.50"),
        minimum_payment=Decimal("160.00"),
        loan_type=LoanType.FEDERAL
    )
    offer = RefinanceInput(
        proposed_interest_rate=Decimal("4.00"),
        term_months=120,
        fees=Decimal("0.00")
    )
    summary = calculate_refinance_scenario([fed_loan], offer)
    assert summary.federal_loan_warning is not None
    assert "permanently forfeits federal protections" in summary.federal_loan_warning
