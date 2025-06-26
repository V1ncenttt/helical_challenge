from fastapi import FastAPI
from app.routes import upload, workflow, meta



app = FastAPI()

app.include_router(upload.router)
app.include_router(workflow.router)
app.include_router(meta.router)