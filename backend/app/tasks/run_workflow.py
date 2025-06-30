import scanpy as sc
import torch
import numpy as np
from datetime import datetime
from collections import Counter
import os
import json
import redis
from app.worker import celery_app
from ml.model_registry import ModelRegistry

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UPLOAD_DIR = os.path.join(BASE_DIR, "..", "data", "tmp")
redis_client = redis.Redis(host="redis", port=6379, db=0)

def publish_workflow_result(result):
    redis_client.publish("workflow_results", json.dumps(result))

@celery_app.task(name="tasks.run_workflow", bind=True)
def run_workflow(self, workflow_id, upload_id, model_name, application):
    #TODO: add application type handling
    

    global UPLOAD_DIR, redis_client
    
    data = load_upload_file(upload_id)

    model_registry = ModelRegistry()
    print(model_name)
    model_name_lower = model_name.lower()
    embedding_model, classification_model = model_registry.get_model(model_name_lower)
    device = model_registry.get_device()
    id2label = model_registry.id2label

    self.update_state(state="PROGRESS", meta={"stage": "EMBEDDING"})
    
    x_processed = embedding_model.process_data(data, gene_names="gene_name")
    x_embedded = embedding_model.get_embeddings(x_processed)

    if not isinstance(x_embedded, torch.Tensor):
        x_embedded = torch.tensor(x_embedded, dtype=torch.float32).to(device)

    self.update_state(state="PROGRESS", meta={"stage": "CLASSIFICATION"})
    with torch.no_grad():
        y_pred = classification_model(x_embedded)

    probs = torch.nn.functional.softmax(y_pred, dim=1)
    pred_labels = probs.argmax(dim=1)
    confidence_scores = probs.max(dim=1).values

    # Distribution
    self.update_state(state="PROGRESS", meta={"stage": "RUNNING STATS"})
    dist = Counter(pred_labels.cpu().numpy())
    cell_type_distribution = {model_registry.get_label(str(k)): int(v) for k, v in dist.items()}

    # Summary
    threshold = 0.5
    num_cells_analysed = len(pred_labels)
    num_cell_types = len(set(pred_labels.tolist()))
    num_ambiguous = (confidence_scores < threshold).sum().item()
    confidence_stats = {
        "min": confidence_scores.min().item(),
        "max": confidence_scores.max().item(),
        "average": confidence_scores.mean().item()
    }

    # Confidence histograms
    bins = np.linspace(0, 1, 11)
    confidence_histograms = {}
    for i in range(len(id2label)):
        mask = (pred_labels == i)
        confs = confidence_scores[mask].cpu().numpy()
        hist, _ = np.histogram(confs, bins=bins)
        confidence_histograms[id2label[i]] = {
            f"{int(bins[j]*100)}-{int(bins[j+1]*100)}": int(hist[j]) for j in range(len(hist))
        }

    # Average per class
    confidence_averages = {}
    for i in range(len(id2label)):
        mask = (pred_labels == i)
        if mask.sum() > 0:
            confidence_averages[id2label[i]] = confidence_scores[mask].mean().item()

    # UMAP
    data.obsm["X_embedded"] = x_embedded.cpu().numpy()
    sc.pp.neighbors(data, use_rep="X_embedded")
    sc.tl.umap(data)
    umap_points = []
    for i in range(data.n_obs):
        umap_points.append({
            "x": float(data.obsm["X_umap"][i, 0]),
            "y": float(data.obsm["X_umap"][i, 1]),
            "label": id2label[pred_labels[i].item()],
            "confidence": float(confidence_scores[i].item())
        })

    result = {
        "workflow_id": workflow_id,
        "status": "completed",
        "metadata": {
            "model": model_name,
            "application": application,
            "input_file_name": f"{upload_id}.h5ad",
            "created_at": datetime.utcnow().isoformat()
        },
        "summary": {
            "num_cells_analysed": num_cells_analysed,
            "num_cell_types": num_cell_types,
            "num_ambiguous": num_ambiguous,
            "confidence_stats": confidence_stats
        },
        "total_cells": num_cells_analysed,
        "confidence_stats": confidence_stats,
        "cell_type_distribution": cell_type_distribution,
        "label_counts": {str(k): int(v) for k, v in dist.items()},
        "confidence_histograms": confidence_histograms,
        "confidence_averages": confidence_averages,
        "confidence_scores": confidence_scores[:100].tolist(),  # Optional: first 100 for sampling
        "id_to_label": id2label,
        "umap": umap_points
    }
    redis_client.publish("workflow_results", json.dumps(result))
    delete_upload_file(upload_id)
    return result

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