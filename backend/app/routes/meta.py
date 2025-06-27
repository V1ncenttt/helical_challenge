# app/routes/meta.py
from sqlalchemy.orm import Session
from fastapi import Depends
from db.database import get_db
from db.models import Model, Application
from fastapi import APIRouter

router = APIRouter()

@router.get("/models")
def list_models(db: Session = Depends(get_db)):
    models = db.query(Model).all()
    return {
        "models": [
            {
                "id": m.id,
                "name": m.name,
                "description": m.description,
                "speed": m.speed,
                "recommended": m.recommended,
                "accuracy": m.accuracy,
                "attributes": [attr.attribute for attr in m.attributes]
            }
            for m in models
        ]
    }

@router.get("/applications")
def list_apps(db: Session = Depends(get_db)):
    apps = db.query(Application).all()
    return {
        "applications": [
            {
                "id": a.id,
                "name": a.name,
                "description": a.description,
                "time_estimation_min": a.time_estimation_min,
                "time_estimation_max": a.time_estimation_max,
                "attributes": [attr.attribute for attr in a.attributes]
            }
            for a in apps
        ]
    }





# Route to get all models associated with a given application
@router.get("/applications/{application_id}/models")
def get_models_for_application(application_id: int, db: Session = Depends(get_db)):
    application = db.query(Application).filter(Application.id == application_id).first()
    if not application:
        return {"error": "Application not found"}

    return {
        "application_id": application.id,
        "application_name": application.name,
        "models": [
            {
                "id": m.id,
                "name": m.name,
                "description": m.description,
                "speed": m.speed,
                "recommended": m.recommended,
                "accuracy": m.accuracy,
                "attributes": [attr.attribute for attr in m.attributes]
            }
            for m in application.models
        ]
    }