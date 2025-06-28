from fastapi import FastAPI
from app.routes import upload, workflow, meta
from db.init_db import init_database
from ml.model_registry import ModelRegistry
app = FastAPI()

app.include_router(upload.router)
app.include_router(workflow.router)
app.include_router(meta.router)

@app.on_event("startup")
async def startup_event():
    init_database()
    ModelRegistry()
    print("✅ Database initialized successfully.")