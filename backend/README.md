# Still In Queue backend

This lightweight FastAPI service exposes an endpoint to trigger the InventoryPulse container startup.

## Run locally

```bash
pip install -r requirements.txt
uvicorn app:app --host 0.0.0.0 --port 8000
```

## Trigger startup

```bash
curl -X POST http://127.0.0.1:8000/api/inventorypulse/start
```
