"""
run_workflow.py

Author: Vincent Lefeuve  
Date: 2025-06-29

This module defines the core asynchronous task used to process a cell type annotation workflow in the Helical platform. It handles:

- Loading user-uploaded single-cell datasets (.h5ad format)
- Running the embedding and classification models
- Computing and summarizing prediction confidence and label distribution
- Generating UMAP coordinates for visualization
- Storing results and broadcasting them via Redis
- Saving annotated data to CSV for download
- Cleaning up temporary uploaded files

The main Celery task `run_workflow` orchestrates this full process. It relies on the ModelRegistry to retrieve model components and is designed to support future extensions via the `application` parameter.

Redis is used to publish real-time progress updates and final results, while intermediate progress is reported using `self.update_state` for frontend polling.

This file also defines helpers to load and delete uploaded files, and to store annotated results.

Dependencies:
- scanpy for data loading and UMAP
- torch and numpy for embedding and inference
- redis for messaging
- pandas for result export
"""
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
import pandas as pd
import logging

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UPLOAD_DIR = os.path.join(BASE_DIR, "..", "data", "tmp")
redis_client = redis.Redis(host="redis", port=6379, db=0)

def publish_workflow_result(result):
    """
    Publishes the final workflow result to the Redis channel "workflow_results".

    Args:
        result (dict): The result dictionary containing workflow metadata, summary, predictions, and UMAP points.
    """
    redis_client.publish("workflow_results", json.dumps(result))

@celery_app.task(name="tasks.run_workflow", bind=True)
def run_workflow(self, workflow_id, upload_id, model_name, application):
    """
    Celery task that processes a full cell type annotation workflow. This includes:
    - Loading the uploaded .h5ad file
    - Running embedding and classification models
    - Calculating confidence statistics
    - Running UMAP for visualization
    - Saving and publishing results

    Args:
        self: The Celery task instance (for state updates)
        workflow_id (str): Unique ID for this workflow run
        upload_id (str): ID of the uploaded .h5ad file
        model_name (str): The model to use for embedding and classification
        application (str): The chosen application, e.g., "cell_type_annotation"

    Returns:
        dict: A JSON-serializable result dictionary containing predictions and statistics.
    """

    global UPLOAD_DIR, redis_client
    
    data = load_upload_file(upload_id)
    logging.info(f"Loaded data for workflow {workflow_id} from {upload_id}.h5ad")
    model_registry = ModelRegistry()
    logging.info(f"Model name: {model_name}")
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
    cell_type_distribution = {id2label[i]: int(dist.get(i, 0)) for i in range(len(id2label))}

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

    high_confidence = int((confidence_scores > 0.8).sum().item())
    medium_confidence = int(((confidence_scores > 0.6) & (confidence_scores <= 0.8)).sum().item())
    low_confidence = int((confidence_scores <= 0.6).sum().item())
    confidence_breakdown = {
        "high": high_confidence,
        "medium": medium_confidence,
        "low": low_confidence
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
        else:
            confidence_averages[id2label[i]] = None

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
            "confidence_stats": confidence_stats,
            "confidence_breakdown": confidence_breakdown
        },
        "total_cells": num_cells_analysed,
        "confidence_stats": confidence_stats,
        "cell_type_distribution": cell_type_distribution,
        "label_counts": {str(i): int(dist.get(i, 0)) for i in range(len(id2label))},
        "confidence_histograms": confidence_histograms,
        "confidence_averages": confidence_averages,
        "confidence_scores": confidence_scores[:100].tolist(),
        "id_to_label": id2label,
        "umap": umap_points
    }
    save_annotated_data(data, probs.cpu().numpy(), pred_labels.cpu().numpy(), umap_points, workflow_id)
    redis_client.publish("workflow_results", json.dumps(result))
    delete_upload_file(upload_id)
    return result
def save_annotated_data(data, probs, pred_labels, umap_points, workflow_id):
    """
    Saves annotated data as CSV including cell ID, prediction probabilities,
    predicted labels, and UMAP coordinates.

    Args:
        data (AnnData): The annotated scanpy data object
        probs (ndarray): Prediction probabilities
        pred_labels (ndarray): Predicted class labels
        umap_points (list): List of dictionaries with UMAP x, y, label, confidence
        workflow_id (str): ID for the workflow to name the output file
    """
    
    global UPLOAD_DIR
    folder = os.path.join(UPLOAD_DIR, "results")
    os.makedirs(folder, exist_ok=True)
    
    df = pd.DataFrame({
        "cell_id": data.obs.index,
        **{f"PROBA_{i}": probs[:, i] for i in range(probs.shape[1])},
        "predicted_label": pred_labels.tolist(),
        "umap_x": [p["x"] for p in umap_points],
        "umap_y": [p["y"] for p in umap_points]
    })
    file_loc = os.path.join(folder, f"annotated_data_{workflow_id}.csv")
    logging.info(f"Saving annotated data to {file_loc}")
    df.to_csv(file_loc, index=False)

def load_upload_file(upload_id):
    """
    Loads the user-uploaded .h5ad file from the temporary upload directory.

    Args:
        upload_id (str): ID of the uploaded file

    Returns:
        AnnData: The loaded single-cell data object
    """
    file_path = os.path.join(UPLOAD_DIR, f"{upload_id}.h5ad")
    if os.path.exists(file_path):
        logging.info(f"Loading upload file: {file_path}")
        return sc.read_h5ad(file_path)
    else:
        raise FileNotFoundError(f"Upload file with ID {upload_id} not found.")
    
def delete_upload_file(upload_id):
    """
    Deletes the uploaded .h5ad file after processing to free up storage.

    Args:
        upload_id (str): ID of the uploaded file
    """
    file_path = os.path.join(UPLOAD_DIR, f"{upload_id}.h5ad")
    if os.path.exists(file_path):
        os.remove(file_path)
        logging.info(f"Deleted upload file: {file_path}")
    else:
        logging.warning(f"File not found: {file_path}")