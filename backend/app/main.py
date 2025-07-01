"""
Main FastAPI application module for the Hellical challenge backend.

This module sets up the FastAPI app, registers routes, initializes the database,
and launches a background thread to listen for workflow result updates.

Modules:
    - upload: Handles file uploads.
    - workflow: Manages workflow execution and status tracking.
    - meta: Provides metadata endpoints (e.g., list of models).
    - init_db: Initializes the SQLite database schema and structure.
    - pubsub_listener: Listens to internal pub/sub events for asynchronous updates.
    - model_registry: Handles ML model registration logic.
"""
from fastapi import FastAPI
from app.routes import upload, workflow, meta
from db.init_db import init_database
from app.pubsub_listener import listen_to_workflow_results
import threading
from fastapi.middleware.cors import CORSMiddleware

from ml.model_registry import ModelRegistry
app = FastAPI()

app.add_middleware( # for CORS support
    CORSMiddleware,
    allow_origins=["*"],  # Or restrict to specific origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload.router)
app.include_router(workflow.router)
app.include_router(meta.router)


@app.on_event("startup")
async def startup_event():
    """
    Event handler triggered on application startup.

    Initializes the database schema and starts a daemon thread that listens
    for workflow results published on the internal pub/sub system.
    """
    init_database()
    thread = threading.Thread(target=listen_to_workflow_results)
    thread.daemon = True
    thread.start()
    print("✅ Database initialized successfully.")