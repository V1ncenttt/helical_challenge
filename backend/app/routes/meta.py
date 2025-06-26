# app/routes/meta.py
# app/routes/meta.py
from sqlalchemy.orm import Session
from fastapi import Depends
from db.database import get_db
from db.models import Model
from fastapi import APIRouter

router = APIRouter()

@router.get("/models")
def list_models(db: Session = Depends(get_db)):
    models = db.query(Model).all()
    return {"models": [{"id": m.id, "name": m.name, "speed": m.speed, "recommended": m.recommended, "accuracy": m.accuracy} for m in models]}

@router.get("/applications")
def list_apps():
    return {"applications": ["cell_type_classification"]}