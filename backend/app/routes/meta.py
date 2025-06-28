"""
meta.py - API metadata routes for model and application information.

Author: Vincent Lefeuve  
Date: 2025-06-28

This module defines REST API endpoints for exposing metadata related to machine learning models
and applications registered in the system. It is intended to be used as part of a FastAPI backend.

Endpoints:
    - GET /models
        Lists all available ML models with associated metadata such as name, description, speed, accuracy, 
        whether it is recommended, and the list of required input attributes.

    - GET /applications
        Lists all applications, with metadata including time estimation ranges and required attributes.

    - GET /applications/{application_id}/models
        Lists all models that are compatible with the specified application ID. Returns the application name 
        and associated models. If the application ID does not exist, returns a 404-like error payload.

Dependencies:
    - FastAPI
    - SQLAlchemy ORM for DB interaction
    - DB models: Model, Application (and their relationships)
    - Dependency: get_db for DB session injection
"""

from sqlalchemy.orm import Session
from fastapi import Depends
from db.database import get_db
from db.models import Model, Application
from fastapi import APIRouter

router = APIRouter()

@router.get(
    "/models",
    summary="List all models",
    description="Retrieve a list of all available models, including their performance metrics and associated attributes.",
    responses={
        200: {
            "description": "A list of models with metadata and attributes",
            "content": {
                "application/json": {
                    "example": {
                        "models": [
                            {
                                "id": 1,
                                "name": "Example Model",
                                "description": "This is an example model.",
                                "speed": 0.95,
                                "recommended": True,
                                "accuracy": 0.97,
                                "attributes": ["cell_type", "organ"]
                            }
                        ]
                    }
                }
            }
        }
    }
)
def list_models(db: Session = Depends(get_db)):
    """
    Retrieve a list of all available models.

    Returns:
        dict: A dictionary containing a list of models. Each model includes:
            - id (int): The model's unique identifier.
            - name (str): The model's name.
            - description (str): A description of the model.
            - speed (float): The speed performance metric of the model.
            - recommended (bool): Whether this model is the recommended default.
            - accuracy (float): The accuracy performance metric of the model.
            - attributes (List[str]): A list of associated attributes.
    """
    
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

@router.get(
    "/applications",
    summary="List all applications",
    description="Retrieve a list of all available applications, including descriptions, estimated runtime, and required attributes.",
    responses={
        200: {
            "description": "A list of applications with metadata and attributes",
            "content": {
                "application/json": {
                    "example": {
                        "applications": [
                            {
                                "id": 1,
                                "name": "Example Application",
                                "description": "This is an example application.",
                                "time_estimation_min": 5,
                                "time_estimation_max": 10,
                                "attributes": ["cell_type"]
                            }
                        ]
                    }
                }
            }
        }
    }
)
def list_apps(db: Session = Depends(get_db)):
    """
    Retrieve a list of all applications.

    Returns:
        dict: A dictionary containing a list of applications. Each application includes:
            - id (int): The application's unique identifier.
            - name (str): The application's name.
            - description (str): A description of the application.
            - time_estimation_min (int): Minimum estimated runtime in minutes.
            - time_estimation_max (int): Maximum estimated runtime in minutes.
            - attributes (List[str]): A list of required or associated attributes.
    """
    
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





@router.get(
    "/applications/{application_id}/models",
    summary="Get models for a specific application",
    description="Retrieve all models associated with a specific application by its ID.",
    responses={
        200: {
            "description": "List of models for the given application",
            "content": {
                "application/json": {
                    "example": {
                        "application_id": 1,
                        "application_name": "Example Application",
                        "models": [
                            {
                                "id": 1,
                                "name": "Example Model",
                                "description": "Model for classification",
                                "speed": 0.95,
                                "recommended": True,
                                "accuracy": 0.97,
                                "attributes": ["cell_type", "organ"]
                            }
                        ]
                    }
                }
            }
        },
        404: {
            "description": "Application not found"
        }
    }
)
def get_models_for_application(application_id: int, db: Session = Depends(get_db)):
    """
    Retrieve all models associated with a specific application.

    Args:
        application_id (int): The unique identifier of the application.
        db (Session): The database session dependency.

    Returns:
        dict: If the application is found, returns:
            - application_id (int): The ID of the application.
            - application_name (str): The name of the application.
            - models (List[dict]): A list of models associated with the application, where each model includes:
                - id (int)
                - name (str)
                - description (str)
                - speed (float)
                - recommended (bool)
                - accuracy (float)
                - attributes (List[str])
        dict: If the application is not found, returns:
            - error (str): An error message.
    """
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