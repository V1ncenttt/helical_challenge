from fastapi import FastAPI
from app.routes import upload, workflow, meta
from db.init_db import init_database
from app.pubsub_listener import listen_to_workflow_results
import threading
from fastapi.middleware.cors import CORSMiddleware

from ml.model_registry import ModelRegistry
app = FastAPI()

app.add_middleware(
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
    init_database()
    thread = threading.Thread(target=listen_to_workflow_results)
    thread.daemon = True
    thread.start()
    print("✅ Database initialized successfully.")