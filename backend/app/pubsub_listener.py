"""Redis Pub/Sub listener for processing workflow results.

This module listens to messages on the 'workflow_results' Redis channel and updates
the corresponding workflow entry in the database with the result and status.
"""

import json
import redis
import logging
from db.database import SessionLocal
from db.models import Workflow

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def listen_to_workflow_results():
    """Listen to the Redis 'workflow_results' channel and update workflows in the DB.

    Messages are expected to be JSON-encoded strings with at least a 'workflow_id' field.
    The message data is stored as the workflow's result, and the status is updated accordingly.
    """
    r = redis.Redis(host="redis", port=6379, db=0)
    pubsub = r.pubsub()
    pubsub.subscribe("workflow_results")

    logger.info("Subscribed to Redis channel 'workflow_results'")

    for message in pubsub.listen():
        if message["type"] == "message":
            try:
                data_raw = message["data"]
                data_str = data_raw.decode("utf-8") if isinstance(data_raw, bytes) else str(data_raw)
                data = json.loads(data_str)
                if not isinstance(data, dict) or "workflow_id" not in data:
                    raise ValueError("Malformed message received")
                workflow_id = data["workflow_id"]
                result = data
                status = data.get("status", "finished")

                logger.info(f"Status: {status}, Workflow ID: {workflow_id}")
                db = SessionLocal()
                try:
                    wf = db.query(Workflow).filter_by(id=workflow_id).first()
                    if wf:
                        logger.info(f"Found workflow {workflow_id}, updating...")
                        wf.result = json.dumps(result) if isinstance(result, dict) else result
                        wf.status = status
                        db.commit()
                        logger.info(f"Updated workflow {workflow_id}")
                    else:
                        logger.warning(f"Workflow {workflow_id} not found in DB")
                except Exception as e:
                    logger.error(f"DB error: {e}")
                    db.rollback()
                finally:
                    db.close()
            except Exception as e:
                logger.error(f"Error processing message: {e}")