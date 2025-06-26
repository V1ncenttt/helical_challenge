from fastapi import APIRouter

router = APIRouter()

@router.get("/workflow")
def workflow_stub():
    return {"msg": "workflow route stub"}