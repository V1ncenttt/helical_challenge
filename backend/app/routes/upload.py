"""
upload.py - File upload endpoint.

Author: Vincent Lefeuve  
Date: 2025-06-28

This module provides an API endpoint to handle file uploads in the application.
Uploaded files are stored in a temporary directory with a unique UUID-based filename.
"""
from fastapi import APIRouter, File, UploadFile
import uuid
import os

router = APIRouter()

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
UPLOAD_DIR = os.path.join(BASE_DIR, "data", "tmp")
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post(
    "/upload",
    summary="Upload a file",
    description="Upload a file to the temporary server directory. Returns a UUID and absolute file path.",
    responses={
        200: {
            "description": "File successfully uploaded",
            "content": {
                "application/json": {
                    "example": {
                        "upload_id": "a7f3c4a2-3b77-4b24-908b-6a6b9d4e2bfa",
                        "file_path": "/absolute/path/to/data/tmp/a7f3c4a2-3b77-4b24-908b-6a6b9d4e2bfa.csv"
                    }
                }
            }
        }
    }
)
async def upload_file(file: UploadFile = File(...)):
    """
    Handle file upload and save it to a temporary directory with a unique name.

    Args:
        file (UploadFile): The file sent via multipart/form-data.

    Returns:
        dict: A dictionary containing:
            - upload_id (str): UUID used to uniquely identify the uploaded file.
            - file_path (str): The absolute path where the file was saved.
    """
    file_id = str(uuid.uuid4())
    save_path = os.path.join(UPLOAD_DIR, file_id + "." + file.filename.split(".")[-1])
    with open(save_path, "wb") as f:
        content = await file.read()
        f.write(content)
    save_path = os.path.abspath(os.path.join(UPLOAD_DIR, file_id + "." + file.filename.split(".")[-1]))
    return {"upload_id": file_id, "file_path": save_path}