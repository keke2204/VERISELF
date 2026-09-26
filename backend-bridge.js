/* VeriSelf API bridge — single source of truth for frontend/backend communication. */
(() => {
  const DEFAULT_API = 'https://veriself.onrender.com';
  const $ = (id) => document.getElementById(id);
  let sourceFile = null;
  let sourceMediaId = null;
  let busy = false;

  function apiBase() {
    const typed = ($('apiBaseUrl')?.value || '').trim();
    const saved = localStorage.getItem('veriself-api-base');
    return (typed || saved || DEFAULT_API).replace(/\/$/, '');
  }

  function status(message) {
    const el = $('apiStatus');
    if (el) el.textContent = message;
  }

  function showError(message) {
    status('ERROR');
    const text = message || 'Backend request failed.';
    console.error('[VeriSelf API]', text);
    const el = $('apiStatus');
    if (el) {
      el.title = text;
      el.dataset.error = text;
    }
    alert('VeriSelf backend error:\n\n' + text);
  }

  async function request(path, options = {}, attempts = 3) {
    let lastError;
    for (let attempt = 1; attempt <= attempts; attempt++) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 60000);
      try {
        const response = await fetch(apiBase() + path, {
          ...options,
          mode: 'cors',
          cache: 'no-store',
          signal: controller.signal
        });
        const text = await response.text();
        let body = {};
        try { body = text ? JSON.parse(text) : {}; } catch (_) {}
        if (!response.ok) {
          throw new Error(body.detail || ('HTTP ' + response.status + ' from ' + path));
        }
        return body;
      } catch (err) {
        lastError = err.name === 'AbortError'
          ? new Error('Backend request timed out after 60 seconds. Render may still be waking up.')
          : err;
        if (attempt < attempts) {
          status('RETRY ' + attempt + '/2…');
          await new Promise(resolve => setTimeout(resolve, 1500 * attempt));
        }
      } finally {
        clearTimeout(timer);
      }
    }
    throw lastError || new Error('Backend request failed.');
  }

  async function testBackend(showAlert = false) {
    status('CONNECTING…');
    try {
      const data = await request('/api/v1/health', {}, 3);
      if (data.status !== 'healthy') throw new Error('Health endpoint returned an unexpected status.');
      status('ONLINE');
      return true;
    } catch (err) {
      status('OFFLINE');
      if (showAlert) showError(err.message);
      else console.warn('[VeriSelf API] Health check:', err.message);
      return false;
    }
  }

  async function registerSource(file = sourceFile) {
    if (!file) throw new Error('Upload the source photo first.');
    if (busy) return null;
    busy = true;
    status('REGISTERING SOURCE…');
    try {
      const form = new FormData();
      form.append('file', file, file.name || 'source-image');
      const data = await request('/api/v1/media/register', { method: 'POST', body: form });
      sourceMediaId = String(data.id);
      localStorage.setItem('veriself-media-id', sourceMediaId);
      if ($('apiMediaId')) $('apiMediaId').textContent = sourceMediaId;
      if ($('advEvidencePhash')) $('advEvidencePhash').textContent = data.phash || '—';
      if ($('advSha')) $('advSha').textContent = data.sha256 || '—';
      if ($('advEvidenceFile')) $('advEvidenceFile').textContent = data.filename || file.name || 'upload';
      status('SOURCE REGISTERED');
      return data;
    } finally {
      busy = false;
    }
  }

  async function compareCandidate(file) {
    const id = sourceMediaId || localStorage.getItem('veriself-media-id');
    const candidate = file || $('candidateInput')?.files?.[0];
    if (!id) throw new Error('Register the source photo before comparing a candidate.');
    if (!candidate) throw new Error('Choose a candidate image first.');

    status('COMPARING…');
    const form = new FormData();
    form.append('source_id', id);
    form.append('candidate', candidate, candidate.name || 'candidate-image');
    const data = await request('/api/v1/media/compare', { method: 'POST', body: form });

    if ($('advSourceHash')) $('advSourceHash').textContent = data.source_phash;
    if ($('advCandidateHash')) $('advCandidateHash').textContent = data.candidate_phash;
    if ($('advDistance')) $('advDistance').textContent = data.hamming_distance + ' BITS / 64';
    if ($('advSimilarity')) $('advSimilarity').textContent = data.similarity_percent + '%';
    if ($('advVerdict')) {
      $('advVerdict').textContent = data.result;
      $('advVerdict').className = 'verdict-tag font-mono ' +
        (data.hamming_distance <= 8 ? 'status-match' : 'status-distinct');
    }
    if ($('candidateResult')) $('candidateResult').style.display = 'block';
    status('BACKEND MATCH COMPLETE');
    return data;
  }

  function bind(id, handler) {
    const el = $(id);
    if (!el) return;
    el.addEventListener('click', async (event) => {
      event.preventDefault();
      try { await handler(); }
      catch (err) { showError(err.message); }
    });
  }

  function captureSource(file) {
    if (!file) return;
    sourceFile = file;
    // Register automatically so the backend is actually part of the upload flow.
    registerSource(file).catch(err => showError(err.message));
  }

  document.addEventListener('DOMContentLoaded', () => {
    const input = $('apiBaseUrl');
    const saved = localStorage.getItem('veriself-api-base');
    if (input) input.value = saved || DEFAULT_API;

    bind('saveApiBtn', async () => {
      const value = (input?.value || '').trim().replace(/\/$/, '');
      if (!/^https:\/\//i.test(value)) throw new Error('Enter a valid HTTPS backend URL.');
      localStorage.setItem('veriself-api-base', value);
      status('SAVED');
      await testBackend(true);
    });

    bind('testApiBtn', () => testBackend(true));

    bind('syncSourceBtn', async () => {
      await registerSource();
    });

    bind('syncCandidateBtn', async () => {
      await compareCandidate();
    });

    const uploadInput = $('uploadInput');
    if (uploadInput) {
      uploadInput.addEventListener('change', () => captureSource(uploadInput.files?.[0]));
    }

    const uploadDropzone = $('uploadDropzone');
    if (uploadDropzone) {
      uploadDropzone.addEventListener('drop', (event) => {
        captureSource(event.dataTransfer?.files?.[0]);
      });
    }

    const candidateInput = $('candidateInput');
    if (candidateInput) {
      candidateInput.addEventListener('change', async () => {
        const file = candidateInput.files?.[0];
        if (!file) return;
        try {
          if (!sourceMediaId) await registerSource();
          await compareCandidate(file);
        } catch (err) {
          showError(err.message);
        }
      });
    }

    // Do not block the UI while Render wakes up.
    testBackend(false);
  });
})();