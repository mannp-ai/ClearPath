# ClearPath Setup Guide

## Prerequisites

- Node.js and npm
- Python and dependencies from `backend/requirements.txt` (the financial parity Jest test invokes Python)
- A reachable MongoDB instance
- SMTP credentials for account verification and password reset flows

Install the Python reference dependencies from the repository root:

```powershell
python -m pip install -r backend\requirements.txt
```

## Configure and run the Express API

Copy `backend/.env.example` to `backend/.env`, then set:

- `MONGODB_URI`
- `JWT_ACCESS_SECRET` (at least 32 characters)
- `CORS_ORIGINS` and `FRONTEND_URL` to the frontend origin
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, and `EMAIL_FROM`

Run:

```powershell
npm --prefix backend install
npm --prefix backend run build
npm --prefix backend run dev
```

The API listens on `http://localhost:4000`; check `http://localhost:4000/api/health`.
The server connects to MongoDB before listening.

## Run the Next.js frontend

```powershell
npm --prefix frontend install
npm --prefix frontend run dev
```

The app listens on `http://localhost:3000`. Optionally set `NEXT_PUBLIC_API_URL` to the API origin; the default is `http://localhost:4000`.

## Validation

See the commands in [README.md](./README.md). A passing local build does not verify MongoDB persistence or SMTP delivery; those require live, non-production test services.
