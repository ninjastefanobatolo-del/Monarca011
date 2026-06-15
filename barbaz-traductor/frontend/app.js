// BarBaZ Traductor — Frontend Application Logic
// Full JS - no truncation

'use strict';

const API_BASE = '';  // Same origin; backend serves frontend

// === STATE ===
let currentTranslation = null;
let currentGlossary = [];
let selectedFile = null;

// === DOM REFERENCES ===
const dom = {
  // Tabs
  tabBtns: document.querySelectorAll('.tab-btn'),
  tabContents: document.querySelectorAll('.tab-content'),

  // Text tab
  sourceText: document.getElementById('sourceText'),
  charCount: document.getElementById('charCount'),
  translateTextBtn: document.getElementById('translateTextBtn'),
  clearTextBtn: document.getElementById('clearTextBtn'),
  translationOutput: document.getElementById('translationOutput'),
  copyTranslationBtn: document.getElementById('copyTranslationBtn'),
  downloadTextBtn: document.getElementById('downloadTextBtn'),
  textResultFooter: document.getElementById('textResultFooter'),
  detectedLangBadge: document.getElementById('detectedLangBadge'),
  wordCountBadge: document.getElementById('wordCountBadge'),
  textSourceLang: document.getElementById('textSourceLang'),

  // File tab
  uploadZone: document.getElementById('uploadZone'),
  fileInput: document.getElementById('fileInput'),
  fileSelected: document.getElementById('fileSelected'),
  selectedFileName: document.getElementById('selectedFileName'),
  selectedFileSize: document.getElementById('selectedFileSize'),
  removeFileBtn: document.getElementById('removeFileBtn'),
  translateFileBtn: document.getElementById('translateFileBtn'),
  fileResult: document.getElementById('fileResult'),
  fileTranslationText: document.getElementById('fileTranslationText'),
  fileDetectedLang: document.getElementById('fileDetectedLang'),
  fileWordCount: document.getElementById('fileWordCount'),
  fileNameBadge: document.getElementById('fileNameBadge'),
  copyFileTranslationBtn: document.getElementById('copyFileTranslationBtn'),
  downloadFileBtn: document.getElementById('downloadFileBtn'),
  newTranslationBtn: document.getElementById('newTranslationBtn'),
  fileSourceLang: document.getElementById('fileSourceLang'),

  // UI feedback
  loadingOverlay: document.getElementById('loadingOverlay'),
  loadingMessage: document.getElementById('loadingMessage'),
  errorAlert: document.getElementById('errorAlert'),
  errorMessage: document.getElementById('errorMessage'),
  successAlert: document.getElementById('successAlert'),
  successMessage: document.getElementById('successMessage'),
  closeErrorBtn: document.getElementById('closeErrorBtn'),

  // Glossary
  glossaryEmpty: document.getElementById('glossaryEmpty'),
  glossaryTableWrapper: document.getElementById('glossaryTableWrapper'),
  glossaryBody: document.getElementById('glossaryBody'),
  glossaryMeta: document.getElementById('glossaryMeta'),
  downloadGlossaryBtn: document.getElementById('downloadGlossaryBtn'),

  // Nav
  navToggle: document.getElementById('navToggle'),
  mainNav: document.querySelector('.main-nav'),
  navLinks: document.querySelectorAll('.nav-link'),
};

// === UTILITY FUNCTIONS ===

function formatFileSize(bytes) {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
}

function showLoading(message = 'Procesando traducción jurídica...') {
  dom.loadingMessage.textContent = message;
  dom.loadingOverlay.style.display = 'flex';
  document.body.style.overflow = 'hidden';
}

function hideLoading() {
  dom.loadingOverlay.style.display = 'none';
  document.body.style.overflow = '';
}

function showError(message) {
  dom.errorMessage.textContent = message;
  dom.errorAlert.style.display = 'flex';
  dom.successAlert.style.display = 'none';
  dom.errorAlert.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  setTimeout(() => { dom.errorAlert.style.display = 'none'; }, 8000);
}

function showSuccess(message) {
  dom.successMessage.textContent = message;
  dom.successAlert.style.display = 'flex';
  dom.errorAlert.style.display = 'none';
  setTimeout(() => { dom.successAlert.style.display = 'none'; }, 4000);
}

async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    showSuccess('Traducción copiada al portapapeles.');
  } catch {
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.position = 'fixed';
    ta.style.opacity = '0';
    document.body.appendChild(ta);
    ta.select();
    document.execCommand('copy');
    document.body.removeChild(ta);
    showSuccess('Traducción copiada al portapapeles.');
  }
}

function downloadText(text, filename) {
  const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

function downloadCSV(glossary, filename) {
  const header = 'Término Original,Traducción al Español,Contexto Jurídico\n';
  const rows = glossary.map(item => {
    const term = `"${(item.term || '').replace(/"/g, '""')}"`;
    const translation = `"${(item.translation || '').replace(/"/g, '""')}"`;
    const context = `"${(item.context || '').replace(/"/g, '""')}"`;
    return `${term},${translation},${context}`;
  }).join('\n');
  const csv = '﻿' + header + rows;
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// === TABS ===

function activateTab(tabName) {
  dom.tabBtns.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.tab === tabName);
  });
  dom.tabContents.forEach(content => {
    content.classList.toggle('active', content.id === `tab-${tabName}`);
  });
}

dom.tabBtns.forEach(btn => {
  btn.addEventListener('click', () => activateTab(btn.dataset.tab));
});

// === CHARACTER COUNT ===

dom.sourceText.addEventListener('input', () => {
  const len = dom.sourceText.value.length;
  dom.charCount.textContent = `${len.toLocaleString('es')} caracteres`;
  if (len > 45000) {
    dom.charCount.style.color = '#c0392b';
  } else {
    dom.charCount.style.color = '';
  }
});

// === CLEAR TEXT ===

dom.clearTextBtn.addEventListener('click', () => {
  dom.sourceText.value = '';
  dom.charCount.textContent = '0 caracteres';
  dom.translationOutput.innerHTML = `
    <div class="output-placeholder">
      <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.3"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
      <p>La traducción aparecerá aquí</p>
    </div>`;
  dom.textResultFooter.style.display = 'none';
  dom.copyTranslationBtn.style.display = 'none';
  currentTranslation = null;
});

// === TRANSLATE TEXT ===

async function translateText() {
  const text = dom.sourceText.value.trim();
  if (!text) {
    showError('Por favor ingrese el texto a traducir.');
    return;
  }
  if (text.length > 50000) {
    showError('El texto excede el límite de 50,000 caracteres. Por favor divídalo en partes más pequeñas.');
    return;
  }

  const sourceLang = dom.textSourceLang.value;

  showLoading('Traduciendo texto jurídico con IA...');
  dom.errorAlert.style.display = 'none';

  try {
    const response = await fetch(`${API_BASE}/translate/text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        source_language: sourceLang,
        target_language: 'Spanish'
      })
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ detail: 'Error desconocido del servidor.' }));
      throw new Error(err.detail || `Error ${response.status}`);
    }

    const data = await response.json();

    dom.translationOutput.textContent = data.translated_text;
    dom.detectedLangBadge.textContent = `Idioma: ${data.source_language}`;
    dom.wordCountBadge.textContent = `${data.word_count.toLocaleString('es')} palabras`;
    dom.textResultFooter.style.display = 'flex';
    dom.copyTranslationBtn.style.display = 'flex';

    currentTranslation = data;

    if (data.legal_terms_glossary && data.legal_terms_glossary.length > 0) {
      updateGlossary(data.legal_terms_glossary, data.source_language);
    }

    showSuccess(`Traducción completada. ${data.word_count.toLocaleString('es')} palabras procesadas.`);

  } catch (error) {
    showError(error.message || 'Error al conectar con el servidor. Verifique su conexión.');
  } finally {
    hideLoading();
  }
}

dom.translateTextBtn.addEventListener('click', translateText);

dom.sourceText.addEventListener('keydown', (e) => {
  if (e.ctrlKey && e.key === 'Enter') translateText();
});

// === COPY TRANSLATION (TEXT TAB) ===

dom.copyTranslationBtn.addEventListener('click', () => {
  if (currentTranslation) {
    copyToClipboard(currentTranslation.translated_text);
  }
});

// === DOWNLOAD TEXT TRANSLATION ===

dom.downloadTextBtn.addEventListener('click', () => {
  if (currentTranslation) {
    const filename = `traduccion_barbaz_${Date.now()}.txt`;
    downloadText(currentTranslation.translated_text, filename);
    showSuccess('Archivo descargado correctamente.');
  }
});

// === FILE UPLOAD ===

function handleFileSelection(file) {
  if (!file) return;

  const allowedExts = ['.pdf', '.docx', '.txt'];
  const ext = '.' + file.name.split('.').pop().toLowerCase();

  if (!allowedExts.includes(ext)) {
    showError(`Formato de archivo no permitido: ${ext}. Use PDF, DOCX o TXT.`);
    return;
  }

  if (file.size > 10 * 1024 * 1024) {
    showError('El archivo excede el límite de 10 MB.');
    return;
  }

  selectedFile = file;
  dom.selectedFileName.textContent = file.name;
  dom.selectedFileSize.textContent = formatFileSize(file.size);
  dom.uploadZone.style.display = 'none';
  dom.fileSelected.style.display = 'block';
  dom.fileResult.style.display = 'none';
}

dom.uploadZone.addEventListener('click', () => dom.fileInput.click());

dom.fileInput.addEventListener('change', (e) => {
  if (e.target.files.length > 0) {
    handleFileSelection(e.target.files[0]);
  }
});

dom.uploadZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dom.uploadZone.classList.add('drag-over');
});

dom.uploadZone.addEventListener('dragleave', (e) => {
  if (!dom.uploadZone.contains(e.relatedTarget)) {
    dom.uploadZone.classList.remove('drag-over');
  }
});

dom.uploadZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dom.uploadZone.classList.remove('drag-over');
  if (e.dataTransfer.files.length > 0) {
    handleFileSelection(e.dataTransfer.files[0]);
  }
});

dom.removeFileBtn.addEventListener('click', () => {
  selectedFile = null;
  dom.fileInput.value = '';
  dom.fileSelected.style.display = 'none';
  dom.uploadZone.style.display = 'block';
  dom.fileResult.style.display = 'none';
});

// === TRANSLATE FILE ===

async function translateFile() {
  if (!selectedFile) {
    showError('Por favor seleccione un archivo para traducir.');
    return;
  }

  const sourceLang = dom.fileSourceLang.value;

  showLoading('Extrayendo y traduciendo el documento jurídico...');
  dom.errorAlert.style.display = 'none';

  try {
    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('source_language', sourceLang);
    formData.append('target_language', 'Spanish');

    const response = await fetch(`${API_BASE}/translate/file`, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ detail: 'Error desconocido del servidor.' }));
      throw new Error(err.detail || `Error ${response.status}`);
    }

    const data = await response.json();

    dom.fileTranslationText.textContent = data.translated_text;
    dom.fileDetectedLang.textContent = `Idioma: ${data.source_language}`;
    dom.fileWordCount.textContent = `${data.word_count.toLocaleString('es')} palabras`;
    dom.fileNameBadge.textContent = data.filename || selectedFile.name;
    dom.fileResult.style.display = 'block';

    currentTranslation = data;

    if (data.legal_terms_glossary && data.legal_terms_glossary.length > 0) {
      updateGlossary(data.legal_terms_glossary, data.source_language);
    }

    showSuccess(`Documento traducido exitosamente. ${data.word_count.toLocaleString('es')} palabras procesadas.`);

    // Scroll to result
    dom.fileResult.scrollIntoView({ behavior: 'smooth', block: 'start' });

  } catch (error) {
    showError(error.message || 'Error al procesar el archivo. Intente nuevamente.');
  } finally {
    hideLoading();
  }
}

dom.translateFileBtn.addEventListener('click', translateFile);

dom.copyFileTranslationBtn.addEventListener('click', () => {
  if (currentTranslation) {
    copyToClipboard(currentTranslation.translated_text);
  }
});

dom.downloadFileBtn.addEventListener('click', () => {
  if (currentTranslation) {
    const baseName = (currentTranslation.filename || 'documento').replace(/\.[^.]+$/, '');
    const filename = `traduccion_${baseName}_${Date.now()}.txt`;
    downloadText(currentTranslation.translated_text, filename);
    showSuccess('Archivo descargado correctamente.');
  }
});

dom.newTranslationBtn.addEventListener('click', () => {
  selectedFile = null;
  dom.fileInput.value = '';
  dom.fileSelected.style.display = 'none';
  dom.uploadZone.style.display = 'block';
  dom.fileResult.style.display = 'none';
  currentTranslation = null;
});

// === GLOSSARY ===

function updateGlossary(terms, sourceLang) {
  currentGlossary = terms;

  dom.glossaryEmpty.style.display = 'none';
  dom.glossaryTableWrapper.style.display = 'block';
  dom.glossaryMeta.textContent = `${terms.length} término${terms.length !== 1 ? 's' : ''} jurídico${terms.length !== 1 ? 's' : ''} identificado${terms.length !== 1 ? 's' : ''} del ${sourceLang || 'idioma de origen'}`;

  dom.glossaryBody.innerHTML = '';
  terms.forEach(item => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${escapeHtml(item.term || '')}</td>
      <td>${escapeHtml(item.translation || '')}</td>
      <td>${escapeHtml(item.context || '')}</td>
    `;
    dom.glossaryBody.appendChild(tr);
  });

  // Smooth scroll hint only if user hasn't already scrolled there
  const glossarySection = document.getElementById('glosario');
  if (glossarySection) {
    const rect = glossarySection.getBoundingClientRect();
    // Only scroll if glossary is not visible
    if (rect.top > window.innerHeight || rect.bottom < 0) {
      setTimeout(() => {
        glossarySection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 800);
    }
  }
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.appendChild(document.createTextNode(text));
  return div.innerHTML;
}

dom.downloadGlossaryBtn.addEventListener('click', () => {
  if (currentGlossary.length > 0) {
    downloadCSV(currentGlossary, `glosario_juridico_barbaz_${Date.now()}.csv`);
    showSuccess('Glosario descargado en formato CSV.');
  }
});

// === ERROR ALERT CLOSE ===

dom.closeErrorBtn.addEventListener('click', () => {
  dom.errorAlert.style.display = 'none';
});

// === NAVIGATION ===

dom.navToggle.addEventListener('click', () => {
  dom.mainNav.classList.toggle('open');
});

// Smooth scroll & active nav link
dom.navLinks.forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const sectionId = link.dataset.section;
    const section = document.getElementById(sectionId);
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      dom.mainNav.classList.remove('open');
    }
    dom.navLinks.forEach(l => l.classList.remove('active'));
    link.classList.add('active');
  });
});

// Update active nav on scroll
const sections = ['inicio', 'traducir', 'glosario', 'acerca'];
const observerOptions = { threshold: 0.3 };
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const id = entry.target.id;
      dom.navLinks.forEach(link => {
        link.classList.toggle('active', link.dataset.section === id);
      });
    }
  });
}, observerOptions);

sections.forEach(id => {
  const el = document.getElementById(id);
  if (el) observer.observe(el);
});

// === KEYBOARD SHORTCUTS INFO ===
// Ctrl+Enter triggers translation from text tab

// === INIT ===
(function init() {
  // Check health on load (non-blocking)
  fetch(`${API_BASE}/health`)
    .then(r => r.json())
    .then(data => {
      if (!data.api_key_configured) {
        showError('Advertencia: La clave ANTHROPIC_API_KEY no está configurada en el servidor. Las traducciones no funcionarán.');
      }
    })
    .catch(() => {
      // Server not reachable — silent fail on init
    });
})();
