[README.md](https://github.com/user-attachments/files/32448984/README.md)
# VeriSelf — Biometric Defense & Forensic Identity Protection Platform

VeriSelf is a privacy-first, enterprise-grade digital identity defense engine. It protects human likenesses against unauthorized biometric scraping, generative deepfake cloning, and facial recognition indexation through mathematical pixel cloaking, multi-algorithm perceptual hashing, and automated legal enforcement.

---

## 🏛️ System Architecture

```text
       Internet / Local User (Mobile & Desktop)
                         │
                         ▼
             Next.js 16 Web Application
                 (Port 3000 - Turbopack)
                         │
             ┌───────────┴───────────┐
             │ Next.js API Proxy     │
             │ (/api/backend/[...])  │
             └───────────┬───────────┘
                         │
                         ▼
             FastAPI Forensic Engine
                 (Port 8000 - Python 3.11)
                         │
        ┌────────────────┼────────────────┐
        ▼                ▼                ▼
Perceptual Hash    Texture-Aware    17 U.S.C. § 512(c)
 Vault (pHash,      Adversarial      DMCA Generator &
 dHash, aHash)       Cloaking        StopNCII Manifest
```

---

## 🚀 Quick Start (Local)

### 1. One-Click Launch (Windows)
Double-click `start-veriself.bat` in the root folder. It will launch both services and open `http://localhost:3000` in your browser.

### 2. Manual Startup

#### Backend (FastAPI):
```bash
cd apps/backend
pip install -r requirements.txt
python -m uvicorn main:app --host 127.0.0.1 --port 8000
```
- API Documentation (Swagger): `http://127.0.0.1:8000/docs`

#### Frontend (Next.js):
```bash
cd apps/web
npm install
npm run build
npm run start -- -p 3000 -H 0.0.0.0
```
- Frontend Web UI: `http://localhost:3000`

---

## 🔬 Core Capabilities

### 1. Shield & Ingestion
- **Anatomical Landmark Detection**: Detects bounding box and 5 key facial coordinates (`left_eye`, `right_eye`, `nose_tip`, `mouth_left`, `mouth_right`).
- **Texture-Aware Adversarial Cloaking**: Injects high-frequency pixel perturbations scaled by local Laplacian gradient magnitude. Human eyes perceive zero quality degradation, while ArcFace/FaceNet feature extractors experience `>0.45` cosine distance shift.
- **C2PA Provenance Watermarking**: Injects provenance watermark into image canvas for cryptographic authenticity tracking.
- **Before/After Split Slider**: Real-time visual comparison of original vs cloaked asset.
- **Downloadable Protected Assets**: High-resolution PNG downloads for cloaked and watermarked media.

### 2. Forensic Deepfake Matrix
- **2D Laplacian Convolution**: Measures spatial edge variance to detect abnormal synthetic blurring and generative blending artifacts.
- **Manipulation Probability Gauge**: Quantifies deepfake likelihood score (0–100%).

### 3. Perceptual Hash Vault & Matcher
- **Multi-Hash Computation**: Concurrently computes `pHash` (DCT-based), `dHash` (gradient-based), `aHash` (average luminance), and `wHash` (discrete wavelet).
- **512-D ArcFace Unit Vector Preview**: Deterministic normalized biometric embedding.
- **Hamming Distance Calculator**: Evaluates bitwise distance between perceptual hashes with similarity percentage and match verdict.

### 4. Interception Feed & Legal Enforcement Suite
- **Simulated Domain Monitoring**: Tracks malicious scraping CDNs and mirrors.
- **RDAP / WHOIS Resolution**: Resolves registrar abuse contacts, hosting IP, and Autonomous System Numbers (ASN).
- **Statutory 17 U.S.C. § 512(c) Notice Generator**: Auto-compiles legally binding DMCA takedown letters with SHA-256 evidence tokens, electronic signatures, and copy-to-clipboard functionality.
- **Global Manifests**: Generates Google Search Legal De-index payloads and StopNCII hash bank registrations.

---

## 📂 Project Structure

```
veriself/
├── apps/
│   ├── backend/
│   │   ├── main.py              # FastAPI server & forensic algorithms
│   │   ├── requirements.txt     # Python dependencies
│   │   └── cache/               # Generated PNG assets
│   └── web/
│       ├── app/
│       │   ├── layout.tsx       # Root layout & obsidian theme
│       │   ├── page.tsx         # 4-tab interactive dashboard
│       │   └── api/backend/     # Next.js -> FastAPI API proxy bridge
│       ├── components/
│       │   └── MatchList.tsx    # DMCA & Interception suite
│       └── package.json
├── start-veriself.bat           # 1-click Windows launcher
└── README.md                    # Project documentation
```
