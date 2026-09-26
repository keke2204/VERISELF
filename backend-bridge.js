/* VeriSelf live backend bridge — replaces the optional/manual connection behavior with a direct working path. */
(() => {
  const API = 'https://veriself.onrender.com';
  const $ = (id) => document.getElementById(id);

  function status(message) {
    const el = $('apiStatus');
    if (el) el.textContent = message;
  }

  async function request(path, options = {}) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 30000);
    try {
      const response = await fetch(API + path, {
        ...options,
        mode: 'cors',
        cache: 'no-store',
        signal: controller.signal
      });
      const text = await response.text();
      let body = {};
      try { body = text ? JSON.parse(text) : {}; } catch (_) {}
      if (!response.ok) {
        throw new Error(body.detail || ('HTTP ' + response.status));
      }
      return body;
    } finally {
      clearTimeout(timer);
    }
  }

  async function testBackend() {
    status('CONNECTING…');
    try {
      const data = await request('/api/v1/health');
      status(data.status === 'healthy' ? 'ONLINE' : 'ERROR');
      return true;
    } catch (err) {
      console.error('VeriSelf backend:', err);
      status(err.name === 'AbortError' ? 'TIMEOUT' : 'OFFLINE');
      return false;
    }
  }

  async function registerSource() {
    const file = window.__veriselfSourceFile;
    if (!file) {
      alert('Upload the source photo first.');
      return null;
    }
    status('REGISTERING SOURCE…');
    const form = new FormData();
    form.append('file', file, file.name || 'source-image');
    const data = await request('/api/v1/media/register', { method:'POST', body:form });
    localStorage.setItem('veriself-media-id', String(data.id));
    const id = $('apiMediaId');
    if (id) id.textContent = String(data.id);
    status('SOURCE REGISTERED');
    return data;
  }

  async function compareCandidate() {
    const sourceId = localStorage.getItem('veriself-media-id');
    const input = $('candidateInput');
    const candidate = input && input.files && input.files[0];
    if (!sourceId) {
      alert('Register the source photo in the backend first.');
      return;
    }
    if (!candidate) {
      alert('Choose a candidate image first.');
      return;
    }

    status('COMPARING…');
    const form = new FormData();
    form.append('source_id', sourceId);
    form.append('candidate', candidate, candidate.name || 'candidate-image');
    const data = await request('/api/v1/media/compare', { method:'POST', body:form });

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
  }

  function replaceButton(id, handler) {
    const old = $(id);
    if (!old) return;
    const fresh = old.cloneNode(true);
    old.replaceWith(fresh);
    fresh.addEventListener('click', async () => {
      try { await handler(); }
      catch (err) {
        console.error('VeriSelf backend:', err);
        status('ERROR');
        alert(err.message || 'Backend request failed.');
      }
    });
  }

  function exposeSourceFile() {
    const input = $('uploadInput');
    if (!input) return;
    input.addEventListener('change', () => {
      const file = input.files && input.files[0];
      if (file) window.__veriselfSourceFile = file;
    });
    const drop = $('uploadDropzone');
    if (drop) {
      drop.addEventListener('drop', (e) => {
        const file = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
        if (file) window.__veriselfSourceFile = file;
      });
    }
  }

  document.addEventListener('DOMContentLoaded', () => {
    exposeSourceFile();

    const input = $('apiBaseUrl');
    if (input) input.value = API;

    replaceButton('saveApiBtn', async () => {
      localStorage.setItem('veriself-api-base', API);
      status('SAVED');
    });

    replaceButton('testApiBtn', testBackend);
    replaceButton('syncSourceBtn', registerSource);
    replaceButton('syncCandidateBtn', compareCandidate);

    // Show the real connection state automatically.
    testBackend();
  });
})();