/* ============================================================
   MONARCA · Powerlifting Intelligence
   ============================================================ */

const STORE = {
  profile:   'monarca_profile',
  lesiones:  'monarca_lesiones',
  apiKey:    'monarca_api_key',
  model:     'monarca_model',
  geminiKey: 'monarca_gemini_key',
  geminiMod: 'monarca_gemini_model',
  provider:  'monarca_provider',
  lastRM:    'monarca_last_rm',
};

const $ = (id) => document.getElementById(id);

/* =========================================================
   TABS
   ========================================================= */
document.querySelectorAll('.tab').forEach((btn) => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.tab').forEach((b) => b.classList.remove('active'));
    document.querySelectorAll('.panel').forEach((p) => p.classList.remove('active'));
    btn.classList.add('active');
    $(btn.dataset.tab).classList.add('active');
  });
});

/* =========================================================
   PROFILE
   ========================================================= */
const profileFields = [
  'p_nombre','p_apellido','p_edad','p_sexo','p_peso','p_altura',
  'p_femur','p_tibia','p_torso','p_envergadura','p_federacion','p_categoria','p_nivel','p_notas',
];

function loadProfile() {
  const data = JSON.parse(localStorage.getItem(STORE.profile) || '{}');
  profileFields.forEach((f) => { if (data[f] !== undefined && $(f)) $(f).value = data[f]; });
  renderLesiones(JSON.parse(localStorage.getItem(STORE.lesiones) || '[]'));
}

function saveProfile() {
  const data = {};
  profileFields.forEach((f) => data[f] = $(f) ? $(f).value : '');
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

/* =========================================================
   1RM CALCULATOR (RTS RPE table)
   ========================================================= */
const RPE_TABLE = {
  10:   [100.0,95.5,92.2,89.2,86.3,83.7,81.1,78.6,76.2,73.9,70.7],
  9.5:  [97.8, 93.9,90.7,87.8,85.0,82.4,79.9,77.4,75.1,72.3,69.4],
  9:    [95.5, 92.2,89.2,86.3,83.7,81.1,78.6,76.2,73.9,70.7,68.0],
  8.5:  [93.9, 90.7,87.8,85.0,82.4,79.9,77.4,75.1,72.3,69.4,66.7],
  8:    [92.2, 89.2,86.3,83.7,81.1,78.6,76.2,73.9,70.7,68.0,65.3],
  7.5:  [90.7, 87.8,85.0,82.4,79.9,77.4,75.1,72.3,69.4,66.7,64.0],
  7:    [89.2, 86.3,83.7,81.1,78.6,76.2,73.9,70.7,68.0,65.3,62.6],
  6.5:  [87.8, 85.0,82.4,79.9,77.4,75.1,72.3,69.4,66.7,64.0,61.3],
  6:    [86.3, 83.7,81.1,78.6,76.2,73.9,70.7,68.0,65.3,62.6,59.9],
};
const epley     = (w,r) => w*(1+r/30);
const brzycki   = (w,r) => w*(36/(37-r));
const lombardi  = (w,r) => w*Math.pow(r,0.10);
const oconner   = (w,r) => w*(1+0.025*r);
const rpeAdj    = (w,r,rpe) => { const row=RPE_TABLE[rpe]; if(!row||r<1||r>11) return null; return (w/row[r-1])*100; };

$('calcular_rm').addEventListener('click', () => {
  const peso = parseFloat($('rm_peso').value);
  const reps = parseInt($('rm_reps').value);
  const rpe  = parseFloat($('rm_rpe').value);
  const lift = $('rm_lift').value;
  if (!peso || !reps || reps < 1) { alert('Ingresa peso y repeticiones válidos.'); return; }

  const e=epley(peso,reps), b=brzycki(peso,reps), l=lombardi(peso,reps), o=oconner(peso,reps), r=rpeAdj(peso,reps,rpe);
  $('rm_epley').textContent    = e.toFixed(1)+' kg';
  $('rm_brzycki').textContent  = b.toFixed(1)+' kg';
  $('rm_lombardi').textContent = l.toFixed(1)+' kg';
  $('rm_oconner').textContent  = o.toFixed(1)+' kg';
  $('rm_rpe_adj').textContent  = r ? r.toFixed(1)+' kg' : 'n/d';

  const final = r ? r*0.5+e*0.2+b*0.2+o*0.1 : (e+b+o)/3;
  $('rm_result').textContent  = final.toFixed(1);
  $('rm_formula').textContent = r ? `Promedio ponderado · RPE ${rpe} · ${lift}` : `Promedio multi-fórmula · ${lift}`;

  const last = JSON.parse(localStorage.getItem(STORE.lastRM)||'{}');
  last[lift] = final;
  localStorage.setItem(STORE.lastRM, JSON.stringify(last));
  updateBlocks(final, lift);
});

/* =========================================================
   BLOCKS
   ========================================================= */
function updateBlocks(rm, lift) {
  const round = (x) => (Math.round(x/2.5)*2.5).toFixed(1);
  const block = (label, percents, sets, reps) =>
    `${label} · ${lift}\n`+percents.map((p)=>`  ${p}% → ${round(rm*p/100)} kg`).join('\n')+`\nProtocolo: ${sets} × ${reps}`;
  $('block_hipertrofia').textContent = block('HIPERTROFIA',[65,70,75],'4-6','8-12');
  $('block_volumen').textContent     = block('VOLUMEN/FUERZA',[77,82,87],'3-5','3-6');
  $('block_peak').textContent        = block('PEAK',[92,97,102],'2-4','1-2');
}
(function initBlocks() {
  const last = JSON.parse(localStorage.getItem(STORE.lastRM)||'{}');
  const keys = Object.keys(last);
  if (keys.length) updateBlocks(last[keys[0]], keys[0]);
})();

/* =========================================================
   API CONFIG
   ========================================================= */
function updateProviderUI() {
  const prov = $('api_provider').value;
  $('gemini_fields').style.display    = prov==='gemini'    ? '' : 'none';
  $('anthropic_fields').style.display = prov==='anthropic' ? '' : 'none';
  const badge = $('api_badge');
  if (badge) {
    badge.textContent = prov === 'gemini' ? '● GEMINI' : '● CLAUDE';
    badge.style.color = prov === 'gemini' ? '#4ade80' : '#a855f7';
  }
}

function loadApi() {
  const prov = localStorage.getItem(STORE.provider) || 'gemini';
  $('api_provider').value  = prov;
  if ($('gemini_key'))  $('gemini_key').value  = localStorage.getItem(STORE.geminiKey) || '';
  if ($('gemini_model'))$('gemini_model').value = localStorage.getItem(STORE.geminiMod) || 'gemini-2.0-flash';
  if ($('api_key'))     $('api_key').value      = localStorage.getItem(STORE.apiKey)    || '';
  if ($('api_model'))   $('api_model').value    = localStorage.getItem(STORE.model)     || 'claude-sonnet-4-6';
  updateProviderUI();
}

$('api_provider').addEventListener('change', updateProviderUI);
$('guardar_api').addEventListener('click', () => {
  const prov = $('api_provider').value;
  localStorage.setItem(STORE.provider,  prov);
  if ($('gemini_key'))  localStorage.setItem(STORE.geminiKey, $('gemini_key').value.trim());
  if ($('gemini_model'))localStorage.setItem(STORE.geminiMod, $('gemini_model').value);
  if ($('api_key'))     localStorage.setItem(STORE.apiKey,    $('api_key').value.trim());
  if ($('api_model'))   localStorage.setItem(STORE.model,     $('api_model').value);
  updateProviderUI();
  $('api_estado').textContent = '✓ Guardado en este navegador';
  setTimeout(() => $('api_estado').textContent = '', 2500);
});

/* =========================================================
   AI CALLS  (Gemini / Anthropic)
   ========================================================= */
function profileBlock() {
  const p = getProfile();
  const has = (k) => p[k] && p[k]!=='';
  const parts = [];
  if(has('p_nombre'))      parts.push(`Nombre: ${p.p_nombre} ${p.p_apellido||''}`);
  if(has('p_edad'))        parts.push(`Edad: ${p.p_edad}`);
  if(has('p_sexo'))        parts.push(`Sexo: ${p.p_sexo}`);
  if(has('p_peso'))        parts.push(`Peso: ${p.p_peso} kg`);
  if(has('p_altura'))      parts.push(`Altura: ${p.p_altura} cm`);
  if(has('p_femur'))       parts.push(`Fémur: ${p.p_femur} cm`);
  if(has('p_tibia'))       parts.push(`Tibia: ${p.p_tibia} cm`);
  if(has('p_torso'))       parts.push(`Torso: ${p.p_torso} cm`);
  if(has('p_envergadura')) parts.push(`Envergadura: ${p.p_envergadura} cm`);
  if(has('p_nivel'))       parts.push(`Nivel: ${p.p_nivel}`);
  if(has('p_categoria'))   parts.push(`Categoría: ${p.p_categoria} kg`);
  if(p.lesiones&&p.lesiones.length) parts.push(`Lesiones: ${p.lesiones.join('; ')}`);
  if(has('p_notas'))       parts.push(`Notas médicas: ${p.p_notas}`);
  return parts.length ? parts.join('\n') : 'Sin perfil cargado.';
}

const COACH_SYSTEM = `Eres MONARCA Coach, entrenador élite de powerlifting IPF. Reglas inquebrantables:
- DIRECTO: sin "podría", sin "tal vez", sin relleno. Afirmas o callas.
- PUNTUAL: cada observación = error específico + cue de corrección en UNA frase.
- CONCRETO: cita la fase exacta (setup, bajada, fondo, subida, lockout).
- PALANCAS: adaptas la técnica ideal al cuerpo del atleta. Fémur largo = más inclinación de torso en sentadilla, NO es un error.
- JERARQUÍAS: riesgo de lesión primero, eficiencia después.
FORMATO (markdown estricto):
**Veredicto** (1 frase · VÁLIDO / NO VÁLIDO en competencia · motivo).
**Errores críticos** (lista · máx 3 · error + cue).
**Eficiencia** (lista · máx 3 · mejora + cue).
**Tus palancas** (1-2 frases de cómo tu cuerpo modifica la técnica estándar).
**Próxima sesión** (1 ejercicio accesorio concreto para el error #1).`;

async function callGemini({ prompt, images = [], maxTokens = 1600 }) {
  const key   = localStorage.getItem(STORE.geminiKey);
  const model = localStorage.getItem(STORE.geminiMod) || 'gemini-2.0-flash';
  if (!key) throw new Error('Configura tu Gemini API key en la pestaña API. Consíguela gratis en aistudio.google.com/apikey');

  const parts = [{ text: prompt }];
  images.forEach((b64) => {
    parts.push({ inlineData: { mimeType: 'image/jpeg', data: b64 } });
  });

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: COACH_SYSTEM }] },
        contents: [{ role: 'user', parts }],
        generationConfig: { maxOutputTokens: maxTokens, temperature: 0.4 },
      }),
    }
  );
  if (!res.ok) { const err = await res.text(); throw new Error(`Gemini ${res.status}: ${err}`); }
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.map((p)=>p.text).join('\n') || '';
}

async function callGeminiText({ system, prompt, maxTokens = 1200 }) {
  const key   = localStorage.getItem(STORE.geminiKey);
  const model = localStorage.getItem(STORE.geminiMod) || 'gemini-2.0-flash';
  if (!key) throw new Error('Configura tu Gemini API key.');

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${key}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: system }] },
        contents: [{ role: 'user', parts: [{ text: prompt }] }],
        generationConfig: { maxOutputTokens: maxTokens, temperature: 0.35 },
      }),
    }
  );
  if (!res.ok) { const err = await res.text(); throw new Error(`Gemini ${res.status}: ${err}`); }
  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.map((p)=>p.text).join('\n') || '';
}

async function callClaude({ system, messages, max_tokens = 1400 }) {
  const apiKey = localStorage.getItem(STORE.apiKey);
  const model  = localStorage.getItem(STORE.model) || 'claude-sonnet-4-6';
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
  if (!res.ok) { const err = await res.text(); throw new Error(`API error ${res.status}: ${err}`); }
  const data = await res.json();
  return data.content.map((b)=>b.text).filter(Boolean).join('\n');
}

async function aiAnalyze(lift, notas, frameB64s) {
  const prov   = localStorage.getItem(STORE.provider) || 'gemini';
  const profTxt = profileBlock();
  const prompt  = `LEVANTAMIENTO: ${lift}\n\nPERFIL DEL ATLETA:\n${profTxt}\n\n${notas?`NOTAS: ${notas}\n\n`:''}`+
    `Analiza los ${frameB64s.length} fotogramas en orden cronológico. Los fotogramas ya tienen dibujado el esqueleto y ángulos articulares detectados por MediaPipe. Aplica las reglas del system prompt.`;

  if (prov === 'gemini') {
    return callGemini({ prompt, images: frameB64s, maxTokens: 1600 });
  } else {
    const content = [
      { type: 'text', text: prompt },
      ...frameB64s.map((d) => ({ type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: d } })),
    ];
    return callClaude({ system: COACH_SYSTEM, messages: [{ role: 'user', content }], max_tokens: 1600 });
  }
}

async function aiText(system, prompt) {
  const prov = localStorage.getItem(STORE.provider) || 'gemini';
  if (prov === 'gemini') {
    return callGeminiText({ system, prompt, maxTokens: 1000 });
  } else {
    return callClaude({ system, messages: [{ role: 'user', content: prompt }], max_tokens: 900 });
  }
}

/* =========================================================
   MEDIAPIPE POSE — esqueleto + líneas de fuerza
   ========================================================= */

// Conexiones de esqueleto simplificadas (índices MediaPipe Pose)
const POSE_CONNECTIONS = [
  [11,12],[11,13],[13,15],[12,14],[14,16],
  [11,23],[12,24],[23,24],[23,25],[24,26],[25,27],[26,28],[27,29],[28,30],[29,31],[30,32],
];

// Articulaciones clave que evaluamos para powerlifting
const KEY_JOINTS = {
  left_knee:  [23,25,27],
  right_knee: [24,26,28],
  left_hip:   [11,23,25],
  right_hip:  [12,24,26],
  left_elbow: [11,13,15],
  right_elbow:[12,14,16],
};

function angle3(a, b, c) {
  const BA = { x: a.x-b.x, y: a.y-b.y };
  const BC = { x: c.x-b.x, y: c.y-b.y };
  const dot = BA.x*BC.x + BA.y*BC.y;
  const magBA = Math.hypot(BA.x, BA.y);
  const magBC = Math.hypot(BC.x, BC.y);
  if (magBA===0 || magBC===0) return 0;
  return Math.acos(Math.max(-1, Math.min(1, dot/(magBA*magBC)))) * (180/Math.PI);
}

// Color del joint según el ángulo (riesgo)
function jointColor(angleDeg, type) {
  if (type.includes('knee')) {
    // Rodilla: < 70° = muy cerrado, > 170° = casi extendido en fondo = malo
    if (angleDeg < 70 || angleDeg > 170) return '#ff4444';
    if (angleDeg < 85 || angleDeg > 155) return '#fbbf24';
    return '#4ade80';
  }
  if (type.includes('hip')) {
    if (angleDeg < 55) return '#ff4444';
    if (angleDeg < 75) return '#fbbf24';
    return '#4ade80';
  }
  if (type.includes('elbow')) {
    if (angleDeg < 50 || angleDeg > 160) return '#ff4444';
    return '#4ade80';
  }
  return '#a855f7';
}

function drawPoseOnCanvas(canvas, landmarks, angleData) {
  const ctx = canvas.getContext('2d');
  const W = canvas.width, H = canvas.height;

  // Línea de fuerza: centro de masa estimado (promedio cadera) → barra (hombros)
  const lHip  = landmarks[23], rHip  = landmarks[24];
  const lSho  = landmarks[11], rSho  = landmarks[12];
  if (lHip && rHip && lSho && rSho) {
    const hipCx  = (lHip.x+rHip.x)/2*W;
    const hipCy  = (lHip.y+rHip.y)/2*H;
    const shoCx  = (lSho.x+rSho.x)/2*W;
    const shoCy  = (lSho.y+rSho.y)/2*H;
    // Línea de fuerza ideal: vertical desde las caderas hacia arriba
    const dx = Math.abs(shoCx - hipCx);
    const lineColor = dx < W*0.04 ? '#4ade80' : dx < W*0.09 ? '#fbbf24' : '#ff4444';

    ctx.save();
    ctx.setLineDash([6,4]);
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = 2.5;
    ctx.globalAlpha = 0.85;
    ctx.beginPath();
    ctx.moveTo(hipCx, hipCy);
    ctx.lineTo(shoCx, shoCy);
    ctx.stroke();
    // Etiqueta de línea de fuerza
    ctx.globalAlpha = 0.92;
    ctx.setLineDash([]);
    ctx.font = 'bold 10px Inter, sans-serif';
    ctx.fillStyle = lineColor;
    ctx.fillText('FUERZA', shoCx+4, shoCy-4);
    ctx.restore();
  }

  // Esqueleto
  ctx.save();
  ctx.strokeStyle = '#c084fc';
  ctx.lineWidth = 1.8;
  ctx.globalAlpha = 0.7;
  POSE_CONNECTIONS.forEach(([a,b]) => {
    const pa = landmarks[a], pb = landmarks[b];
    if (!pa || !pb || pa.visibility < 0.4 || pb.visibility < 0.4) return;
    ctx.beginPath();
    ctx.moveTo(pa.x*W, pa.y*H);
    ctx.lineTo(pb.x*W, pb.y*H);
    ctx.stroke();
  });

  // Joints clave con ángulos
  Object.entries(KEY_JOINTS).forEach(([type, [ai,bi,ci]]) => {
    const pa=landmarks[ai], pb=landmarks[bi], pc=landmarks[ci];
    if (!pa||!pb||!pc) return;
    if (pa.visibility<0.4||pb.visibility<0.4||pc.visibility<0.4) return;
    const ang = angle3(
      {x:pa.x*W,y:pa.y*H},
      {x:pb.x*W,y:pb.y*H},
      {x:pc.x*W,y:pc.y*H}
    );
    const color = jointColor(ang, type);
    ctx.globalAlpha = 1;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(pb.x*W, pb.y*H, 5, 0, Math.PI*2);
    ctx.fill();
    ctx.font = 'bold 9px Inter, sans-serif';
    ctx.fillStyle = '#fff';
    ctx.globalAlpha = 0.9;
    ctx.fillText(`${Math.round(ang)}°`, pb.x*W+6, pb.y*H-4);
    if (angleData) angleData[type] = Math.round(ang);
  });

  ctx.restore();
}

let poseInstance = null;

async function getPose() {
  if (poseInstance) return poseInstance;
  if (typeof Pose === 'undefined') return null;
  return new Promise((resolve) => {
    const pose = new Pose({ locateFile: (f) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${f}` });
    pose.setOptions({ modelComplexity: 1, smoothLandmarks: true, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5 });
    pose.initialize().then(() => { poseInstance = pose; resolve(pose); }).catch(() => resolve(null));
  });
}

async function processFrameWithPose(pose, dataUrl) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = async () => {
      const canvas = document.createElement('canvas');
      canvas.width  = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);

      const angleData = {};
      pose.onResults((results) => {
        if (results.poseLandmarks) {
          drawPoseOnCanvas(canvas, results.poseLandmarks, angleData);
        }
        resolve({ dataUrl: canvas.toDataURL('image/jpeg', 0.82), angles: angleData });
      });

      try { await pose.send({ image: canvas }); }
      catch { resolve({ dataUrl, angles: {} }); }
    };
    img.onerror = () => resolve({ dataUrl, angles: {} });
    img.src = dataUrl;
  });
}

/* =========================================================
   VIDEO: dropzone + extracción de frames
   ========================================================= */
let currentVideoFile = null;
let rawFrames        = [];
let processedFrames  = [];

const dz = $('dropzone');
dz.addEventListener('click', ()=>$('video_input').click());
dz.addEventListener('dragover', (e)=>{ e.preventDefault(); dz.classList.add('dragover'); });
dz.addEventListener('dragleave', ()=>dz.classList.remove('dragover'));
dz.addEventListener('drop', (e)=>{ e.preventDefault(); dz.classList.remove('dragover'); if(e.dataTransfer.files[0]) handleVideo(e.dataTransfer.files[0]); });
$('video_input').addEventListener('change', (e)=>{ if(e.target.files[0]) handleVideo(e.target.files[0]); });

function handleVideo(file) {
  if (!file.type.startsWith('video/')) { alert('Selecciona un archivo de video.'); return; }
  currentVideoFile = file;
  const v = $('video_preview');
  v.src = URL.createObjectURL(file);
  v.hidden = false;
  dz.style.display = 'none';
  $('analizar_btn').disabled = false;
  rawFrames = []; processedFrames = [];
  $('frames_row').innerHTML = '';
}

async function extractRawFrames(videoEl, count=6) {
  return new Promise((resolve) => {
    const frames=[], dur=videoEl.duration, interval=dur/(count+1);
    let i=1;
    const canvas=document.createElement('canvas');
    const ctx=canvas.getContext('2d');
    const grab=()=>{ videoEl.currentTime=interval*i; };
    const onSeek=()=>{
      const W=640, scale=W/videoEl.videoWidth;
      canvas.width=W; canvas.height=videoEl.videoHeight*scale;
      ctx.drawImage(videoEl,0,0,canvas.width,canvas.height);
      frames.push(canvas.toDataURL('image/jpeg',0.82));
      i++;
      if(i>count){ videoEl.removeEventListener('seeked',onSeek); resolve(frames); }
      else grab();
    };
    videoEl.addEventListener('seeked',onSeek);
    grab();
  });
}

function renderFrameThumbnail(dataUrl, idx) {
  const fr = $('frames_row');
  let wrapper = fr.querySelector(`[data-idx="${idx}"]`);
  if (!wrapper) {
    wrapper = document.createElement('div');
    wrapper.dataset.idx = idx;
    wrapper.style.cssText = 'position:relative;display:inline-block';
    fr.appendChild(wrapper);
  }
  const img = document.createElement('img');
  img.src = dataUrl;
  wrapper.innerHTML = '';
  wrapper.appendChild(img);
}

/* =========================================================
   ANALYSIS BUTTON
   ========================================================= */
$('analizar_btn').addEventListener('click', async () => {
  if (!currentVideoFile) return;
  const lift  = $('ia_lift').value;
  const notas = $('ia_notas').value.trim();
  const out   = $('ia_output');

  const v = $('video_preview');
  if (v.readyState < 2) await new Promise((r)=>v.addEventListener('loadeddata',r,{once:true}));

  out.innerHTML = '<span class="loader"></span> Extrayendo fotogramas...';
  $('frames_row').innerHTML = '';

  try {
    rawFrames = await extractRawFrames(v, 6);
    rawFrames.forEach((src,i)=>renderFrameThumbnail(src,i));

    // MediaPipe pose overlay
    out.innerHTML = '<span class="loader"></span> Detectando esqueleto y calculando ángulos...';
    const pose = await getPose();
    if (pose) {
      processedFrames = [];
      for (let i=0; i<rawFrames.length; i++) {
        out.innerHTML = `<span class="loader"></span> Analizando fotograma ${i+1}/${rawFrames.length}...`;
        const { dataUrl } = await processFrameWithPose(pose, rawFrames[i]);
        processedFrames.push(dataUrl);
        renderFrameThumbnail(dataUrl, i);
      }
    } else {
      processedFrames = [...rawFrames];
    }

    out.innerHTML = '<span class="loader"></span> Enviando a IA coach...';
    const b64s = processedFrames.map((d)=>d.split(',')[1]);
    const text = await aiAnalyze(lift, notas, b64s);
    out.innerHTML = renderMarkdown(text);

  } catch(e) {
    out.innerHTML = `<span style="color:#ff6b6b">Error: ${e.message}</span>`;
  }
});

/* =========================================================
   REFERENCIA IDEAL + CUES
   ========================================================= */
$('generar_ref').addEventListener('click', async () => {
  const lift = $('ia_lift').value;
  const refBox  = $('ref_image');
  const cuesBox = $('cues_output');
  refBox.innerHTML  = '<span class="loader"></span> Generando ejecución ideal...';
  cuesBox.innerHTML = '<span class="loader"></span> Generando cues...';

  const perfil = profileBlock();
  try {
    const [refText, cuesText] = await Promise.all([
      aiText(
        `Eres un coach de powerlifting élite. Describe la ejecución técnica IDEAL de ${lift}, AJUSTADA a las palancas del atleta. Lista numerada de fases: setup → bajada → fondo → subida → lockout. Máx 8 puntos. Cada punto = instrucción concreta. Sin relleno.`,
        `Levantamiento: ${lift}\n\nPerfil:\n${perfil}`
      ),
      aiText(
        `Eres un coach. Genera exactamente 5 cues mentales para powerlifting. Máx 6 palabras cada uno. Solo la lista, sin explicación. Adaptados a las palancas del atleta.`,
        `Levantamiento: ${lift}\n\nPerfil:\n${perfil}`
      ),
    ]);
    refBox.innerHTML  = renderMarkdown(refText);
    cuesBox.innerHTML = renderMarkdown(cuesText);
  } catch(e) {
    refBox.innerHTML  = `<span style="color:#ff6b6b">Error: ${e.message}</span>`;
    cuesBox.innerHTML = '';
  }
});

/* =========================================================
   MARKDOWN MINI-RENDERER
   ========================================================= */
function renderMarkdown(t) {
  let html = t
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/\*\*(.+?)\*\*/g,'<strong>$1</strong>')
    .replace(/^#{1,3} (.+)$/gm,'<h4>$1</h4>');

  const lines = html.split('\n');
  const out=[]; let inList=false;
  for(const line of lines){
    if(/^\s*[-*]\s+/.test(line)){
      if(!inList){out.push('<ul>');inList=true;}
      out.push('<li>'+line.replace(/^\s*[-*]\s+/,'')+'</li>');
    } else if(/^\s*\d+\.\s+/.test(line)){
      if(!inList){out.push('<ul>');inList=true;}
      out.push('<li>'+line.replace(/^\s*\d+\.\s+/,'')+'</li>');
    } else {
      if(inList){out.push('</ul>');inList=false;}
      out.push(line);
    }
  }
  if(inList)out.push('</ul>');
  return out.join('\n');
}

/* =========================================================
   INIT
   ========================================================= */
loadProfile();
loadApi();
