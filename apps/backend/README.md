# VeriSelf Backend

Run locally from this directory:

python -m venv .venv
.venv\\Scripts\\activate
pip install -r requirements.txt
uvicorn app.main:app --reload

Endpoints:
- GET /api/health
- POST /api/v1/media/register
- POST /api/v1/media/compare
- GET /api/v1/media/{media_id}/evidence
- POST /api/v1/enforce/dmca

The backend uses SQLite + SQLAlchemy and real SHA-256/pHash calculations. Forensics are explicitly heuristic. It does not claim identity recognition, does not fabricate biometric confidence, and does not automatically send legal complaints.
