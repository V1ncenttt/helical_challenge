# app/routes/workflow.py

from fastapi import APIRouter
from pydantic import BaseModel
from fastapi.responses import FileResponse
import uuid

router = APIRouter()

class WorkflowRequest(BaseModel):
    upload_id: str
    model: str
    application: str

@router.post("/submit")
async def submit_workflow(req: WorkflowRequest):
    job_id = str(uuid.uuid4())
    # Put your Celery or SLURM submission logic here
    return {"job_id": job_id, "status": "queued"}

@router.get("/status/{job_id}")
async def check_status(job_id: str):
    # Query DB or status file
    return {"job_id": job_id, "status": "completed", "result_url": f"/workflow/result/{job_id}"}



@router.get("/result/{job_id}")
async def get_result(job_id: str):
    result_path = f"/tmp/helical_results/{job_id}.csv"
    return FileResponse(result_path, filename=f"{job_id}_result.csv")