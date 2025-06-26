from app.worker import celery_app


@celery_app.task(name="tasks.run_workflow")
def run_workflow(upload_path, model_name, application):
    # Load dataset, run Helical model, save results
    ...
    return {"labels": [...], "confidence": [...]}