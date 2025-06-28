# app/worker.py
from app.worker import celery_app
from ml.model_registry import ModelRegistry
import scanpy as sc
import torch
import os
import time

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UPLOAD_DIR = os.path.join(BASE_DIR, "data", "tmp")

@celery_app.task(name="tasks.run_workflow")
def run_workflow(upload_id, model_name, application):
    #TODO: Logic to handle applications
    global UPLOAD_DIR
    # Load dataset, run Helical model, save results
    data = load_upload_file(upload_id)
    
    
    model_registry = ModelRegistry()
    embedding_model, classification_model = model_registry.get_model(model_name)
    device = model_registry.get_device()
    
    x_processed = embedding_model.process_data(data, gene_names="gene_name")
    x_embedded = embedding_model.get_embeddings(x_processed)
    
    #convert to torch tensor
    if not isinstance(x_embedded, torch.Tensor):
        x_embedded = torch.tensor(x_embedded, dtype=torch.float32)
        x_embedded = x_embedded.to(device)

    with torch.no_grad():
        y_pred = classification_model(x_embedded)
        
    probs = torch.nn.functional.softmax(y_pred, dim=1)
    pred_labels = probs.argmax(dim=1)
    confidence_scores = probs.max(dim=1).values
    
    #TODO: get everything
    #Delete the upload file after processing
    delete_upload_file(upload_id)
    return

    
    

    x_embedded = torch.tensor(embedding_model.process_data(data, gene_names="gene_name")).to(model_registry.get_device())
    
    with torch.no_grad():
        y_pred = classification_model(x_embedded)
        
    probababilities = torch.softmax(y_pred, dim=1)
    labels = probababilities.argmax(dim=1)
    #TODO: Run experiments
    
    ...
    return {"labels": [...], "confidence": [...]}


def load_upload_file(upload_id):
    """
    Loads the uploaded file for processing.
    """
    file_path = os.path.join(UPLOAD_DIR, f"{upload_id}.h5ad")
    if os.path.exists(file_path):
        print(f"Loading upload file: {file_path}")
        return sc.read_h5ad(file_path)
    else:
        raise FileNotFoundError(f"Upload file with ID {upload_id} not found.")
    
def delete_upload_file(upload_id):
    """
    Deletes the uploaded file after processing.
    """
    file_path = os.path.join(UPLOAD_DIR, f"{upload_id}.h5ad")
    if os.path.exists(file_path):
        os.remove(file_path)
        print(f"Deleted upload file: {file_path}")
    else:
        print(f"File not found: {file_path}")