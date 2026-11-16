import json

with open('app/api/analysis.py', 'r') as f:
    lines = f.readlines()

new_lines = []
in_bad_section = False
for i, line in enumerate(lines):
    if 'session.agent4_state_json = json.dumps(sanitized)' in line and not in_bad_section:
        new_lines.append(line)
        new_lines.append('        session.status = "agent_4_completed"\n')
        new_lines.append('        db.commit()\n')
        new_lines.append('        return sanitized\n')
        new_lines.append('    except Exception as e:\n')
        new_lines.append('        import traceback\n')
        new_lines.append('        traceback.print_exc()\n')
        new_lines.append('        session.status = "agent_4_error"\n')
        new_lines.append('        db.commit()\n')
        new_lines.append('        raise HTTPException(status_code=500, detail=str(e))\n\n')
        new_lines.append('class AskRequest(BaseModel):\n')
        new_lines.append('    question: str\n\n')
        new_lines.append('@router.post("/{session_id}/agent-4/ask")\n')
        new_lines.append('async def ask_agent_4_question(session_id: str, req: AskRequest, db: Session = Depends(get_db)):\n')
        new_lines.append('    from app.agents.research_agent import answer_statistical_question\n')
        new_lines.append('    session = db.query(AnalysisSession).filter(AnalysisSession.id == session_id).first()\n')
        new_lines.append('    if not session or not session.agent4_state_json:\n')
        new_lines.append('        raise HTTPException(status_code=400, detail="Agent 4 analysis not found. Run analysis first.")\n')
        new_lines.append('    stats = json.loads(session.agent4_state_json)\n')
        new_lines.append('    try:\n')
        new_lines.append('        answer = await answer_statistical_question(req.question, stats)\n')
        new_lines.append('        return {"answer": answer}\n')
        new_lines.append('    except Exception as e:\n')
        new_lines.append('        raise HTTPException(status_code=500, detail=str(e))\n\n')
        in_bad_section = True
    elif 'AGENT 6: ML PREPARATION' in line and in_bad_section:
        in_bad_section = False
        new_lines.append(line)
    elif not in_bad_section:
        new_lines.append(line)

with open('app/api/analysis.py', 'w') as f:
    f.writelines(new_lines)
