from decimal import Decimal

import pytest
from pydantic import ValidationError

from app.calculations.models import LoanInput, RefinanceInput
from app.schemas import CalculateComparisonRequest


@pytest.mark.parametrize("balance", [Decimal("0.00"), Decimal("-0.01")])
def test_loan_balance_must_be_positive(balance: Decimal):
    """Zero and negative balances are rejected before they reach the repayment engine."""
    with pytest.raises(ValidationError):
        LoanInput(
            id="invalid-balance",
            name="Invalid balance",
            balance=balance,
            interest_rate=Decimal("5.00"),
            minimum_payment=Decimal("50.00"),
        )


@pytest.mark.parametrize("term_months", [0, -1, 601])
def test_refinance_term_is_bounded(term_months: int):
    """The public API cannot request a zero, negative, or unbounded amortisation term."""
    with pytest.raises(ValidationError):
        RefinanceInput(
            proposed_interest_rate=Decimal("5.00"),
            term_months=term_months,
            fees=Decimal("0.00"),
        )


@pytest.mark.parametrize(
    ("interest_rate", "minimum_payment"),
    [
        (Decimal("-0.01"), Decimal("50.00")),
        (Decimal("5.00"), Decimal("-0.01")),
    ],
)
def test_loan_rejects_negative_financial_inputs(
    interest_rate: Decimal, minimum_payment: Decimal
):
    with pytest.raises(ValidationError):
        LoanInput(
            id="negative-value",
            name="Negative value",
            balance=Decimal("1000.00"),
            interest_rate=interest_rate,
            minimum_payment=minimum_payment,
        )


def test_comparison_rejects_negative_extra_payment():
    with pytest.raises(ValidationError):
        CalculateComparisonRequest(
            loans=[
                LoanInput(
                    id="valid",
                    name="Valid loan",
                    balance=Decimal("1000.00"),
                    interest_rate=Decimal("5.00"),
                    minimum_payment=Decimal("50.00"),
                )
            ],
            extra_monthly_payment=Decimal("-1.00"),
        )


@pytest.mark.parametrize(
    ("balance", "interest_rate", "minimum_payment"),
    [
        (Decimal("0.001"), Decimal("5.00"), Decimal("1.00")),
        (Decimal("1.00"), Decimal("5.001"), Decimal("1.00")),
        (Decimal("1.00"), Decimal("5.00"), Decimal("0.001")),
    ],
)
def test_loan_inputs_reject_values_below_supported_precision(
    balance: Decimal, interest_rate: Decimal, minimum_payment: Decimal
):
    with pytest.raises(ValidationError):
        LoanInput(
            id="sub-cent",
            name="Sub-cent value",
            balance=balance,
            interest_rate=interest_rate,
            minimum_payment=minimum_payment,
        )
