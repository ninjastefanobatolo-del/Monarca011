const API = '';

// ── Tabs ──────────────────────────────────────────────────────────────────────
document.querySelectorAll('.tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById('panel-' + tab.dataset.tab).classList.add('active');
    hideError();
    hideResults();
  });
});

// ── Word counter ──────────────────────────────────────────────────────────────
const inputText = document.getElementById('inputText');
inputText.addEventListener('input', () => {
  const words = inputText.value.trim() ? inputText.value.trim().split(/\s+/).length : 0;
  document.getElementById('inputWordCount').textContent = `${words} palabras`;
});

// ── Drag & drop ───────────────────────────────────────────────────────────────
const dropzone = document.getElementById('dropzone');
const fileInput = document.getElementById('fileInput');

dropzone.addEventListener('dragover', e => { e.preventDefault(); dropzone.classList.add('drag-over'); });
dropzone.addEventListener('dragleave', () => dropzone.classList.remove('drag-over'));
dropzone.addEventListener('drop', e => {
  e.preventDefault();
  dropzone.classList.remove('drag-over');
  if (e.dataTransfer.files.length) setFile(e.dataTransfer.files[0]);
});
fileInput.addEventListener('change', () => { if (fileInput.files.length) setFile(fileInput.files[0]); });

let selectedFile = null;

function setFile(file) {
  const allowed = ['pdf', 'docx', 'doc', 'txt'];
  const ext = file.name.split('.').pop().toLowerCase();
  if (!allowed.includes(ext)) { showError(`Formato .${ext} no soportado. Use PDF, DOCX o TXT.`); return; }
  selectedFile = file;
  document.getElementById('fileName').textContent = `📎 ${file.name} (${(file.size / 1024).toFixed(1)} KB)`;
  document.getElementById('fileInfo').classList.remove('hidden');
  document.getElementById('btnTranslateFile').disabled = false;
  hideError(); hideResults();
}

function clearFile() {
  selectedFile = null;
  fileInput.value = '';
  document.getElementById('fileInfo').classList.add('hidden');
  document.getElementById('btnTranslateFile').disabled = true;
  hideResults();
}

// ── Translate text ─────────────────────────────────────────────────────────────
async function translateText() {
  const text = inputText.value.trim();
  if (!text) { showError('Por favor ingrese el texto a traducir.'); return; }
  const lang = document.getElementById('sourceLang').value;

  showLoader(); hideError(); hideResults();

  try {
    const res = await fetch(`${API}/translate/text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, source_language: lang }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Error en la traducción');
    renderTextResult(data);
  } catch (e) {
    showError(e.message);
  } finally {
    hideLoader();
  }
}

function renderTextResult(data) {
  const out = document.getElementById('outputText');
  out.textContent = data.translated_text || '';
  document.getElementById('outputWordCount').textContent = `${data.word_count_translated || 0} palabras`;
  document.getElementById('copyBtn').disabled = false;
  document.getElementById('downloadTxtBtn').disabled = false;

  showMeta(data);
  renderGlossary(data.glossary);
  document.getElementById('results').classList.remove('hidden');
  document.getElementById('resultFileSection').classList.add('hidden');
}

// ── Translate file ─────────────────────────────────────────────────────────────
async function translateFile() {
  if (!selectedFile) return;
  const lang = document.getElementById('sourceLang').value;
  const form = new FormData();
  form.append('file', selectedFile);
  form.append('source_language', lang);

  showLoader(); hideError(); hideResults();

  try {
    const res = await fetch(`${API}/translate/file`, { method: 'POST', body: form });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Error en la traducción');
    renderFileResult(data);
  } catch (e) {
    showError(e.message);
  } finally {
    hideLoader();
  }
}

function renderFileResult(data) {
  document.getElementById('resultBody').textContent = data.translated_text || '';
  document.getElementById('resultFileSection').classList.remove('hidden');
  document.getElementById('outputText').innerHTML = '<span class="placeholder-text">La traducción aparecerá aquí...</span>';

  showMeta(data);
  renderGlossary(data.glossary);
  document.getElementById('results').classList.remove('hidden');
}

// ── Meta chips ─────────────────────────────────────────────────────────────────
function showMeta(data) {
  document.getElementById('metaLang').textContent = `🌍 ${data.detected_language || 'Idioma detectado'}`;
  const w = data.word_count_original || 0;
  document.getElementById('metaWords').textContent = `📝 ${w} palabras originales`;
}

// ── Glossary ───────────────────────────────────────────────────────────────────
function renderGlossary(glossary) {
  const tbody = document.getElementById('glossaryBody');
  tbody.innerHTML = '';
  if (!glossary || !glossary.length) {
    document.getElementById('glossarySection').style.display = 'none';
    return;
  }
  document.getElementById('glossarySection').style.display = '';
  glossary.forEach(item => {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td>${esc(item.term)}</td><td>${esc(item.translation)}</td><td>${esc(item.context)}</td>`;
    tbody.appendChild(tr);
  });
}

// ── Copy / download ────────────────────────────────────────────────────────────
function copyTranslation() {
  const text = document.getElementById('outputText').textContent;
  navigator.clipboard.writeText(text).then(() => flash('copyBtn', 'Copiado ✓'));
}

function copyResult() {
  const text = document.getElementById('resultBody').textContent;
  navigator.clipboard.writeText(text).then(() => alert('Texto copiado al portapapeles'));
}

function downloadTxt() {
  const text = document.getElementById('outputText').textContent;
  triggerDownload(text, 'traduccion_barbaz.txt');
}

function downloadResult() {
  const text = document.getElementById('resultBody').textContent;
  triggerDownload(text, 'traduccion_barbaz.txt');
}

function triggerDownload(text, filename) {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

function flash(btnId, label) {
  const btn = document.getElementById(btnId);
  const orig = btn.textContent; btn.textContent = label;
  setTimeout(() => { btn.textContent = orig; }, 1800);
}

// ── Utilities ─────────────────────────────────────────────────────────────────
function clearAll() {
  inputText.value = '';
  document.getElementById('inputWordCount').textContent = '0 palabras';
  document.getElementById('outputText').innerHTML = '<span class="placeholder-text">La traducción aparecerá aquí...</span>';
  document.getElementById('outputWordCount').textContent = '0 palabras';
  document.getElementById('copyBtn').disabled = true;
  document.getElementById('downloadTxtBtn').disabled = true;
  hideResults(); hideError();
}

function showLoader() { document.getElementById('loader').classList.remove('hidden'); }
function hideLoader() { document.getElementById('loader').classList.add('hidden'); }
function showError(msg) { document.getElementById('errorMsg').textContent = msg; document.getElementById('errorBox').classList.remove('hidden'); }
function hideError() { document.getElementById('errorBox').classList.add('hidden'); }
function hideResults() { document.getElementById('results').classList.add('hidden'); }
function esc(str) { return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
