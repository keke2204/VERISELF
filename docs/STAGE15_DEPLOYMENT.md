# VeriSelf Stage 15 — Free Deployment Record

Date: 2026-09-29

Deployment architecture:

- Frontend: GitHub Pages
- Backend: Render Free Web Service
- Source repository: keke2204/VERISELF
- Database: SQLite
- Backend runtime: FastAPI + Uvicorn
- No Docker

Live endpoints:

- Frontend: https://keke2204.github.io/VERISELF/
- Backend: https://veriself.onrender.com
- Swagger: https://veriself.onrender.com/docs
- Health: https://veriself.onrender.com/api/v1/health

Deployment configuration:

- Render root directory: apps/backend
- Render build command: pip install -r requirements.txt
- Render start command: uvicorn app.main:app --host 0.0.0.0 --port $PORT
- Render health check: /api/v1/health
- GitHub Pages serves the repository root static frontend.

Live validation performed on 2026-09-29:

1. GitHub Pages returned the VeriSelf web application successfully.
2. Render root endpoint returned the VeriSelf backend service response.
3. Render Swagger documentation loaded successfully.
4. Render /api/v1/health initially returned HTTP 503 while the free service was waking, then returned:
   {"service":"veriself-backend","status":"healthy","database":"sqlite/sqlalchemy"}
5. The repository contains an automated Playwright live-integration workflow that exercises GitHub Pages -> Render source registration and candidate comparison.
6. The frontend API bridge retries backend requests and allows up to 60 seconds for Render wake-up.

Free-tier limitations:

- Render free services can sleep after inactivity and therefore are not guaranteed to be always-on.
- SQLite is local service storage and should not be treated as durable production storage.
- The deployed backend is a public prototype and does not implement authentication or authorization.
- Do not upload sensitive real biometric datasets to this public demo.

Stage status:

DEPLOYED — LIVE VALIDATION PASSED

Final production-security status:

NOT A HARDENED PRODUCTION SERVICE. This deployment is suitable for a public technical prototype/demo and must not be represented as a secure multi-tenant biometric service.
