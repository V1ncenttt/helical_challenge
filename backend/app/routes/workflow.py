"""
workflow.py

Author: Vincent Lefeuve  
Date: 2025-06-28

This module defines API routes related to managing and executing annotation workflows in the Helical backend service.

It provides endpoints for:
- Submitting a new workflow (`/submit`)
- Checking the status of a workflow (`/status/{job_id}`)
- Retrieving the result of a workflow (`/result/{job_id}`)
- Downloading the annotated dataset (`/download/{job_id}`)

Each submitted workflow corresponds to a user-uploaded `.h5ad` dataset file, a selected application, and an associated model. Submitted workflows are processed asynchronously using Celery.

Modules and Components:
-----------------------
- FastAPI: Used for routing and HTTP handling.
- SQLAlchemy: ORM for database interaction.
- Celery: Handles background task execution.
- Pydantic: Used for request payload validation.
- OS and JSON: File handling and serialization.
- UUID: Used to uniquely identify each workflow.

Key Concepts:
-------------
- `WorkflowRequest`: Pydantic model defining the required payload for a workflow submission.
- `workflows_dict`: In-memory dictionary mapping workflow IDs to Celery task IDs.
- `UPLOAD_DIR`: Directory path where user-uploaded `.h5ad` files and result files are stored.
- `run_workflow`: Celery task responsible for executing the actual model-based annotation logic.

Notes:
------
- Results are serialized JSON objects stored in the database and returned via the `/result/{job_id}` endpoint.
- UMAP embeddings, cell type labels, confidence scores, and annotated CSV files are generated as part of the workflow output.
- This module assumes the application and model IDs are valid and linked in the database.
"""

from fastapi import APIRouter, Depends, BackgroundTasks
from pydantic import BaseModel
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from celery.result import AsyncResult
from uuid import uuid4
from db.database import get_db
from db.models import Workflow, Application
from fastapi import HTTPException
import os
import json
from sqlalchemy.exc import IntegrityError
from app.tasks.run_workflow import run_workflow
from app.tasks.run_workflow_mock import run_workflow_mock

router = APIRouter()
workflows_dict = {}
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UPLOAD_DIR = os.path.abspath(os.path.join(BASE_DIR, "..", "data", "tmp"))

class WorkflowRequest(BaseModel):
    upload_id: str
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
async def submit_workflow(payload: WorkflowRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    print(f"Received workflow submission request: {payload}")
    application = db.query(Application).filter(Application.id == payload.application).first()
    if not application:
        raise HTTPException(status_code=404, detail="Application not found")

    model_obj = next((m for m in application.models if m.id == payload.model), None)
    if not model_obj:
        raise HTTPException(status_code=404, detail="Model not found for the given application")

    model_name = model_obj.name
    # Check if upload_id exists in the files
    print(UPLOAD_DIR)
    print(BASE_DIR)
    upload_path = os.path.join(UPLOAD_DIR, f"{payload.upload_id}.h5ad")
    if not os.path.exists(upload_path):
        raise HTTPException(status_code=404, detail=f"Upload file with ID {payload.upload_id} not found")
    
    print(f"Submitting workflow for application: {application.name}, model: {payload.model}, upload_id: {payload.upload_id}")
    workflow_id = str(uuid4())
    workflow = Workflow(
        id=workflow_id,
        application_id=payload.application,
        model_id=payload.model,
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
        task = run_workflow.delay(workflow_id, payload.upload_id, model_name, workflow.application_id)
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
        try:
            info = res.info
        except Exception as e:
            print(f"Error retrieving task info: {e}")
            info = None

        return {"job_id": job_id, "status": status, "info": info}
    raise HTTPException(status_code=404, detail="Workflow not found")



@router.get(
    "/result/{job_id}",
    responses={
        200: {
            "description": "JSON containing the results of the workflow",
            "content": {
                "application/json": {
                    "example": {
                        "workflow_id": "123e4567-e89b-12d3-a456-426614174000",
                        "status": "completed",
                        "metadata": {
                            "model": "Geneformer",
                            "application": 1,
                            "input_file_name": "example.h5ad",
                            "created_at": "2025-06-30T15:26:07.165423"
                        },
                        "summary": {
                            "num_cells_analysed": 1000,
                            "num_cell_types": 6,
                            "num_ambiguous": 120,
                            "confidence_stats": {
                                "min": 0.22,
                                "max": 0.97,
                                "average": 0.74
                            },
                            "confidence_breakdown": {
                                "high": 730,
                                "medium": 150,
                                "low": 120
                            }
                        },
                        "total_cells": 1000,
                        "confidence_stats": {
                            "min": 0.22,
                            "max": 0.97,
                            "average": 0.74
                        },
                        "cell_type_distribution": {
                            "ERYTHROID": 250,
                            "LYMPHOID": 200,
                            "MK": 150,
                            "MYELOID": 150,
                            "PROGENITOR": 150,
                            "STROMA": 100
                        },
                        "label_counts": {
                            "0": 250,
                            "1": 200,
                            "2": 150,
                            "3": 150,
                            "4": 150,
                            "5": 100
                        },
                        "confidence_histograms": {
                            "ERYTHROID": [0, 0, 17, 30, 45, 60, 40, 30, 20, 8]
                        },
                        "confidence_averages": {
                            "ERYTHROID": 0.6159
                        },
                        "confidence_scores": [0.81, 0.82, 0.79],
                        "id_to_label": {
                            "0": "ERYTHROID",
                            "1": "LYMPHOID",
                            "2": "MK",
                            "3": "MYELOID",
                            "4": "PROGENITOR",
                            "5": "STROMA"
                        },
                        "umap": [
                            {
                                "x": 1.23,
                                "y": -0.56,
                                "label": "ERYTHROID",
                                "confidence": 0.81
                            }
                        ]
                    }
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
async def get_result(job_id: str, db: Session = Depends(get_db)):
    workflow = db.query(Workflow).filter(Workflow.id == job_id).first()
    if workflow:
        if workflow.result:
            # Deserialize before returning
            result = json.loads(workflow.result) if isinstance(workflow.result, str) else workflow.result
            return result
        else:
            raise HTTPException(status_code=404, detail="Workflow is still running or result is not yet available")
    else:
        raise HTTPException(status_code=404, detail="Workflow not found")

@router.get(
    "/download/{job_id}",
    responses={
        200: {
            "description": "Download the annotated data file",
            "content": {         
                "application/csv": {
                    "example": "annotated_data_123e4567-e89b-12d3-a456-426614174000.csv"
                }
            }
        },
        404: {
            "description": "File not found",
            "content": {
                "application/json": {
                    "example": {
                        "detail": "File not found for workflow ID 123e4567-e89b-12d3-a456-426614174000"
                    }
                }
            }
        }
    }
)
async def download_file(job_id: str):
    """
    Download the annotated data file for the given workflow ID.
    
    Args:
        job_id (str): The unique identifier of the workflow.
    
    Returns:
        FileResponse: The annotated data file if it exists.
    
    Raises:
        HTTPException: If the file does not exist.
    """
    file_path = os.path.join(UPLOAD_DIR, "results", f"annotated_data_{job_id}.csv")
    if os.path.exists(file_path):
        return FileResponse(file_path, media_type='application/csv', filename=os.path.basename(file_path))
    else:
        raise HTTPException(status_code=404, detail=f"File not found for workflow ID {job_id}")
    