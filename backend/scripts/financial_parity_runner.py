import json
import sys
from datetime import datetime
from decimal import Decimal
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from app.calculations.models import (
    FeeTreatment,
    LoanInput,
    LoanType,
    RefinanceInput,
)
from app.calculations.refinancing import calculate_refinance_scenario
from app.calculations.repayment import compare_repayment_strategies


def main() -> None:
    payload = json.load(sys.stdin)
    loans = [
        LoanInput(
            id=loan["id"],
            name=loan["name"],
            balance=Decimal(str(loan["balance"])),
            interest_rate=Decimal(str(loan["interest_rate"])),
            minimum_payment=Decimal(str(loan["minimum_payment"])),
            loan_type=LoanType(loan.get("loan_type", "Unknown")),
        )
        for loan in payload["loans"]
    ]
    start_date = datetime.strptime(payload["start_date"], "%Y-%m-%d")
    comparison = compare_repayment_strategies(
        loans,
        Decimal(str(payload["extra_monthly_payment"])),
        start_date=start_date,
    )
    refinancing = []
    for offer in payload["refinance_offers"]:
        refinance_input = RefinanceInput(
            proposed_interest_rate=Decimal(str(offer["proposed_interest_rate"])),
            term_months=offer["term_months"],
            fees=Decimal(str(offer["fees"])),
            fee_treatment=FeeTreatment(offer["fee_treatment"]),
            has_federal_loans=offer["has_federal_loans"],
        )
        refinancing.append(calculate_refinance_scenario(loans, refinance_input).model_dump(mode="json"))

    print(json.dumps({
        "comparison": comparison.model_dump(mode="json"),
        "refinancing": refinancing,
    }))


if __name__ == "__main__":
    main()
