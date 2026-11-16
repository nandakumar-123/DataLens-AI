from fastapi.testclient import TestClient
import os
import uuid

from app.main import app

client = TestClient(app)

def test_upload_valid_csv(tmp_path):
    # Create a temporary CSV file
    csv_file = tmp_path / "test_data.csv"
    csv_file.write_text("id,name,value\n1,Test,100\n2,Data,200")
    
    with open(csv_file, "rb") as f:
        response = client.post(
            "/api/datasets/upload",
            files={"files": ("test_data.csv", f, "text/csv")}
        )
        
    assert response.status_code == 200
    data = response.json()
    assert "session_id" in data
    assert data["status"] == "created"
    assert len(data["datasets"]) == 1
    assert data["datasets"][0]["original_filename"] == "test_data.csv"
    assert data["datasets"][0]["mime_type"] == "text/csv"
    assert data["datasets"][0]["file_size_bytes"] > 0

def test_upload_multiple_files(tmp_path):
    # Create temporary files
    csv_file = tmp_path / "test1.csv"
    csv_file.write_text("col1,col2\n1,2")
    
    # We will simulate excel with a dummy content but right extension
    xlsx_file = tmp_path / "test2.xlsx"
    xlsx_file.write_bytes(b"dummy excel content")
    
    with open(csv_file, "rb") as f1, open(xlsx_file, "rb") as f2:
        response = client.post(
            "/api/datasets/upload",
            files=[
                ("files", ("test1.csv", f1, "text/csv")),
                ("files", ("test2.xlsx", f2, "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
            ]
        )
        
    assert response.status_code == 200
    data = response.json()
    assert len(data["datasets"]) == 2
    filenames = [d["original_filename"] for d in data["datasets"]]
    assert "test1.csv" in filenames
    assert "test2.xlsx" in filenames

def test_upload_unsupported_file(tmp_path):
    txt_file = tmp_path / "test.txt"
    txt_file.write_text("hello world")
    
    with open(txt_file, "rb") as f:
        response = client.post(
            "/api/datasets/upload",
            files={"files": ("test.txt", f, "text/plain")}
        )
        
    assert response.status_code == 400
    assert "Unsupported file extension" in response.json()["detail"]

def test_upload_empty_file(tmp_path):
    empty_file = tmp_path / "empty.csv"
    empty_file.write_text("")
    
    with open(empty_file, "rb") as f:
        response = client.post(
            "/api/datasets/upload",
            files={"files": ("empty.csv", f, "text/csv")}
        )
        
    assert response.status_code == 400
    assert "empty" in response.json()["detail"].lower()
