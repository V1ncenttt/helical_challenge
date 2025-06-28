from celery import Celery

celery_app = Celery(
    "helical_tasks",
    broker="redis://redis:6379/0",
    backend="redis://redis:6379/0",
    include=["app.tasks.run_workflow"]
)
