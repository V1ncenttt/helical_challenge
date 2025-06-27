from app.worker import celery_app
from ml.model_registry import ModelRegistry

@celery_app.task(name="tasks.run_workflow")
def run_workflow(upload_path, model_name, application):
    # Load dataset, run Helical model, save results
    
    data = None # TODO: Load from file at upload_path
    
    model_registry = ModelRegistry()
    embedding_model, classification_model = model_registry.get_model(model_name)

    x_embedded = embedding_model.get_embeddings(data)
    y_pred = classification_model(x_embedded) 
    #TODO: Run experiments
    
    ...
    return {"labels": [...], "confidence": [...]}