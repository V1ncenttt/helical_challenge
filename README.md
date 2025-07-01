# 🧬 Helical AI Platform – Bio Foundation Models Web Interface

This project is a full-stack web application enabling users to **explore**, **select**, and **run Bio Foundation Models** such as **Geneformer** and **scGPT** for biological use cases like **cell annotation**.

It includes a FastAPI backend, React frontend (with shadcn/ui), and task execution via **Celery + Redis**. Both models are **preloaded in memory** for low-latency inference, and results (e.g. confusion matrices) are persisted in a database.

---

## 🚀 Features

- 🔬 Run **Geneformer** and **scGPT** for **cell type annotation**
- 🧠 Load models into RAM at startup
- 📊 Store confusion matrices, probabilities, and metadata per run
- 🌐 REST API to query applications and models
- ⚙️ Task queue via **Celery + Redis**
- 🐳 Dockerized environment for local and cloud deployment

---

## 🏗️ Architecture

```bash
.
├── backend/
│   ├── db/
│   │   ├── models.py          # SQLAlchemy models
│   │   └── database.py        # DB session and setup
│   ├── api/
│   │   └── routes.py          # FastAPI endpoints
│   ├── workers/
│   │   └── tasks.py           # Celery tasks
│   ├── load_models.py         # Model loading logic
│   ├── celery_worker.py       # Celery entrypoint
│   └── main.py                # FastAPI app
├── frontend/                  # React frontend (shadcn/ui)
├── docker-compose.yml         # Orchestrates FastAPI, Redis, and Celery
└── requirements.txt

```

---

## 🧬 Supported Models

| Model       | Speed | Accuracy | Applications     | Description                     |
|-------------|-------|----------|------------------|---------------------------------|
| Geneformer  | fast  | 0.92     | Cell Annotation  | Transformer model for scRNA-seq |
| scGPT       | slow  | 0.95     | Cell Annotation  | GPT-style model for single-cell |

---

## 📡 API Endpoints

| Method | Endpoint                      | Description                             |
|--------|-------------------------------|-----------------------------------------|
| GET    | `/applications`               | List available applications             |
| GET    | `/models`                     | List all models with attributes         |
| GET    | `/applications/{id}/models`   | Get models linked to an application     |
| POST   | `/submit`                        | Submit job (model, application, input)  |
| GET    | `/results/{run_id}`           | Fetch run output      |
| GET    | `/status/{run_id}`           | Fetch run status and stored output      |
| POST    | `/upload`           | Upload data      |
| GET    | `/download/{run_id}`           | Download annotated data      |




---

## ⚙️ Asynchronous Task Handling

Uses [**Celery**](https://docs.celeryq.dev) with [**Redis**](https://redis.io/) to handle long-running model inference jobs asynchronously.

Run the Celery worker:

```bash
celery -A backend.celery_worker worker --loglevel=info
```

---

## 💾 Storing Results

Each prediction stores:
- Cell type probabilities
- Raw model outputs
- Metadata

These are stored as structured JSON (e.g. via SQLite’s `Text` field or PostgreSQL `JSONB`).

---

## 🧠 Model Loading

Both models are loaded **at startup** and remain in RAM for fast access. This is suitable for small-to-medium scale deployments.

For large-scale, batch-heavy workloads, we recommend offloading inference to a **SLURM cluster**, **Ray**, or **Kubernetes-based** setup with GPU scheduling.

---

## 🐳 Quickstart (Docker)

```bash
# Start API, Celery, Redis
docker-compose up --build
```

Once running:
- FastAPI backend → http://localhost:8000
- Swagger docs → http://localhost:8000/docs
- Front end application → http://localhost:3000

---

## 🧪 Requirements

- Python 3.10+
- FastAPI, SQLAlchemy, Celery, Redis
- PyTorch with GPU (optional but recommended)
- See `requirements.txt`

---

## 🧑‍💻 Development

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn backend.main:app --reload
```

---

## 📬 Contact

Vincent Lefeuve – [vincent.lefeuve@imperial.ac.uk](mailto:vincent.lefeuve@imperial.ac.uk)

---

## 📜 License

MIT License. See `LICENSE` for details.
