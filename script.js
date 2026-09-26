/**
 * VERISELF — Editorial Showcase Client Logic
 * Handcrafted Vanilla JavaScript • Zero External Dependencies
 */

document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initComparisonPlate();
  initHashComparator();
  initUploadDemo();
});

/* 1. Theme Management (Pure Monochrome Invert) */
function initTheme() {
  const root = document.documentElement;
  const themeToggle = document.getElementById('themeToggle');
  const savedTheme = localStorage.getItem('veriself-monograph-theme');
  const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;

  const applyTheme = (theme) => {
    const isLight = theme === 'light';
    root.classList.toggle('light', isLight);
    root.classList.toggle('dark', !isLight);
    root.style.colorScheme = isLight ? 'light' : 'dark';
    localStorage.setItem('veriself-monograph-theme', isLight ? 'light' : 'dark');
  };

  applyTheme(savedTheme === 'light' || (!savedTheme && !prefersDark) ? 'light' : 'dark');

  if (themeToggle) {
    themeToggle.addEventListener('click', (event) => {
      event.preventDefault();
      applyTheme(root.classList.contains('light') ? 'dark' : 'light');
    });
  }
}

/* 2. Before / After Comparison Plate (Editorial Specimen Slider) */
function initComparisonPlate() {
  const container = document.getElementById('comparisonSlider');
  const cloakedWrapper = document.getElementById('cloakedWrapper');
  const sliderHandle = document.getElementById('sliderHandle');

  if (!container || !cloakedWrapper || !sliderHandle) return;

  let isDragging = false;

  function updatePosition(clientX) {
    const rect = container.getBoundingClientRect();
    let x = clientX - rect.left;
    if (x < 0) x = 0;
    if (x > rect.width) x = rect.width;

    const percent = ((x / rect.width) * 100).toFixed(2);
    cloakedWrapper.style.width = percent + '%';
    sliderHandle.style.left = percent + '%';
  }

  container.addEventListener('mousedown', (e) => {
    isDragging = true;
    updatePosition(e.clientX);
  });

  window.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    updatePosition(e.clientX);
  });

  window.addEventListener('mouseup', () => {
    isDragging = false;
  });

  // Touch Support
  container.addEventListener('touchstart', (e) => {
    isDragging = true;
    if (e.touches && e.touches[0]) {
      updatePosition(e.touches[0].clientX);
    }
  }, { passive: true });

  window.addEventListener('touchmove', (e) => {
    if (!isDragging || !e.touches || !e.touches[0]) return;
    updatePosition(e.touches[0].clientX);
  }, { passive: true });

  window.addEventListener('touchend', () => {
    isDragging = false;
  });
}

/* 3. Forensic Perceptual Hash Comparator (Hamming Bit Distance) */
function initHashComparator() {
  const input1 = document.getElementById('hashInput1');
  const input2 = document.getElementById('hashInput2');

  if (input1 && input2) {
    input1.addEventListener('input', calculateHamming);
    input2.addEventListener('input', calculateHamming);
    calculateHamming();
  }
}

function calculateHamming() {
  const raw1 = (document.getElementById('hashInput1')?.value || '').trim().toLowerCase();
  const raw2 = (document.getElementById('hashInput2')?.value || '').trim().toLowerCase();

  const resDist = document.getElementById('resDistance');
  const resSim = document.getElementById('resSimilarity');
  const resVerdict = document.getElementById('resVerdict');

  if (!resDist || !resSim || !resVerdict) return;

  // Sanitize hex strings (64-bit perceptual hash = 16 hex characters)
  const clean1 = raw1.replace(/[^0-9a-f]/g, '').padEnd(16, '0').slice(0, 16);
  const clean2 = raw2.replace(/[^0-9a-f]/g, '').padEnd(16, '0').slice(0, 16);

  let bitDistance = 0;

  for (let i = 0; i < 16; i++) {
    const val1 = parseInt(clean1[i] || '0', 16);
    const val2 = parseInt(clean2[i] || '0', 16);
    let xor = val1 ^ val2;
    while (xor > 0) {
      bitDistance += (xor & 1);
      xor >>= 1;
    }
  }

  const similarity = Math.max(0, ((64 - bitDistance) / 64) * 100).toFixed(2);
  const isMatch = bitDistance <= 8;

  resDist.textContent = `${bitDistance} BITS / 64`;
  resSim.textContent = `${similarity}%`;

  if (isMatch) {
    resVerdict.textContent = `CLOSE PERCEPTUAL MATCH (≤ 8 BITS)`;
    resVerdict.className = 'verdict-tag font-mono status-match';
  } else {
    resVerdict.textContent = `DISTINCT ASSET (> 8 BITS)`;
    resVerdict.className = 'verdict-tag font-mono status-distinct';
  }
}

/* 5. Upload Demo — Real client-side cloak effect, hashing & biometric scan */
const FACE_MODEL_URL = 'https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js@0.22.2/weights';
const UPLOAD_MAX_DIM = 720;
let faceApiModelsPromise = null;
let workCanvas = null;   // capped-resolution copy of the uploaded image
let cloakCanvas = null;  // noise-perturbed version of workCanvas
let sourceFile = null;   // original uploaded file, used for SHA-256 evidence

function initUploadDemo() {
  const dropzone = document.getElementById('uploadDropzone');
  const fileInput = document.getElementById('uploadInput');
  const resetBtn = document.getElementById('resetSpecimenBtn');
  const downloadBtn = document.getElementById('downloadCloakedBtn');

  if (!dropzone || !fileInput) return;

  const openPicker = (e) => {
    if (e) e.preventDefault();
    fileInput.click();
  };
  dropzone.addEventListener('click', openPicker);
  dropzone.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') openPicker(e);
  });
  fileInput.addEventListener('change', (e) => {
    const file = e.target.files && e.target.files[0];
    if (file) handleUploadedFile(file);
  });

  ['dragenter', 'dragover'].forEach(evt => {
    dropzone.addEventListener(evt, (e) => {
      e.preventDefault();
      dropzone.classList.add('is-dragover');
    });
  });

  ['dragleave', 'drop'].forEach(evt => {
    dropzone.addEventListener(evt, (e) => {
      e.preventDefault();
      dropzone.classList.remove('is-dragover');
    });
  });

  dropzone.addEventListener('drop', (e) => {
    const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
    if (file) handleUploadedFile(file);
  });

  if (resetBtn) resetBtn.addEventListener('click', () => {
    fileInput.value = '';
    resetSpecimenToDefault();
  });
  if (downloadBtn) downloadBtn.addEventListener('click', () => {
    if (!cloakCanvas) return;
    const link = document.createElement('a');
    link.href = cloakCanvas.toDataURL('image/png');
    link.download = 'veriself-cloaked.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  });

  const biometricBtn = document.getElementById('runBiometricBtn');
  if (biometricBtn) {
    biometricBtn.addEventListener('click', () => {
      if (!workCanvas) {
        setUploadStatus('Upload a photo first, then run the biometric scan.');
        document.getElementById('protect')?.scrollIntoView({ behavior: 'smooth' });
        return;
      }
      document.getElementById('biometric')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      runBiometricScan();
    });
  }
}

function setUploadStatus(text) {
  const row = document.getElementById('uploadStatusRow');
  const label = document.getElementById('uploadStatusText');
  if (row) row.style.display = 'flex';
  if (label) label.textContent = text;
}

function handleUploadedFile(file) {
  const name = (file.name || '').toLowerCase();
  const isImage = file.type.startsWith('image/') || /\.(png|jpe?g|webp)$/i.test(name);
  if (!isImage) {
    setUploadStatus('That file doesn\'t look like an image — try a JPG, PNG, or WebP.');
    return;
  }

  if (file.size === 0) {
    setUploadStatus('That image file is empty. Please choose another image.');
    return;
  }

  sourceFile = file;
  setUploadStatus('Processing your photo locally…');

  const reader = new FileReader();
  reader.onload = (e) => {
    const img = new Image();
    img.onload = () => processUploadedImage(img);
    img.onerror = () => setUploadStatus('Could not read that image — try a different file.');
    img.src = e.target.result;
  };
  reader.onerror = () => setUploadStatus('Could not read that file.');
  reader.readAsDataURL(file);
}

function processUploadedImage(img) {
  // 1. Draw to a capped-resolution working canvas (keeps things fast & consistent)
  const scale = Math.min(1, UPLOAD_MAX_DIM / Math.max(img.naturalWidth, img.naturalHeight));
  const w = Math.max(1, Math.round(img.naturalWidth * scale));
  const h = Math.max(1, Math.round(img.naturalHeight * scale));

  workCanvas = document.createElement('canvas');
  workCanvas.width = w;
  workCanvas.height = h;
  workCanvas.getContext('2d').drawImage(img, 0, 0, w, h);

  // 2. Apply the gradient-weighted noise ("cloak") effect
  cloakCanvas = applyCloakEffect(workCanvas);

  // 3. Update the comparison plate with the real images
  const plateOriginal = document.getElementById('plateOriginalImg');
  const plateCloaked = document.getElementById('plateCloakedImg');
  const plateBStatus = document.getElementById('plateBStatus');
  if (plateOriginal) plateOriginal.src = workCanvas.toDataURL('image/jpeg', 0.93);
  if (plateCloaked) plateCloaked.src = cloakCanvas.toDataURL('image/png');
  if (plateBStatus) plateBStatus.textContent = 'PERTURBED • YOUR UPLOAD (LIVE)';

  // 4. Compute real perceptual hashes and feed the Hamming calculator
  const hashOriginal = computeAverageHash(workCanvas);
  const hashCloaked = computeAverageHash(cloakCanvas);
  const hashInput1 = document.getElementById('hashInput1');
  const hashInput2 = document.getElementById('hashInput2');
  if (hashInput1) hashInput1.value = hashOriginal;
  if (hashInput2) hashInput2.value = hashCloaked;
  calculateHamming();

  // 5. Update the plate footer metadata with real, computed figures
  const metaResolution = document.getElementById('metaResolution');
  const metaHashLabel = document.getElementById('metaHashLabel');
  const metaHashValue = document.getElementById('metaHashValue');
  if (metaResolution) metaResolution.textContent = `${img.naturalWidth} × ${img.naturalHeight} PX`;
  if (metaHashLabel) metaHashLabel.textContent = 'LIVE HASH DELTA';
  if (metaHashValue) {
    const dist = document.getElementById('resDistance')?.textContent || '—';
    const sim = document.getElementById('resSimilarity')?.textContent || '—';
    metaHashValue.textContent = `${dist} (${sim})`;
  }

  // 6. Reveal the download button
  const downloadRow = document.getElementById('plateDownloadRow');
  if (downloadRow) downloadRow.style.display = 'flex';

  setUploadStatus('Done — compare the photo above, then open Biometric Scan.');

  // 7. Run the live biometric landmark scan
  runBiometricScan();
}

function resetSpecimenToDefault() {
  const plateOriginal = document.getElementById('plateOriginalImg');
  const plateCloaked = document.getElementById('plateCloakedImg');
  const plateBStatus = document.getElementById('plateBStatus');
  const metaResolution = document.getElementById('metaResolution');
  const metaHashLabel = document.getElementById('metaHashLabel');
  const metaHashValue = document.getElementById('metaHashValue');
  const downloadRow = document.getElementById('plateDownloadRow');
  const scanPanel = document.getElementById('biometricScanPanel');
  const statusRow = document.getElementById('uploadStatusRow');
  const hashInput1 = document.getElementById('hashInput1');
  const hashInput2 = document.getElementById('hashInput2');

  if (plateOriginal) plateOriginal.src = './original.png';
  if (plateCloaked) plateCloaked.src = './cloaked.png';
  if (plateBStatus) plateBStatus.textContent = 'PERTURBED • SAMPLE SPECIMEN';
  if (metaResolution) metaResolution.textContent = '1920 × 1080 PX';
  if (metaHashLabel) metaHashLabel.textContent = 'SAMPLE HASH DELTA';
  if (metaHashValue) metaHashValue.textContent = '4 BITS / 64 (93.75%)';
  if (downloadRow) downloadRow.style.display = 'none';
  if (scanPanel) scanPanel.style.display = 'none';
  if (statusRow) statusRow.style.display = 'none';
  if (hashInput1) hashInput1.value = 'e38a29b4c0f1d5e6';
  if (hashInput2) hashInput2.value = 'e38a29b4c0f1d5a1';
  calculateHamming();

  workCanvas = null;
  cloakCanvas = null;
  sourceFile = null;
  advancedCandidateHash = null;
  advancedForensic = null;
  advancedCase = null;
}

/* 5a. Texture-aware gradient-weighted noise ("cloak") effect — real, on-device pixel math */
function applyCloakEffect(sourceCanvas) {
  const w = sourceCanvas.width;
  const h = sourceCanvas.height;
  const srcCtx = sourceCanvas.getContext('2d');
  const srcData = srcCtx.getImageData(0, 0, w, h);
  const out = srcCtx.createImageData(w, h);

  // Grayscale luminance map, used to estimate local gradient (detail) magnitude
  const lum = new Float32Array(w * h);
  for (let i = 0; i < w * h; i++) {
    const r = srcData.data[i * 4], g = srcData.data[i * 4 + 1], b = srcData.data[i * 4 + 2];
    lum[i] = 0.299 * r + 0.587 * g + 0.114 * b;
  }

  let maxGrad = 1;
  const grad = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = y * w + x;
      const gx = lum[idx] - lum[y * w + Math.max(0, x - 1)];
      const gy = lum[idx] - lum[Math.max(0, y - 1) * w + x];
      const g = Math.sqrt(gx * gx + gy * gy);
      grad[idx] = g;
      if (g > maxGrad) maxGrad = g;
    }
  }

  const STRENGTH = 55; // max noise amplitude in 0-255 space, applied only at full gradient
  for (let i = 0; i < w * h; i++) {
    const gNorm = grad[i] / maxGrad; // 0 (flat) .. 1 (high detail / edges)
    const noise = (Math.random() * 2 - 1) * STRENGTH * gNorm;
    for (let c = 0; c < 3; c++) {
      const v = srcData.data[i * 4 + c] + noise;
      out.data[i * 4 + c] = Math.max(0, Math.min(255, v));
    }
    out.data[i * 4 + 3] = srcData.data[i * 4 + 3];
  }

  const outCanvas = document.createElement('canvas');
  outCanvas.width = w;
  outCanvas.height = h;
  outCanvas.getContext('2d').putImageData(out, 0, 0);
  return outCanvas;
}

/* 5b. Real 64-bit average hash (aHash), computed from actual pixel data */
function computeAverageHash(canvas) {
  const size = 8;
  const tmp = document.createElement('canvas');
  tmp.width = size;
  tmp.height = size;
  const ctx = tmp.getContext('2d');
  ctx.drawImage(canvas, 0, 0, size, size);
  const data = ctx.getImageData(0, 0, size, size).data;

  const gray = [];
  let sum = 0;
  for (let i = 0; i < size * size; i++) {
    const v = 0.299 * data[i * 4] + 0.587 * data[i * 4 + 1] + 0.114 * data[i * 4 + 2];
    gray.push(v);
    sum += v;
  }
  const mean = sum / gray.length;

  let bits = '';
  for (let i = 0; i < gray.length; i++) bits += gray[i] >= mean ? '1' : '0';

  let hex = '';
  for (let i = 0; i < bits.length; i += 4) {
    hex += parseInt(bits.substr(i, 4), 2).toString(16);
  }
  return hex;
}

/* 5c. Live biometric landmark scan using a real browser face-detection model */
function loadFaceApiModels() {
  if (faceApiModelsPromise) return faceApiModelsPromise;
  if (typeof faceapi === 'undefined') {
    faceApiModelsPromise = Promise.reject(new Error('face-api.js failed to load'));
    return faceApiModelsPromise;
  }
  faceApiModelsPromise = Promise.all([
    faceapi.nets.tinyFaceDetector.loadFromUri(FACE_MODEL_URL),
    faceapi.nets.faceLandmark68Net.loadFromUri(FACE_MODEL_URL),
  ]);
  return faceApiModelsPromise;
}

async function runBiometricScan() {
  const panel = document.getElementById('biometricScanPanel');
  const statusEl = document.getElementById('scanEngineStatus');
  const canvas = document.getElementById('scanCanvas');
  const detectedEl = document.getElementById('scanFaceDetected');
  const confEl = document.getElementById('scanConfidence');
  const countEl = document.getElementById('scanLandmarkCount');
  const boxEl = document.getElementById('scanBoundingBox');

  if (!panel || !canvas || !workCanvas) return;

  panel.style.display = 'block';
  canvas.width = workCanvas.width;
  canvas.height = workCanvas.height;
  const ctx = canvas.getContext('2d');
  ctx.drawImage(workCanvas, 0, 0);

  statusEl.textContent = 'LOADING MODEL…';
  detectedEl.textContent = '—';
  confEl.textContent = '—';
  countEl.textContent = '—';
  boxEl.textContent = '—';

  try {
    await loadFaceApiModels();
    statusEl.textContent = 'SCANNING…';

    const detection = await faceapi
      .detectSingleFace(workCanvas, new faceapi.TinyFaceDetectorOptions())
      .withFaceLandmarks();

    if (!detection) {
      statusEl.textContent = 'IDLE';
      detectedEl.textContent = 'NO';
      confEl.textContent = 'N/A';
      countEl.textContent = '0';
      boxEl.textContent = 'No face found — try a clearer, front-facing photo.';
      return;
    }

    const box = detection.detection.box;
    const points = detection.landmarks.positions;

    // Draw bounding box
    ctx.strokeStyle = '#00ff88';
    ctx.lineWidth = Math.max(2, canvas.width * 0.004);
    ctx.strokeRect(box.x, box.y, box.width, box.height);

    // Draw the 5 anatomical reference points VeriSelf's copy describes:
    // left eye, right eye, nose tip, mouth-left, mouth-right (averaged from the 68-pt model)
    const avg = (idxs) => {
      const pts = idxs.map(i => points[i]);
      return { x: pts.reduce((s, p) => s + p.x, 0) / pts.length, y: pts.reduce((s, p) => s + p.y, 0) / pts.length };
    };
    const keyPoints = [
      avg([36, 37, 38, 39, 40, 41]), // left eye
      avg([42, 43, 44, 45, 46, 47]), // right eye
      points[30],                    // nose tip
      points[48],                    // mouth left corner
      points[54],                    // mouth right corner
    ];
    ctx.fillStyle = '#00ff88';
    keyPoints.forEach(p => {
      ctx.beginPath();
      ctx.arc(p.x, p.y, Math.max(2.5, canvas.width * 0.006), 0, Math.PI * 2);
      ctx.fill();
    });

    statusEl.textContent = 'FACE FOUND';
    detectedEl.textContent = 'YES';
    confEl.textContent = `${(detection.detection.score * 100).toFixed(1)}%`;
    countEl.textContent = `${points.length} (5 KEY REFS DRAWN)`;
    boxEl.textContent = `x:${Math.round(box.x)} y:${Math.round(box.y)} w:${Math.round(box.width)} h:${Math.round(box.height)}`;
  } catch (err) {
    console.error('Biometric scan unavailable:', err);
    statusEl.textContent = 'MODEL UNAVAILABLE';
    detectedEl.textContent = '—';
    confEl.textContent = '—';
    countEl.textContent = '—';
    boxEl.textContent = 'Could not load the face-landmark model (check your connection).';
  }
}

/* 6. Terminal Command Copy Helper */
function copyCode(text) {
  navigator.clipboard.writeText(text).then(() => {
    const active = document.activeElement;
    if (active && active.classList.contains('copy-btn')) {
      const originalText = active.textContent;
      active.textContent = 'COPIED';
      setTimeout(() => {
        active.textContent = originalText;
      }, 1600);
    }
  }).catch(err => {
    console.error('Failed to copy text: ', err);
  });
}

/* Advanced demo modules derived from the project's forensic/evidence concepts. */
document.addEventListener('DOMContentLoaded', initAdvancedDemo);
let advancedCandidateHash = null;
let advancedForensic = null;
let advancedCase = null;
function adv(id){return document.getElementById(id)}
function advInitHashCanvas(canvas,size){const t=document.createElement('canvas');t.width=size;t.height=size;t.getContext('2d').drawImage(canvas,0,0,size,size);return t.getContext('2d').getImageData(0,0,size,size).data}
function advGray(d){const a=[];for(let i=0;i<d.length;i+=4)a.push(.299*d[i]+.587*d[i+1]+.114*d[i+2]);return a}
function advHex(bits){let h='';for(let i=0;i<bits.length;i+=4)h+=parseInt(bits.slice(i,i+4).padEnd(4,'0'),2).toString(16);return h}
function advPHash(canvas){const N=32,S=8,g=advGray(advInitHashCanvas(canvas,N)),vals=[];for(let u=0;u<S;u++)for(let v=0;v<S;v++){let sum=0;for(let x=0;x<N;x++)for(let y=0;y<N;y++)sum+=g[x*N+y]*Math.cos(((2*x+1)*u*Math.PI)/(2*N))*Math.cos(((2*y+1)*v*Math.PI)/(2*N));vals.push(sum)}const q=vals.slice(1),mean=q.reduce((a,b)=>a+b,0)/q.length;return advHex(q.map(v=>v>=mean?'1':'0').join('').slice(0,64))}
function advHamming(a,b){let n=0;for(let i=0;i<16;i++){let x=(parseInt(a[i]||'0',16)^parseInt(b[i]||'0',16));while(x){n+=x&1;x>>=1}}return n}
function advForensicScan(canvas){const ctx=canvas.getContext('2d'),w=canvas.width,h=canvas.height,d=ctx.getImageData(0,0,w,h).data,step=Math.max(1,Math.floor(Math.min(w,h)/450));let s=0,s2=0,drift=0,n=0;for(let y=1;y<h-1;y+=step)for(let x=1;x<w-1;x+=step){const i=(y*w+x)*4,u=((y-1)*w+x)*4,dn=((y+1)*w+x)*4,l=(y*w+x-1)*4,r=(y*w+x+1)*4,c=.299*d[i]+.587*d[i+1]+.114*d[i+2],up=.299*d[u]+.587*d[u+1]+.114*d[u+2],down=.299*d[dn]+.587*d[dn+1]+.114*d[dn+2],left=.299*d[l]+.587*d[l+1]+.114*d[l+2],right=.299*d[r]+.587*d[r+1]+.114*d[r+2],lap=up+down+left+right-4*c;s+=lap;s2+=lap*lap;drift+=Math.abs(d[i]-d[i+1])+Math.abs(d[i+1]-d[i+2]);n++}const variance=Math.max(0,s2/n-(s/n)*(s/n)),channel=drift/n,texture=Math.min(100,variance/8),risk=Math.max(1,Math.min(99,Math.round(55-texture*.35+channel*.18))),level=risk<30?'LOW':risk<65?'MODERATE':'HIGH';return{risk,level,variance,channel,texture}}
function advInitCandidate(){const dz=adv('candidateDropzone'),input=adv('candidateInput');if(!dz||!input)return;const choose=()=>input.click();dz.onclick=choose;dz.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();choose()}};input.onchange=e=>{const f=e.target.files&&e.target.files[0];if(f)advReadCandidate(f);};dz.addEventListener('dragover',e=>{e.preventDefault();dz.classList.add('is-dragover')});dz.addEventListener('dragleave',()=>dz.classList.remove('is-dragover'));dz.addEventListener('drop',e=>{e.preventDefault();dz.classList.remove('is-dragover');const f=e.dataTransfer.files[0];if(f)advReadCandidate(f)})}
function advReadCandidate(file){if(!workCanvas)return alert('Upload the source image first.');const name=(file.name||'').toLowerCase(),isImage=file.type.startsWith('image/')||/\.(png|jpe?g|webp)$/i.test(name);if(!isImage)return alert('Choose a JPG, PNG, or WebP image.');if(!file.size)return alert('The candidate image is empty.');const r=new FileReader();r.onerror=()=>alert('Could not read the candidate image.');r.onload=e=>{const img=new Image();img.onerror=()=>alert('Could not decode the candidate image.');img.onload=()=>{const c=document.createElement('canvas'),scale=Math.min(1,720/Math.max(img.naturalWidth,img.naturalHeight));c.width=Math.max(1,Math.round(img.naturalWidth*scale));c.height=Math.max(1,Math.round(img.naturalHeight*scale));c.getContext('2d').drawImage(img,0,0,c.width,c.height);advancedCandidateHash=advPHash(c);const source=advPHash(workCanvas),dist=advHamming(source,advancedCandidateHash),sim=((64-dist)/64*100).toFixed(2),match=dist<=8;adv('advSourceHash').textContent=source;adv('advCandidateHash').textContent=advancedCandidateHash;adv('advDistance').textContent=dist+' BITS / 64';adv('advSimilarity').textContent=sim+'%';adv('advVerdict').textContent=match?'CLOSE PERCEPTUAL MATCH':'DISTINCT IMAGE';adv('advVerdict').className='verdict-tag font-mono '+(match?'status-match':'status-distinct');adv('candidateResult').style.display='block'}};img.src=e.target.result};r.readAsDataURL(file)}
async function advGenerateEvidence(){if(!sourceFile||!workCanvas)return alert('Upload a source image first.');const buf=await sourceFile.arrayBuffer(),digest=await crypto.subtle.digest('SHA-256',buf),sha=[...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,'0')).join(''),phash=advPHash(workCanvas);advancedCase={case_id:'VS-'+Math.random().toString(36).slice(2,10).toUpperCase(),created_at:new Date().toISOString(),file:{name:sourceFile.name,type:sourceFile.type,size_bytes:sourceFile.size},sha256:sha,phash:phash,forensic:advancedForensic,candidate_match:advancedCandidateHash?{candidate_phash:advancedCandidateHash,hamming_distance:advHamming(phash,advancedCandidateHash)}:null};adv('advEvidenceFile').textContent=sourceFile.name;adv('advSha').textContent=sha;adv('advEvidencePhash').textContent=phash;adv('advDownloadBtn').style.display='inline-block'}
function advDownloadEvidence(){if(!advancedCase)return;const blob=new Blob([JSON.stringify(advancedCase,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download='veriself-case-evidence.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),500)}
function advNotice(){const url=adv('advTargetUrl').value.trim(),owner=adv('advOwner').value.trim()||'Identity Owner';if(!url){adv('advNotice').value='Enter the suspected URL first.';return}const sha=adv('advSha').textContent||'not generated',ph=adv('advEvidencePhash').textContent||'not generated';adv('advNotice').value='VERISELF — RESPONSE DRAFT\n\nDate: '+new Date().toLocaleDateString()+'\nOwner: '+owner+'\nSuspected URL: '+url+'\n\nEvidence SHA-256: '+sha+'\npHash: '+ph+'\n\nREQUEST\nPlease review the referenced media and, where appropriate, remove or disable access to material being used without authorization. Please preserve the URL and evidence for review.\n\nThis is a user-reviewed draft generated by the VeriSelf prototype. It is not an automatic legal filing and does not establish infringement by itself.'}
function initAdvancedDemo(){advInitCandidate();adv('advForensicBtn').onclick=()=>{if(!workCanvas)return alert('Upload a source image first.');advancedForensic=advForensicScan(workCanvas);adv('advRiskLevel').textContent=advancedForensic.level;adv('advRiskBar').style.width=advancedForensic.risk+'%';adv('advRiskScore').textContent=advancedForensic.risk+'% · '+advancedForensic.level;adv('advLaplacian').textContent=advancedForensic.variance.toFixed(2);adv('advDrift').textContent=advancedForensic.channel.toFixed(2);adv('advTexture').textContent=advancedForensic.texture.toFixed(1)+'%'};adv('advEvidenceBtn').onclick=advGenerateEvidence;adv('advDownloadBtn').onclick=advDownloadEvidence;adv('advNoticeBtn').onclick=advNotice}
