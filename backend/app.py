import os
import secrets
import shlex
import hashlib
import smtplib
import subprocess
from datetime import datetime, timedelta, timezone
from email.message import EmailMessage
from pathlib import Path
from typing import Any, Optional

from fastapi import FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sqlalchemy import create_engine, text
from sqlalchemy.exc import IntegrityError


def get_cors_origins() -> list[str]:
    raw_origins = os.getenv("CORS_ORIGINS", "*")
    origins = [origin.strip() for origin in raw_origins.split(",") if origin.strip()]
    return origins or ["*"]


app = FastAPI(title="Still In Queue Backend", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DEFAULT_REPO_PATH = os.getenv("INVENTORYPULSE_REPO_PATH", "/workspaces/inventorypulse-ai")
DEFAULT_COMPOSE_COMMAND = os.getenv("INVENTORYPULSE_COMPOSE_COMMAND", "docker compose up --build -d")
LOG_PATH = Path(os.getenv("INVENTORYPULSE_LOG_PATH", "/tmp/inventorypulse-start.log"))
DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+psycopg2://inventorypulse:inventorypulse@127.0.0.1:5432/inventorypulse",
)
SMTP_HOST = os.getenv("SMTP_HOST", "localhost")
SMTP_PORT = int(os.getenv("SMTP_PORT", 1025))
SMTP_USER = os.getenv("SMTP_USER", "")
SMTP_PASS = os.getenv("SMTP_PASS", "")
SMTP_FROM = os.getenv("SMTP_FROM", SMTP_USER or "no-reply@stillinqueue.com")
SMTP_USE_TLS = os.getenv("SMTP_USE_TLS", "true").lower() == "true"
SMTP_USE_SSL = os.getenv("SMTP_USE_SSL", "false").lower() == "true"
RESET_CODE_TTL_MINUTES = int(os.getenv("RESET_CODE_TTL_MINUTES", 10))
ADMIN_API_KEY = os.getenv("ADMIN_API_KEY", "")
AUTH_ALLOW_CODE_FALLBACK = os.getenv("AUTH_ALLOW_CODE_FALLBACK", "false").lower() == "true"
ADMIN_EMAILS = {
    email.strip().lower()
    for email in os.getenv("ADMIN_EMAILS", "").split(",")
    if email.strip()
}

engine = create_engine(DATABASE_URL, pool_pre_ping=True)


def init_db() -> None:
    with engine.begin() as conn:
        conn.execute(
            text(
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
        )
        conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_code TEXT"))
        conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT FALSE"))
        conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_code TEXT"))
        conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_code_created_at TEXT"))
        conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS membership_type TEXT NOT NULL DEFAULT 'Paid'"))
        conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'active'"))
        conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS payment_provider TEXT"))
        conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS payment_last4 TEXT"))
        conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS payment_renewal_at TEXT"))
        conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE"))


init_db()


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode("utf-8")).hexdigest()


def verify_password(password: str, hashed: str) -> bool:
    return hash_password(password) == hashed


def create_token() -> str:
    return secrets.token_urlsafe(24)


def get_user(email: str) -> Optional[dict[str, Any]]:
    with engine.connect() as conn:
        row = conn.execute(text("SELECT * FROM users WHERE email = :email"), {"email": email}).mappings().fetchone()
        return dict(row) if row is not None else None


def get_user_by_token(token: str) -> Optional[dict[str, Any]]:
    with engine.connect() as conn:
        row = conn.execute(text("SELECT * FROM users WHERE token = :token"), {"token": token}).mappings().fetchone()
        return dict(row) if row is not None else None


def is_admin_email(email: str) -> bool:
    return email.strip().lower() in ADMIN_EMAILS


def send_email(recipient: str, subject: str, body: str) -> None:
    message = EmailMessage()
    message["Subject"] = subject
    message["From"] = SMTP_FROM
    message["To"] = recipient
    message.set_content(body)

    smtp_class = smtplib.SMTP_SSL if SMTP_USE_SSL else smtplib.SMTP
    with smtp_class(SMTP_HOST, SMTP_PORT, timeout=15) as smtp:
        if not SMTP_USE_SSL and SMTP_USE_TLS:
            smtp.ehlo()
            smtp.starttls()
            smtp.ehlo()
        if SMTP_USER and SMTP_PASS:
            smtp.login(SMTP_USER, SMTP_PASS)
        smtp.send_message(message)


def send_verification_email(email: str, code: str) -> None:
    send_email(
        email,
        "Your Still In Queue verification code",
        f"Welcome to Still In Queue!\n\nYour verification code is: {code}\n\nEnter this code on the login page to confirm your email."
    )


def send_reset_email(email: str, code: str) -> None:
    send_email(
        email,
        "Your Still In Queue password reset code",
        f"Use this reset code to update your password: {code}\n\nEnter this code on the login page and submit your new password."
    )


def create_user(email: str, name: str, password_hash: str, token: str, verification_code: str, is_admin: bool) -> None:
    try:
        with engine.begin() as conn:
            conn.execute(
                text(
                    "INSERT INTO users (email, name, password_hash, token, verification_code, email_verified, created_at, membership_type, payment_status, is_admin) VALUES (:email, :name, :password_hash, :token, :verification_code, :email_verified, :created_at, :membership_type, :payment_status, :is_admin)"
                ),
                {
                    "email": email,
                    "name": name,
                    "password_hash": password_hash,
                    "token": token,
                    "verification_code": verification_code,
                    "email_verified": False,
                    "created_at": datetime.utcnow().isoformat() + "Z",
                    "membership_type": "Paid",
                    "payment_status": "active",
                    "is_admin": is_admin,
                },
            )
    except IntegrityError as exc:
        raise HTTPException(status_code=400, detail="An account already exists for this email.") from exc


class AuthRequest(BaseModel):
    email: str
    password: str
    name: Optional[str] = None
    verification_code: Optional[str] = None


class AuthResponse(BaseModel):
    success: bool
    message: str
    token: Optional[str] = None
    email_verified: Optional[bool] = None
    verification_code: Optional[str] = None
    reset_code: Optional[str] = None
    is_admin: Optional[bool] = None


class ForgotPasswordRequest(BaseModel):
    email: str


class ForgotPasswordConfirmRequest(BaseModel):
    email: str
    code: str
    new_password: str


class UserProfileResponse(BaseModel):
    email: str
    name: str
    email_verified: bool
    created_at: str
    membership_type: str
    payment_status: str
    payment_provider: Optional[str] = None
    payment_last4: Optional[str] = None
    payment_renewal_at: Optional[str] = None
    is_admin: bool


class UserSummaryResponse(BaseModel):
    email: str
    name: str
    email_verified: bool
    created_at: str
    membership_type: str
    payment_status: str
    is_admin: bool


class UserDetailResponse(BaseModel):
    email: str
    name: str
    email_verified: bool
    created_at: str
    membership_type: str
    payment_status: str
    payment_provider: Optional[str] = None
    payment_last4: Optional[str] = None
    payment_renewal_at: Optional[str] = None
    is_admin: bool
    has_pending_verification: bool
    has_pending_reset: bool


def enforce_admin_access(x_admin_key: Optional[str]) -> None:
    # If ADMIN_API_KEY is not set, endpoints remain open for local development.
    if not ADMIN_API_KEY:
        return

    if not x_admin_key or x_admin_key != ADMIN_API_KEY:
        raise HTTPException(status_code=401, detail="Missing or invalid admin key.")


def get_user_from_authorization(authorization: Optional[str]) -> dict[str, Any]:
    if not authorization or not authorization.lower().startswith("bearer "):
        raise HTTPException(status_code=401, detail="Missing or invalid authorization token.")

    token = authorization.split(" ", 1)[1].strip()
    if not token:
        raise HTTPException(status_code=401, detail="Missing or invalid authorization token.")

    user = get_user_by_token(token)
    if user is None:
        raise HTTPException(status_code=401, detail="Invalid session token.")

    return user


def enforce_admin_user(authorization: Optional[str], x_admin_key: Optional[str]) -> dict[str, Any]:
    if ADMIN_API_KEY and x_admin_key == ADMIN_API_KEY:
        return {"is_admin": True}

    user = get_user_from_authorization(authorization)
    if not bool(user.get("is_admin")):
        raise HTTPException(status_code=403, detail="Admin privileges required.")
    return user


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
    verification_code = secrets.token_hex(3).upper()
    user_is_admin = is_admin_email(request.email)

    code_to_return = None
    email_failed = False
    try:
        send_verification_email(request.email, verification_code)
    except Exception:
        email_failed = True
        code_to_return = verification_code

    create_user(
        request.email,
        request.name,
        hash_password(request.password),
        token,
        verification_code,
        user_is_admin,
    )

    return AuthResponse(
        success=True,
        message=(
            "Account created. Check your email for the verification code."
            if not email_failed
            else "Account created, but email delivery failed. Use the verification code shown below to sign in."
        ),
        token=token,
        email_verified=False,
        verification_code=code_to_return,
        is_admin=user_is_admin,
    )


@app.post("/api/auth/login", response_model=AuthResponse)
def login(request: AuthRequest) -> AuthResponse:
    user = get_user(request.email)
    if user is None or not verify_password(request.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password.")

    if not user["email_verified"]:
        if not request.verification_code:
            raise HTTPException(status_code=400, detail="Email not verified. Please provide the verification code sent to your email.")

        if request.verification_code != user["verification_code"]:
            raise HTTPException(status_code=401, detail="Invalid verification code.")

        with engine.begin() as conn:
            conn.execute(
                text("UPDATE users SET email_verified = TRUE, verification_code = NULL WHERE email = :email"),
                {"email": request.email},
            )

    return AuthResponse(
        success=True,
        message="Login successful.",
        token=user["token"],
        email_verified=True,
        is_admin=bool(user.get("is_admin")),
    )


@app.post("/api/auth/forgot-password/request", response_model=AuthResponse)
def forgot_password_request(request: ForgotPasswordRequest) -> AuthResponse:
    user = get_user(request.email)
    if user is None:
        # Avoid user enumeration by returning a success response either way.
        return AuthResponse(success=True, message="If the email exists, a reset code has been sent.")

    reset_code = secrets.token_hex(3).upper()
    with engine.begin() as conn:
        conn.execute(
            text("UPDATE users SET reset_code = :reset_code, reset_code_created_at = :created_at WHERE email = :email"),
            {
                "reset_code": reset_code,
                "created_at": datetime.utcnow().isoformat() + "Z",
                "email": request.email,
            },
        )

    code_to_return = None
    email_failed = False
    try:
        send_reset_email(request.email, reset_code)
    except Exception:
        email_failed = True
        code_to_return = reset_code

    return AuthResponse(
        success=True,
        message=(
            "If the email exists, a reset code has been sent."
            if not email_failed
            else "Reset code email delivery failed. Use the code shown below to continue."
        ),
        reset_code=code_to_return,
    )


@app.post("/api/auth/forgot-password/confirm", response_model=AuthResponse)
def forgot_password_confirm(request: ForgotPasswordConfirmRequest) -> AuthResponse:
    user = get_user(request.email)
    if user is None or not user.get("reset_code"):
        raise HTTPException(status_code=400, detail="Invalid or expired reset code.")

    raw_created_at = user.get("reset_code_created_at")
    if not raw_created_at:
        raise HTTPException(status_code=400, detail="Invalid or expired reset code.")

    try:
        created_at = datetime.fromisoformat(str(raw_created_at).replace("Z", "+00:00"))
    except ValueError as exc:
        raise HTTPException(status_code=400, detail="Invalid or expired reset code.") from exc

    now_utc = datetime.now(timezone.utc)
    if created_at.tzinfo is None:
        created_at = created_at.replace(tzinfo=timezone.utc)

    expires_at = created_at + timedelta(minutes=RESET_CODE_TTL_MINUTES)
    if now_utc > expires_at:
        with engine.begin() as conn:
            conn.execute(
                text("UPDATE users SET reset_code = NULL, reset_code_created_at = NULL WHERE email = :email"),
                {"email": request.email},
            )
        raise HTTPException(status_code=400, detail="Reset code expired. Please request a new code.")

    if request.code != user["reset_code"]:
        raise HTTPException(status_code=401, detail="Invalid or expired reset code.")

    with engine.begin() as conn:
        conn.execute(
            text(
                "UPDATE users SET password_hash = :password_hash, reset_code = NULL, reset_code_created_at = NULL WHERE email = :email"
            ),
            {
                "password_hash": hash_password(request.new_password),
                "email": request.email,
            },
        )

    return AuthResponse(success=True, message="Password reset successful. You can now sign in.")


@app.get("/api/auth/health")
def auth_health() -> dict[str, Any]:
    return {"status": "ok", "service": "stillinqueue-auth", "timestamp": datetime.utcnow().isoformat() + "Z"}


@app.get("/api/auth/me", response_model=UserProfileResponse)
def auth_me(authorization: Optional[str] = Header(default=None)) -> UserProfileResponse:
    user = get_user_from_authorization(authorization)

    return UserProfileResponse(
        email=user["email"],
        name=user["name"],
        email_verified=bool(user["email_verified"]),
        created_at=user["created_at"],
        membership_type=str(user.get("membership_type") or "Paid"),
        payment_status=str(user.get("payment_status") or "active"),
        payment_provider=user.get("payment_provider"),
        payment_last4=user.get("payment_last4"),
        payment_renewal_at=user.get("payment_renewal_at"),
        is_admin=bool(user.get("is_admin")),
    )


@app.get("/api/auth/users/count")
def get_user_count(
    authorization: Optional[str] = Header(default=None),
    x_admin_key: Optional[str] = Header(default=None, alias="X-Admin-Key"),
) -> dict[str, int]:
    enforce_admin_user(authorization, x_admin_key)
    with engine.connect() as conn:
        result = conn.execute(text("SELECT COUNT(*) AS count FROM users"))
        count = result.scalar_one()
    return {"count": count}


@app.get("/api/auth/users", response_model=list[UserSummaryResponse])
def list_users(
    authorization: Optional[str] = Header(default=None),
    x_admin_key: Optional[str] = Header(default=None, alias="X-Admin-Key"),
) -> list[UserSummaryResponse]:
    enforce_admin_user(authorization, x_admin_key)
    with engine.connect() as conn:
        rows = conn.execute(
            text(
                "SELECT email, name, email_verified, created_at, membership_type, payment_status, is_admin FROM users ORDER BY created_at DESC"
            )
        ).mappings().fetchall()

    return [
        UserSummaryResponse(
            email=str(row["email"]),
            name=str(row["name"]),
            email_verified=bool(row["email_verified"]),
            created_at=str(row["created_at"]),
            membership_type=str(row.get("membership_type") or "Paid"),
            payment_status=str(row.get("payment_status") or "active"),
            is_admin=bool(row.get("is_admin")),
        )
        for row in rows
    ]


@app.get("/api/auth/users/{email}", response_model=UserDetailResponse)
def get_user_detail(
    email: str,
    authorization: Optional[str] = Header(default=None),
    x_admin_key: Optional[str] = Header(default=None, alias="X-Admin-Key"),
) -> UserDetailResponse:
    enforce_admin_user(authorization, x_admin_key)

    user = get_user(email)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found.")

    return UserDetailResponse(
        email=str(user["email"]),
        name=str(user["name"]),
        email_verified=bool(user["email_verified"]),
        created_at=str(user["created_at"]),
        membership_type=str(user.get("membership_type") or "Paid"),
        payment_status=str(user.get("payment_status") or "active"),
        payment_provider=user.get("payment_provider"),
        payment_last4=user.get("payment_last4"),
        payment_renewal_at=user.get("payment_renewal_at"),
        is_admin=bool(user.get("is_admin")),
        has_pending_verification=bool(user.get("verification_code")),
        has_pending_reset=bool(user.get("reset_code")),
    )


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
