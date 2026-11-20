from decimal import Decimal
from typing import List, Optional
from pydantic import BaseModel, Field, field_validator
from app.calculations.models import (
    LoanInput,
    RefinanceInput,
    RepaymentSummary,
    StrategyComparisonResult,
    RefinanceSummary,
)

class LoansRequest(BaseModel):
    loans: List[LoanInput] = Field(..., min_length=1, max_length=50, description="List of loans to calculate (1-50)")

    @field_validator("loans")
    @classmethod
    def require_unique_loan_ids(cls, loans: List[LoanInput]) -> List[LoanInput]:
        loan_ids = [loan.id for loan in loans]
        if len(loan_ids) != len(set(loan_ids)):
            raise ValueError("Loan identifiers must be unique.")
        return loans


class CalculateBaselineRequest(LoansRequest):
    pass


class CalculateAcceleratedRequest(LoansRequest):
    extra_monthly_payment: Decimal = Field(default=Decimal("0.00"), ge=0, le=Decimal("50000.00"), decimal_places=2, description="Extra monthly payment (0-$50,000)")


class CalculateComparisonRequest(LoansRequest):
    extra_monthly_payment: Decimal = Field(default=Decimal("0.00"), ge=0, le=Decimal("50000.00"), decimal_places=2, description="Extra monthly payment (0-$50,000)")


class CalculateRefinanceRequest(LoansRequest):
    refinance: RefinanceInput = Field(..., description="Hypothetical refinancing terms")

class HealthCheckResponse(BaseModel):
    status: str
    version: str
    message: str
