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
import urllib.request
from docx import Document

# ── Configuración ────────────────────────────────────────────────────────────

DOCX_DIR = os.path.join(os.path.dirname(__file__), "../../Libro El GCP-3")
API_BASE = "http://localhost:3000/api"
EMAIL    = "pedrocubero@icloud.com"
PASSWORD = "dihgyh-pixxeq-Winfy2"

# Colores que NO se consideran "especiales" (negro / gris oscuro → sin color)
NEUTRAL_COLORS = {"000000", "1A1A1D", "1C1C1C", "202122", "595959", "333333",
                  "1C1C1E", "0F0F0F", "FFFFFF"}

# Longitud máxima de un párrafo para que sea candidato a encabezado
HEADING_MAX_LEN = 100

# ── Helpers Lexical JSON ─────────────────────────────────────────────────────

def text_node(text: str, bold=False, italic=False, underline=False, color=None) -> dict:
    # Lexical format bitmask: 1=bold, 2=italic, 8=underline
    fmt = 0
    if bold:     fmt |= 1
    if italic:   fmt |= 2
    if underline: fmt |= 8
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
        bold    = bool(run.bold)
        italic  = bool(run.italic)
        underline = bool(run.underline)
        color = None
        try:
            if run.font.color and run.font.color.type is not None:
                color = str(run.font.color.rgb)
        except Exception:
            pass
        nodes.append(text_node(run.text, bold=bold, italic=italic, underline=underline, color=color))
    if not nodes and para.text.strip():
        nodes = [text_node(para.text)]
    return nodes

def plain_text_nodes(para) -> list:
    """Texto plano sin formato — para encabezados (el nivel ya lo da el tag)."""
    text = para.text.strip().rstrip(".,;:")
    return [text_node(text)] if text else []

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

def linebreak_node() -> dict:
    return {"type": "linebreak", "version": 1}

def toc_to_lexical(toc_entries: list) -> dict:
    """Renderiza el índice como un único párrafo con saltos de línea, sin márgenes entre items."""
    children = []
    for i, para in enumerate(toc_entries):
        text = para.text.strip()
        if not text:
            continue
        if children:
            children.append(linebreak_node())
        children.append(text_node(text))
    if not children:
        return make_root([])
    return make_root([paragraph_node(children)])

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

STYLE_HEADING_MAP = {
    "Nivel 1": "h2",
    "Nivel 2": "h3",
    "Nivel 3": "h4",
}

def get_heading_level(para):  # -> Optional[str]
    """
    Detecta nivel de encabezado.
    Primero mira el estilo de párrafo Word (Nivel 1/2/3).
    Si no hay estilo explícito, recurre al formato tipográfico del autor:
      cursiva + subrayado → h2
      versalita (small caps) → h3
      solo cursiva          → h4
    Devuelve None si es texto de cuerpo normal.
    """
    # Método principal: estilo Word explícito
    if para.style.name in STYLE_HEADING_MAP:
        return STYLE_HEADING_MAP[para.style.name]

    # Fallback: detección por formato tipográfico
    text = para.text.strip()
    if not text or len(text) > HEADING_MAX_LEN:
        return None
    if text[-1] in ".,:;":
        return None

    runs = [r for r in para.runs if r.text.strip()]
    if not runs:
        return None

    # Excluir solo si NO tiene ningún marcador de encabezado explícito
    # (para no bloquear encabezados que terminan en punto)
    has_iu = all(r.italic and r.underline for r in runs)
    has_sc = all(r.font.small_caps for r in runs)
    has_i  = all(r.italic for r in runs)

    if not (has_iu or has_sc or has_i):
        if text[-1] in ".,:;":
            return None

    if has_iu:
        return "h2"
    if has_sc:
        return "h3"
    if has_i:
        return "h4"

    return None

def find_toc_and_content(paragraphs):
    """
    Devuelve (toc_entries, content_start_idx).
    Recoge todo lo que hay entre 'ÍNDICE' y el primer h2 del cuerpo real.
    Así funciona aunque haya párrafos de descripción o líneas vacías entre
    el marcador ÍNDICE y las entradas del índice.
    """
    toc_idx = None
    for i, para in enumerate(paragraphs):
        if para.text.strip().upper() in ("INDICE", "ÍNDICE"):
            toc_idx = i
            break

    if toc_idx is None:
        return [], 0

    toc_entries = []
    i = toc_idx + 1
    while i < len(paragraphs):
        para = paragraphs[i]
        text = para.text.strip()
        # El primer h2 real marca el inicio del contenido
        if text and get_heading_level(para) == "h2":
            break
        if text:
            toc_entries.append(para)
        i += 1

    return toc_entries, i

def find_content_start(paragraphs) -> int:
    """Devuelve el índice donde empieza el contenido real (mantiene compatibilidad)."""
    _, content_start = find_toc_and_content(paragraphs)
    return content_start

def _find_content_start_legacy(paragraphs) -> int:
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

def split_into_sections(paragraphs: list) -> list:
    """
    Divide los párrafos en secciones usando estilos Word (o formato tipográfico).
    Un Nivel 1 / h2 abre una nueva sección principal.
    El índice del capítulo (si existe) se incluye como primera sección.
    """
    _, start = find_toc_and_content(paragraphs)
    body = paragraphs[start:]

    sections = []

    current = []
    for para in body:
        text = para.text.strip()

        # "Referencias" en negrita → nueva sección final
        if is_bold(para) and text.lower() in ("referencias", "bibliografía"):
            if current:
                sections.append(current)
            current = [para]
            continue

        if not text:
            continue

        # h2 → nueva sección principal
        if get_heading_level(para) == "h2":
            if current:
                sections.append(current)
            current = [para]
        else:
            current.append(para)

    if current:
        sections.append(current)

    if not sections:
        sections = [body]

    # Fallback: sección enorme sin encabezados h2 → dividir en bloques
    if len(sections) == 1 and len(sections[0]) > 50:
        big = sections[0]
        sections = [big[i:i+15] for i in range(0, len(big), 15)]

    return sections

# ── Conversión sección → Lexical JSON ───────────────────────────────────────

def section_to_lexical(paras: list) -> dict:
    nodes = []

    for para in paras:
        text = para.text.strip()
        if not text:
            continue

        # Título introductorio: ya está en la BD como título del capítulo
        if para.style.name == "Título introductorio":
            continue

        # Cita larga: bloque de cita por estilo explícito
        if para.style.name == "Cita larga":
            nodes.append(quote_node(para_to_inline_nodes(para)))
            continue

        # Detectar indicadores de cita antes de la detección de encabezado,
        # para que texto en cursiva dentro de citas no se clasifique como h4.
        size = get_para_size(para)
        indented = is_indented(para)
        is_quote_candidate = (size and size <= 10.0) or (indented and para.style.name != "List Paragraph")

        level = get_heading_level(para)
        # Si la detección fue por fallback tipográfico (no estilo Word explícito)
        # y el párrafo parece una cita, no lo tratamos como encabezado.
        if level and para.style.name not in STYLE_HEADING_MAP and is_quote_candidate:
            level = None

        if level:
            nodes.append(heading_node(plain_text_nodes(para), tag=level))
            continue

        inline = para_to_inline_nodes(para)

        if para.style.name == "List Paragraph" and indented:
            nodes.append(paragraph_node(inline, indent=1))
        elif is_quote_candidate:
            # Etiqueta de cita: párrafo corto sin comillas iniciales → párrafo normal
            quote_starters = ('"', '"', '«', '"', '[', '(', '—', '-')
            if len(text) <= 80 and not text.startswith(quote_starters):
                nodes.append(paragraph_node(inline))
            else:
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

        raw_sections = split_into_sections(paras)

        sections_payload = []
        for sec in raw_sections:
            lexical = section_to_lexical(sec)
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
