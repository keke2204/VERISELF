from __future__ import annotations

import hashlib
import io
import math
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import numpy as np
from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from PIL import Image, ImageFilter, ImageStat
from sqlalchemy import DateTime, Float, Integer, String, create_engine
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column, sessionmaker

BASE_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = BASE_DIR / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)
DATABASE_URL = os.getenv("VERISELF_DATABASE_URL", f"sqlite:///{DATA_DIR / 'veriself.db'}")
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)

class Base(DeclarativeBase):
    pass

class MediaRecord(Base):
    __tablename__ = "media"
    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    filename: Mapped[str] = mapped_column(String(255))
    sha256: Mapped[str] = mapped_column(String(64), index=True)
    phash: Mapped[str] = mapped_column(String(16))
    width: Mapped[int] = mapped_column(Integer)
    height: Mapped[int] = mapped_column(Integer)
    forensic_risk: Mapped[float] = mapped_column(Float)
    forensic_level: Mapped[str] = mapped_column(String(32))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=lambda: datetime.now(timezone.utc))

Base.metadata.create_all(engine)

app = FastAPI(
    title="VeriSelf API",
    description="Digital identity defense API using reproducible image verification primitives.",
    version="1.0.0",
)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

def sha256_bytes(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()

def load_image(data: bytes) -> Image.Image:
    if not data:
        raise HTTPException(status_code=400, detail="Empty image file.")
    try:
        image = Image.open(io.BytesIO(data))
        image.load()
        return image.convert("RGB")
    except Exception as exc:
        raise HTTPException(status_code=400, detail="The uploaded file is not a valid readable image.") from exc

def phash(data: bytes) -> str:
    image = load_image(data).resize((32, 32), Image.Resampling.LANCZOS)
    gray = np.asarray(image.convert("L"), dtype=np.float64)
    n = 32
    dct = np.zeros((8, 8), dtype=np.float64)
    x = np.arange(n)
    for u in range(8):
        for v in range(8):
            cu = 1 / math.sqrt(2) if u == 0 else 1.0
            cv = 1 / math.sqrt(2) if v == 0 else 1.0
            basis_x = np.cos((2 * x + 1) * u * math.pi / (2 * n))
            basis_y = np.cos((2 * x + 1) * v * math.pi / (2 * n))
            dct[u, v] = 0.25 * cu * cv * np.sum(gray * basis_x[:, None] * basis_y[None, :])
    block = dct[:8, :8]
    median = float(np.median(block[1:, :]))
    bits = (block > median).astype(np.uint8).flatten()
    value = 0
    for bit in bits:
        value = (value << 1) | int(bit)
    return f"{value:016x}"

def hamming_distance(a: str, b: str) -> int:
    if len(a) != len(b):
        raise ValueError("Hash lengths differ")
    return sum((int(x, 16) ^ int(y, 16)).bit_count() for x, y in zip(a, b))

def forensic_metrics(image: Image.Image) -> tuple[float, str, dict[str, float]]:
    gray = np.asarray(image.convert("L"), dtype=np.float32)
    edges = np.asarray(Image.fromarray(np.uint8(np.clip(gray, 0, 255))).filter(ImageFilter.FIND_EDGES), dtype=np.float32)
    variance = float(edges.var())
    arr = np.asarray(image, dtype=np.float32)
    means = arr.reshape(-1, 3).mean(axis=0)
    drift = float(np.max(means) - np.min(means))
    texture = float(np.mean(np.abs(np.diff(gray, axis=1))) + np.mean(np.abs(np.diff(gray, axis=0))))
    risk = min(100.0, max(0.0, 100.0 - variance * 0.12 + drift * 0.35 - texture * 0.08))
    level = "LOW" if risk < 35 else "MODERATE" if risk < 70 else "HIGH"
    return round(risk, 2), level, {"edge_variance": round(variance, 3), "channel_drift": round(drift, 3), "texture_signal": round(texture, 3)}

async def read_upload(upload: UploadFile) -> bytes:
    data = await upload.read()
    if len(data) > 12 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="Image is larger than the 12 MB limit.")
    return data

@app.get("/")
def root() -> dict[str, str]:
    return {"service": "veriself-backend", "status": "ok", "version": app.version}

@app.get("/health")
@app.get("/api/health")
@app.get("/api/v1/health")
def health() -> dict[str, str]:
    return {"service": "veriself-backend", "status": "healthy", "database": "sqlite/sqlalchemy"}

@app.get("/api/v1/stats")
def stats() -> dict[str, Any]:
    with SessionLocal() as db:
        count = db.query(MediaRecord).count()
    return {"media_records": count, "storage": "local SQLite", "biometric": "not performed by backend"}

@app.post("/api/v1/media/register")
async def register_media(file: UploadFile = File(...)) -> dict[str, Any]:
    data = await read_upload(file)
    image = load_image(data)
    risk, level, metrics = forensic_metrics(image)
    record = MediaRecord(
        filename=file.filename or "upload",
        sha256=sha256_bytes(data),
        phash=phash(data),
        width=image.width,
        height=image.height,
        forensic_risk=risk,
        forensic_level=level,
    )
    with SessionLocal() as db:
        db.add(record)
        db.commit()
        db.refresh(record)
        return {
            "id": record.id,
            "filename": record.filename,
            "sha256": record.sha256,
            "phash": record.phash,
            "dimensions": {"width": record.width, "height": record.height},
            "forensics": {"risk": risk, "level": level, "metrics": metrics, "note": "Heuristic indicators, not a deepfake verdict."},
        }

@app.post("/api/v1/media/compare")
async def compare_media(source_id: int = Form(...), candidate: UploadFile = File(...)) -> dict[str, Any]:
    candidate_data = await read_upload(candidate)
    load_image(candidate_data)
    with SessionLocal() as db:
        source = db.get(MediaRecord, source_id)
    if source is None:
        raise HTTPException(status_code=404, detail="Source media record not found.")
    candidate_hash = phash(candidate_data)
    distance = hamming_distance(source.phash, candidate_hash)
    similarity = round(max(0.0, 1.0 - distance / 64.0) * 100, 2)
    return {
        "source_id": source.id,
        "candidate_filename": candidate.filename,
        "source_phash": source.phash,
        "candidate_phash": candidate_hash,
        "hamming_distance": distance,
        "similarity_percent": similarity,
        "result": "CLOSE PERCEPTUAL MATCH" if distance <= 8 else "DISTINCT PERCEPTUAL HASH",
        "note": "Perceptual similarity does not establish identity, authorship, or infringement.",
    }

@app.get("/api/v1/media/{media_id}/evidence")
def evidence(media_id: int) -> JSONResponse:
    with SessionLocal() as db:
        record = db.get(MediaRecord, media_id)
    if record is None:
        raise HTTPException(status_code=404, detail="Media record not found.")
    return JSONResponse({
        "case": "VeriSelf evidence package",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "media": {
            "id": record.id, "filename": record.filename, "sha256": record.sha256,
            "phash": record.phash, "dimensions": {"width": record.width, "height": record.height},
        },
        "forensics": {"risk": record.forensic_risk, "level": record.forensic_level},
        "limitations": [
            "Perceptual hashes indicate visual similarity, not identity.",
            "Forensic metrics are heuristic indicators, not a validated deepfake classifier.",
        ],
    })

@app.post("/api/v1/enforce/dmca")
def draft_notice(url: str = Form(...), identity_owner: str = Form(...)) -> dict[str, Any]:
    clean_url, owner = url.strip(), identity_owner.strip()
    if not clean_url or not owner:
        raise HTTPException(status_code=400, detail="Both URL and identity owner are required.")
    notice = (
        f"Hello,\n\nI am {owner}, the identity owner associated with the media at {clean_url}. "
        "Please review the referenced material and the attached evidence before taking any action. "
        "This is a review request, not an automated legal filing.\n"
    )
    return {"status": "DRAFT_READY", "url": clean_url, "identity_owner": owner, "notice": notice, "dispatched": False}
