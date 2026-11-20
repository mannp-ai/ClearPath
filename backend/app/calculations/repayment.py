from decimal import Decimal, ROUND_HALF_UP
from typing import List, Tuple, Dict, Optional
from datetime import datetime
from dateutil.relativedelta import relativedelta

from app.calculations.models import (
    LoanInput,
    MonthSchedule,
    MonthlyLoanDetail,
    RepaymentSummary,
    StrategyType,
    StrategyComparisonResult,
)

CENT = Decimal("0.01")
MAX_SIMULATION_MONTHS = 600  # 50 years cap


def quantize_currency(value: Decimal) -> Decimal:
    """Rounds decimal to standard 2-decimal currency cents."""
    return value.quantize(CENT, rounding=ROUND_HALF_UP)


def calculate_weighted_average_rate(loans: List[LoanInput]) -> Decimal:
    """Calculates balance-weighted average annual interest rate."""
    total_balance = sum(loan.balance for loan in loans)
    if total_balance <= Decimal("0.00"):
        return Decimal("0.00")

    weighted_sum = sum(loan.balance * loan.interest_rate for loan in loans)
    return (weighted_sum / total_balance).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)


def check_loan_sufficiency(loan: LoanInput) -> Tuple[bool, Decimal]:
    """
    Checks if a loan's minimum payment is strictly greater than initial monthly interest.
    Returns (is_sufficient, initial_monthly_interest).
    """
    monthly_rate = (loan.interest_rate / Decimal("100")) / Decimal("12")
    monthly_interest = quantize_currency(loan.balance * monthly_rate)
    is_sufficient = loan.minimum_payment > monthly_interest
    return is_sufficient, monthly_interest


def generate_date_label(start_date: datetime, month_offset: int) -> str:
    """Formats month index into 'Mon YYYY' string (e.g. Dec 2026)."""
    target = start_date + relativedelta(months=month_offset)
    return target.strftime("%b %Y")


def calculate_baseline_schedule(
    loans: List[LoanInput],
    start_date: Optional[datetime] = None
) -> RepaymentSummary:
    """
    Simulates the minimum-payment baseline scenario.
    - Each loan uses only its entered minimum payment.
    - No extra payment.
    - No payment rollover when a loan clears.
    - Detects non-amortizing loans.
    """
    if start_date is None:
        start_date = datetime.now()

    non_amortizing_loans = []
    for loan in loans:
        sufficient, init_interest = check_loan_sufficiency(loan)
        if not sufficient:
            non_amortizing_loans.append(loan.id)

    if non_amortizing_loans:
        return RepaymentSummary(
            strategy=StrategyType.BASELINE,
            is_amortizing=False,
            non_amortizing_loan_ids=non_amortizing_loans,
            warning_message="One or more loans have minimum payments insufficient to cover monthly interest. Debt-free date cannot be calculated.",
            schedule=[]
        )

    # Track independent loan balances
    loan_states = {
        loan.id: {
            "name": loan.name,
            "balance": loan.balance,
            "interest_rate": loan.interest_rate,
            "monthly_rate": (loan.interest_rate / Decimal("100")) / Decimal("12"),
            "minimum_payment": loan.minimum_payment,
            "is_paid_off": False
        }
        for loan in loans
    }

    schedule: List[MonthSchedule] = []
    month_index = 1
    total_interest_paid = Decimal("0.00")
    total_amount_repaid = Decimal("0.00")
    total_principal_paid = Decimal("0.00")

    while month_index <= MAX_SIMULATION_MONTHS:
        active_loans = [l for l in loan_states.values() if not l["is_paid_off"]]
        if not active_loans:
            break

        month_details: List[MonthlyLoanDetail] = []
        month_payment = Decimal("0.00")
        month_interest = Decimal("0.00")
        month_principal = Decimal("0.00")
        month_remaining = Decimal("0.00")

        for loan_id, state in loan_states.items():
            if state["is_paid_off"]:
                continue

            opening_bal = state["balance"]
            interest = quantize_currency(opening_bal * state["monthly_rate"])
            payoff_needed = opening_bal + interest

            payment_applied = min(state["minimum_payment"], payoff_needed)
            principal_paid = payment_applied - interest
            closing_bal = payoff_needed - payment_applied

            if closing_bal <= Decimal("0.00"):
                closing_bal = Decimal("0.00")
                state["is_paid_off"] = True

            state["balance"] = closing_bal

            month_payment += payment_applied
            month_interest += interest
            month_principal += principal_paid
            month_remaining += closing_bal

            month_details.append(
                MonthlyLoanDetail(
                    loan_id=loan_id,
                    loan_name=state["name"],
                    opening_balance=opening_bal,
                    interest_charged=interest,
                    payment_applied=payment_applied,
                    principal_paid=principal_paid,
                    closing_balance=closing_bal,
                    is_paid_off=state["is_paid_off"]
                )
            )

        total_interest_paid += month_interest
        total_amount_repaid += month_payment
        total_principal_paid += month_principal

        active_count = sum(1 for s in loan_states.values() if not s["is_paid_off"])

        schedule.append(
            MonthSchedule(
                month_index=month_index,
                year_month=generate_date_label(start_date, month_index),
                total_payment=quantize_currency(month_payment),
                total_interest=quantize_currency(month_interest),
                total_principal=quantize_currency(month_principal),
                remaining_balance=quantize_currency(month_remaining),
                active_loans_count=active_count,
                loans_detail=month_details
            )
        )

        month_index += 1

    if any(not s["is_paid_off"] for s in loan_states.values()):
        return RepaymentSummary(
            strategy=StrategyType.BASELINE,
            is_amortizing=False,
            warning_message=f"Repayment exceeds maximum timeline limit of {MAX_SIMULATION_MONTHS} months (50 years).",
            schedule=schedule
        )

    payoff_months = len(schedule)
    debt_free_date = generate_date_label(start_date, payoff_months)

    return RepaymentSummary(
        strategy=StrategyType.BASELINE,
        is_amortizing=True,
        payoff_months=payoff_months,
        estimated_debt_free_date=debt_free_date,
        total_interest_paid=quantize_currency(total_interest_paid),
        total_amount_repaid=quantize_currency(total_amount_repaid),
        total_principal_paid=quantize_currency(total_principal_paid),
        interest_saved_vs_baseline=Decimal("0.00"),
        time_saved_months_vs_baseline=0,
        schedule=schedule
    )


def calculate_accelerated_schedule(
    loans: List[LoanInput],
    strategy: StrategyType,
    extra_monthly_payment: Decimal = Decimal("0.00"),
    start_date: Optional[datetime] = None
) -> RepaymentSummary:
    """
    Simulates accelerated repayment using Avalanche or Snowball strategy.

    Priority Rules:
    - Avalanche:
        1. Highest annual interest rate descending.
        2. Tie break: Smallest outstanding balance ascending.
        3. Tie break 2: Stable creation index.
    - Snowball:
        1. Smallest outstanding balance ascending.
        2. Tie break: Highest annual interest rate descending.
        3. Tie break 2: Stable creation index.

    Rollover:
    - Total monthly budget = sum(all initial minimum payments) + extra_monthly_payment.
    - Each month, active loans receive their minimum payment (capped at payoff amount).
    - All remaining funds (including unspent minimum payments and extra payment) form the extra allocation pool.
    - Pool is applied sequentially to priority loans. If a priority loan is cleared, the leftover rolls over
      immediately to the next priority active loan in the same month until the pool is empty or all loans are zero.
    """
    if strategy not in (StrategyType.AVALANCHE, StrategyType.SNOWBALL):
        raise ValueError(f"Invalid accelerated strategy: {strategy}")

    if start_date is None:
        start_date = datetime.now()

    # Total committed monthly payment budget
    total_monthly_budget = sum(loan.minimum_payment for loan in loans) + max(Decimal("0.00"), extra_monthly_payment)

    # Initial loan state wrappers with stable index
    loan_states = [
        {
            "id": loan.id,
            "name": loan.name,
            "balance": loan.balance,
            "interest_rate": loan.interest_rate,
            "monthly_rate": (loan.interest_rate / Decimal("100")) / Decimal("12"),
            "minimum_payment": loan.minimum_payment,
            "is_paid_off": False,
            "creation_index": idx
        }
        for idx, loan in enumerate(loans)
    ]

    schedule: List[MonthSchedule] = []
    month_index = 1
    total_interest_paid = Decimal("0.00")
    total_amount_repaid = Decimal("0.00")
    total_principal_paid = Decimal("0.00")

    while month_index <= MAX_SIMULATION_MONTHS:
        active_loans = [l for l in loan_states if not l["is_paid_off"]]
        if not active_loans:
            break

        # Step 1: Calculate monthly interest and required payoff for all active loans
        month_loan_calcs = {}
        spent_on_mins = Decimal("0.00")

        for l in active_loans:
            opening_bal = l["balance"]
            interest = quantize_currency(opening_bal * l["monthly_rate"])
            payoff_needed = opening_bal + interest
            min_to_apply = min(l["minimum_payment"], payoff_needed)
            spent_on_mins += min_to_apply

            month_loan_calcs[l["id"]] = {
                "opening_balance": opening_bal,
                "interest": interest,
                "payoff_needed": payoff_needed,
                "min_applied": min_to_apply,
                "extra_applied": Decimal("0.00"),
                "remaining_needed": payoff_needed - min_to_apply
            }

        # Step 2: Extra pool available this month
        extra_pool = total_monthly_budget - spent_on_mins

        # Step 3: Sort active loans that still need repayment by strategy priority
        def sort_key(l):
            if strategy == StrategyType.AVALANCHE:
                # -interest_rate (desc), balance (asc), creation_index (asc)
                return (-l["interest_rate"], l["balance"], l["creation_index"])
            else:
                # balance (asc), -interest_rate (desc), creation_index (asc)
                return (l["balance"], -l["interest_rate"], l["creation_index"])

        priority_loans = sorted(active_loans, key=sort_key)

        for l in priority_loans:
            calc = month_loan_calcs[l["id"]]
            if calc["remaining_needed"] <= Decimal("0.00"):
                continue
            if extra_pool <= Decimal("0.00"):
                break

            alloc = min(extra_pool, calc["remaining_needed"])
            calc["extra_applied"] += alloc
            calc["remaining_needed"] -= alloc
            extra_pool -= alloc

        # Step 4: Finalize month details and update balances
        month_details: List[MonthlyLoanDetail] = []
        month_payment = Decimal("0.00")
        month_interest = Decimal("0.00")
        month_principal = Decimal("0.00")
        month_remaining = Decimal("0.00")

        for l in loan_states:
            if l["id"] not in month_loan_calcs:
                continue

            calc = month_loan_calcs[l["id"]]
            total_applied = calc["min_applied"] + calc["extra_applied"]
            principal = total_applied - calc["interest"]
            closing = calc["payoff_needed"] - total_applied

            if closing <= Decimal("0.00"):
                closing = Decimal("0.00")
                l["is_paid_off"] = True

            l["balance"] = closing

            month_payment += total_applied
            month_interest += calc["interest"]
            month_principal += principal
            month_remaining += closing

            month_details.append(
                MonthlyLoanDetail(
                    loan_id=l["id"],
                    loan_name=l["name"],
                    opening_balance=calc["opening_balance"],
                    interest_charged=calc["interest"],
                    payment_applied=total_applied,
                    principal_paid=principal,
                    closing_balance=closing,
                    is_paid_off=l["is_paid_off"]
                )
            )

        total_interest_paid += month_interest
        total_amount_repaid += month_payment
        total_principal_paid += month_principal

        active_count = sum(1 for l in loan_states if not l["is_paid_off"])

        schedule.append(
            MonthSchedule(
                month_index=month_index,
                year_month=generate_date_label(start_date, month_index),
                total_payment=quantize_currency(month_payment),
                total_interest=quantize_currency(month_interest),
                total_principal=quantize_currency(month_principal),
                remaining_balance=quantize_currency(month_remaining),
                active_loans_count=active_count,
                loans_detail=month_details
            )
        )

        month_index += 1

    if any(not l["is_paid_off"] for l in loan_states):
        return RepaymentSummary(
            strategy=strategy,
            is_amortizing=False,
            warning_message=f"Repayment exceeds maximum timeline limit of {MAX_SIMULATION_MONTHS} months (50 years).",
            schedule=schedule
        )

    payoff_months = len(schedule)
    debt_free_date = generate_date_label(start_date, payoff_months)

    return RepaymentSummary(
        strategy=strategy,
        is_amortizing=True,
        payoff_months=payoff_months,
        estimated_debt_free_date=debt_free_date,
        total_interest_paid=quantize_currency(total_interest_paid),
        total_amount_repaid=quantize_currency(total_amount_repaid),
        total_principal_paid=quantize_currency(total_principal_paid),
        schedule=schedule
    )


def compare_repayment_strategies(
    loans: List[LoanInput],
    extra_monthly_payment: Decimal = Decimal("0.00"),
    start_date: Optional[datetime] = None
) -> StrategyComparisonResult:
    """
    Computes Baseline, Avalanche, and Snowball scenarios, calculating
    comparative savings against a valid baseline where possible.
    """
    total_debt = sum(loan.balance for loan in loans)
    total_min = sum(loan.minimum_payment for loan in loans)
    weighted_rate = calculate_weighted_average_rate(loans)

    baseline = calculate_baseline_schedule(loans, start_date=start_date)
    avalanche = calculate_accelerated_schedule(
        loans, strategy=StrategyType.AVALANCHE, extra_monthly_payment=extra_monthly_payment, start_date=start_date
    )
    snowball = calculate_accelerated_schedule(
        loans, strategy=StrategyType.SNOWBALL, extra_monthly_payment=extra_monthly_payment, start_date=start_date
    )

    # Compute savings against baseline only if baseline is amortizing
    if baseline.is_amortizing and baseline.total_interest_paid is not None and baseline.payoff_months is not None:
        if avalanche.is_amortizing and avalanche.total_interest_paid is not None and avalanche.payoff_months is not None:
            avalanche.interest_saved_vs_baseline = max(
                Decimal("0.00"), baseline.total_interest_paid - avalanche.total_interest_paid
            )
            avalanche.time_saved_months_vs_baseline = max(
                0, baseline.payoff_months - avalanche.payoff_months
            )

        if snowball.is_amortizing and snowball.total_interest_paid is not None and snowball.payoff_months is not None:
            snowball.interest_saved_vs_baseline = max(
                Decimal("0.00"), baseline.total_interest_paid - snowball.total_interest_paid
            )
            snowball.time_saved_months_vs_baseline = max(
                0, baseline.payoff_months - snowball.payoff_months
            )

    return StrategyComparisonResult(
        baseline=baseline,
        avalanche=avalanche,
        snowball=snowball,
        total_debt=quantize_currency(total_debt),
        total_minimum_payment=quantize_currency(total_min),
        weighted_average_interest_rate=weighted_rate,
        extra_monthly_payment=quantize_currency(extra_monthly_payment),
        loan_count=len(loans)
    )
