# VeriSelf — GitHub Pages Showcase Webpage

This directory contains the complete, self-contained static showcase landing page for the **VeriSelf** Biometric Defense Platform.

It is designed to run 100% statically on **GitHub Pages** without any backend, server runtime, or database dependencies.

---

## 📁 Directory Contents

```
github-pages/
├── index.html           # Main semantic HTML5 showcase entry point
├── style.css            # Responsive dark/light obsidian theme
├── script.js            # Pure vanilla JavaScript (slider, hash calculator, theme toggle)
├── assets/
│   ├── logo.svg         # VeriSelf SVG crest brand mark
│   ├── architecture.svg # Full end-to-end pipeline SVG diagram
│   ├── original.png     # Web-optimized original sample asset
│   ├── cloaked.png      # Web-optimized adversarially cloaked asset
│   └── watermarked.png  # Web-optimized provenance watermarked asset
└── README.md            # This publishing guide
```

---

## ⚙️ Step 1: Customize Your GitHub Repository URL

Before pushing, open `github-pages/index.html` and replace:
```html
https://github.com/YOUR_USERNAME/YOUR_REPOSITORY
```
with your actual GitHub username and repository name (for example, `https://github.com/keert/veriself`).

---

## 🚀 Step 2: How to Publish on GitHub Pages

You have **two simple options** to publish this webpage to GitHub Pages:

### Option A: Publish from a `docs/` folder in your `main` branch (Recommended)
1. In your git repository, copy the contents of `github-pages/` into a folder named `docs/`:
   ```bash
   mkdir docs
   cp -r github-pages/* docs/
   git add docs/
   git commit -m "Add GitHub Pages documentation and showcase"
   git push origin main
   ```
2. Go to your repository on **GitHub.com**.
3. Click **Settings** (top tab) → **Pages** (in the left sidebar).
4. Under **Build and deployment** > **Branch**:
   - Select branch: `main`
   - Select folder: `/docs`
   - Click **Save**.
5. Within 1–2 minutes, GitHub will publish your site at:
   ```
   https://YOUR_USERNAME.github.io/YOUR_REPOSITORY/
   ```

---

### Option B: Publish via a dedicated `gh-pages` branch
1. Create and switch to a clean `gh-pages` orphan branch:
   ```bash
   git checkout --orphan gh-pages
   git rm -rf .
   cp -r ../path-to-veriself/github-pages/* .
   git add .
   git commit -m "Deploy VeriSelf static showcase to GitHub Pages"
   git push origin gh-pages
   ```
2. Go to **Settings** → **Pages** on GitHub.
3. Select branch: `gh-pages` and folder: `/ (root)`.
4. Click **Save**.

---

## 🔍 Validation Checklist

- [x] **Zero Localhost / Machine Dependencies**: All resources use relative paths (`./style.css`, `./script.js`, `./assets/...`).
- [x] **404 Prevention**: `index.html` is the root document.
- [x] **Interactive Client-side Tools**: The Before/After cloaking split slider and the 64-bit Hamming distance calculator run entirely in pure client-side JavaScript.
- [x] **Mobile Responsive**: Fully tested for screen sizes from 320px smartphones to 1440px+ desktop monitors.
- [x] **Theme Switcher**: Dark and Light mode toggle with automatic `localStorage` persistence.
