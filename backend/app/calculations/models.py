from decimal import Decimal
from typing import List, Optional
from enum import Enum
from pydantic import BaseModel, Field

class LoanType(str, Enum):
    FEDERAL = "Federal"
    PRIVATE = "Private"
    UNKNOWN = "Unknown"

class StrategyType(str, Enum):
    BASELINE = "baseline"
    AVALANCHE = "avalanche"
    SNOWBALL = "snowball"

class FeeTreatment(str, Enum):
    UPFRONT = "upfront"
    FINANCED = "financed"

class LoanInput(BaseModel):
    id: str = Field(..., min_length=1, max_length=64, description="Unique loan identifier")
    name: str = Field(..., min_length=1, max_length=100, description="User-assigned loan name")
    balance: Decimal = Field(..., gt=0, le=Decimal("10000000.00"), decimal_places=2, description="Outstanding balance in USD (max $10M)")
    interest_rate: Decimal = Field(..., ge=0, le=Decimal("100.00"), decimal_places=2, description="Annual interest rate percentage (0-100%)")
    minimum_payment: Decimal = Field(..., gt=0, le=Decimal("1000000.00"), decimal_places=2, description="Minimum monthly payment in USD")
    loan_type: Optional[LoanType] = Field(default=LoanType.UNKNOWN)

class MonthlyLoanDetail(BaseModel):
    loan_id: str
    loan_name: str
    opening_balance: Decimal
    interest_charged: Decimal
    payment_applied: Decimal
    principal_paid: Decimal
    closing_balance: Decimal
    is_paid_off: bool

class MonthSchedule(BaseModel):
    month_index: int
    year_month: str
    total_payment: Decimal
    total_interest: Decimal
    total_principal: Decimal
    remaining_balance: Decimal
    active_loans_count: int
    loans_detail: List[MonthlyLoanDetail]

class RepaymentSummary(BaseModel):
    strategy: StrategyType
    is_amortizing: bool
    payoff_months: Optional[int] = None
    estimated_debt_free_date: Optional[str] = None
    total_interest_paid: Optional[Decimal] = None
    total_amount_repaid: Optional[Decimal] = None
    total_principal_paid: Optional[Decimal] = None
    interest_saved_vs_baseline: Optional[Decimal] = None
    time_saved_months_vs_baseline: Optional[int] = None
    non_amortizing_loan_ids: List[str] = Field(default_factory=list)
    warning_message: Optional[str] = None
    schedule: List[MonthSchedule] = Field(default_factory=list)

class StrategyComparisonResult(BaseModel):
    baseline: RepaymentSummary
    avalanche: RepaymentSummary
    snowball: RepaymentSummary
    total_debt: Decimal
    total_minimum_payment: Decimal
    weighted_average_interest_rate: Decimal
    extra_monthly_payment: Decimal
    loan_count: int

class RefinanceInput(BaseModel):
    proposed_interest_rate: Decimal = Field(..., ge=0, le=Decimal("100.00"), decimal_places=2, description="Proposed annual interest rate (0-100%)")
    term_months: int = Field(..., gt=0, le=600, description="Repayment term in months (max 50 years / 600 mos)")
    fees: Decimal = Field(default=Decimal("0.00"), ge=0, le=Decimal("500000.00"), decimal_places=2, description="Refinancing fees in USD")
    fee_treatment: FeeTreatment = Field(default=FeeTreatment.UPFRONT)
    has_federal_loans: bool = Field(default=False)

class RefinanceSummary(BaseModel):
    proposed_rate: Decimal
    term_months: int
    fees: Decimal
    fee_treatment: FeeTreatment
    principal_refinanced: Decimal
    proposed_monthly_payment: Decimal
    proposed_total_interest: Decimal
    proposed_total_cost: Decimal
    current_monthly_payment: Decimal
    current_estimated_total_cost: Optional[Decimal] = None
    monthly_payment_difference: Decimal
    total_cost_difference: Optional[Decimal] = None
    current_cost_warning: Optional[str] = None
    break_even_months: Optional[int] = None
    break_even_explanation: Optional[str] = None
    federal_loan_warning: Optional[str] = None
    is_hypothetical: bool = True
