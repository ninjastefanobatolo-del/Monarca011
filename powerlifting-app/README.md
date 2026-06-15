# MONARCA · Powerlifting Intelligence

Aplicación web de powerlifting con calculadora de 1RM, periodización por bloques (hipertrofia / volumen / peak) y coach de IA que analiza video del levantamiento.

## Uso local

```bash
cd powerlifting-app
python3 -m http.server 8000
```

Abre `http://localhost:8000` en tu navegador.

> No necesita backend: es 100% estático. La API key de Anthropic se guarda solo en `localStorage` del navegador.

## Configuración inicial

1. Pestaña **API** → pega tu Anthropic API key (`sk-ant-...`) → Guardar.
2. Pestaña **Perfil** → completa datos antropométricos (fémur, tibia, torso, envergadura) y lesiones. Esto alimenta el análisis de IA.
3. Calcula tu 1RM en la pestaña correspondiente → las cargas de los bloques se actualizan automáticamente.

## Análisis de video

1. Sube un video del levantamiento (≤100MB).
2. La app extrae 6 fotogramas clave automáticamente.
3. Los envía a Claude con tu perfil → recibe feedback directo, puntual y ajustado a tus palancas.

## Stack

- HTML + CSS + Vanilla JS (sin build step)
- API Anthropic vía fetch directo desde navegador
- Tipografía: Bebas Neue + Cinzel + Inter
- Paleta: morado (#7c3aed) sobre negro (#07060a) con acentos en oro (#d4af37)
