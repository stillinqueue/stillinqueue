# Still In Queue backend

This lightweight FastAPI service exposes an endpoint to trigger the InventoryPulse container startup.

It also handles auth emails (verification and password reset) via SMTP.

## Run locally

```bash
pip install -r requirements.txt
uvicorn app:app --host 0.0.0.0 --port 8000
```

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
uvicorn app:app --host 0.0.0.0 --port 8000
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
