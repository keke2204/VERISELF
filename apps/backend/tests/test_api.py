from fastapi.testclient import TestClient
from PIL import Image
import io

from app.main import app

client = TestClient(app)


def image_bytes(color=(120, 80, 40), size=(64, 64)):
    buf = io.BytesIO()
    Image.new("RGB", size, color).save(buf, format="PNG")
    return buf.getvalue()


def test_health():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json()["status"] == "healthy"


def test_register_compare_and_evidence():
    source = image_bytes()
    response = client.post(
        "/api/v1/media/register",
        files={"file": ("source.png", source, "image/png")},
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data["sha256"]) == 64
    assert len(data["phash"]) == 16
    media_id = data["id"]

    compare = client.post(
        "/api/v1/media/compare",
        data={"source_id": str(media_id)},
        files={"candidate": ("candidate.png", source, "image/png")},
    )
    assert compare.status_code == 200
    assert compare.json()["hamming_distance"] == 0

    evidence = client.get(f"/api/v1/media/{media_id}/evidence")
    assert evidence.status_code == 200
    assert evidence.json()["media"]["id"] == media_id


def test_invalid_image_is_rejected():
    response = client.post(
        "/api/v1/media/register",
        files={"file": ("bad.txt", b"not an image", "text/plain")},
    )
    assert response.status_code == 400


def test_notice_is_draft_only():
    response = client.post(
        "/api/v1/enforce/dmca",
        data={"url": "https://example.com/image.jpg", "identity_owner": "Test Owner"},
    )
    assert response.status_code == 200
    assert response.json()["status"] == "DRAFT_READY"
    assert response.json()["dispatched"] is False
