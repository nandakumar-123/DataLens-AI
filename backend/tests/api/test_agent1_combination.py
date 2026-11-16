import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch
import os

from app.main import app

client = TestClient(app)

@pytest.fixture
def mock_upload_for_combine(tmp_path):
    csv1 = tmp_path / "customers.csv"
    csv1.write_text("customer_id,name\n1,Alice\n2,Bob")
    
    csv2 = tmp_path / "orders.csv"
    csv2.write_text("order_id,customer_id,amount\n101,1,250.5\n102,1,100.0\n103,3,50.0")
    
    with open(csv1, "rb") as f1, open(csv2, "rb") as f2:
        response = client.post(
            "/api/datasets/upload",
            files=[
                ("files", ("customers.csv", f1, "text/csv")),
                ("files", ("orders.csv", f2, "text/csv"))
            ]
        )
    return response.json()["session_id"]

@patch("app.api.analysis.generate_combination_plan")
def test_combination_plan_generation(mock_generate, mock_upload_for_combine):
    session_id = mock_upload_for_combine
    
    mock_generate.return_value = {
        "combination_plan": [
            {
                "step": 1,
                "left_dataset": "customers.csv",
                "right_dataset": "orders.csv",
                "left_key": "customer_id",
                "right_key": "customer_id",
                "join_type": "LEFT"
            }
        ],
        "error": None
    }
    
    res = client.post(
        f"/api/analysis/{session_id}/agent-1/combination-plan",
        json={"prompt": "combine them using customer_id"}
    )
    assert res.status_code == 200
    plan = res.json()
    assert len(plan) == 1
    assert plan[0]["left_dataset"] == "customers.csv"
    assert plan[0]["left_key"] == "customer_id"

def test_combination_execution_and_download(mock_upload_for_combine):
    session_id = mock_upload_for_combine
    
    plan = {
        "left": "customers.csv",
        "right": "orders.csv",
        "left_key": "customer_id",
        "right_key": "customer_id",
        "type": "LEFT"
    }
    
    # Execute combine
    res = client.post(f"/api/analysis/{session_id}/agent-1/combine", json=plan)
    assert res.status_code == 200
    
    data = res.json()
    assert data["status"] == "success"
    assert data["stats"]["result_rows"] == 3 # Alice has 2 orders, Bob has 0 (wait left join drops order 103, keeps Bob)
    # Alice (1) matches 101, 102. Bob (2) matches nothing.
    # So 2 rows for Alice, 1 row for Bob = 3 rows.
    assert data["stats"]["matched_rows"] == 2 # 2 matches from right table (orders 101, 102)
    assert data["stats"]["unmatched_rows"] == 1 # Bob
    
    # Download
    download_res = client.get(f"/api/analysis/{session_id}/agent-1/download")
    assert download_res.status_code == 200
    assert "text/csv" in download_res.headers["content-type"]
    content = download_res.text
    assert "Alice" in content
    assert "Bob" in content

def test_combination_invalid_key(mock_upload_for_combine):
    session_id = mock_upload_for_combine
    plan = {
        "left": "customers.csv",
        "right": "orders.csv",
        "left_key": "invalid_key",
        "right_key": "invalid_key",
        "type": "INNER"
    }
    res = client.post(f"/api/analysis/{session_id}/agent-1/combine", json=plan)
    assert res.status_code == 400
    detail = res.json()["detail"]
    assert detail["error_code"] == "COMBINATION_VALIDATION_ERROR"
    assert "not found in left dataset" in detail["message"]

def test_single_dataset_bypass(tmp_path):
    csv1 = tmp_path / "single.csv"
    csv1.write_text("id,val\n1,A\n2,B")
    
    with open(csv1, "rb") as f:
        response = client.post(
            "/api/datasets/upload",
            files=[("files", ("single.csv", f, "text/csv"))]
        )
    session_id = response.json()["session_id"]
    
    # Profile should bypass
    res = client.post(f"/api/analysis/{session_id}/agent-1/profile")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "completed"
    assert len(data["profiles"]) == 1
    assert data["relationships"] == []
