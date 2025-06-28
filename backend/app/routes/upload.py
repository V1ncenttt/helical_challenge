from fastapi import APIRouter, File, UploadFile
import uuid
import os

router = APIRouter()

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
UPLOAD_DIR = os.path.join(BASE_DIR, "data", "tmp")
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload")
async def upload_file(file: UploadFile = File(...)):
    file_id = str(uuid.uuid4())
    save_path = os.path.join(UPLOAD_DIR, file_id + "." + file.filename.split(".")[-1])
    with open(save_path, "wb") as f:
        content = await file.read()
        f.write(content)
    save_path = os.path.abspath(os.path.join(UPLOAD_DIR, file_id + "." + file.filename.split(".")[-1]))
    return {"upload_id": file_id, "file_path": save_path}