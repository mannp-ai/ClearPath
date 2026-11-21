from decimal import Decimal, ROUND_CEILING
from typing import List, Optional
from app.calculations.models import (
    LoanInput,
    LoanType,
    RefinanceInput,
    RefinanceSummary,
    FeeTreatment,
)
from app.calculations.repayment import (
    calculate_baseline_schedule,
    quantize_currency,
)

CENT = Decimal("0.01")


def calculate_amortization_payment(principal: Decimal, annual_rate_pct: Decimal, term_months: int) -> Decimal:
    """
    Standard fixed-rate amortization monthly payment:
    P * r / (1 - (1 + r)^(-n))
    Handles 0% interest separately (P / n).
    """
    if principal <= Decimal("0.00") or term_months <= 0:
        return Decimal("0.00")

    if annual_rate_pct == Decimal("0.00"):
        payment = quantize_currency(principal / Decimal(term_months))
        return max(CENT, payment)

    monthly_rate = (annual_rate_pct / Decimal("100")) / Decimal("12")
    denominator = Decimal("1") - (Decimal("1") + monthly_rate) ** (-term_months)
    if denominator == Decimal("0"):
        payment = quantize_currency(principal / Decimal(term_months))
        return max(CENT, payment)

    payment = quantize_currency(principal * (monthly_rate / denominator))
    return max(CENT, payment)


def calculate_amortization_totals(
    principal: Decimal,
    annual_rate_pct: Decimal,
    monthly_payment: Decimal,
    term_months: int,
) -> tuple[Decimal, Decimal]:
    """Return rounded total payments and interest, adjusting the final payment to clear the balance."""
    monthly_rate = (annual_rate_pct / Decimal("100")) / Decimal("12")
    balance = principal
    total_payments = Decimal("0.00")
    total_interest = Decimal("0.00")

    for month in range(1, term_months + 1):
        interest = quantize_currency(balance * monthly_rate)
        payoff_needed = balance + interest
        payment_applied = payoff_needed if month == term_months else min(monthly_payment, payoff_needed)
        balance = payoff_needed - payment_applied
        total_interest += interest
        total_payments += payment_applied

        if balance <= Decimal("0.00"):
            break

    return quantize_currency(total_payments), quantize_currency(total_interest)


def calculate_refinance_scenario(
    loans: List[LoanInput],
    refinance_input: RefinanceInput
) -> RefinanceSummary:
    """
    Compares current loan costs with a hypothetical refinancing offer.
    """
    current_debt = sum(loan.balance for loan in loans)
    current_monthly_payment = sum(loan.minimum_payment for loan in loans)

    # Compute baseline for current total cost
    baseline = calculate_baseline_schedule(loans)
    if baseline.is_amortizing and baseline.total_amount_repaid is not None:
        current_total_cost = baseline.total_amount_repaid
        current_cost_warning = None
    else:
        current_total_cost = None
        current_cost_warning = (
            "Current-loan total cost cannot be estimated from the entered minimum payments. "
            "At least one loan does not amortize or exceeds the supported payoff timeline."
        )

    fees = quantize_currency(refinance_input.fees)
    rate = refinance_input.proposed_interest_rate
    term = refinance_input.term_months

    # Determine principal refinanced and total cost based on fee treatment
    if refinance_input.fee_treatment == FeeTreatment.UPFRONT:
        principal_refinanced = current_debt
        monthly_payment = calculate_amortization_payment(principal_refinanced, rate, term)
        total_loan_payments, proposed_total_interest = calculate_amortization_totals(
            principal_refinanced, rate, monthly_payment, term
        )
        proposed_total_cost = quantize_currency(total_loan_payments + fees)
    else:  # FINANCED into principal
        principal_refinanced = quantize_currency(current_debt + fees)
        monthly_payment = calculate_amortization_payment(principal_refinanced, rate, term)
        total_loan_payments, proposed_total_interest = calculate_amortization_totals(
            principal_refinanced, rate, monthly_payment, term
        )
        proposed_total_cost = total_loan_payments

    monthly_payment_diff = quantize_currency(monthly_payment - current_monthly_payment)
    total_cost_diff = (
        quantize_currency(proposed_total_cost - current_total_cost)
        if current_total_cost is not None
        else None
    )

    # Break-even estimation
    break_even_months = None
    break_even_explanation = None

    if fees == Decimal("0.00"):
        break_even_months = 0
        break_even_explanation = "No upfront fees were entered; cost adjustments take effect from the first payment."
    elif refinance_input.fee_treatment == FeeTreatment.UPFRONT:
        # Cash flow break-even: how many months of lower monthly payments to recover upfront fee
        monthly_cash_savings = current_monthly_payment - monthly_payment
        if monthly_cash_savings > Decimal("0.00"):
            break_even_months = int(
                (fees / monthly_cash_savings).to_integral_value(rounding=ROUND_CEILING)
            )
            break_even_explanation = (
                f"At ${monthly_cash_savings:.2f}/month lower payment, it takes approximately {break_even_months} "
                f"months to recover the upfront fee of ${fees:.2f}."
            )
        else:
            break_even_explanation = (
                "Proposed monthly payment is higher than or equal to current payments; upfront fees are not "
                "recovered through monthly cash flow savings."
            )
    else:
        break_even_explanation = "Fees are financed into the loan balance and amortized over the full term."

    # Federal loan warning check
    has_federal = refinance_input.has_federal_loans or any(
        loan.loan_type == LoanType.FEDERAL for loan in loans
    )
    federal_warning = None
    if has_federal:
        federal_warning = (
            "Caution: You have eligible federal student loans. Refinancing federal loans into a private loan "
            "permanently forfeits federal protections, including Income-Driven Repayment (IDR/SAVE), Public "
            "Service Loan Forgiveness (PSLF), federal forbearance/deferment, and death/disability discharge."
        )

    return RefinanceSummary(
        proposed_rate=rate,
        term_months=term,
        fees=fees,
        fee_treatment=refinance_input.fee_treatment,
        principal_refinanced=principal_refinanced,
        proposed_monthly_payment=monthly_payment,
        proposed_total_interest=proposed_total_interest,
        proposed_total_cost=proposed_total_cost,
        current_monthly_payment=quantize_currency(current_monthly_payment),
        current_estimated_total_cost=(
            quantize_currency(current_total_cost) if current_total_cost is not None else None
        ),
        monthly_payment_difference=monthly_payment_diff,
        total_cost_difference=total_cost_diff,
        current_cost_warning=current_cost_warning,
        break_even_months=break_even_months,
        break_even_explanation=break_even_explanation,
        federal_loan_warning=federal_warning,
        is_hypothetical=True
    )
