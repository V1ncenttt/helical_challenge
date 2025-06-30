# app/pubsub_listener.py
import threading
import json
import redis
from db.database import SessionLocal
from db.models import Workflow

def listen_to_workflow_results():
    r = redis.Redis(host="redis", port=6379, db=0)
    pubsub = r.pubsub()
    pubsub.subscribe("workflow_results")

    print("🔊 Subscribed to Redis channel 'workflow_results'")
    
    for message in pubsub.listen():
        if message["type"] == "message":
            try:
                data_raw = message["data"]
                data_str = data_raw.decode("utf-8") if isinstance(data_raw, bytes) else str(data_raw)
                data = json.loads(data_str)
                if not isinstance(data, dict) or "workflow_id" not in data:
                    raise ValueError("Malformed message received")
                workflow_id = data["workflow_id"]
                result = data  # store the entire message as the result
                status = data.get("status", "finished")

                print(status, workflow_id)
                db = SessionLocal()
                try:
                    wf = db.query(Workflow).filter_by(id=workflow_id).first()
                    if wf:
                        print(f"🔍 Found workflow {workflow_id}, updating...")
                        wf.result = json.dumps(result) if isinstance(result, dict) else result
                        wf.status = status
                        db.commit()
                        print(f"✅ Updated workflow {workflow_id}")
                    else:
                        print(f"⚠️ Workflow {workflow_id} not found in DB")
                except Exception as e:
                    print(f"❌ DB error: {e}")
                    db.rollback()
                finally:
                    db.close()
            except Exception as e:
                print(f"❌ Error processing message: {e}")