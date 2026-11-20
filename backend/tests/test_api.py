from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_api_health():
    response = client.get("/api/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert data["version"] == "1.0.0"


def test_api_calculate_compare():
    payload = {
        "loans": [
            {
                "id": "l1",
                "name": "Federal Direct Subsidized",
                "balance": 5000.0,
                "interest_rate": 4.5,
                "minimum_payment": 60.0,
                "loan_type": "Federal"
            },
            {
                "id": "l2",
                "name": "Private Graduate Loan",
                "balance": 15000.0,
                "interest_rate": 8.0,
                "minimum_payment": 200.0,
                "loan_type": "Private"
            }
        ],
        "extra_monthly_payment": 100.0
    }
    response = client.post("/api/calculate/compare", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["total_debt"] == "20000.00"
    assert data["total_minimum_payment"] == "260.00"
    assert data["baseline"]["is_amortizing"] is True
    assert data["avalanche"]["is_amortizing"] is True
    assert data["snowball"]["is_amortizing"] is True
    assert float(data["avalanche"]["total_interest_paid"]) < float(data["baseline"]["total_interest_paid"])


def test_api_calculate_refinance():
    payload = {
        "loans": [
            {
                "id": "l1",
                "name": "Student Loan",
                "balance": 25000.0,
                "interest_rate": 6.8,
                "minimum_payment": 290.0,
                "loan_type": "Federal"
            }
        ],
        "refinance": {
            "proposed_interest_rate": 4.25,
            "term_months": 84,
            "fees": 250.0,
            "fee_treatment": "upfront",
            "has_federal_loans": True
        }
    }
    response = client.post("/api/calculate/refinance", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["is_hypothetical"] is True
    assert data["federal_loan_warning"] is not None
    assert "forfeits federal protections" in data["federal_loan_warning"]
    assert float(data["proposed_monthly_payment"]) > 0


def test_api_rejects_duplicate_loan_ids():
    payload = {
        "loans": [
            {
                "id": "duplicate",
                "name": "First loan",
                "balance": 1000,
                "interest_rate": 5,
                "minimum_payment": 50,
            },
            {
                "id": "duplicate",
                "name": "Second loan",
                "balance": 2000,
                "interest_rate": 6,
                "minimum_payment": 100,
            },
        ]
    }

    response = client.post("/api/calculate/baseline", json=payload)

    assert response.status_code == 422
