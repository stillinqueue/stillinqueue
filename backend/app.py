import os
import shlex
import subprocess
import sys
from datetime import datetime
from pathlib import Path
from typing import Any

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="Still In Queue Backend", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DEFAULT_REPO_PATH = os.getenv("INVENTORYPULSE_REPO_PATH", "/workspaces/inventorypulse-ai")
DEFAULT_COMPOSE_COMMAND = os.getenv("INVENTORYPULSE_COMPOSE_COMMAND", "docker compose up --build -d")
LOG_PATH = Path(os.getenv("INVENTORYPULSE_LOG_PATH", "/tmp/inventorypulse-start.log"))


@app.get("/health")
def health() -> dict[str, Any]:
    return {"status": "ok", "service": "stillinqueue-backend", "timestamp": datetime.utcnow().isoformat() + "Z"}


@app.post("/api/inventorypulse/start")
def start_inventorypulse() -> dict[str, Any]:
    repo_path = Path(DEFAULT_REPO_PATH).expanduser().resolve()
    if not repo_path.exists():
        raise HTTPException(status_code=404, detail=f"InventoryPulse repo not found at {repo_path}")

    if not (repo_path / "docker-compose.yml").exists() and not (repo_path / "compose.yaml").exists():
        raise HTTPException(status_code=400, detail="InventoryPulse repo does not contain a compose file")

    try:
        command = shlex.split(DEFAULT_COMPOSE_COMMAND)
        process = subprocess.Popen(
            command,
            cwd=str(repo_path),
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            start_new_session=True,
        )
    except FileNotFoundError as exc:
        raise HTTPException(status_code=500, detail="docker is not available on this host") from exc
    except Exception as exc:  # pragma: no cover - defensive branch
        raise HTTPException(status_code=500, detail=str(exc)) from exc

    LOG_PATH.parent.mkdir(parents=True, exist_ok=True)
    with LOG_PATH.open("a", encoding="utf-8") as handle:
        handle.write(f"[{datetime.utcnow().isoformat()}Z] started pid={process.pid} cwd={repo_path}\n")

    return {
        "status": "starting",
        "repo_path": str(repo_path),
        "command": DEFAULT_COMPOSE_COMMAND,
        "pid": process.pid,
    }
