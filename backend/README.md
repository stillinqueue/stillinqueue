# Still In Queue backend

This lightweight FastAPI service exposes an endpoint to trigger the InventoryPulse container startup.

It also handles auth emails (verification and password reset) via SMTP.

## Run locally

```bash
pip install -r requirements.txt
uvicorn app:app --host 0.0.0.0 --port 8000
```

## Recommended hosted setup

Use this split:

1. Web service: Render
2. Database: Neon Postgres free tier
3. SMTP: Brevo

Why this split:

1. The backend is already a single FastAPI container, so Render can run it with minimal changes.
2. Neon gives you a standard PostgreSQL connection string, which works directly with SQLAlchemy and `psycopg2`.
3. Brevo is already a better fit than self-hosting mail while the product is early.

The repo now includes a Render blueprint at [render.yaml](../render.yaml).

### Deploy on Render with Neon Postgres

1. Create a free Neon project and database.
2. Copy the pooled PostgreSQL connection string from Neon.
3. In Render, create a new Blueprint instance from this repository.
4. Render will read [render.yaml](../render.yaml) and create the `stillinqueue-backend` web service.
5. Set `DATABASE_URL` in Render to the Neon connection string.
6. Set the Brevo SMTP variables in Render.
7. Redeploy the service.

Expected runtime env vars for production:

```bash
DATABASE_URL="postgresql+psycopg2://USER:PASSWORD@HOST/DBNAME?sslmode=require"
CORS_ORIGINS="https://stillinqueue.com,https://www.stillinqueue.com"
SMTP_HOST="smtp-relay.brevo.com"
SMTP_PORT="587"
SMTP_USER="your-brevo-smtp-login"
SMTP_PASS="your-brevo-smtp-key"
SMTP_FROM="no-reply@your-verified-domain.com"
SMTP_USE_TLS="true"
SMTP_USE_SSL="false"
AUTH_ALLOW_CODE_FALLBACK="false"
ADMIN_EMAILS="you@example.com"
ADMIN_API_KEY="set-a-long-random-secret"
```

Notes:

1. Neon usually requires TLS. Keep `sslmode=require` in the connection string if Neon includes it.
2. `CORS_ORIGINS` should list your real frontend origins, comma-separated.
3. The Docker container now listens on Render's assigned `PORT` automatically.
4. The `/api/inventorypulse/start` endpoint is not suitable for Render, because Render web services do not provide sibling repo access or host-level Docker control.

## Recommended Open-Source Email Stack

Recommended choice: Postal (self-hosted transactional mail server, open source).

Why this choice:
1. Built for application email delivery (verification, reset, notifications).
2. Reliable queue/retry behavior and bounce tracking.
3. Works with any recipient domain when DNS and server reputation are configured correctly.

Important reality:
1. No SMTP stack can guarantee inbox delivery to every domain.
2. Delivery depends on DNS (SPF, DKIM, DMARC, PTR), IP reputation, and message quality.

### Backend SMTP env vars

Set these before starting the API:

```bash
export SMTP_HOST="postal.yourdomain.com"
export SMTP_PORT="587"
export SMTP_USER="your-postal-smtp-username"
export SMTP_PASS="your-postal-smtp-password"
export SMTP_FROM="no-reply@yourdomain.com"
export SMTP_USE_TLS="true"
export SMTP_USE_SSL="false"
uvicorn app:app --host 0.0.0.0 --port 8000
```

For Brevo SMTP specifically, use:

```bash
export SMTP_HOST="smtp-relay.brevo.com"
export SMTP_PORT="587"
export SMTP_USER="your-brevo-smtp-login"
export SMTP_PASS="your-brevo-smtp-key"
export SMTP_FROM="no-reply@your-verified-domain.com"
export SMTP_USE_TLS="true"
export SMTP_USE_SSL="false"
```

Optional admin protection env var:

```bash
export ADMIN_API_KEY="set-a-strong-random-key"
export ADMIN_EMAILS="admin1@example.com,admin2@example.com"
export AUTH_ALLOW_CODE_FALLBACK="false"
```

Behavior:
1. `ADMIN_EMAILS`: accounts created with these emails are marked as admin.
2. `AUTH_ALLOW_CODE_FALLBACK=false`: if SMTP fails, signup/reset returns an error instead of exposing OTP on UI/API.
3. `ADMIN_API_KEY`: optional emergency override header for admin endpoints.

### Required DNS for good deliverability

Configure these for your sending domain:
1. SPF TXT record
2. DKIM TXT record(s)
3. DMARC TXT record
4. MX record (if receiving mail on that domain)
5. PTR/rDNS for sending IP

Without these, many providers will spam-folder or reject messages.

## Trigger startup

```bash
curl -X POST http://127.0.0.1:8000/api/inventorypulse/start
```

## Inspect users created from website

Count:

```bash
curl http://127.0.0.1:8000/api/auth/users/count
```

List users:

```bash
curl http://127.0.0.1:8000/api/auth/users
```

Single user details:

```bash
curl http://127.0.0.1:8000/api/auth/users/<email>
```

If `ADMIN_API_KEY` is set, include:

```bash
-H "X-Admin-Key: your-key"
```

Admin users can also access these endpoints with normal login bearer token.
