import os
import json
import time
import scanpy as sc
import redis
from app.worker import celery_app

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
UPLOAD_DIR = os.path.join(BASE_DIR, "..", "data", "tmp")
redis_client = redis.Redis(host="redis", port=6379, db=0)

def publish_workflow_result(result):
    redis_client.publish("workflow_results", json.dumps(result))
    
# Mock Celery task that mimics run_workflow but only sleeps and updates progress stages.
@celery_app.task(name="tasks.run_workflow_mock", bind=True)
def run_workflow_mock(self, workflow_id, upload_id, model_name, application):
    import time
    from datetime import datetime
    import random

    self.update_state(state="PROGRESS", meta={"stage": "EMBEDDING"})
    time.sleep(5)

    self.update_state(state="PROGRESS", meta={"stage": "CLASSIFICATION"})
    time.sleep(5)

    self.update_state(state="PROGRESS", meta={"stage": "RUNNING STATS"})
    time.sleep(5)

    cell_types = ["ERYTHROID", "LYMPHOID", "MK", "MYELOID", "PROGENITOR", "STROMA"]
    umap_points = [
        {
            "x": round(random.uniform(-10, 10), 2),
            "y": round(random.uniform(-10, 10), 2),
            "label": random.choice(cell_types),
            "confidence": round(random.uniform(0.2, 0.98), 2),
            "id": i
        }
        for i in range(1000)
    ]

    confidence_histograms = {cell_type: [0] * 10 for cell_type in cell_types}
    confidence_averages = {cell_type: 0 for cell_type in cell_types}
    confidence_sums = {cell_type: 0 for cell_type in cell_types}
    confidence_counts = {cell_type: 0 for cell_type in cell_types}

    for point in umap_points:
        label = point["label"]
        conf = point["confidence"]
        bin_index = min(9, int(conf * 10))
        confidence_histograms[label][bin_index] += 1
        confidence_sums[label] += conf
        confidence_counts[label] += 1

    for cell_type in cell_types:
        count = confidence_counts[cell_type]
        confidence_averages[cell_type] = round(confidence_sums[cell_type] / count, 4) if count > 0 else 0.0

    high_confidence = 0
    medium_confidence = 0
    low_confidence = 0

    for point in umap_points:
        if point["confidence"] >= 0.75:
            high_confidence += 1
        elif point["confidence"] >= 0.5:
            medium_confidence += 1
        else:
            low_confidence += 1

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
            "num_cells_analysed": 1000,
            "num_cell_types": 6,
            "num_ambiguous": 120,
            "confidence_stats": {
                "min": 0.22,
                "max": 0.97,
                "average": 0.74
            },
            "confidence_breakdown": {
                "high": high_confidence,
                "medium": medium_confidence,
                "low": low_confidence
            },
        },
        "total_cells": 1000,
        "confidence_stats": {
            "min": 0.22,
            "max": 0.97,
            "average": 0.74
        },
        "cell_type_distribution": {
            "ERYTHROID": 250,
            "LYMPHOID": 200,
            "MK": 150,
            "MYELOID": 150,
            "PROGENITOR": 150,
            "STROMA": 100
        },
        "label_counts": {
            "0": 250,
            "1": 200,
            "2": 150,
            "3": 150,
            "4": 150,
            "5": 100
        },
        "confidence_histograms": confidence_histograms,
        "confidence_averages": confidence_averages,
        "confidence_scores": [0.81] * 100,
        "id_to_label": {
            "0": "ERYTHROID",
            "1": "LYMPHOID",
            "2": "MK",
            "3": "MYELOID",
            "4": "PROGENITOR",
            "5": "STROMA"
        },
        "umap": umap_points
    }

    redis_client.publish("workflow_results", json.dumps(result))
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