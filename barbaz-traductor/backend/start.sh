#!/bin/bash
echo "Iniciando BarBaZ Traductor..."
if [ ! -f .env ]; then
  cp .env.example .env
  echo "⚠  Crea el archivo .env y agrega tu ANTHROPIC_API_KEY"
fi
pip install -r requirements.txt -q
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
