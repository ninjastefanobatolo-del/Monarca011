import json
import os
import httpx
from dotenv import load_dotenv

load_dotenv()


def _make_client():
    import anthropic
    try:
        return anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))
    except TypeError:
        return anthropic.Anthropic(
            api_key=os.environ.get("ANTHROPIC_API_KEY"),
            http_client=httpx.Client(),
        )


def translate_document(text: str, source_lang: str, target_lang: str = "Spanish") -> dict:
    """
    Translate a legal document using Claude API.

    Args:
        text: The document text to translate
        source_lang: Source language (e.g., "English", "French")
        target_lang: Target language (default: "Spanish")

    Returns:
        dict with translated_text, detected_language, legal_terms_glossary
    """
    client = _make_client()

    system_prompt = """Eres un traductor jurídico profesional especializado en traducción de documentos legales al español. Tu tarea es traducir documentos legales con máxima precisión y fidelidad.

INSTRUCCIONES CRÍTICAS:
1. Preserva EXACTAMENTE la numeración de cláusulas, artículos, secciones, incisos y apartados
2. Mantén la estructura jerárquica del documento (capítulos, títulos, artículos, párrafos)
3. Usa terminología jurídica española precisa y actualizada
4. Mantén el registro formal y solemne propio del lenguaje jurídico español
5. NO parafrasees ni resumas; traduce con fidelidad literal el significado jurídico
6. Conserva los nombres propios, denominaciones de entidades y referencias normativas en su forma original cuando sea apropiado
7. Traduce fechas, monedas y medidas al formato español cuando sea pertinente
8. Preserva el formato: saltos de línea, sangrías indicadas con espacios, listas

RESPONDE ÚNICAMENTE con un objeto JSON válido con esta estructura exacta:
{
  "translated_text": "texto completo traducido al español manteniendo toda la estructura",
  "detected_language": "idioma detectado del texto original",
  "legal_terms_glossary": [
    {
      "term": "término en idioma original",
      "translation": "traducción al español",
      "context": "breve explicación del uso jurídico (máx 15 palabras)"
    }
  ]
}

El glosario debe incluir entre 5 y 20 términos jurídicos relevantes del documento."""

    user_message = f"""Traduce el siguiente documento jurídico del {source_lang} al {target_lang}.

DOCUMENTO A TRADUCIR:
{text}"""

    message = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=8000,
        system=system_prompt,
        messages=[
            {"role": "user", "content": user_message}
        ]
    )

    response_text = message.content[0].text.strip()

    # Extract JSON from response (handle potential markdown code blocks)
    if "```json" in response_text:
        start = response_text.find("```json") + 7
        end = response_text.find("```", start)
        response_text = response_text[start:end].strip()
    elif "```" in response_text:
        start = response_text.find("```") + 3
        end = response_text.find("```", start)
        response_text = response_text[start:end].strip()

    result = json.loads(response_text)

    # Ensure required fields are present
    if "translated_text" not in result:
        raise ValueError("La respuesta del modelo no contiene el campo 'translated_text'")
    if "detected_language" not in result:
        result["detected_language"] = source_lang
    if "legal_terms_glossary" not in result:
        result["legal_terms_glossary"] = []

    return result
