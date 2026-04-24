"""
Importa el contenido de los .docx al campo `sections` de cada capítulo en Payload.

Uso:
  python3 src/scripts/import-content.py

Requiere el servidor local corriendo en localhost:3000.
"""

import os
import json
import uuid
import re
import sys
import urllib.request
import urllib.parse
from docx import Document
from docx.shared import Pt

# ── Configuración ────────────────────────────────────────────────────────────

DOCX_DIR = os.path.join(os.path.dirname(__file__), "../../Libro El GCP")
API_BASE = "http://localhost:3000/api"
EMAIL    = "pedrocubero@icloud.com"
PASSWORD = "dihgyh-pixxeq-Winfy2"

# Colores que NO se consideran "especiales" (negro / gris oscuro → sin color)
NEUTRAL_COLORS = {"000000", "1A1A1D", "1C1C1C", "202122", "595959", "333333",
                  "1C1C1E", "0F0F0F", "FFFFFF"}

# Longitud máxima de un párrafo para que sea candidato a encabezado
HEADING_MAX_LEN = 100

# ── Helpers Lexical JSON ─────────────────────────────────────────────────────

def text_node(text: str, bold=False, color=None) -> dict:  # color: Optional[str]
    fmt = 1 if bold else 0
    style = ""
    if color and color.upper() not in NEUTRAL_COLORS:
        style = f"color: #{color};"
    return {
        "type": "text",
        "detail": 0,
        "format": fmt,
        "mode": "normal",
        "style": style,
        "text": text,
        "version": 1,
    }

def para_to_inline_nodes(para) -> list:
    """Convierte los runs de un párrafo en nodos de texto con formato."""
    nodes = []
    for run in para.runs:
        if not run.text:
            continue
        bold = bool(run.bold)
        color = None
        try:
            if run.font.color and run.font.color.type is not None:
                color = str(run.font.color.rgb)
        except Exception:
            pass
        nodes.append(text_node(run.text, bold=bold, color=color))
    # Si no hay runs con formato, caer de vuelta al texto plano
    if not nodes and para.text.strip():
        nodes = [text_node(para.text)]
    return nodes

def paragraph_node(children: list, indent: int = 0) -> dict:
    return {
        "type": "paragraph",
        "children": children,
        "direction": "ltr" if children else None,
        "format": "",
        "indent": indent,
        "version": 1,
        "textFormat": 0,
        "textStyle": "",
    }

def heading_node(children: list, tag: str = "h2") -> dict:
    return {
        "type": "heading",
        "tag": tag,
        "children": children,
        "direction": "ltr",
        "format": "",
        "indent": 0,
        "version": 1,
    }

def quote_node(children: list) -> dict:
    return {
        "type": "quote",
        "children": children,
        "direction": "ltr",
        "format": "",
        "indent": 0,
        "version": 1,
    }

def make_root(children: list) -> dict:
    return {
        "root": {
            "type": "root",
            "children": children,
            "direction": "ltr" if children else None,
            "format": "",
            "indent": 0,
            "version": 1,
        }
    }

# ── Detección de estructura del .docx ───────────────────────────────────────

def get_para_size(para):  # -> Optional[float]
    for run in para.runs:
        if run.font.size:
            return round(run.font.size.pt, 1)
    return None

def is_bold(para) -> bool:
    return any(run.bold for run in para.runs if run.text.strip())

def is_indented(para) -> bool:
    return bool(para.paragraph_format.left_indent)

def is_heading_candidate(para) -> bool:
    """Heurística para detectar títulos de sección."""
    text = para.text.strip()
    if not text:
        return False
    if len(text) > HEADING_MAX_LEN:
        return False
    # No debe terminar en puntuación de frase
    if text[-1] in ".,:;":
        return False
    # No debe tener indentación
    if is_indented(para):
        return False
    # Sin tamaño explícito pequeño (las citas son 10pt)
    size = get_para_size(para)
    if size and size <= 10.0:
        return False
    # No debe parecer una referencia bibliográfica
    if re.match(r"^[A-Z][a-záéíóúñü]+ [A-Z]", text) and "." in text:
        return False
    # "List Paragraph" sin indent y sin tamaño pequeño = título de subsección
    # (el autor usa este estilo para los encabezados del índice y del cuerpo)
    if para.style.name == "List Paragraph" and not is_indented(para):
        return True
    return True

def find_toc_entries(paragraphs) -> set:
    """Extrae los títulos del ÍNDICE para usarlos como guía."""
    entries = set()
    in_toc = False
    blank_count = 0
    for para in paragraphs:
        text = para.text.strip()
        if text.upper() in ("INDICE", "ÍNDICE"):
            in_toc = True
            continue
        if not in_toc:
            continue
        if not text:
            blank_count += 1
            # Múltiples blancos seguidos = fin del TOC
            if blank_count >= 3:
                break
            continue
        blank_count = 0
        # Las entradas del TOC son cortas (< 100 chars)
        if len(text) <= HEADING_MAX_LEN:
            entries.add(text)
        # Un párrafo muy largo = ya estamos en el cuerpo real
        elif len(text) > 200:
            break
    return entries

def find_content_start(paragraphs) -> int:
    """
    Devuelve el índice donde empieza el contenido real.

    Estrategia:
    1. Si hay INDICE, encontrar el bloque contiguo de párrafos cortos
       que conforman las entradas del TOC. El contenido empieza en el
       primer párrafo no-vacío tras ese bloque.
    2. Si no hay INDICE, devolver 0.
    """
    toc_idx = None
    for i, para in enumerate(paragraphs):
        if para.text.strip().upper() in ("INDICE", "ÍNDICE"):
            toc_idx = i
            break

    if toc_idx is None:
        return 0

    # Buscar el bloque contiguo de párrafos cortos (las entradas del TOC).
    # Lo reconocemos como el primer grupo de ≥2 párrafos cortos seguidos sin
    # párrafos largos intercalados. Los párrafos largos ANTES del bloque son
    # el resumen del capítulo (los saltamos).
    cluster_end = None
    cluster_len = 0

    i = toc_idx + 1
    while i < len(paragraphs):
        text = paragraphs[i].text.strip()
        if not text:
            if cluster_len >= 2:
                # Fin del bloque contiguo: encontrar siguiente no-vacío
                for j in range(i + 1, len(paragraphs)):
                    if paragraphs[j].text.strip():
                        return j
                break
            # Blank dentro o antes del bloque — resetear y seguir
            cluster_len = 0
        elif len(text) <= HEADING_MAX_LEN:
            cluster_len += 1
        else:
            # Párrafo largo → no es una entrada del TOC; resetear el contador
            cluster_len = 0
        i += 1

    # Fallback: si no se encontró el bloque, devolver el primer párrafo
    # no-vacío después del INDICE
    for j in range(toc_idx + 1, len(paragraphs)):
        if paragraphs[j].text.strip():
            return j
    return toc_idx + 1

def split_into_sections(paragraphs: list, toc_entries: set) -> list:
    """
    Divide los párrafos en secciones.
    Cada sección es una lista de párrafos (el primero puede ser un título).
    """
    start = find_content_start(paragraphs)
    body = paragraphs[start:]

    sections = []
    current = []

    for para in body:
        text = para.text.strip()

        # "Referencias" en negrita → empieza una nueva sección (la última)
        if is_bold(para) and text.lower() in ("referencias", "bibliografía"):
            if current:
                sections.append(current)
            current = [para]
            continue

        if not text:
            continue

        # ¿Es un nuevo título de sección?
        if is_heading_candidate(para) and (text in toc_entries or (
            len(text) <= 60 and not text[-1] in ".,:;" and not is_indented(para)
        )):
            if current:
                sections.append(current)
            current = [para]
        else:
            current.append(para)

    if current:
        sections.append(current)

    # Si no se detectaron secciones con título, el capítulo es una sola sección
    if not sections:
        sections = [body]

    # Fallback: si hay sólo una sección enorme (>50 párrafos), dividir por bloques de 15
    if len(sections) == 1 and len(sections[0]) > 50:
        big = sections[0]
        sections = [big[i:i+15] for i in range(0, len(big), 15)]

    return sections

# ── Conversión sección → Lexical JSON ───────────────────────────────────────

def section_to_lexical(paras: list) -> dict:
    nodes = []
    first = True

    for para in paras:
        text = para.text.strip()
        if not text:
            continue

        inline = para_to_inline_nodes(para)
        size = get_para_size(para)
        indented = is_indented(para)

        # Primer párrafo del grupo y es candidato a título → heading h3
        if first and is_heading_candidate(para):
            nodes.append(heading_node(inline, tag="h3"))
            first = False
            continue

        first = False

        # "List Paragraph" con indent = item de lista → párrafo indentado
        if para.style.name == "List Paragraph" and indented:
            nodes.append(paragraph_node(inline, indent=1))
        # 10pt o indentado sin List Paragraph = cita/blockquote
        elif (size and size <= 10.0) or (indented and para.style.name != "List Paragraph"):
            nodes.append(quote_node(inline))
        else:
            nodes.append(paragraph_node(inline))

    return make_root(nodes)

# ── API REST de Payload ──────────────────────────────────────────────────────

def api_request(method: str, path: str, data=None, token=None) -> dict:  # token: Optional[str]
    url = f"{API_BASE}{path}"
    body = json.dumps(data).encode() if data else None
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"JWT {token}"
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read())

def login() -> str:
    result = api_request("POST", "/users/login", {"email": EMAIL, "password": PASSWORD})
    token = result.get("token")
    if not token:
        raise RuntimeError(f"Login fallido: {result}")
    print("✓ Login OK")
    return token

def get_all_chapters(token: str) -> list:
    result = api_request("GET", "/chapters?limit=100&sort=order", token=token)
    return result.get("docs", [])

def update_chapter_sections(chapter_id: str, sections: list, token: str):
    payload = {"sections": sections}
    api_request("PATCH", f"/chapters/{chapter_id}?locale=es", data=payload, token=token)

# ── Lógica principal ─────────────────────────────────────────────────────────

def docx_order_from_filename(filename: str):  # -> Optional[int]
    """Extrae el número de orden del nombre del archivo (ej: '1 El individuo.docx' → 1)."""
    m = re.match(r"^(\d+)\s", filename)
    return int(m.group(1)) if m else None

def main():
    token = login()
    chapters = get_all_chapters(token)
    by_order = {ch["order"]: ch for ch in chapters}
    print(f"  {len(chapters)} capítulos en la BD")

    docx_files = sorted(
        [f for f in os.listdir(DOCX_DIR) if f.endswith(".docx")],
        key=lambda f: docx_order_from_filename(f) or 999
    )

    results = []
    for filename in docx_files:
        order = docx_order_from_filename(filename)
        if order is None or order == 0:
            print(f"  ⏭  Saltando: {filename} (sin capítulo en BD)")
            continue
        chapter = by_order.get(order)
        if not chapter:
            print(f"  ⚠  No encontrado en BD: orden {order} ({filename})")
            continue

        filepath = os.path.join(DOCX_DIR, filename)
        doc = Document(filepath)
        paras = doc.paragraphs

        toc_entries = find_toc_entries(paras)
        raw_sections = split_into_sections(paras, toc_entries)

        sections_payload = []
        for sec in raw_sections:
            lexical = section_to_lexical(sec)
            # Solo incluir secciones con contenido real
            if not lexical["root"]["children"]:
                continue
            sections_payload.append({
                "blockId": str(uuid.uuid4()),
                "content": lexical,
                "translationStatus": "stale",
                "sourceHash": "",
            })

        update_chapter_sections(chapter["id"], sections_payload, token)
        print(f"  ✓ Cap {order:2d} — {chapter['title'][:50]}: {len(sections_payload)} secciones")
        results.append({"order": order, "title": chapter["title"], "sections": len(sections_payload)})

    print(f"\nImportación completa: {len(results)} capítulos actualizados.")

if __name__ == "__main__":
    main()
