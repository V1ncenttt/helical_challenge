"""
Celery worker configuration for the Hellical application.

This module sets up the Celery app, specifying Redis as the broker and result backend.
It also ensures that the model registry is loaded when the Celery worker process starts.
"""
from celery import Celery
from celery.signals import worker_process_init
from ml.model_registry import ModelRegistry


celery_app = Celery(
    "helical_tasks",
    broker="redis://redis:6379/0",
    backend="redis://redis:6379/0",
    include=["app.tasks.run_workflow", "app.tasks.run_workflow_mock"]
)

@worker_process_init.connect
def load_models_on_startup(**kwargs):
    """
    Celery signal handler that runs when a worker process starts.

    Loads the model registry into memory, so that models are ready
    for use when tasks are processed.
    """
    registry = ModelRegistry()
    # Optionally preload models or perform setup