from fastapi import APIRouter, Depends
from pydantic import BaseModel
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from celery.result import AsyncResult
from uuid import uuid4
from db.database import get_db
from db.models import Workflow, Application
from fastapi import HTTPException
import os
from sqlalchemy.exc import IntegrityError
from app.tasks.run_workflow import run_workflow




router = APIRouter()
workflows_dict = {}
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UPLOAD_DIR = os.path.join(BASE_DIR, "data", "tmp")

class WorkflowRequest(BaseModel):
    upload_id: int
    model: int
    application: int

@router.post(
    "/submit",
    responses={
        200: {
            "description": "Successful Submission",
            "content": {
                "application/json": {
                    "example": {
                        "workflow_id": "123e4567-e89b-12d3-a456-426614174000",
                        "status": "pending",
                        "message": "Workflow successfully submitted and queued for processing"
                    }
                }
            }
        },
        400: {"description": "Failed to commit workflow to DB"},
        404: {"description": "Application not found"},
        503: {"description": "Task queue unavailable"}
    }
)
async def submit_workflow(payload: WorkflowRequest, db: Session = Depends(get_db)):
    
    application = db.query(Application).filter(Application.id == payload.application).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")
    
    model = db.query(Application.models).filter(Application.id == payload.application, Application.models.any(id=payload.model)).first()
    if not model:
        raise HTTPException(status_code=404, detail="Model not found for the given application")
    
    model = model.name
    # Check if upload_id exists in the files
    upload_path = os.path.join(UPLOAD_DIR, f"{payload.upload_id}.h5ad")
    if not os.path.exists(upload_path):
        raise HTTPException(status_code=404, detail=f"Upload file with ID {payload.upload_id} not found")
    
    print(f"Submitting workflow for application: {application.name}, model: {payload.model}, upload_id: {payload.upload_id}")
    
    workflow = Workflow(
        id=str(uuid4()),
        application_id=payload.application,
        model_id=payload.model,
        data_id=payload.upload_id,
        status="pending"
    )
    try:
        db.add(workflow)
        db.commit()
    except IntegrityError as e:
        print(f"IntegrityError: {e}")
        db.rollback()
        raise HTTPException(status_code=400, detail="Failed to commit workflow to DB")
    
    try:
        task = run_workflow.delay(workflow.data_id, model, workflow.application_id)
        workflows_dict[str(workflow.id)] = task.id
        print(f"Task {task.id} submitted for workflow {workflow.id}")
    except Exception as e:
        print(f"Error submitting task to Celery: {e}")
        raise HTTPException(status_code=503, detail="Task queue unavailable")
    
    db.refresh(workflow)
    
    return {
        "workflow_id": str(workflow.id),
        "status": "pending",
        "message": "Workflow successfully submitted and queued for processing"
    }


@router.get(
    "/status/{job_id}",
    responses={
        200: {
            "description": "Workflow status retrieved successfully",
            "content": {
                "application/json": {
                    "example": {
                        "job_id": "123e4567-e89b-12d3-a456-426614174000",
                        "status": "PENDING"
                    }
                }
            }
        },
        404: {
            "description": "Workflow not found",
            "content": {
                "application/json": {
                    "example": {
                        "job_id": "123e4567-e89b-12d3-a456-426614174000",
                        "status": "not found"
                    }
                }
            }
        }
    }
)
async def check_status(job_id: str, db: Session = Depends(get_db)):
    workflow = db.query(Workflow).filter(Workflow.id == job_id).first()
    #TODO: Handle case where workflow is not found in celery tasks
    if workflow:
        
        if job_id not in workflows_dict:
            raise HTTPException(status_code=404, detail="Workflow not found")
        task_id = workflows_dict[job_id]
        
        res = AsyncResult(task_id)
        
        status = res.status
        
        return {"job_id": job_id, "status": status, }
    raise HTTPException(status_code=404, detail="Workflow not found")



@router.get(
    "/result/{job_id}",
    responses={
        200: {
            "description": "CSV file containing the results of the workflow",
            "content": {
                "text/csv": {
                    "example": "cell_id,label,confidence\n1,ERYTHROID,0.91\n2,LYMPHOID,0.85\n..."
                }
            }
        },
        404: {
            "description": "Workflow result not found",
            "content": {
                "application/json": {
                    "example": {
                        "detail": "Result file not found for workflow ID 123e4567-e89b-12d3-a456-426614174000"
                    }
                }
            }
        }
    }
)
async def get_result(job_id: str):
    #TODO: Will do later: check jsoon from DB and return the json instead
    result_path = f"/tmp/helical_results/{job_id}.csv"
    if not os.path.exists(result_path):
        raise HTTPException(status_code=404, detail=f"Result file not found for workflow ID {job_id}")
    return FileResponse(result_path, filename=f"{job_id}_result.csv")