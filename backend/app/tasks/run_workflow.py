# app/worker.py
from app.worker import celery_app
from ml.model_registry import ModelRegistry
import scanpy as sc
import torch
import time

i=0

@celery_app.task(name="tasks.run_workflow")
def run_workflow(upload_path, model_name, application):
    global i
    # Load dataset, run Helical model, save results
    print(f"Running workflow with model: {model_name} on data: {upload_path} for the {i}th time")
    time.sleep(5)  # Simulate a long-running task
    print(f"Workflow completed for model: {model_name} on data: {upload_path} for the {i}th time")
    i+=1
    return
    data = sc.read_h5ad(upload_path)
    
    model_registry = ModelRegistry()
    embedding_model, classification_model = model_registry.get_model(model_name)

    x_embedded = torch.tensor(embedding_model.process_data(data, gene_names="gene_name")).to(model_registry.get_device())
    
    with torch.no_grad():
        y_pred = classification_model(x_embedded)
        
    probababilities = torch.softmax(y_pred, dim=1)
    labels = probababilities.argmax(dim=1)
    #TODO: Run experiments
    
    ...
    return {"labels": [...], "confidence": [...]}