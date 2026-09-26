# VeriSelf

## Biometric defense and forensic identity protection

VeriSelf is a local-first image protection and analysis tool. You upload an image, inspect its identity and manipulation signals, generate a cloaked copy, create a provenance-marked copy, compare perceptual hashes, and download the generated outputs.

The project contains two services:

- **Next.js web application** — the browser dashboard at `http://localhost:3000`.
- **FastAPI forensic engine** — the image-processing API at `http://127.0.0.1:8000`.

> **Important:** VeriSelf is a research/demo project. Its analysis scores and generated outputs should not be treated as proof of identity, a guarantee against scraping or model training, or legal advice. Review generated evidence with a qualified professional before taking legal action.

## What VeriSelf does

### Image registration and protection

When an image is registered, the backend creates a job and returns:

- Original image metadata and a preview.
- Perceptual hashes: pHash, dHash, aHash, and wHash.
- A 512-dimensional vector preview.
- A face-region and landmark preview used by the current demo pipeline.
- A manipulation-risk score and risk level.
- A cloaked image variant.
- A watermarked/provenance image variant.

The original, cloaked, and watermarked PNG files are saved in `apps/backend/cache/<job_id>/` and can be downloaded through the API.

### Comparison and matching

The dashboard includes an original-versus-protected comparison slider. The API can also compare two perceptual hash strings and return a Hamming-distance-based similarity result.

### Forensic indicators

The backend calculates image-signal indicators such as Laplacian variance and exposes them as part of the registration response. These indicators are useful for experimentation and review, but they are not a definitive deepfake classifier.

## Requirements

Install the following before running VeriSelf:

- Python 3.11 or newer
- Node.js 18 or newer
- npm
- Git

The backend dependencies are listed in `apps/backend/requirements.txt`. The frontend dependencies are listed in `apps/web/package.json`.

## Quick start

### Windows

Double-click:

```text
start-veriself.bat
```

The launcher starts the backend and frontend and opens the web dashboard at:

```text
http://localhost:3000
```

### macOS, Linux, or manual startup

Open two terminals from the repository root.

#### Terminal 1: start the FastAPI backend

```bash
cd apps/backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
python -m uvicorn main:app --host 127.0.0.1 --port 8000
```

Windows PowerShell activation:

```powershell
cd apps/backend
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
python -m uvicorn main:app --host 127.0.0.1 --port 8000
```

The FastAPI documentation is available at:

```text
http://127.0.0.1:8000/docs
```

#### Terminal 2: start the Next.js web application

```bash
cd apps/web
npm install
npm run dev
```

Open:

```text
http://localhost:3000
```

For a production-style frontend run:

```bash
npm run build
npm run start -- -p 3000 -H 0.0.0.0
```

## Using the image protection tool

1. Start both services using the instructions above.
2. Open `http://localhost:3000`.
3. Open the **Shield** or image-protection area of the dashboard.
4. Choose an image in PNG, JPEG, or WebP format.
5. Upload or register the image.
6. Review the image dimensions, file size, hashes, face-region preview, vector preview, and manipulation-risk indicators.
7. Use the comparison slider to inspect the original and cloaked versions.
8. Download the **cloaked** output when you want the protected image variant.
9. Download the **watermarked** output when you want the provenance-marked variant.
10. Keep the returned job ID with the files so the outputs can be traced back to one processing run.

A good first test is one of the image files in the project cache:

```text
apps/backend/cache/0e388d7e-f7e9-4c68-889d-395e1163b7f0/original.png
```

## API usage

### Check service health

```bash
curl http://127.0.0.1:8000/health
```

Expected response shape:

```json
{
  "status": "healthy",
  "version": "2.4.0"
}
```

### Register and protect an image

```bash
curl -X POST \
  -F "file=@/absolute/path/to/photo.jpg" \
  http://127.0.0.1:8000/api/v1/media/register
```

The response includes a `job_id`, four hashes, analysis values, and base64 previews. The generated full-resolution files are stored at:

```text
apps/backend/cache/<job_id>/original.png
apps/backend/cache/<job_id>/cloaked.png
apps/backend/cache/<job_id>/watermarked.png
```

### Download generated files

Replace `<job_id>` with the ID returned by the registration request.

```bash
curl -OJ http://127.0.0.1:8000/api/v1/media/download/<job_id>/original
curl -OJ http://127.0.0.1:8000/api/v1/media/download/<job_id>/cloaked
curl -OJ http://127.0.0.1:8000/api/v1/media/download/<job_id>/watermarked
```

### Compare two perceptual hashes

```bash
curl -X POST \
  http://127.0.0.1:8000/api/v1/media/compare \
  -H "Content-Type: application/json" \
  -d '{"hash1":"ffff0000ffff0000","hash2":"ffff0000ffff00ff"}'
```

The comparison endpoint returns the Hamming distance, a similarity percentage, and a match verdict.

### Generate an enforcement draft

The project exposes a DMCA/enforcement drafting endpoint for demonstration purposes. It creates a draft from a match ID, target URL, domain, and owner name.

```bash
curl -X POST \
  http://127.0.0.1:8000/api/v1/enforce/dmca \
  -H "Content-Type: application/json" \
  -d '{
    "match_id":"example-match-id",
    "target_url":"https://example.com/image.jpg",
    "domain":"example.com",
    "owner_name":"Your Name"
  }'
```

This endpoint does not send a legal notice automatically. Review any generated draft carefully and obtain appropriate legal advice before using it.

## API endpoint reference

| Method | Endpoint | Purpose |
|---|---|---|
| `GET` | `/health` | Check backend health |
| `GET` | `/api/v1/health` | Versioned health check |
| `GET` | `/api/v1/stats` | Return demo statistics |
| `POST` | `/api/v1/media/register` | Analyze and protect an uploaded image |
| `POST` | `/api/v1/media/compare` | Compare two perceptual hashes |
| `GET` | `/api/v1/media/download/{job_id}/{mode}` | Download an original, cloaked, or watermarked file |
| `POST` | `/api/v1/enforce/dmca` | Generate an enforcement draft |

The interactive Swagger documentation is available at `http://127.0.0.1:8000/docs` while the backend is running.

## GitHub Pages showcase

The repository also includes a static, human-designed showcase in:

```text
github-pages/
```

It includes the responsive landing page, the original/protected comparison slider, and project asset previews. The static showcase does not run the FastAPI backend.

To publish it with GitHub Pages using the simplest branch method:

1. Create a `docs/` folder at the repository root.
2. Copy the contents of `github-pages/` into `docs/`.
3. Confirm that `docs/index.html` exists directly inside the folder.
4. Open **Repository → Settings → Pages**.
5. Select **Deploy from a branch**.
6. Select the `main` branch and `/docs` folder.
7. Save and wait for deployment.

The current repository showcase link is:

```text
https://keke2204.github.io/VERISELF/
```

## Project structure

```text
VERISELF/
├── apps/
│   ├── backend/
│   │   ├── main.py              # FastAPI app and image-processing pipeline
│   │   ├── pipeline.py          # Supporting processing functions
│   │   ├── detector.py          # Detection, matching, and enforcement helpers
│   │   ├── requirements.txt     # Python dependencies
│   │   └── cache/               # Generated job outputs
│   └── web/
│       ├── app/
│       │   ├── page.tsx         # Main dashboard
│       │   ├── layout.tsx       # Root layout
│       │   └── api/backend/     # Frontend-to-backend proxy routes
│       ├── components/          # Reusable UI components
│       └── package.json         # Frontend dependencies and scripts
├── github-pages/                # Static GitHub Pages showcase
├── start-veriself.bat          # Windows launcher
└── README.md                    # This documentation
```

## Troubleshooting

### The frontend cannot reach the backend

Confirm that the FastAPI service is running on port `8000`, then open:

```text
http://127.0.0.1:8000/health
```

If the health endpoint fails, restart the backend from `apps/backend`.

### Python dependency installation fails

Use Python 3.11 or newer and create a fresh virtual environment. On Linux, some scientific packages may require build tools supplied by your operating system.

### The GitHub Pages site shows a 404

GitHub Pages branch publishing only recognizes the repository root or `/docs`. Confirm that the static entry point is exactly:

```text
docs/index.html
```

### Generated files are missing

Check the backend cache directory for the returned job ID:

```text
apps/backend/cache/<job_id>/
```

A registration request must complete successfully before the downloadable files are created.

## License and responsible use

Add the license that applies to your project before public distribution. Use VeriSelf only with images and data you are authorized to process. Do not use it to impersonate people, evade legitimate safety systems, or send unreviewed legal claims.

## Repository

[github.com/keke2204/VERISELF](https://github.com/keke2204/VERISELF)
