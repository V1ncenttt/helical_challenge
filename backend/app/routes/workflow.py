# app/routes/workflow.py

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from uuid import uuid4
from db.database import get_db
from db.models import Workflow
from app.tasks import run_workflow_task  # Celery task




router = APIRouter()

class WorkflowRequest(BaseModel):
    upload_id: str
    model: str
    application: str
    

@router.post("/submit")
async def submit_workflow(payload: WorkflowRequest, db: Session = Depends(get_db)):
    workflow = Workflow(
        id=str(uuid4()),
        application_id=payload.application_id,
        model_id=payload.model_id,
        data_id=payload.data_id,
        metadata=payload.metadata,
        status="pending"
    )
    
    db.add(workflow)
    db.commit()
    run_workflow_task.delay(str(workflow.id))
    db.refresh(workflow)
    return {"workflow_id": workflow.id, "status": workflow.status}

@router.get("/status/{job_id}")
async def check_status(job_id: str, db: Session = Depends(get_db)):
    # Query DB or status file
    return {"job_id": job_id, "status": "completed", "result_url": f"/workflow/result/{job_id}"}



@router.get("/result/{job_id}")
async def get_result(job_id: str):
    result_path = f"/tmp/helical_results/{job_id}.csv"
    return FileResponse(result_path, filename=f"{job_id}_result.csv")