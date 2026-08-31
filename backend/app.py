import base64
import io
import json
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
from urllib.error import URLError
from urllib.request import urlopen

from fastapi import BackgroundTasks, FastAPI, Header, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas as pdf_canvas
from sqlalchemy import create_engine, text
from sqlalchemy.exc import IntegrityError
from openai import OpenAI


def get_cors_origins() -> list[str]:
    raw_origins = os.getenv("CORS_ORIGINS", "*")
    origins = [origin.strip() for origin in raw_origins.split(",") if origin.strip()]
    return origins or ["*"]


app = FastAPI(title="Still In Queue Backend", version="0.1.0")

# OpenAI configuration.
# Keep OPENAI_API_KEY in the hosting environment; never commit it to GitHub.
OPENAI_MODEL = os.getenv("OPENAI_MODEL", "gpt-5.6-luna")


def get_openai_client() -> OpenAI:
    api_key = os.getenv("OPENAI_API_KEY", "").strip()
    if not api_key:
        raise HTTPException(
            status_code=503,
            detail="OPENAI_API_KEY is not configured on the backend.",
        )
    return OpenAI(api_key=api_key)

app.add_middleware(
    CORSMiddleware,
    allow_origins=get_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DEFAULT_REPO_PATH = os.getenv("INVENTORYPULSE_REPO_PATH", "/workspaces/stillinqueue/inventorypulse-ai")
DEFAULT_COMPOSE_COMMAND = os.getenv("INVENTORYPULSE_COMPOSE_COMMAND", "docker compose up --build -d")
LOG_PATH = Path(os.getenv("INVENTORYPULSE_LOG_PATH", "/tmp/inventorypulse-start.log"))
INVENTORYPULSE_FRONTEND_URL = os.getenv("INVENTORYPULSE_FRONTEND_URL", "")
INVENTORYPULSE_BACKEND_URL = os.getenv("INVENTORYPULSE_BACKEND_URL", "")
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
SMTP_TIMEOUT_SECONDS = float(os.getenv("SMTP_TIMEOUT_SECONDS", 15))
SMTP_FALLBACK_PORTS = [
    int(port.strip())
    for port in os.getenv("SMTP_FALLBACK_PORTS", "").split(",")
    if port.strip().isdigit()
]
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
        conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS membership_type TEXT NOT NULL DEFAULT 'Free'"))
        conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'not active'"))
        conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS payment_provider TEXT"))
        conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS payment_last4 TEXT"))
        conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS payment_renewal_at TEXT"))
        conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT FALSE"))
        conn.execute(
            text(
                """
                UPDATE users
                SET membership_type = 'Free', payment_status = 'not active'
                WHERE COALESCE(membership_type, '') IN ('', 'Paid')
                  AND COALESCE(payment_status, '') IN ('', 'active', 'Active')
                  AND payment_provider IS NULL
                  AND payment_last4 IS NULL
                  AND payment_renewal_at IS NULL
                """
            )
        )
        conn.execute(
            text(
                """
                CREATE TABLE IF NOT EXISTS plans (
                    id TEXT PRIMARY KEY,
                    user_email TEXT,
                    plan_json TEXT NOT NULL,
                    svg TEXT NOT NULL,
                    pdf_base64 TEXT,
                    created_at TEXT NOT NULL
                )
                """
            )
        )


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

    attempts: list[tuple[int, bool]] = [(SMTP_PORT, SMTP_USE_SSL)]
    attempts.extend((port, False) for port in SMTP_FALLBACK_PORTS if port != SMTP_PORT)
    attempts.extend((port, True) for port in SMTP_FALLBACK_PORTS if port != SMTP_PORT)

    last_error: Exception | None = None
    for port, use_ssl in attempts:
        try:
            smtp_class = smtplib.SMTP_SSL if use_ssl else smtplib.SMTP
            with smtp_class(SMTP_HOST, port, timeout=SMTP_TIMEOUT_SECONDS) as smtp:
                if not use_ssl and SMTP_USE_TLS:
                    smtp.ehlo()
                    smtp.starttls()
                    smtp.ehlo()
                if SMTP_USER and SMTP_PASS:
                    smtp.login(SMTP_USER, SMTP_PASS)
                smtp.send_message(message)
                return
        except Exception as exc:
            last_error = exc

    if last_error is not None:
        raise last_error


def get_smtp_error_message(exc: Exception) -> str:
    message = str(exc).strip() or exc.__class__.__name__
    return f"SMTP send failed: {message}"


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
                    "membership_type": "Free",
                    "payment_status": "not active",
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


class UpdateUserRequest(BaseModel):
    name: Optional[str] = None
    email_verified: Optional[bool] = None
    membership_type: Optional[str] = None
    payment_status: Optional[str] = None
    payment_provider: Optional[str] = None
    payment_last4: Optional[str] = None
    payment_renewal_at: Optional[str] = None
    is_admin: Optional[bool] = None


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


@app.get("/api/openai/test")
def test_openai() -> dict[str, Any]:
    """
    Simple backend-only OpenAI connectivity test.

    The API key is read from the OPENAI_API_KEY environment variable.
    The key is never returned to the browser.
    """
    client = get_openai_client()

    try:
        response = client.responses.create(
            model=OPENAI_MODEL,
            input="Reply with exactly: OpenAI connection works",
        )
    except Exception as exc:
        # Return a useful error without leaking credentials.
        message = str(exc).strip() or exc.__class__.__name__
        raise HTTPException(
            status_code=502,
            detail=f"OpenAI request failed: {message}",
        ) from exc

    return {
        "status": "ok",
        "model": OPENAI_MODEL,
        "reply": response.output_text,
    }



# ---------------------------------------------------------------------------
# OpenAI real-estate conversation / requirements agent
# ---------------------------------------------------------------------------

class RealEstateChatRequest(BaseModel):
    message: str
    state: Optional[dict[str, Any]] = None
    history: Optional[list[dict[str, Any]]] = None


class RealEstateChatResponse(BaseModel):
    reply: str
    state: dict[str, Any]
    missing_fields: list[str]
    concept_ready: bool
    proposal_ready: bool
    proposal: Optional[dict[str, Any]] = None
    interpreted_message: str
    model: str


REAL_ESTATE_CHAT_SCHEMA: dict[str, Any] = {
    "type": "object",
    "properties": {
        "reply": {"type": "string"},
        "interpreted_message": {"type": "string"},
        "state": {
            "type": "object",
            "properties": {
                "plot": {
                    "type": "object",
                    "properties": {
                        "width": {"type": ["number", "null"]},
                        "depth": {"type": ["number", "null"]},
                        "unit": {
                            "type": ["string", "null"],
                            "enum": ["ft", "m", None],
                        },
                    },
                    "required": ["width", "depth", "unit"],
                    "additionalProperties": False,
                },
                "facing": {
                    "type": ["string", "null"],
                    "enum": ["N", "NE", "E", "SE", "S", "SW", "W", "NW", None],
                },
                "bedrooms": {"type": ["integer", "null"]},
                "floors": {"type": ["integer", "null"]},
                "floor_description": {"type": ["string", "null"]},
                "planning_style": {
                    "type": ["string", "null"],
                    "enum": ["practical", "vastu", "modern", "accessible", None],
                },
                "bathrooms": {"type": ["integer", "null"]},
                "parking_spaces": {"type": ["integer", "null"]},
                "road_side": {
                    "type": ["string", "null"],
                    "enum": ["N", "NE", "E", "SE", "S", "SW", "W", "NW", None],
                },
                "site_context": {"type": ["string", "null"]},
                "special_requirements": {
                    "type": "array",
                    "items": {"type": "string"},
                },
                "room_preferences": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "room": {"type": "string"},
                            "preference": {"type": "string"},
                        },
                        "required": ["room", "preference"],
                        "additionalProperties": False,
                    },
                },
                "layout_operations": {
                    "type": "array",
                    "description": (
                        "Canonical geometry operations interpreted from the "
                        "user's latest and previously active layout edits."
                    ),
                    "items": {
                        "type": "object",
                        "properties": {
                            "operation": {
                                "type": "string",
                                "enum": [
                                    "swap", "adjacent", "near", "position", "resize",
                                    "transfer_area", "redistribute_area", "architectural_rebalance", "balcony_access", "site_feature", "optimize_layout",
                                ],
                            },
                            "source_room": {
                                "type": ["string", "null"],
                                "enum": [
                                    "living", "familyLounge", "dining", "kitchen", "utility",
                                    "masterBedroom", "bedroom2", "bedroom3", "bedroom4",
                                    "commonBathroom", "masterBathroom", "bathroom2", "bathroom3",
                                    "bathroom4", "foyer", "passage", "balcony", "parking",
                                    "study", "storage", "sitout", None,
                                ],
                            },
                            "target_room": {
                                "type": ["string", "null"],
                                "enum": [
                                    "living", "familyLounge", "dining", "kitchen", "utility",
                                    "masterBedroom", "bedroom2", "bedroom3", "bedroom4",
                                    "commonBathroom", "masterBathroom", "bathroom2", "bathroom3",
                                    "bathroom4", "foyer", "passage", "balcony", "parking",
                                    "study", "storage", "sitout", None,
                                ],
                            },
                            "donor_room": {
                                "type": ["string", "null"],
                                "enum": [
                                    "living", "familyLounge", "dining", "kitchen", "utility",
                                    "masterBedroom", "bedroom2", "bedroom3", "bedroom4",
                                    "commonBathroom", "masterBathroom", "bathroom2", "bathroom3",
                                    "bathroom4", "foyer", "passage", "balcony", "parking",
                                    "study", "storage", "sitout", None,
                                ],
                            },
                            "side": {
                                "type": ["string", "null"],
                                "enum": ["left", "right", "top", "bottom", None],
                            },
                            "width": {"type": ["number", "null"]},
                            "depth": {"type": ["number", "null"]},
                            "area": {"type": ["number", "null"]},
                            "amount_sqft": {"type": ["number", "null"]},
                            "amount_percent": {"type": ["number", "null"]},
                            "requested_width": {"type": ["number", "null"]},
                            "requested_depth": {"type": ["number", "null"]},
                            "strategy": {
                                "type": ["string", "null"],
                                "enum": ["direct_wall_transfer", "local_propagation", "balanced_remote_redistribution", "auto_architectural", None],
                            },
                            "preferred_local_receiver": {
                                "type": ["string", "null"],
                                "enum": [
                                    "living", "familyLounge", "dining", "kitchen", "utility",
                                    "masterBedroom", "bedroom2", "bedroom3", "bedroom4",
                                    "commonBathroom", "masterBathroom", "bathroom2", "bathroom3",
                                    "bathroom4", "foyer", "passage", "balcony", "parking",
                                    "study", "storage", "sitout", None,
                                ],
                            },
                            "preferred_target_donor": {
                                "type": ["string", "null"],
                                "enum": [
                                    "living", "familyLounge", "dining", "kitchen", "utility",
                                    "masterBedroom", "bedroom2", "bedroom3", "bedroom4",
                                    "commonBathroom", "masterBathroom", "bathroom2", "bathroom3",
                                    "bathroom4", "foyer", "passage", "balcony", "parking",
                                    "study", "storage", "sitout", None,
                                ],
                            },
                            "allow_auto_fallback": {"type": "boolean"},
                            "feature_type": {
                                "type": ["string", "null"],
                                "enum": [
                                    "balcony", "parking", "garden", "lawn", "sitout",
                                    "terrace", "courtyard", "driveway", "carport", None,
                                ],
                            },
                            "target_rooms": {
                                "type": "array",
                                "items": {
                                    "type": "string",
                                    "enum": [
                                        "living", "familyLounge", "dining", "kitchen", "utility",
                                        "masterBedroom", "bedroom2", "bedroom3", "bedroom4",
                                        "commonBathroom", "masterBathroom", "bathroom2", "bathroom3",
                                        "bathroom4", "foyer", "passage", "study", "storage", "sitout",
                                    ],
                                },
                            },
                            "count": {"type": ["integer", "null"]},
                            "placement": {
                                "type": ["string", "null"],
                                "enum": [
                                    "front", "rear", "left", "right", "north", "south",
                                    "east", "west", "auto", None,
                                ],
                            },
                            "covered": {"type": ["boolean", "null"]},
                            "shared": {"type": ["boolean", "null"]},
                            "priority": {
                                "type": "string",
                                "enum": ["low", "normal", "high"],
                            },
                            "preserve_total_area": {"type": "boolean"},
                            "preserve_room_usability": {"type": "boolean"},
                            "reason": {"type": "string"},
                        },
                        "required": [
                            "operation", "source_room", "target_room", "donor_room", "side",
                            "width", "depth", "area", "amount_sqft", "amount_percent",
                            "requested_width", "requested_depth", "strategy",
                            "preferred_local_receiver", "preferred_target_donor",
                            "allow_auto_fallback", "feature_type", "target_rooms", "count",
                            "placement", "covered", "shared", "priority",
                            "preserve_total_area", "preserve_room_usability", "reason",
                        ],
                        "additionalProperties": False,
                    },
                },
                "room_constraints": {
                    "type": "array",
                    "description": (
                        "Persistent explicit room size constraints. Width/depth "
                        "and area are independent; use null for values the user "
                        "did not specify."
                    ),
                    "items": {
                        "type": "object",
                        "properties": {
                            "room": {"type": "string"},
                            "width": {"type": ["number", "null"]},
                            "depth": {"type": ["number", "null"]},
                            "area": {"type": ["number", "null"]},
                            "area_delta": {"type": ["number", "null"]},
                            "unit": {
                                "type": ["string", "null"],
                                "enum": ["ft", "m", None],
                            },
                        },
                        "required": ["room", "width", "depth", "area", "area_delta", "unit"],
                        "additionalProperties": False,
                    },
                },
                "target_internal_area": {
                    "type": "object",
                    "description": (
                        "Target usable/internal apartment area, distinct from "
                        "plot area. Null values mean no target was stated."
                    ),
                    "properties": {
                        "area": {"type": ["number", "null"]},
                        "unit": {
                            "type": ["string", "null"],
                            "enum": ["sq ft", "sq m", None],
                        },
                    },
                    "required": ["area", "unit"],
                    "additionalProperties": False,
                },
                "layout_directives": {
                    "type": "object",
                    "description": (
                        "Structured edit directives the deterministic layout "
                        "engine already understands. Set a field only when the "
                        "user has actually asked for that change; otherwise keep "
                        "the previous value from current_state (null means no "
                        "preference either way)."
                    ),
                    "properties": {
                        "family_lounge": {"type": ["boolean", "null"]},
                        "utility": {"type": ["boolean", "null"]},
                        "puja": {"type": ["boolean", "null"]},
                        "store": {"type": ["boolean", "null"]},
                        "balcony": {"type": ["boolean", "null"]},
                        "kitchen_direction": {
                            "type": ["string", "null"],
                            "enum": ["north", "south", "east", "west", "northeast", "northwest", "southeast", "southwest", None],
                        },
                        "master_bedroom_direction": {
                            "type": ["string", "null"],
                            "enum": ["north", "south", "east", "west", "northeast", "northwest", "southeast", "southwest", None],
                        },
                        "extend_bedroom_passage": {"type": ["boolean", "null"]},
                        "direct_master_entry": {"type": ["boolean", "null"]},
                        "opposite_bedroom_entries": {"type": ["boolean", "null"]},
                        "common_toilet_independent_access": {"type": ["boolean", "null"]},
                        "dining_below_family": {"type": ["boolean", "null"]},
                        "rooms_scaled_bigger": {
                            "type": "array",
                            "items": {
                                "type": "string",
                                "enum": ["living", "familyLounge", "dining", "kitchen", "masterBedroom", "bedroom", "bedroom2", "bedroom3", "bedroom4", "bedroom5"],
                            },
                        },
                        "rooms_scaled_smaller": {
                            "type": "array",
                            "items": {
                                "type": "string",
                                "enum": ["living", "familyLounge", "dining", "kitchen", "masterBedroom", "bedroom", "bedroom2", "bedroom3", "bedroom4", "bedroom5"],
                            },
                        },
                    },
                    "required": [
                        "family_lounge",
                        "utility",
                        "puja",
                        "store",
                        "balcony",
                        "kitchen_direction",
                        "master_bedroom_direction",
                        "extend_bedroom_passage",
                        "direct_master_entry",
                        "opposite_bedroom_entries",
                        "common_toilet_independent_access",
                        "dining_below_family",
                        "rooms_scaled_bigger",
                        "rooms_scaled_smaller",
                    ],
                    "additionalProperties": False,
                },
                "pending_decision": {
                    "type": ["object", "null"],
                    "description": (
                        "A material design choice that must be resolved with the user "
                        "before the related geometry edit is finalized."
                    ),
                    "properties": {
                        "decision_type": {
                            "type": "string",
                            "enum": [
                                "released_area_allocation",
                                "space_source_selection",
                                "room_reference",
                                "dimension_conflict",
                                "layout_conflict",
                                "practicality_choice",
                            ],
                        },
                        "source_room": {
                            "type": ["string", "null"],
                            "enum": [
                                "living", "familyLounge", "dining", "kitchen", "utility",
                                "masterBedroom", "bedroom2", "bedroom3", "bedroom4",
                                "commonBathroom", "masterBathroom", "bathroom2", "bathroom3",
                                "bathroom4", "foyer", "passage", "balcony", "parking",
                                "study", "storage", "sitout", None,
                            ],
                        },
                        "target_room": {
                            "type": ["string", "null"],
                            "enum": [
                                "living", "familyLounge", "dining", "kitchen", "utility",
                                "masterBedroom", "bedroom2", "bedroom3", "bedroom4",
                                "commonBathroom", "masterBathroom", "bathroom2", "bathroom3",
                                "bathroom4", "foyer", "passage", "balcony", "parking",
                                "study", "storage", "sitout", None,
                            ],
                        },
                        "requested_width": {"type": ["number", "null"]},
                        "requested_depth": {"type": ["number", "null"]},
                        "requested_area": {"type": ["number", "null"]},
                        "requested_area_delta": {"type": ["number", "null"]},
                        "estimated_released_area": {"type": ["number", "null"]},
                        "unit": {
                            "type": ["string", "null"],
                            "enum": ["ft", "m", None],
                        },
                        "question": {"type": "string"},
                        "suggested_options": {
                            "type": "array",
                            "items": {"type": "string"},
                        },
                        "original_user_request": {"type": "string"},
                    },
                    "required": [
                        "decision_type",
                        "source_room",
                        "target_room",
                        "requested_width",
                        "requested_depth",
                        "requested_area",
                        "requested_area_delta",
                        "estimated_released_area",
                        "unit",
                        "question",
                        "suggested_options",
                        "original_user_request",
                    ],
                    "additionalProperties": False,
                },
            },
            "required": [
                "plot",
                "facing",
                "bedrooms",
                "floors",
                "floor_description",
                "planning_style",
                "bathrooms",
                "parking_spaces",
                "road_side",
                "site_context",
                "special_requirements",
                "room_preferences",
                "layout_operations",
                "room_constraints",
                "target_internal_area",
                "layout_directives",
                "pending_decision",
            ],
            "additionalProperties": False,
        },
        "missing_fields": {
            "type": "array",
            "items": {"type": "string"},
        },
        "concept_ready": {"type": "boolean"},
        "proposal_ready": {"type": "boolean"},
        "proposal": {
            "type": ["object", "null"],
            "properties": {
                "summary": {"type": "string"},
                "assumptions": {
                    "type": "array",
                    "items": {"type": "string"},
                },
                "design_strategy": {
                    "type": "array",
                    "items": {"type": "string"},
                },
                "spaces": {
                    "type": "array",
                    "items": {
                        "type": "object",
                        "properties": {
                            "name": {"type": "string"},
                            "width_ft": {"type": ["number", "null"]},
                            "depth_ft": {"type": ["number", "null"]},
                            "area_sqft": {"type": ["number", "null"]},
                            "preferred_zone": {"type": ["string", "null"]},
                            "notes": {"type": ["string", "null"]},
                        },
                        "required": [
                            "name",
                            "width_ft",
                            "depth_ft",
                            "area_sqft",
                            "preferred_zone",
                            "notes",
                        ],
                        "additionalProperties": False,
                    },
                },
                "engineer_notes": {
                    "type": "array",
                    "items": {"type": "string"},
                },
                "buyer_notes": {
                    "type": "array",
                    "items": {"type": "string"},
                },
            },
            "required": [
                "summary",
                "assumptions",
                "design_strategy",
                "spaces",
                "engineer_notes",
                "buyer_notes",
            ],
            "additionalProperties": False,
        },
    },
    "required": [
        "reply",
        "interpreted_message",
        "state",
        "missing_fields",
        "concept_ready",
        "proposal_ready",
        "proposal",
    ],
    "additionalProperties": False,
}


REAL_ESTATE_AGENT_INSTRUCTIONS = """
You are the conversational requirements agent for Still In Queue's residential
planning product.

Your job is NOT to create structural engineering calculations and NOT to claim
that a concept is construction-approved. Your job is to understand the user's
natural-language requirements, maintain a clean structured state, ask only the
next useful question, and create a sensible residential space-program proposal
once the minimum concept requirements are known.

IMPORTANT BEHAVIOUR

1. Understand normal conversation, abbreviations, spelling mistakes and typos.
   Examples:
   - "norht" probably means north.
   - "3bhk" means 3 bedrooms unless the user clearly means something else.
   - "ground", "ground only", "ground floor" mean one floor.
   - "g+1" means two floors total.
   - "g+2" means three floors total.
   - "88*97", "88x97", "88 × 97" are plot dimensions.
   - If the unit is omitted and dimensions look like a normal Indian residential
     plot in feet, use ft but say that you interpreted them as feet.
   - Never silently make a high-impact assumption when clarification is safer.

2. Preserve previously known state unless the user changes it.
   The incoming "current_state" is the source of truth for facts established
   earlier in the conversation.

3. Minimum fields for concept readiness are:
   - plot.width
   - plot.depth
   - plot.unit
   - bedrooms
   - facing
   - floors

4. Ask only ONE focused follow-up question at a time when required fields are
   missing. Do not dump a giant questionnaire on the user.

5. Optional requirements such as bathrooms, parking, Vastu, utility room,
   balconies, pooja, stairs, accessibility, home office, garden, etc. can be
   collected naturally. They do not block concept readiness unless the user
   explicitly says they are essential.

6. When all minimum fields are known:
   - concept_ready must be true.
   - proposal_ready should normally be true.
   - generate a practical preliminary SPACE PROGRAM, not structural design, but
     put it ONLY in the structured "proposal" fields (summary, spaces,
     design_strategy, assumptions, engineer_notes, buyer_notes) -- see item 10
     for why "reply" must NOT restate this list.
   - use realistic residential room sizes as a planning starting point.
   - account for the plot dimensions and avoid proposing obviously impossible
     room areas.
   - include assumptions explicitly.
   - engineer_notes should describe what a later technical drawing needs:
     setbacks subject to local rules, wall/opening dimensions, circulation,
     wet-area coordination, structural grid to be verified, etc.
   - buyer_notes should describe the home in plain language: privacy,
     circulation, natural light, room relationships, parking and usability.

7. Do NOT invent local building-code setbacks as legal requirements. If the user
   has not provided city/jurisdiction, describe setback values as concept
   assumptions only and state that local regulations must be checked.

8. A proposal is NOT a structural or permit drawing. Never say it is certified,
   approved, safe for construction, or ready to build without professional
   verification.

9. Distinguish:
   - user-provided facts,
   - interpreted user intent,
   - design assumptions,
   - unresolved information.

10. "reply" is a SHORT, SPECIFIC, conversational answer to the user's latest
    message -- 1 to 4 sentences, like a real chat assistant, not a report.
    CRITICAL: "reply" must NEVER restate the space program (room list with
    dimensions), the design_strategy bullets, assumptions list, or any other
    content that already lives in the structured "proposal" fields -- the app
    renders that separately, and repeating it every turn is exactly the kind
    of robotic, unhelpful behavior to avoid. Instead:
    - First time the proposal becomes ready: 1-2 sentences noting it's ready
      for review (e.g. "Here's a first concept for your 3BHK on the 40x60 plot
      -- take a look below and accept it when you're happy, or tell me what to
      change."). Do not list rooms/areas in the text.
    - Any later turn (follow-up question, edit request, positional request,
      small tweak): reply ONLY to that specific message. If you updated the
      proposal, say briefly what changed ("Updated -- the kitchen now faces
      southeast.") and nothing else. If nothing in the space program changed
      (e.g. a purely positional request that only affects room_preferences),
      do not mention the space program at all.
    - If the user asks a genuine question ("why is the kitchen there", "can
      you make it bigger"), answer that question directly and specifically,
      the way a helpful human assistant would -- not with a canned template.

11. Always return the FULL updated state, not only changed fields.

12. "missing_fields" must contain only genuinely missing minimum concept fields.
    Use these exact labels when applicable:
    "plot size", "plot unit", "BHK / bedrooms", "plot facing", "floors".
    A target_internal_area may substitute for plot size for an apartment
    concept; the deterministic engine will derive a temporary planning
    envelope. Do not fabricate plot width/depth in that case.

13. "road_side" usually equals facing for a conventional facing description
    unless the user explicitly distinguishes them.

14. If the user's message is ambiguous, do not hallucinate certainty. Explain
    the likely interpretation in "interpreted_message" and ask for confirmation
    in "reply" when needed.

15. "layout_directives" mirrors a fixed vocabulary the deterministic layout
    engine already understands (this is NOT the free-form space program).
    Set a field ONLY when the user's latest message clearly asks for that
    exact change; otherwise copy the previous value from current_state's
    layout_directives (do not reset it to null just because it wasn't
    mentioned again). Examples of user phrasing -> field:
    - "remove/no family lounge" -> family_lounge=false; "add a family lounge" -> true
    - "remove/no utility" -> utility=false; "add a utility room" -> true
    - "remove/no puja room" -> puja=false; "add a puja room" -> true
    - "remove/no store room" -> store=false; "add a store room" -> true
    - "large balcony connected to living" -> balcony=true AND emit a structured
      balcony_access operation. Do NOT encode balcony access as room_preferences.
    - "kitchen facing southeast" -> kitchen_direction="southeast"
    - "master bedroom in the southwest" -> master_bedroom_direction="southwest"
    - "extend the passage/corridor to the bedrooms" -> extend_bedroom_passage=true
    - "master bedroom should have its own direct entry" -> direct_master_entry=true
    - "bedroom doors facing opposite each other" -> opposite_bedroom_entries=true
    - "common toilet should have independent access, not through another room"
      -> common_toilet_independent_access=true
    - "dining below/under the family lounge" -> dining_below_family=true
    - "make the living room bigger" -> add "living" to rooms_scaled_bigger
    - "make the bedrooms smaller" -> add "bedroom" to rooms_scaled_smaller
    - "make bedroom 3 smaller" -> add "bedroom3" to rooms_scaled_smaller
    Never invent a directive the user did not ask for.

16. Any request about WHERE a room should sit relative to another room or to
    the hall/corridor/passage (e.g. "put the common toilet near the hall",
    "attached toilet 2 should be next to it", "move the kitchen beside the
    dining room") is NOT a layout_directive. Capture it verbatim in
    "room_preferences" as {"room": <the room being positioned>,
    "preference": <the raw relational phrase, e.g. "near the hall, adjacent
    to attached toilet 2">}. Keep every previously stated room_preference
    from current_state unless the user explicitly changes or removes that
    specific one -- do not silently drop earlier requests.
    For swaps, use a direct preference such as {"room": "kitchen",
    "preference": "swap with bedroom 2"}. Preserve side/opposite phrases such
    as "on left", "on right", "on top", or "opposite bedroom 2".

17. IMPORTANT -- be honest about what you can actually guarantee. You are a
    conversational interpreter; a separate deterministic geometry engine
    decides the real room positions when the user clicks Render, AFTER this
    reply is sent. You cannot see or guarantee the geometry outcome. So:
    - Never say a positional change "is done", "has been moved", or is
      "reflected in the plan" -- you have not seen the render yet.
    - For positional/adjacency requests, phrase the reply tentatively, e.g.
      "Noted -- I'll ask the layout engine to place the common toilet next
      to the hall and attached toilet 2 when you render. I'll flag it here
      if the engine can't apply it exactly." The app will report back after
      rendering whether it actually succeeded.
    - If the room reference is ambiguous (e.g. "the toilet" when there are
      several, or a room name that doesn't clearly match anything in the
      plan), do NOT guess silently -- ask a short, specific clarifying
      question in "reply" naming the choices (e.g. "Do you mean the Common
      Toilet or Attached Toilet 2?") before/alongside recording your best
      guess in room_preferences.
    - Only describe layout_directives fields (item 15) as applied plainly,
      since those are simple flags the engine reliably honors; reserve the
      tentative phrasing for room_preferences-style positional requests.

18. Capture explicit room sizes in "room_constraints":
        - "master bedroom 14 by 16 ft" -> width=14, depth=16, area=null.
        - "living room should be 300 sq ft" -> area=300, width/depth=null.
        - "increase living by 40 sq ft" -> area_delta=40, area/width/depth=null.
        - "reduce bedroom 3 by 20 sq ft" -> area_delta=-20.
        - Width/depth and area are independent; never invent missing values.
        - Keep previous constraints from current_state unless the user changes or
            removes that room's constraint. Use the room name/number stated by the
            user so the deterministic engine can resolve it.

19. "1600 sq ft apartment", "usable area", "internal area", or "carpet area"
        sets target_internal_area, NOT plot dimensions. Keep the previous target
        unless explicitly changed or removed. A stated plot/site area remains plot
        information and must not be copied into target_internal_area.

20. Convert every room movement request into canonical "layout_operations".
        This is the authoritative geometry instruction; do not encode a swap as two
        room_preferences. Canonical room IDs are: living, familyLounge, dining,
        kitchen, utility, masterBedroom, bedroom2, bedroom3, bedroom4,
        commonBathroom, masterBathroom, bathroom2, bathroom3, bathroom4, foyer,
        passage, balcony, parking. Normalize aliases strictly: "bed room 2",
        "bed2", and "second bedroom" are bedroom2; "family room", "family lounge",
        and a distinct "lounge" are familyLounge; "master room" is masterBedroom.
        Never collapse a numbered bedroom to generic "bedroom".
        - "Bedroom 2 in place of Family Lounge" and reciprocal/exchange wording
            means one operation: swap bedroom2 with familyLounge.
        - "Bedroom 2 near Family Lounge" means near, not swap.
        - "Bedroom 2 beside Family Lounge" means adjacent, not swap.
        - "Master bedroom on left" means position with side=left.
        Copy previously active operations from current_state, replace an older
        operation when the user changes the same source relationship, and never
        emit duplicate identical operations.

21. Interpret practical area-edit intent into canonical operations:
        - "reduce bedroom 3 and give that space to living" -> transfer_area,
            source_room=bedroom3, target_room=living, preserve_total_area=true.
        - "kitchen bigger but don't increase the house" -> redistribute_area,
            target_room=kitchen, source_room=null, donor_room=null,
            preserve_total_area=true. The deterministic planner chooses donors.
        - "Bedroom 2 is too large, give some space to family lounge" ->
            transfer_area from bedroom2 to familyLounge.
        - "master bedroom 14x16, take required area from bedroom 3" -> resize with
            target_room=masterBedroom, donor_room=bedroom3, requested dimensions set.
        - "make the plan more practical" -> optimize_layout. This requests a local
            evaluation/proposal, never a wholesale redesign.
        Interpret "a little" or "some" as amount_percent=8; "slightly" as 5;
        "much bigger" as 15; "as large as possible" leaves both amount fields null
        with priority=high. Preserve usability unless the user explicitly overrides
        it. Never invent geometry or claim a deterministic result before Render.
        current_state may include a compact current_layout_summary with canonical
        IDs, dimensions, areas, and validation status. Use it only to explain likely
        planning choices; JavaScript remains authoritative for donor selection and
        all geometry outcomes.

    22. Resolve instruction conflicts using this order: latest explicit user
        instruction, locked/confirmed constraints, explicit dimensions, adjacency,
        inferred preferences, defaults. If a latest move directly conflicts with a
        locked instruction, ask for confirmation in reply and do not emit the
        conflicting operation until confirmed. A newer explicit resize replaces the
        older constraint for that room rather than accumulating both.


23. COLLABORATIVE DESIGN BEHAVIOUR
    Behave like a collaborative residential planning assistant, not just a command
    parser. Balance the user's preference, practical usability, geometric feasibility,
    previously confirmed requirements, and minimum disruption to the accepted plan.
    Ask ONE concise question only when the answer materially changes the design.

24. PENDING DESIGN DECISIONS
    Use state.pending_decision when an important design choice must be resolved before
    the requested geometry edit is finalized. While pending_decision is active:
    - remember the original request and requested dimensions/area;
    - preserve unrelated existing state;
    - ask one focused question;
    - DO NOT emit the incomplete new geometry operation;
    - DO NOT activate an incomplete new room_constraint yet;
    - do not silently choose on the user's behalf.
    When the user answers, interpret the short answer using pending_decision, complete
    the room_constraint and/or layout operation, clear pending_decision to null, and
    briefly confirm what will be attempted on the next render.

25. SHRINKING A ROOM CREATES RELEASED FLOOR AREA
    If the user specifies the recipient in the SAME request, e.g. "Make Bedroom 3
    exactly 10x11 and give the remaining area to Family Lounge", create/update the
    Bedroom 3 room_constraint and create transfer_area from bedroom3 to familyLounge
    with preserve_total_area=true. Do not ask again.
    If the user only asks to shrink a room and current_layout_summary shows that the
    requested room is smaller than the current room, do NOT activate the new resize
    immediately. Create pending_decision with decision_type="released_area_allocation"
    and ask where the released area should go.

26. RELEASED AREA ESTIMATE
    If current_layout_summary contains the current room area or dimensions, calculate
    an approximate released amount. Say "about X sq ft" rather than implying survey
    precision. If current geometry is unavailable, simply say that some floor area
    will be released.

27. PRACTICAL RELEASED-AREA OPTIONS
    Offer a small number of meaningful choices, such as Family Lounge, an adjacent
    flexible room, circulation, or "choose the most practical option". Never claim
    adjacency unless current_layout_summary supports it.

28. AUTOMATIC PRACTICAL CHOICE
    Understand "choose for me", "whatever is practical", "best option", "you
    decide", and similar wording as permission for deterministic practical
    redistribution. Use redistribute_area as appropriate. JavaScript remains
    authoritative for actual geometric donor/recipient selection.

29. GROWING A ROOM CAN REQUIRE A SOURCE
    If the user wants to enlarge a room but does not say where the extra area should
    come from, and this is a meaningful trade-off, use pending_decision with
    decision_type="space_source_selection" and ask whether to take area from one of
    a few sensible spaces or choose the least disruptive option. Do not ask when the
    user already named a donor or authorized automatic choice.

30. PRACTICALITY VS USER PREFERENCE
    If an exact preference appears likely to create a major usability problem, do not
    immediately reject it. Explain the trade-off briefly and offer one or two useful
    alternatives. Do not claim something is impossible until deterministic validation
    has established it.

31. PREVIOUS GEOMETRY FAILURE
    If current_layout_summary shows that a previous exact request failed, do not keep
    repeating the same operation while promising success. Explain the previous result
    briefly and propose one or two practical alternatives. Ask only one decision
    question.

32. DO NOT OVER-QUESTION
    Ask clarification only when it materially changes room allocation, dimensions,
    donor/recipient choice, conflicting room relationships, an ambiguous numbered room,
    or a major redesign compromise. Do not ask about exact coordinates, tiny rounding
    differences, solver strategy, or other technical details JavaScript can decide.

33. PRESERVE THE ORIGINAL GOAL THROUGH FOLLOW-UP
    Example: user says "Bedroom 3 must be 10x11"; assistant asks where released area
    should go; user says "Family Lounge". The completed state must still preserve
    Bedroom 3 = 10x11 and also add the transfer to Family Lounge. The follow-up answer
    completes the first request; it does not replace it.

34. CANCELLING OR REPLACING A PENDING CHANGE
    Understand "forget it", "cancel that", "leave it as it was", and "never mind"
    as cancellation when they refer to the pending request. Clear pending_decision and
    do not activate the pending constraint/operation. If the user instead gives a new
    explicit instruction, that new instruction may replace the pending request.

35. DO NOT REBUILD THE WHOLE PROPOSAL FOR SMALL EDITS
    Once an accepted/rendered concept exists and current_layout_summary is available,
    resize, swap, move, allocation, enlargement, and corridor changes are edits to the
    existing concept. Keep the proposal stable whenever possible; proposal may be null
    for a small edit. Do not regenerate the full room schedule for every tweak.

36. PENDING DECISION DOES NOT INVALIDATE THE EXISTING CONCEPT
    If a valid concept already exists and a new edit is awaiting clarification, keep
    concept_ready=true. The existing concept remains valid; only the new edit is waiting
    for a choice.

37. FRIENDLY, PRECISE REPLIES
    Prefer natural language like: "That will free some floor area. Would you like it
    added to the Family Lounge, Bedroom 4, circulation, or should I choose the most
    practical option?" Avoid robotic phrases such as "target_room unresolved".

38. NEVER CLAIM AN UNRENDERED RESULT
    Until geometry runs, say "I'll ask the engine to...", "the engine will attempt...",
    or "we can try...". Never claim exact dimensions, transferred area, or validity
    before Render verifies it.

39. ROOM SIZE AND AREA MOVEMENT ARE SEPARATE RESPONSIBILITIES
    A room size belongs in room_constraints. Movement of released/required area between
    rooms belongs in transfer_area/redistribute_area. Example: "Master Bedroom 14x16,
    take required area from Bedroom 3" means a Master Bedroom room_constraint plus a
    transfer/redistribution operation identifying Bedroom 3 as donor, not one hybrid
    resize operation.

40. ARCHITECTURAL FEATURES — BALCONIES, PARKING, GARDENS AND SITE DESIGN
    Treat outdoor/site requests as architectural design intent, not generic room
    adjacency text. Never turn phrases such as "balcony accessible from living"
    into room_preferences like "living near balcony".

    BALCONIES:
    - For requests such as "balcony in living, kitchen, master bedroom and bedroom 4",
      emit ONE operation="balcony_access" with feature_type="balcony" and
      target_rooms containing every requested room.
    - target_room/source_room may be null for multi-room balcony requests.
    - shared=true when a continuous/shared balcony is acceptable or clearly useful;
      otherwise shared=false. If the user did not specify, choose architecturally.
    - The geometry engine may create separate balconies, a continuous balcony serving
      several rooms, or propose a perimeter replan if a requested room has no exterior
      edge. Do not falsely claim all requested accesses are already possible.

    PARKING / GARDEN / LAWN / SITOUT / COURTYARD / DRIVEWAY / CARPORT:
    - Emit operation="site_feature" and set feature_type accordingly.
    - Use count for parking spaces when known. Preserve parking_spaces in state too.
    - placement should follow an explicit user request; otherwise "auto".
    - Width/depth/area stay null unless the user supplied them.
    - These are SITE elements, not indoor room adjacency requests. Do not put them in
      room_preferences. The deterministic planner should first use available setback/yard
      space; if that is insufficient, it may reduce/replan the building footprint only
      when consistent with explicit room constraints.

    ARCHITECT BEHAVIOR:
    - Infer a practical solution when multiple safe options exist; do not ask the user
      to micromanage geometry.
    - Ask one focused question only when a decision materially changes the brief, e.g.
      covered vs open parking when essential, or a garden size that would require losing
      an explicitly locked room.
    - Preserve vehicular access from the road to parking/garage.
    - Prefer garden/lawn where daylight and privacy are useful; avoid blocking the main
      entrance or required circulation.
    - Prefer balconies on exterior edges with usable door access. Wet/service areas
      should not be moved just to create a balcony unless a broader replan is justified.
    - If a feature cannot be achieved literally, propose the closest architecturally
      sensible alternative instead of producing a misleading adjacency result.

41. ARCHITECTURAL REBALANCE — THINK LIKE A DESIGNER
    For a room-size change whose benefit should go to another room, model the DESIGN
    INTENT instead of pretending the same physical rectangle must travel across the
    house. Use operation="architectural_rebalance" when the source is being resized
    and the user names a beneficiary room, including when resolving a pending
    released_area_allocation decision.

    Architectural goal:
    - satisfy the source room's explicit requested dimensions locally;
    - absorb its released physical strip into the least disruptive nearby room(s);
    - enlarge the beneficiary locally using equivalent area from a practical room
      beside the beneficiary;
    - preserve total floor area, circulation, access, practical minimums and wet-core
      stability where possible;
    - disturb as few rooms as practical.

    For architectural_rebalance:
    - source_room = resized room;
    - target_room = beneficiary room;
    - requested_width/requested_depth = explicit final dimensions when known;
    - strategy="auto_architectural" unless the user explicitly chooses otherwise;
    - preferred_local_receiver=null unless the user names a nearby source-side room;
    - preferred_target_donor=null unless the user names a room beside the beneficiary;
    - allow_auto_fallback=true when the assistant may choose practical rooms;
    - preserve_total_area=true and preserve_room_usability=true.

    When the user answers a pending released-area question with a beneficiary such as
    "Family Lounge", complete the pending room_constraint AND emit
    architectural_rebalance, not a naive transfer_area. The deterministic planner may
    implement it as a direct wall edit when adjacent, local propagation when near, or
    balanced remote redistribution when far apart. Never invent coordinates.

42. ARCHITECTURAL PRIORITIES
    Use this order when recommending/authorizing automatic choices:
    1. preserve circulation and access;
    2. preserve explicit user dimensions;
    3. keep bathrooms/plumbing cores stable when possible;
    4. prefer flexible social-room boundaries over harming essential bedroom usability;
    5. minimize the number of disturbed rooms;
    6. prefer direct shared-wall edits;
    7. use balanced remote redistribution for distant source/beneficiary rooms;
    8. if exact geometry fails, preserve the user's main goal and propose the closest
       viable alternative rather than silently substituting another goal.

42. OVERALL COLLABORATIVE FLOW
    Follow this pattern: understand preference -> identify meaningful consequence -> ask
    one useful question if needed -> reach a shared decision -> emit complete structured
    intent -> let deterministic geometry validate it -> if geometry fails, explain why
    and negotiate the nearest practical alternative.
""".strip()


def normalize_realestate_state(raw_state: Optional[dict[str, Any]]) -> dict[str, Any]:
    state = raw_state if isinstance(raw_state, dict) else {}
    plot = state.get("plot") if isinstance(state.get("plot"), dict) else {}

    room_preferences = state.get("room_preferences")
    if not isinstance(room_preferences, list):
        room_preferences = []

    layout_operations = state.get("layout_operations")
    if not isinstance(layout_operations, list):
        layout_operations = []
    deduplicated_operations: list[dict[str, Any]] = []
    operation_keys: set[tuple[Any, ...]] = set()
    for operation in layout_operations:
        if not isinstance(operation, dict):
            continue
        key = (
            operation.get("operation"), operation.get("source_room"),
            operation.get("target_room"), operation.get("donor_room"),
            operation.get("side"), operation.get("width"), operation.get("depth"),
            operation.get("area"), operation.get("amount_sqft"),
            operation.get("amount_percent"), operation.get("requested_width"),
            operation.get("requested_depth"), operation.get("strategy"),
            operation.get("preferred_local_receiver"), operation.get("preferred_target_donor"),
            operation.get("allow_auto_fallback"), operation.get("priority"),
            operation.get("preserve_total_area"), operation.get("preserve_room_usability"),
        )
        if key in operation_keys:
            continue
        operation_keys.add(key)
        deduplicated_operations.append(operation)

    room_constraints = state.get("room_constraints")
    if not isinstance(room_constraints, list):
        room_constraints = []

    target_internal_area = state.get("target_internal_area")
    if not isinstance(target_internal_area, dict):
        target_internal_area = {}

    special_requirements = state.get("special_requirements")
    if not isinstance(special_requirements, list):
        special_requirements = []

    layout_directives = state.get("layout_directives")
    if not isinstance(layout_directives, dict):
        layout_directives = {}

    current_layout_summary = state.get("current_layout_summary")
    if not isinstance(current_layout_summary, dict):
        current_layout_summary = None

    pending_decision = state.get("pending_decision")
    if not isinstance(pending_decision, dict):
        pending_decision = None

    return {
        "plot": {
            "width": plot.get("width"),
            "depth": plot.get("depth"),
            "unit": plot.get("unit"),
        },
        "facing": state.get("facing"),
        "bedrooms": state.get("bedrooms"),
        "floors": state.get("floors"),
        "floor_description": state.get("floor_description"),
        "planning_style": state.get("planning_style"),
        "bathrooms": state.get("bathrooms"),
        "parking_spaces": state.get("parking_spaces"),
        "road_side": state.get("road_side"),
        "site_context": state.get("site_context"),
        "special_requirements": special_requirements,
        "room_preferences": room_preferences,
        "layout_operations": deduplicated_operations,
        "room_constraints": room_constraints,
        "target_internal_area": {
            "area": target_internal_area.get("area"),
            "unit": target_internal_area.get("unit"),
        },
        "layout_directives": layout_directives,
        "pending_decision": pending_decision,
        "current_layout_summary": current_layout_summary,
    }


def trim_realestate_history(history: Optional[list[dict[str, Any]]]) -> list[dict[str, str]]:
    if not isinstance(history, list):
        return []

    cleaned: list[dict[str, str]] = []
    for item in history[-12:]:
        if not isinstance(item, dict):
            continue

        role = str(item.get("role") or "").strip().lower()
        content = str(item.get("content") or "").strip()

        if role not in {"user", "assistant"} or not content:
            continue

        cleaned.append({
            "role": role,
            "content": content[:3000],
        })

    return cleaned


def _normalize_agent_pending_decision(state: dict[str, Any]) -> None:
    pending = state.get("pending_decision")
    if pending is None:
        return
    if not isinstance(pending, dict):
        state["pending_decision"] = None
        return
    question = str(pending.get("question") or "").strip()
    decision_type = str(pending.get("decision_type") or "").strip()
    if not question or not decision_type:
        state["pending_decision"] = None


def _deduplicate_agent_operations(state: dict[str, Any]) -> None:
    operations = state.get("layout_operations")
    if not isinstance(operations, list):
        state["layout_operations"] = []
        return

    unique: list[dict[str, Any]] = []
    seen: set[tuple[Any, ...]] = set()
    for operation in operations:
        if not isinstance(operation, dict):
            continue
        key = (
            operation.get("operation"), operation.get("source_room"),
            operation.get("target_room"), operation.get("donor_room"),
            operation.get("side"), operation.get("width"), operation.get("depth"),
            operation.get("area"), operation.get("amount_sqft"),
            operation.get("amount_percent"), operation.get("requested_width"),
            operation.get("requested_depth"), operation.get("priority"),
            operation.get("preserve_total_area"),
            operation.get("preserve_room_usability"),
            operation.get("feature_type"), tuple(operation.get("target_rooms") or []),
            operation.get("count"), operation.get("placement"),
            operation.get("covered"), operation.get("shared"),
        )
        if key in seen:
            continue
        seen.add(key)
        unique.append(operation)
    state["layout_operations"] = unique


def _keep_latest_room_constraint_per_room(state: dict[str, Any]) -> None:
    constraints = state.get("room_constraints")
    if not isinstance(constraints, list):
        state["room_constraints"] = []
        return

    latest_by_room: dict[str, dict[str, Any]] = {}
    order: list[str] = []
    for constraint in constraints:
        if not isinstance(constraint, dict):
            continue
        room = str(constraint.get("room") or "").strip()
        if not room:
            continue
        key = room.lower()
        if key not in latest_by_room:
            order.append(key)
        latest_by_room[key] = constraint

    state["room_constraints"] = [latest_by_room[key] for key in order]


@app.post("/api/realestate/chat", response_model=RealEstateChatResponse)
def realestate_chat(payload: RealEstateChatRequest) -> RealEstateChatResponse:
    message = payload.message.strip()
    if not message:
        raise HTTPException(status_code=400, detail="message is required.")

    current_state = normalize_realestate_state(payload.state)
    history = trim_realestate_history(payload.history)

    # The stable instructions stay first for prompt-cache friendliness.
    # Dynamic conversation data is appended at the end.
    request_context = {
        "current_state": current_state,
        "recent_history": history,
        "latest_user_message": message,
    }

    client = get_openai_client()

    try:
        response = client.responses.create(
            model=OPENAI_MODEL,
            instructions=REAL_ESTATE_AGENT_INSTRUCTIONS,
            input=json.dumps(request_context, ensure_ascii=False),
            text={
                "format": {
                    "type": "json_schema",
                    "name": "real_estate_requirement_update",
                    "strict": True,
                    "schema": REAL_ESTATE_CHAT_SCHEMA,
                },
                "verbosity": "low",
            },
            store=False,
        )
    except Exception as exc:
        message_text = str(exc).strip() or exc.__class__.__name__
        raise HTTPException(
            status_code=502,
            detail=f"OpenAI real-estate chat failed: {message_text}",
        ) from exc

    raw_output = (response.output_text or "").strip()
    if not raw_output:
        raise HTTPException(
            status_code=502,
            detail="OpenAI returned an empty real-estate chat response.",
        )

    try:
        result = json.loads(raw_output)
    except json.JSONDecodeError as exc:
        raise HTTPException(
            status_code=502,
            detail="OpenAI returned invalid structured JSON.",
        ) from exc

    # Basic server-side sanity checks even though Structured Outputs is strict.
    state = result.get("state")
    if not isinstance(state, dict):
        raise HTTPException(status_code=502, detail="OpenAI response is missing state.")

    _normalize_agent_pending_decision(state)
    _deduplicate_agent_operations(state)
    _keep_latest_room_constraint_per_room(state)

    missing_fields = result.get("missing_fields")
    if not isinstance(missing_fields, list):
        missing_fields = []

    reply = str(result.get("reply") or "").strip()
    pending_decision = state.get("pending_decision")
    if not reply and isinstance(pending_decision, dict):
        reply = str(pending_decision.get("question") or "").strip()

    return RealEstateChatResponse(
        reply=reply,
        state=state,
        missing_fields=[str(item) for item in missing_fields],
        concept_ready=bool(result.get("concept_ready")),
        proposal_ready=bool(result.get("proposal_ready")),
        proposal=result.get("proposal"),
        interpreted_message=str(result.get("interpreted_message") or message),
        model=OPENAI_MODEL,
    )




@app.post("/api/auth/signup", response_model=AuthResponse)
def signup(request: AuthRequest, background_tasks: BackgroundTasks) -> AuthResponse:
    if not request.name:
        raise HTTPException(status_code=400, detail="Name is required to create an account.")

    if get_user(request.email) is not None:
        raise HTTPException(status_code=400, detail="An account already exists for this email.")

    token = create_token()
    verification_code = secrets.token_hex(3).upper()
    user_is_admin = is_admin_email(request.email)

    create_user(
        request.email,
        request.name,
        hash_password(request.password),
        token,
        verification_code,
        user_is_admin,
    )

    background_tasks.add_task(send_verification_email, request.email, verification_code)

    return AuthResponse(
        success=True,
        message="Account created. Check your email for the verification code.",
        token=token,
        email_verified=False,
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
def forgot_password_request(request: ForgotPasswordRequest, background_tasks: BackgroundTasks) -> AuthResponse:
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

    background_tasks.add_task(send_reset_email, request.email, reset_code)

    return AuthResponse(
        success=True,
        message="If the email exists, a reset code has been sent.",
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
        membership_type=str(user.get("membership_type") or "Free"),
        payment_status=str(user.get("payment_status") or "not active"),
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
            membership_type=str(row.get("membership_type") or "Free"),
            payment_status=str(row.get("payment_status") or "not active"),
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
        membership_type=str(user.get("membership_type") or "Free"),
        payment_status=str(user.get("payment_status") or "not active"),
        payment_provider=user.get("payment_provider"),
        payment_last4=user.get("payment_last4"),
        payment_renewal_at=user.get("payment_renewal_at"),
        is_admin=bool(user.get("is_admin")),
        has_pending_verification=bool(user.get("verification_code")),
        has_pending_reset=bool(user.get("reset_code")),
    )


@app.patch("/api/auth/users/{email}", response_model=UserDetailResponse)
def update_user_detail(
    email: str,
    payload: UpdateUserRequest,
    authorization: Optional[str] = Header(default=None),
    x_admin_key: Optional[str] = Header(default=None, alias="X-Admin-Key"),
) -> UserDetailResponse:
    enforce_admin_user(authorization, x_admin_key)

    existing_user = get_user(email)
    if existing_user is None:
        raise HTTPException(status_code=404, detail="User not found.")

    updates: dict[str, Any] = {}
    if payload.name is not None:
        clean_name = payload.name.strip()
        if not clean_name:
            raise HTTPException(status_code=400, detail="Name cannot be empty.")
        updates["name"] = clean_name

    if payload.email_verified is not None:
        updates["email_verified"] = bool(payload.email_verified)
        if payload.email_verified:
            updates["verification_code"] = None

    if payload.membership_type is not None:
        clean_membership = payload.membership_type.strip()
        updates["membership_type"] = clean_membership or "Free"

    if payload.payment_status is not None:
        clean_payment = payload.payment_status.strip()
        updates["payment_status"] = clean_payment or "not active"

    if payload.payment_provider is not None:
        clean_provider = payload.payment_provider.strip()
        updates["payment_provider"] = clean_provider or None

    if payload.payment_last4 is not None:
        clean_last4 = payload.payment_last4.strip()
        updates["payment_last4"] = clean_last4 or None

    if payload.payment_renewal_at is not None:
        clean_renewal = payload.payment_renewal_at.strip()
        updates["payment_renewal_at"] = clean_renewal or None

    if payload.is_admin is not None:
        updates["is_admin"] = bool(payload.is_admin)

    if not updates:
        raise HTTPException(status_code=400, detail="No fields provided for update.")

    set_parts = [f"{field} = :{field}" for field in updates]
    updates["email"] = email
    with engine.begin() as conn:
        conn.execute(text(f"UPDATE users SET {', '.join(set_parts)} WHERE email = :email"), updates)

    user = get_user(email)
    if user is None:
        raise HTTPException(status_code=404, detail="User not found.")

    return UserDetailResponse(
        email=str(user["email"]),
        name=str(user["name"]),
        email_verified=bool(user["email_verified"]),
        created_at=str(user["created_at"]),
        membership_type=str(user.get("membership_type") or "Free"),
        payment_status=str(user.get("payment_status") or "not active"),
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


def _url_is_healthy(url: str, timeout_seconds: float = 2.5) -> bool:
    try:
        with urlopen(url, timeout=timeout_seconds):
            return True
    except (URLError, TimeoutError, ValueError):
        return False


@app.get("/api/inventorypulse/config")
def get_inventorypulse_config() -> dict[str, Any]:
    return {
        "frontend_url": INVENTORYPULSE_FRONTEND_URL,
        "backend_url": INVENTORYPULSE_BACKEND_URL,
        "repo_path": str(Path(DEFAULT_REPO_PATH).expanduser().resolve()),
    }


@app.get("/api/inventorypulse/status")
def get_inventorypulse_status() -> dict[str, Any]:
    frontend_health_url = INVENTORYPULSE_FRONTEND_URL
    backend_health_url = f"{INVENTORYPULSE_BACKEND_URL.rstrip('/')}/health" if INVENTORYPULSE_BACKEND_URL else ""
    frontend_online = _url_is_healthy(frontend_health_url) if frontend_health_url else False
    backend_online = _url_is_healthy(backend_health_url) if backend_health_url else False
    return {
        "frontend_url": INVENTORYPULSE_FRONTEND_URL,
        "backend_health_url": backend_health_url,
        "frontend_online": frontend_online,
        "backend_online": backend_online,
        "is_ready": frontend_online and backend_online,
    }


# ---------------------------------------------------------------------------
# Real estate plan renderer (realestate.html: Chat -> Render -> Confirm -> Download)
# ---------------------------------------------------------------------------

ROOM_COLORS = {
    "living": "#3b82f6",
    "kitchen": "#22c55e",
    "bed": "#a78bfa",
    "bath": "#f59e0b",
    "toilet": "#f59e0b",
    "pooja": "#14b8a6",
    "dining": "#60a5fa",
}
DEFAULT_ROOM_COLOR = "#38bdf8"


def room_color(name: Optional[str]) -> str:
    lowered = (name or "").lower()
    for key, color in ROOM_COLORS.items():
        if key in lowered:
            return color
    return DEFAULT_ROOM_COLOR


def hex_to_rgb01(hex_color: str) -> tuple[float, float, float]:
    hex_color = hex_color.lstrip("#")
    return (
        int(hex_color[0:2], 16) / 255,
        int(hex_color[2:4], 16) / 255,
        int(hex_color[4:6], 16) / 255,
    )


def build_plan_svg(plan: dict[str, Any], plot_w: float, plot_h: float) -> str:
    setbacks = plan.get("setbacks") or {}
    left = float(setbacks.get("left") or 0)
    right = float(setbacks.get("right") or 0)
    front = float(setbacks.get("front") or 0)
    back = float(setbacks.get("back") or 0)

    buildable_x = left
    buildable_y = front
    buildable_w = max(0.0, plot_w - left - right)
    buildable_h = max(0.0, plot_h - front - back)

    parts = [
        f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {plot_w} {plot_h}" '
        f'width="{plot_w * 100:.0f}" height="{plot_h * 100:.0f}">',
        f'<rect x="0" y="0" width="{plot_w}" height="{plot_h}" fill="#0b1120" '
        f'stroke="#94a3b8" stroke-width="0.05" />',
    ]
    if buildable_w > 0 and buildable_h > 0:
        parts.append(
            f'<rect x="{buildable_x}" y="{buildable_y}" width="{buildable_w}" height="{buildable_h}" '
            f'fill="none" stroke="#64748b" stroke-dasharray="0.15,0.1" stroke-width="0.03" />'
        )
    parts.append("</svg>")
    return "".join(parts)


def build_plan_pdf_base64(plan: dict[str, Any], plot_w: float, plot_h: float) -> Optional[str]:
    try:
        rooms = plan.get("rooms") or []
        meta = plan.get("meta") or {}
        production = plan.get("production") or {}
        title_block = production.get("title_block") or {}

        page_size = landscape(A4) if plot_w >= plot_h else A4
        page_w, page_h = page_size
        margin = 40.0
        header_h = 46.0
        footer_h = 46.0

        avail_w = page_w - margin * 2
        avail_h = page_h - margin * 2 - header_h - footer_h
        scale = max(1.0, min(avail_w / plot_w, avail_h / plot_h))

        origin_x = margin
        origin_y = margin + footer_h

        def to_pdf(x_m: float, y_m: float) -> tuple[float, float]:
            return origin_x + x_m * scale, origin_y + (plot_h - y_m) * scale

        buf = io.BytesIO()
        c = pdf_canvas.Canvas(buf, pagesize=page_size)

        c.setFont("Helvetica-Bold", 14)
        c.drawString(margin, page_h - margin, str(meta.get("title") or "Floor Plan"))
        c.setFont("Helvetica", 9)
        scale_label = production.get("scale")
        if scale_label:
            c.drawRightString(page_w - margin, page_h - margin, f"Scale: {scale_label}")

        px, py = to_pdf(0, plot_h)
        c.setStrokeColorRGB(0.55, 0.6, 0.7)
        c.setLineWidth(1.2)
        c.rect(px, py, plot_w * scale, plot_h * scale, stroke=1, fill=0)

        for room in rooms:
            try:
                rx = float(room.get("x", 0))
                ry = float(room.get("y", 0))
                rw = float(room.get("w", 0))
                rh = float(room.get("h", 0))
            except (TypeError, ValueError):
                continue
            if rw <= 0 or rh <= 0:
                continue

            name = str(room.get("name") or "Room")
            r, g, b = hex_to_rgb01(room_color(name))
            x0, y0 = to_pdf(rx, ry + rh)
            box_w, box_h = rw * scale, rh * scale

            c.setFillColorRGB(r, g, b)
            c.setFillAlpha(0.18)
            c.setStrokeColorRGB(r, g, b)
            c.setStrokeAlpha(0.9)
            c.setLineWidth(1)
            c.rect(x0, y0, box_w, box_h, stroke=1, fill=1)

            c.setFillAlpha(1)
            c.setStrokeAlpha(1)
            c.setFillColorRGB(0.15, 0.18, 0.25)
            cx, cy = x0 + box_w / 2, y0 + box_h / 2
            c.setFont("Helvetica-Bold", 8)
            c.drawCentredString(cx, cy + 3, name)
            c.setFont("Helvetica", 7)
            c.drawCentredString(cx, cy - 8, f"{rw:.2f} x {rh:.2f} m")

        footer_lines = [
            value
            for value in (
                f"Client: {title_block.get('client')}" if title_block.get("client") else None,
                f"Site: {title_block.get('site')}" if title_block.get("site") else None,
                f"Sheet: {title_block.get('sheet')}" if title_block.get("sheet") else None,
            )
            if value
        ]
        c.setFillColorRGB(0.4, 0.4, 0.4)
        c.setFont("Helvetica", 8)
        for i, line in enumerate(footer_lines):
            c.drawString(margin, margin - 4 + (len(footer_lines) - 1 - i) * 11, line)

        c.showPage()
        c.save()
        return base64.b64encode(buf.getvalue()).decode("ascii")
    except Exception:
        # PDF export is a bonus; never let it break SVG rendering.
        return None


class PlanRenderRequest(BaseModel):
    plan: dict[str, Any]


class PlanRenderResponse(BaseModel):
    svg: str
    pdf_base64: Optional[str] = None


@app.post("/api/plans/render", response_model=PlanRenderResponse)
def render_plan(payload: PlanRenderRequest) -> PlanRenderResponse:
    plan = payload.plan or {}
    plot = plan.get("plot") or {}

    try:
        plot_w = float(plot.get("w"))
        plot_h = float(plot.get("h"))
    except (TypeError, ValueError):
        raise HTTPException(status_code=400, detail="plan.plot.w and plan.plot.h are required numbers.")

    if plot_w <= 0 or plot_h <= 0:
        raise HTTPException(status_code=400, detail="plan.plot.w and plan.plot.h must be positive.")

    rooms = plan.get("rooms")
    if rooms is not None and not isinstance(rooms, list):
        raise HTTPException(status_code=400, detail="plan.rooms must be a list.")

    svg = build_plan_svg(plan, plot_w, plot_h)
    pdf_base64 = build_plan_pdf_base64(plan, plot_w, plot_h)

    plan_id = secrets.token_urlsafe(16)
    with engine.begin() as conn:
        conn.execute(
            text(
                "INSERT INTO plans (id, plan_json, svg, pdf_base64, created_at) "
                "VALUES (:id, :plan_json, :svg, :pdf_base64, :created_at)"
            ),
            {
                "id": plan_id,
                "plan_json": json.dumps(plan),
                "svg": svg,
                "pdf_base64": pdf_base64,
                "created_at": datetime.utcnow().isoformat() + "Z",
            },
        )

    return PlanRenderResponse(svg=svg, pdf_base64=pdf_base64)


# ---------------------------------------------------------------------------
# Real estate brochure export (Engineer Drawing + Buyer Plan + 3D view, all
# rasterized client-side and bundled here into one downloadable PDF).
# ---------------------------------------------------------------------------

MAX_BROCHURE_IMAGE_BYTES = 8 * 1024 * 1024


class BrochureRequest(BaseModel):
    engineer_view_png: str
    buyer_view_png: str
    brochure_view_png: str
    title: Optional[str] = None


class BrochureResponse(BaseModel):
    pdf_base64: str


def _decode_brochure_image(image_b64: str, field_name: str) -> ImageReader:
    image_b64 = (image_b64 or "").split(",")[-1].strip()
    try:
        decoded = base64.b64decode(image_b64, validate=True)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"{field_name} is not valid base64 image data.") from exc
    if not decoded or len(decoded) > MAX_BROCHURE_IMAGE_BYTES:
        raise HTTPException(status_code=400, detail=f"{field_name} is empty or too large.")
    try:
        reader = ImageReader(io.BytesIO(decoded))
        reader.getSize()
    except Exception as exc:
        raise HTTPException(status_code=400, detail=f"{field_name} could not be decoded as an image.") from exc
    return reader


def _clean_brochure_title(raw_title: str) -> str:
    stripped = "".join(ch for ch in str(raw_title) if ch not in "<>" and (ch == " " or ch.isprintable()))
    return stripped.strip()[:80]


def _draw_brochure_page(c: pdf_canvas.Canvas, page_size: tuple[float, float], image: ImageReader, caption: str) -> None:
    page_w, page_h = page_size
    margin = 40.0
    header_h = 30.0

    img_w, img_h = image.getSize()
    avail_w = page_w - margin * 2
    avail_h = page_h - margin * 2 - header_h
    fit_scale = min(avail_w / img_w, avail_h / img_h)
    draw_w, draw_h = img_w * fit_scale, img_h * fit_scale
    x = margin + (avail_w - draw_w) / 2
    y = margin + (avail_h - draw_h) / 2

    c.setFont("Helvetica-Bold", 13)
    c.drawString(margin, page_h - margin, caption)
    c.drawImage(image, x, y, width=draw_w, height=draw_h, preserveAspectRatio=True, anchor="c")
    c.setStrokeColorRGB(0.55, 0.6, 0.7)
    c.setLineWidth(1)
    c.rect(x, y, draw_w, draw_h, stroke=1, fill=0)


@app.post("/api/realestate/brochure", response_model=BrochureResponse)
def realestate_brochure(payload: BrochureRequest) -> BrochureResponse:
    engineer_image = _decode_brochure_image(payload.engineer_view_png, "engineer_view_png")
    buyer_image = _decode_brochure_image(payload.buyer_view_png, "buyer_view_png")
    brochure_image = _decode_brochure_image(payload.brochure_view_png, "brochure_view_png")

    title = _clean_brochure_title(payload.title or "Still In Queue · Layout Brochure")
    page_size = landscape(A4)

    try:
        buf = io.BytesIO()
        c = pdf_canvas.Canvas(buf, pagesize=page_size)

        _draw_brochure_page(c, page_size, engineer_image, f"{title} — Engineer Drawing")
        c.showPage()

        _draw_brochure_page(c, page_size, buyer_image, f"{title} — Buyer Plan")
        c.showPage()

        _draw_brochure_page(c, page_size, brochure_image, f"{title} — 3D View")
        c.showPage()

        c.save()
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Failed to build brochure PDF.") from exc

    return BrochureResponse(pdf_base64=base64.b64encode(buf.getvalue()).decode("ascii"))
