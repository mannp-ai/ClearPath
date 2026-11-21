import logging
from fastapi import APIRouter, HTTPException, status
from app.schemas import (
    CalculateBaselineRequest,
    CalculateAcceleratedRequest,
    CalculateComparisonRequest,
    CalculateRefinanceRequest,
    HealthCheckResponse,
)
from app.calculations.models import (
    RepaymentSummary,
    StrategyComparisonResult,
    RefinanceSummary,
    StrategyType,
)
from app.calculations.repayment import (
    calculate_baseline_schedule,
    calculate_accelerated_schedule,
    compare_repayment_strategies,
)
from app.calculations.refinancing import (
    calculate_refinance_scenario,
)

logger = logging.getLogger("student_loan_planner.api")
router = APIRouter()


def calculation_error(operation: str, error: Exception) -> HTTPException:
    """Log diagnostic detail server-side without exposing internals to API clients."""
    logger.exception("%s calculation failed", operation, exc_info=error)
    return HTTPException(
        status_code=status.HTTP_400_BAD_REQUEST,
        detail="Unable to calculate this scenario. Check the entered loan details and try again.",
    )


@router.get("/health", response_model=HealthCheckResponse)
def health_check():
    return HealthCheckResponse(
        status="healthy",
        version="1.0.0",
        message="Student Loan Refinancing & Accelerated Payoff Planner API is running."
    )


@router.post("/calculate/baseline", response_model=RepaymentSummary)
def calculate_baseline(request: CalculateBaselineRequest):
    try:
        logger.info(f"Calculating baseline for {len(request.loans)} loans")
        return calculate_baseline_schedule(request.loans)
    except Exception as error:
        raise calculation_error("Baseline", error)


@router.post("/calculate/avalanche", response_model=RepaymentSummary)
def calculate_avalanche(request: CalculateAcceleratedRequest):
    try:
        logger.info(f"Calculating avalanche for {len(request.loans)} loans with extra ${request.extra_monthly_payment}")
        return calculate_accelerated_schedule(
            request.loans,
            strategy=StrategyType.AVALANCHE,
            extra_monthly_payment=request.extra_monthly_payment
        )
    except Exception as error:
        raise calculation_error("Avalanche", error)


@router.post("/calculate/snowball", response_model=RepaymentSummary)
def calculate_snowball(request: CalculateAcceleratedRequest):
    try:
        logger.info(f"Calculating snowball for {len(request.loans)} loans with extra ${request.extra_monthly_payment}")
        return calculate_accelerated_schedule(
            request.loans,
            strategy=StrategyType.SNOWBALL,
            extra_monthly_payment=request.extra_monthly_payment
        )
    except Exception as error:
        raise calculation_error("Snowball", error)


@router.post("/calculate/compare", response_model=StrategyComparisonResult)
def calculate_comparison(request: CalculateComparisonRequest):
    try:
        logger.info(f"Comparing strategies for {len(request.loans)} loans with extra ${request.extra_monthly_payment}")
        return compare_repayment_strategies(
            request.loans,
            extra_monthly_payment=request.extra_monthly_payment
        )
    except Exception as error:
        raise calculation_error("Strategy comparison", error)


@router.post("/calculate/refinance", response_model=RefinanceSummary)
def calculate_refinance(request: CalculateRefinanceRequest):
    try:
        logger.info(f"Calculating refinance for {len(request.loans)} loans at {request.refinance.proposed_interest_rate}%")
        return calculate_refinance_scenario(
            request.loans,
            refinance_input=request.refinance
        )
    except Exception as error:
        raise calculation_error("Refinance", error)
