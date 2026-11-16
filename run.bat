@echo off
echo Starting DataLens AI...

echo Starting Backend...
start cmd /k ".\.venv\Scripts\activate && cd backend && uvicorn app.main:app --reload"

echo Starting Frontend...
start cmd /k "cd frontend && npm run dev"

echo Both servers are starting in new windows!
