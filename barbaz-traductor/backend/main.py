import os
import io
from pathlib import Path
from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse, FileResponse
from pydantic import BaseModel
from dotenv import load_dotenv

from translator import translate_document
from parser import parse_file

load_dotenv()

app = FastAPI(
    title="BarBaZ Traductor API",
    description="API de traducción jurídica profesional",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

FRONTEND_DIR = Path(__file__).parent.parent / "frontend"


class TextTranslationRequest(BaseModel):
    text: str
    source_language: str = "English"
    target_language: str = "Spanish"


@app.get("/health")
async def health_check():
    """Health check endpoint."""
    api_key_set = bool(os.environ.get("ANTHROPIC_API_KEY"))
    return {
        "status": "healthy",
        "service": "BarBaZ Traductor",
        "api_key_configured": api_key_set
    }


@app.post("/translate/text")
async def translate_text(request: TextTranslationRequest):
    """Translate raw text from source language to Spanish."""
    if not request.text.strip():
        raise HTTPException(status_code=400, detail="El texto no puede estar vacío.")

    if len(request.text) > 50000:
        raise HTTPException(status_code=400, detail="El texto excede el límite de 50,000 caracteres.")

    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="ANTHROPIC_API_KEY no está configurada en el servidor.")

    try:
        result = translate_document(
            text=request.text,
            source_lang=request.source_language,
            target_lang=request.target_language
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    word_count = len(request.text.split())

    return JSONResponse(content={
        "original_text": request.text,
        "translated_text": result["translated_text"],
        "source_language": result.get("detected_language", request.source_language),
        "target_language": request.target_language,
        "word_count": word_count,
        "filename": None,
        "legal_terms_glossary": result.get("legal_terms_glossary", [])
    })


@app.post("/translate/file")
async def translate_file(
    file: UploadFile = File(...),
    source_language: str = Form(default="English"),
    target_language: str = Form(default="Spanish")
):
    """Upload and translate a PDF, DOCX, or TXT file."""
    allowed_extensions = {".pdf", ".docx", ".txt"}
    file_ext = Path(file.filename).suffix.lower()

    if file_ext not in allowed_extensions:
        raise HTTPException(
            status_code=400,
            detail=f"Tipo de archivo no permitido: {file_ext}. Formatos soportados: PDF, DOCX, TXT"
        )

    if file.size and file.size > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="El archivo excede el límite de 10 MB.")

    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        raise HTTPException(status_code=500, detail="ANTHROPIC_API_KEY no está configurada en el servidor.")

    file_bytes = await file.read()

    if len(file_bytes) > 10 * 1024 * 1024:
        raise HTTPException(status_code=400, detail="El archivo excede el límite de 10 MB.")

    try:
        extracted_text = parse_file(file_bytes, file.filename)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))

    if len(extracted_text) > 50000:
        extracted_text = extracted_text[:50000]

    try:
        result = translate_document(
            text=extracted_text,
            source_lang=source_language,
            target_lang=target_language
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

    word_count = len(extracted_text.split())

    return JSONResponse(content={
        "original_text": extracted_text,
        "translated_text": result["translated_text"],
        "source_language": result.get("detected_language", source_language),
        "target_language": target_language,
        "word_count": word_count,
        "filename": file.filename,
        "legal_terms_glossary": result.get("legal_terms_glossary", [])
    })


# Serve frontend static files
if FRONTEND_DIR.exists():
    app.mount("/static", StaticFiles(directory=str(FRONTEND_DIR)), name="static")

    @app.get("/")
    async def serve_frontend():
        return FileResponse(str(FRONTEND_DIR / "index.html"))

    @app.get("/{path:path}")
    async def serve_static(path: str):
        file_path = FRONTEND_DIR / path
        if file_path.exists() and file_path.is_file():
            return FileResponse(str(file_path))
        return FileResponse(str(FRONTEND_DIR / "index.html"))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
