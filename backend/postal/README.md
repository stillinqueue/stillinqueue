# Postal Setup (Open Source SMTP)

This folder contains a baseline Postal stack for self-hosted transactional email.

## 1) Prepare environment

```bash
cd backend/postal
cp .env.example .env
# edit .env with real secrets and hostname
```

Use a hostname like `postal.yourdomain.com` and point DNS A/AAAA records to your server.

## 2) Start stack

```bash
docker compose --env-file .env up -d
```

## 3) Initialize Postal

Run initialization commands inside the Postal container (first-time setup):

```bash
docker exec -it postal postal initialize
```

Then create an admin user in Postal UI or CLI depending on your preferred flow.

## 4) DNS records required

For your sending domain, configure:
1. SPF
2. DKIM
3. DMARC
4. PTR/rDNS for sending IP

Without these, many recipients will reject or spam-folder mail.

## 5) Connect app backend to Postal SMTP

Set the backend environment variables where FastAPI runs:

```bash
export SMTP_HOST="postal.yourdomain.com"
export SMTP_PORT="587"
export SMTP_USER="postal-smtp-username"
export SMTP_PASS="postal-smtp-password"
```

Then restart the backend process.

## 6) Verify from auth endpoint behavior

When SMTP works, signup/reset should no longer require fallback debug codes.

---

Note: This compose file is a starter template. Postal production hardening still requires TLS, firewall rules, monitoring, and proper DNS reputation setup.
