/* ============================================================
   MONARCA · Powerlifting Intelligence
   ============================================================ */

const STORE = {
  profile: 'monarca_profile',
  lesiones: 'monarca_lesiones',
  apiKey: 'monarca_api_key',
  model: 'monarca_model',
  lastRM: 'monarca_last_rm',
};

const $ = (id) => document.getElementById(id);

/* ---------- TABS ---------- */
document.querySelectorAll('.tab').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach((b) => b.classList.remove('active'));
    document.querySelectorAll('.panel').forEach((p) => p.classList.remove('active'));
    btn.classList.add('active');
    $(btn.dataset.tab).classList.add('active');
  });
});

/* ---------- PROFILE ---------- */
const profileFields = ['p_nombre','p_apellido','p_edad','p_sexo','p_peso','p_altura','p_femur','p_tibia','p_torso','p_envergadura','p_federacion','p_categoria','p_nivel','p_notas'];

function loadProfile() {
  const data = JSON.parse(localStorage.getItem(STORE.profile) || '{}');
  profileFields.forEach((f) => { if (data[f] !== undefined) $(f).value = data[f]; });
  const lesiones = JSON.parse(localStorage.getItem(STORE.lesiones) || '[]');
  renderLesiones(lesiones);
}

function saveProfile() {
  const data = {};
  profileFields.forEach((f) => data[f] = $(f).value);
  localStorage.setItem(STORE.profile, JSON.stringify(data));
  $('perfil_estado').textContent = '✓ Guardado';
  setTimeout(() => $('perfil_estado').textContent = '', 2500);
}

function getProfile() {
  const data = JSON.parse(localStorage.getItem(STORE.profile) || '{}');
  data.lesiones = JSON.parse(localStorage.getItem(STORE.lesiones) || '[]');
  return data;
}

function renderLesiones(arr) {
  const c = $('lesiones_chips');
  c.innerHTML = '';
  arr.forEach((l, i) => {
    const chip = document.createElement('span');
    chip.className = 'chip';
    chip.innerHTML = `${l}<button data-i="${i}">×</button>`;
    c.appendChild(chip);
  });
  c.querySelectorAll('button').forEach((b) => {
    b.addEventListener('click', () => {
      const a = JSON.parse(localStorage.getItem(STORE.lesiones) || '[]');
      a.splice(Number(b.dataset.i), 1);
      localStorage.setItem(STORE.lesiones, JSON.stringify(a));
      renderLesiones(a);
    });
  });
}

$('add_lesion').addEventListener('click', () => {
  const v = $('p_lesion_input').value.trim();
  if (!v) return;
  const a = JSON.parse(localStorage.getItem(STORE.lesiones) || '[]');
  a.push(v);
  localStorage.setItem(STORE.lesiones, JSON.stringify(a));
  $('p_lesion_input').value = '';
  renderLesiones(a);
});

$('guardar_perfil').addEventListener('click', saveProfile);

/* ---------- 1RM CALCULATOR ---------- */
// RPE → % of 1RM (Reactive Training Systems-style table)
const RPE_TABLE = {
  10:   [100.0, 95.5, 92.2, 89.2, 86.3, 83.7, 81.1, 78.6, 76.2, 73.9, 70.7],
  9.5:  [97.8,  93.9, 90.7, 87.8, 85.0, 82.4, 79.9, 77.4, 75.1, 72.3, 69.4],
  9:    [95.5,  92.2, 89.2, 86.3, 83.7, 81.1, 78.6, 76.2, 73.9, 70.7, 68.0],
  8.5:  [93.9,  90.7, 87.8, 85.0, 82.4, 79.9, 77.4, 75.1, 72.3, 69.4, 66.7],
  8:    [92.2,  89.2, 86.3, 83.7, 81.1, 78.6, 76.2, 73.9, 70.7, 68.0, 65.3],
  7.5:  [90.7,  87.8, 85.0, 82.4, 79.9, 77.4, 75.1, 72.3, 69.4, 66.7, 64.0],
  7:    [89.2,  86.3, 83.7, 81.1, 78.6, 76.2, 73.9, 70.7, 68.0, 65.3, 62.6],
  6.5:  [87.8,  85.0, 82.4, 79.9, 77.4, 75.1, 72.3, 69.4, 66.7, 64.0, 61.3],
  6:    [86.3,  83.7, 81.1, 78.6, 76.2, 73.9, 70.7, 68.0, 65.3, 62.6, 59.9],
};

function epley(w, r) { return w * (1 + r / 30); }
function brzycki(w, r) { return w * (36 / (37 - r)); }
function lombardi(w, r) { return w * Math.pow(r, 0.10); }
function oconner(w, r) { return w * (1 + 0.025 * r); }
function rpeAdjusted(w, r, rpe) {
  const row = RPE_TABLE[rpe];
  if (!row || r < 1 || r > 11) return null;
  const pct = row[r - 1];
  return (w / pct) * 100;
}

$('calcular_rm').addEventListener('click', () => {
  const peso = parseFloat($('rm_peso').value);
  const reps = parseInt($('rm_reps').value);
  const rpe = parseFloat($('rm_rpe').value);
  const lift = $('rm_lift').value;
  if (!peso || !reps || reps < 1) { alert('Ingresa peso y repeticiones válidos.'); return; }

  const e = epley(peso, reps);
  const b = brzycki(peso, reps);
  const l = lombardi(peso, reps);
  const o = oconner(peso, reps);
  const r = rpeAdjusted(peso, reps, rpe);

  $('rm_epley').textContent = e.toFixed(1) + ' kg';
  $('rm_brzycki').textContent = b.toFixed(1) + ' kg';
  $('rm_lombardi').textContent = l.toFixed(1) + ' kg';
  $('rm_oconner').textContent = o.toFixed(1) + ' kg';
  $('rm_rpe_adj').textContent = r ? r.toFixed(1) + ' kg' : 'n/d';

  // Final 1RM: weighted average favoring RPE-adjusted when available
  let final;
  if (r) {
    final = (r * 0.5 + e * 0.2 + b * 0.2 + o * 0.1);
  } else {
    final = (e + b + o) / 3;
  }
  $('rm_result').textContent = final.toFixed(1);
  $('rm_formula').textContent = r ? `Promedio ponderado · RPE ${rpe} · ${lift}` : `Promedio multi-fórmula · ${lift}`;

  const last = JSON.parse(localStorage.getItem(STORE.lastRM) || '{}');
  last[lift] = final;
  localStorage.setItem(STORE.lastRM, JSON.stringify(last));

  updateBlocks(final, lift);
});

/* ---------- BLOCKS ---------- */
function updateBlocks(rm, lift) {
  const round = (x) => (Math.round(x / 2.5) * 2.5).toFixed(1);
  const block = (label, percents, sets, reps) =>
    `${label} · ${lift}\n` +
    percents.map((p) => `  ${p}% → ${round(rm * p / 100)} kg`).join('\n') +
    `\nProtocolo: ${sets} × ${reps}`;

  $('block_hipertrofia').textContent = block('HIPERTROFIA', [65, 70, 75], '4-6', '8-12');
  $('block_volumen').textContent = block('VOLUMEN/FUERZA', [77, 82, 87], '3-5', '3-6');
  $('block_peak').textContent = block('PEAK', [92, 97, 102], '2-4', '1-2');
}

// Load last RM into blocks on page load
(function initBlocks() {
  const last = JSON.parse(localStorage.getItem(STORE.lastRM) || '{}');
  const liftNames = Object.keys(last);
  if (liftNames.length) {
    const lift = liftNames[0];
    updateBlocks(last[lift], lift);
  }
})();

/* ---------- API CONFIG ---------- */
function loadApi() {
  $('api_key').value = localStorage.getItem(STORE.apiKey) || '';
  $('api_model').value = localStorage.getItem(STORE.model) || 'claude-sonnet-4-6';
}
$('guardar_api').addEventListener('click', () => {
  localStorage.setItem(STORE.apiKey, $('api_key').value.trim());
  localStorage.setItem(STORE.model, $('api_model').value);
  $('api_estado').textContent = '✓ Guardado en este navegador';
  setTimeout(() => $('api_estado').textContent = '', 2500);
});

/* ---------- VIDEO DROPZONE + FRAME EXTRACTION ---------- */
let currentVideoFile = null;
let extractedFrames = [];

const dz = $('dropzone');
dz.addEventListener('click', () => $('video_input').click());
dz.addEventListener('dragover', (e) => { e.preventDefault(); dz.classList.add('dragover'); });
dz.addEventListener('dragleave', () => dz.classList.remove('dragover'));
dz.addEventListener('drop', (e) => {
  e.preventDefault();
  dz.classList.remove('dragover');
  if (e.dataTransfer.files[0]) handleVideo(e.dataTransfer.files[0]);
});
$('video_input').addEventListener('change', (e) => {
  if (e.target.files[0]) handleVideo(e.target.files[0]);
});

function handleVideo(file) {
  if (!file.type.startsWith('video/')) { alert('Selecciona un archivo de video.'); return; }
  currentVideoFile = file;
  const v = $('video_preview');
  v.src = URL.createObjectURL(file);
  v.hidden = false;
  dz.style.display = 'none';
  $('analizar_btn').disabled = false;
  extractedFrames = [];
  $('frames_row').innerHTML = '';
}

async function extractFrames(videoEl, count = 6) {
  return new Promise((resolve) => {
    const frames = [];
    const duration = videoEl.duration;
    const interval = duration / (count + 1);
    let i = 1;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    const grab = () => {
      videoEl.currentTime = interval * i;
    };
    const onSeek = () => {
      const targetW = 640;
      const scale = targetW / videoEl.videoWidth;
      canvas.width = targetW;
      canvas.height = videoEl.videoHeight * scale;
      ctx.drawImage(videoEl, 0, 0, canvas.width, canvas.height);
      frames.push(canvas.toDataURL('image/jpeg', 0.78));
      i++;
      if (i > count) {
        videoEl.removeEventListener('seeked', onSeek);
        resolve(frames);
      } else {
        grab();
      }
    };
    videoEl.addEventListener('seeked', onSeek);
    grab();
  });
}

/* ---------- CLAUDE API ---------- */
async function callClaude({ system, messages, max_tokens = 1400 }) {
  const apiKey = localStorage.getItem(STORE.apiKey);
  const model = localStorage.getItem(STORE.model) || 'claude-sonnet-4-6';
  if (!apiKey) throw new Error('Configura tu API key en la pestaña API.');

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-dangerous-direct-browser-access': 'true',
    },
    body: JSON.stringify({ model, max_tokens, system, messages }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`API error ${res.status}: ${err}`);
  }
  const data = await res.json();
  return data.content.map((b) => b.text).filter(Boolean).join('\n');
}

function profileBlock() {
  const p = getProfile();
  const has = (k) => p[k] && p[k] !== '';
  const parts = [];
  if (has('p_nombre')) parts.push(`Nombre: ${p.p_nombre} ${p.p_apellido || ''}`);
  if (has('p_edad')) parts.push(`Edad: ${p.p_edad}`);
  if (has('p_sexo')) parts.push(`Sexo: ${p.p_sexo}`);
  if (has('p_peso')) parts.push(`Peso: ${p.p_peso} kg`);
  if (has('p_altura')) parts.push(`Altura: ${p.p_altura} cm`);
  if (has('p_femur')) parts.push(`Fémur: ${p.p_femur} cm`);
  if (has('p_tibia')) parts.push(`Tibia: ${p.p_tibia} cm`);
  if (has('p_torso')) parts.push(`Torso: ${p.p_torso} cm`);
  if (has('p_envergadura')) parts.push(`Envergadura: ${p.p_envergadura} cm`);
  if (has('p_nivel')) parts.push(`Nivel: ${p.p_nivel}`);
  if (has('p_categoria')) parts.push(`Categoría: ${p.p_categoria} kg`);
  if (p.lesiones && p.lesiones.length) parts.push(`Lesiones: ${p.lesiones.join('; ')}`);
  if (has('p_notas')) parts.push(`Notas médicas: ${p.p_notas}`);
  return parts.length ? parts.join('\n') : 'Sin perfil cargado.';
}

const COACH_SYSTEM = `Eres MONARCA Coach, un entrenador de powerlifting con 20+ años de experiencia analizando técnica de competidores de IPF y federaciones internacionales.

REGLAS DE COMUNICACIÓN:
- DIRECTO. Sin relleno, sin "podría", sin "tal vez". Afirmas o no hablas.
- PUNTUAL. Cada observación = un error técnico específico + un cue de corrección de UNA frase.
- CONCRETO. Cita el momento exacto (fotograma, fase del levantamiento).
- AJUSTADO AL CUERPO. Si el atleta tiene fémur largo, NO le pides torso vertical en sentadilla. Si tiene brazos largos, NO le pides ROM extremo en banca. Adaptas según las palancas reales reportadas.
- SIN PIEDAD pero SIN INSULTO. El tono es el de un coach experto, no un troll.
- JERARQUIZAS. Errores que ponen en riesgo la espalda/articulaciones primero. Eficiencia después.

FORMATO DE SALIDA (markdown, secciones cortas):
**Veredicto** (1 frase, calificación: VÁLIDO / NO VÁLIDO en competencia, y por qué).
**Errores críticos** (lista, máximo 3, cada uno: error + cue de corrección).
**Eficiencia** (lista, máximo 3, cada uno: punto a mejorar + cue).
**Ajuste a tus palancas** (1-2 frases sobre cómo TU cuerpo modifica la ejecución ideal).
**Próxima sesión** (1 ejercicio accesorio específico para corregir el error #1).`;

/* ---------- VIDEO ANALYSIS ---------- */
$('analizar_btn').addEventListener('click', async () => {
  if (!currentVideoFile) return;
  const lift = $('ia_lift').value;
  const notas = $('ia_notas').value.trim();
  const out = $('ia_output');
  out.innerHTML = '<span class="loader"></span> Extrayendo fotogramas...';

  const v = $('video_preview');
  if (v.readyState < 2) {
    await new Promise((r) => v.addEventListener('loadeddata', r, { once: true }));
  }

  try {
    extractedFrames = await extractFrames(v, 6);

    // Render thumbnails
    const fr = $('frames_row');
    fr.innerHTML = '';
    extractedFrames.forEach((src) => {
      const img = document.createElement('img');
      img.src = src;
      fr.appendChild(img);
    });

    out.innerHTML = '<span class="loader"></span> Analizando ejecución con IA...';

    const content = [
      { type: 'text', text:
        `LEVANTAMIENTO: ${lift}\n\n` +
        `PERFIL DEL ATLETA:\n${profileBlock()}\n\n` +
        (notas ? `NOTAS DEL ATLETA: ${notas}\n\n` : '') +
        `Analiza los ${extractedFrames.length} fotogramas (en orden cronológico) del levantamiento. ` +
        `Aplica las reglas de comunicación del system prompt al pie de la letra.`
      },
      ...extractedFrames.map((dataUrl) => ({
        type: 'image',
        source: { type: 'base64', media_type: 'image/jpeg', data: dataUrl.split(',')[1] },
      })),
    ];

    const text = await callClaude({
      system: COACH_SYSTEM,
      messages: [{ role: 'user', content }],
      max_tokens: 1600,
    });

    out.innerHTML = renderMarkdown(text);
  } catch (e) {
    out.innerHTML = `<span style="color:#ff6b6b">Error: ${e.message}</span>`;
  }
});

/* ---------- IDEAL REFERENCE ---------- */
$('generar_ref').addEventListener('click', async () => {
  const lift = $('ia_lift').value;
  const refBox = $('ref_image');
  const cuesBox = $('cues_output');
  refBox.innerHTML = '<span class="loader"></span> Generando descripción de ejecución ideal...';
  cuesBox.innerHTML = '<span class="loader"></span> Generando cues...';

  try {
    const refText = await callClaude({
      system: `Eres un coach de powerlifting. Describe la ejecución técnica IDEAL del levantamiento solicitado, AJUSTADA a las palancas del atleta. Formato: lista numerada de fases (setup → bajada → fondo → subida → lockout). Máximo 8 puntos. Cada punto es una instrucción concreta. Sin relleno.`,
      messages: [{ role: 'user', content: `Levantamiento: ${lift}\n\nPerfil:\n${profileBlock()}` }],
      max_tokens: 900,
    });
    refBox.innerHTML = renderMarkdown(refText);

    const cuesText = await callClaude({
      system: `Eres un coach. Genera 5 cues mentales cortos (máximo 6 palabras cada uno) específicos para las palancas del atleta. Formato: lista, sin explicación, solo el cue.`,
      messages: [{ role: 'user', content: `Levantamiento: ${lift}\n\nPerfil:\n${profileBlock()}` }],
      max_tokens: 400,
    });
    cuesBox.innerHTML = renderMarkdown(cuesText);
  } catch (e) {
    refBox.innerHTML = `<span style="color:#ff6b6b">Error: ${e.message}</span>`;
    cuesBox.innerHTML = '';
  }
});

/* ---------- MARKDOWN MINI-RENDERER ---------- */
function renderMarkdown(t) {
  let html = t
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/^### (.+)$/gm, '<h4>$1</h4>')
    .replace(/^## (.+)$/gm, '<h4>$1</h4>')
    .replace(/^# (.+)$/gm, '<h4>$1</h4>');

  const lines = html.split('\n');
  const out = [];
  let inList = false;
  for (const line of lines) {
    if (/^\s*[-*]\s+/.test(line)) {
      if (!inList) { out.push('<ul>'); inList = true; }
      out.push('<li>' + line.replace(/^\s*[-*]\s+/, '') + '</li>');
    } else if (/^\s*\d+\.\s+/.test(line)) {
      if (!inList) { out.push('<ul>'); inList = true; }
      out.push('<li>' + line.replace(/^\s*\d+\.\s+/, '') + '</li>');
    } else {
      if (inList) { out.push('</ul>'); inList = false; }
      out.push(line);
    }
  }
  if (inList) out.push('</ul>');
  return out.join('\n');
}

/* ---------- INIT ---------- */
loadProfile();
loadApi();
