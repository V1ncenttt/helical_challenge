from fastapi import APIRouter

router = APIRouter()

@router.get("/upload")
def upload_stub():
    return {"msg": "upload route stub"}
