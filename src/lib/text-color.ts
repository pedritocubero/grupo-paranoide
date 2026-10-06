// El color de un trozo de texto se guarda en su "style" (p.ej. "color: #1d4ed8;"): lo ponen
// el botón de azul del administrador y el importador de los .docx. La web lo muestra tal cual;
// los PDF usan esto para pintarlo igual.

// Azul de enlace de Word: la web (globals.css) lo muestra gris oscuro y en cursiva, no azul.
const WORD_LINK_BLUE = '#0563c1'

export function pdfTextColor(style: unknown): { color?: string; italic: boolean } {
  const match = typeof style === 'string' ? style.match(/color:\s*(#[0-9a-f]{3,8})\b/i) : null
  if (!match) return { italic: false }
  const color = match[1].toLowerCase()
  if (color === WORD_LINK_BLUE) return { color: '#57534e', italic: true }
  return { color, italic: false }
}
