import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch
import os
import json

from app.main import app

client = TestClient(app)

@pytest.fixture
def mock_upload_for_agent2(tmp_path):
    csv = tmp_path / "combined.csv"
    # Need >10 rows to trigger outlier detection
    csv.write_text("id,age,income\n1,25,50000\n2,30,60000\n3,,70000\n1,25,50000\n4,120,9000000\n5,28,\n6,29,55000\n7,32,62000\n8,35,71000\n9,26,48000\n10,27,51000\n11,31,63000\n12,33,65000")
    
    with open(csv, "rb") as f:
        response = client.post(
            "/api/datasets/upload",
            files=[("files", ("combined.csv", f, "text/csv"))]
        )
    session_id = response.json()["session_id"]
    
    # manually set combined_dataset_path in db
    from app.database.database import SessionLocal
    from app.models.dataset import AnalysisSession
    db = SessionLocal()
    session = db.query(AnalysisSession).filter(AnalysisSession.id == session_id).first()
    session.combined_dataset_path = str(csv)
    session.status = "agent_1_completed"
    db.commit()
    db.close()
    
    return session_id

@patch("app.api.analysis.recommend_cleaning")
def test_agent2_analyze(mock_recommend, mock_upload_for_agent2):
    session_id = mock_upload_for_agent2
    
    mock_recommend.return_value = {
        "recommendations": {
            "missing": {"age": {"method": "median"}, "income": {"method": "median"}},
            "outliers": {"income": {"method": "cap"}},
            "duplicates": {"method": "remove"}
        },
        "ai_summary": "Test summary"
    }
    
    res = client.post(f"/api/analysis/{session_id}/agent-2/analyze")
    assert res.status_code == 200
    data = res.json()
    assert data["score"] < 100 # there are missing, duplicates, and outliers
    assert "missing" in data["report"]["issues"]
    assert data["report"]["issues"]["missing"]["age"] == 1
    assert data["report"]["issues"]["duplicates"] == 1
    assert "income" in data["report"]["issues"]["outliers"]
    
@patch("app.api.analysis.recommend_cleaning")
def test_agent2_clean(mock_recommend, mock_upload_for_agent2):
    session_id = mock_upload_for_agent2
    mock_recommend.return_value = {}
    
    # First analyze to set state
    client.post(f"/api/analysis/{session_id}/agent-2/analyze")
    
    decisions = {
        "duplicates": "remove",
        "missing": {
            "age": "median",
            "income": "median"
        },
        "outliers": {
            "income": "remove",
            "age": "remove"
        }
    }
    
    res = client.post(f"/api/analysis/{session_id}/agent-2/clean", json=decisions)
    assert res.status_code == 200
    data = res.json()
    
    # Should have improved score
    assert data["score"] >= 95.0 or data["status"] == "agent_2_completed"
    assert data["attempts"] == 1
    
    # Check result endpoint
    res2 = client.get(f"/api/analysis/{session_id}/agent-2/result")
    assert res2.status_code == 200
    data2 = res2.json()
    assert data2["score"] == data["score"]
    assert len(data2["history"]) == 1
