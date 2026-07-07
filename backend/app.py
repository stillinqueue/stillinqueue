import os
import secrets
import shlex
import sqlite3
import hashlib
import subprocess
from datetime import datetime
from pathlib import Path
from typing import Any, Optional

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

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
DB_PATH = Path(__file__).parent / "users.db"
DB_PATH.parent.mkdir(parents=True, exist_ok=True)


def get_db_connection() -> sqlite3.Connection:
    conn = sqlite3.connect(DB_PATH, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    conn = get_db_connection()
    try:
        conn.execute(
            """
            CREATE TABLE IF NOT EXISTS users (
                email TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                password_hash TEXT NOT NULL,
                token TEXT NOT NULL,
                created_at TEXT NOT NULL
            )
            """
        )
        conn.commit()
    finally:
        conn.close()


init_db()


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


def verify_password(password: str, hashed: str) -> bool:
    return hash_password(password) == hashed


def create_token() -> str:
    return secrets.token_urlsafe(24)


def get_user(email: str) -> Optional[sqlite3.Row]:
    conn = get_db_connection()
    try:
        return conn.execute("SELECT * FROM users WHERE email = ?", (email,)).fetchone()
    finally:
        conn.close()


def create_user(email: str, name: str, password_hash: str, token: str) -> None:
    conn = get_db_connection()
    try:
        conn.execute(
            "INSERT INTO users (email, name, password_hash, token, created_at) VALUES (?, ?, ?, ?, ?)",
            (email, name, password_hash, token, datetime.utcnow().isoformat() + "Z"),
        )
        conn.commit()
    finally:
        conn.close()


class AuthRequest(BaseModel):
    email: str
    password: str
    name: Optional[str] = None


class AuthResponse(BaseModel):
    success: bool
    message: str
    token: Optional[str] = None


@app.get("/health")
def health() -> dict[str, Any]:
    return {"status": "ok", "service": "stillinqueue-backend", "timestamp": datetime.utcnow().isoformat() + "Z"}


@app.post("/api/auth/signup", response_model=AuthResponse)
def signup(request: AuthRequest) -> AuthResponse:
    if not request.name:
        raise HTTPException(status_code=400, detail="Name is required to create an account.")

    if get_user(request.email) is not None:
        raise HTTPException(status_code=400, detail="An account already exists for this email.")

    token = create_token()
    create_user(
        request.email,
        request.name,
        hash_password(request.password),
        token,
    )

    return AuthResponse(success=True, message="Account created successfully.", token=token)


@app.post("/api/auth/login", response_model=AuthResponse)
def login(request: AuthRequest) -> AuthResponse:
    user = get_user(request.email)
    if user is None or not verify_password(request.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    return AuthResponse(success=True, message="Login successful.", token=user["token"])


@app.get("/api/auth/health")
def auth_health() -> dict[str, Any]:
    return {"status": "ok", "service": "stillinqueue-auth", "timestamp": datetime.utcnow().isoformat() + "Z"}


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
