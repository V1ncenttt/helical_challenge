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
    #registry = ModelRegistry()
    pass