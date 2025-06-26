from fastapi import APIRouter

router = APIRouter()

@router.get("/meta")
def meta_stub():
    return {"msg": "meta route stub"}