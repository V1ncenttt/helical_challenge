from fastapi import APIRouter, File, UploadFile
import uuid
import os

router = APIRouter()

UPLOAD_DIR = "/tmp/helical_uploads"

@router.post("/")
async def upload_file(file: UploadFile = File(...)):
    file_id = str(uuid.uuid4())
    save_path = os.path.join(UPLOAD_DIR, file_id + "_" + file.filename)
    with open(save_path, "wb") as f:
        content = await file.read()
        f.write(content)
    return {"upload_id": file_id}