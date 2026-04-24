# PLAN — Sistema de edición y traducción de "El grupo paranoide"

## Contexto

Migrar el libro "El grupo paranoide" de Pedro Cubero Bros (24 capítulos, actualmente en Squarespace con PDFs en Google Drive) a un sistema propio que permita:

1. Al autor (no técnico) editar los capítulos en español desde un panel web sencillo.
2. Traducir cada capítulo al inglés con un botón, usando la API de Claude.
3. Que el autor pueda revisar y corregir las traducciones sin que sus cambios se pisen en retraducciones posteriores.
4. Mostrar el libro al público en `elgrupoparanoide.com` con selector de idioma.
5. Ofrecer PDF descargable por capítulo en cada idioma, generado on-the-fly.
6. Dejar preparado para añadir más idiomas (francés, italiano, etc.) en el futuro con mínimo esfuerzo.

## Stack técnico

- **Framework:** Next.js 15 con App Router (TypeScript).
- **CMS:** Payload CMS 3 embebido en el mismo proyecto Next.js (no servicio aparte).
- **Base de datos:** PostgreSQL en Supabase (tier gratis). Usar la connection string de **Transaction pooler** (puerto 6543), obligatorio para entornos serverless como Vercel.
- **Editor:** TipTap (integrado en Payload).
- **Traducción:** API de Anthropic, modelo `claude-sonnet-4-6`.
- **PDFs:** `@react-pdf/renderer`, generación on-the-fly en un route handler.
- **Autenticación:** la nativa de Payload (solo un usuario: el autor).
- **Hosting:** Vercel.
- **DNS:** mover desde Squarespace a Cloudflare o directamente a Vercel.

Razones: un solo repo, un solo deploy, un solo dominio. Payload 3 está pensado para instalarse dentro de Next.js y comparte runtime. Menos piezas = menos cosas que se rompen.

## Modelo de datos

### Collection: `Chapters`

Cada capítulo del libro.

- `slug` (string, único): p.ej. `individuo-paranoide`.
- `order` (number): 1-24.
- `part` (select): `I`, `II`, `III`.
- `title` (string, **localized**): título del capítulo.
- `subtitle` (string, **localized**): los epígrafes tipo "Paranoia · Paranoias · Episodios delirantes agudos…".
- `sections` (array, **localized**): array de bloques. Cada bloque tiene:
  - `blockId` (string, estable, generado una vez y nunca regenerado): clave para identificar esa sección a través de idiomas.
  - `content` (richText TipTap): el texto del bloque.
  - `translationStatus` (select, solo visible en locales no-ES): `auto` | `manual` | `stale`.
  - `sourceHash` (string, oculto): hash SHA-256 del contenido en español en el momento de la última traducción. Si el español cambia, el hash ya no coincide y la sección se marca `stale`.
- `published` (checkbox, **localized**): si está visible al público en ese idioma.

**Nota clave sobre `sections`:** la estructura del array (cuántos bloques hay y sus `blockId`) es compartida entre idiomas. El `content` de cada bloque es lo que se localiza. Esto se consigue en Payload marcando `localized: true` en el array.

### Collection: `GlossaryTerms`

- `termES` (string): término en español.
- `translations` (group, **localized**): un campo por idioma con la traducción preferida.
- `notes` (textarea): contexto para el traductor.

Ejemplos iniciales: "conducta paranoide", "grupo de contagio paranoide", "GCP", "folie à deux", "apiñamiento", "paranoidización".

### Collection: `Users`

La nativa de Payload. Solo un usuario: el autor.

## Flujo de traducción

1. El autor edita un capítulo en español. Al guardar, un hook `beforeChange` recorre las secciones y, para cada una cuyo `content` en ES ha cambiado, recalcula el hash y, si ese hash no coincide con el guardado en la versión inglesa de esa sección, marca la sección inglesa como `stale`.
2. En el admin, el autor ve el capítulo en pestaña "English" con un contador "3 secciones por retraducir" y un botón **Retraducir pendientes**.
3. Al pulsarlo, un endpoint `/api/translate-chapter` recorre las secciones `stale`, las envía a la API de Claude en un batch (o una por una, según tamaño), y guarda el resultado marcándolas como `auto`. Guarda también el `sourceHash` actualizado.
4. El autor puede editar manualmente cualquier sección traducida. Al hacerlo, un hook la marca como `manual`.
5. Las secciones `manual` NO se retraducen al pulsar "Retraducir pendientes". Solo si el autor pulsa un botón específico "Forzar retraducción" dentro de esa sección.
6. Cuando está contento, pulsa **Publish** en inglés y queda visible al público.

## Prompt de traducción (base)

```
You are a professional literary translator specialized in essays 
on psychology, psychiatry, and political science. Translate the 
following Spanish text to English, preserving:

- The author's formal, essayistic register.
- Technical terms from psychiatry (e.g., "conducta paranoide" 
  → "paranoid behavior", "folie à deux" stays as is in French).
- Original markdown formatting (headings, bold, italics, lists).

Use this glossary strictly. If a Spanish term here appears, use 
the English version provided:

{GLOSSARY}

Do not add explanations, notes, or content not present in the 
original. Return only the translated text in markdown, nothing else.

Source text:

{SECTION_CONTENT}
```

El glosario se construye dinámicamente desde la collection `GlossaryTerms`.

## Web pública

- `/` — landing con intro al libro y al autor.
- `/[locale]/capitulos` — índice de capítulos (tipo la página actual, pero generada desde la base de datos).
- `/[locale]/capitulo/[slug]` — capítulo individual, leíble en web.
- `/[locale]/capitulo/[slug]/pdf` — descarga PDF generado on-the-fly.
- `/sobre-mi`, `/obstinaciones`, `/depresion` — páginas estáticas migradas de Squarespace (collection `Pages`, multilingüe).
- Selector de idioma arriba (solo ES/EN al principio).
- Diseño: limpio, tipográfico, sobrio — es un libro de ensayo, no una tienda.

## Hoja de ruta por sesiones de Claude Code

Cada sesión ≈ 1-2 horas. Al final de cada una: commit en Git, deploy a Vercel, y verificación de que funciona.

### Sesión 1 — Andamiaje (hoy)
- `create-next-app` con TypeScript.
- Instalar Payload 3 embebido.
- Conectar a Supabase Postgres (pooled connection, puerto 6543).
- Configurar localización `['es', 'en']`, default `es`.
- Collection `Users` + primer usuario admin (el autor).
- Collection `Chapters` con los campos descritos arriba.
- Seed script: crear los 24 capítulos con sus títulos y orden (sin contenido todavía).
- Deploy a Vercel con variables de entorno.
- **Criterio de éxito:** el autor puede entrar al admin en `/admin`, ver los 24 capítulos listados, editar el título de uno y ver que se guarda.

### Sesión 2 — Importación del contenido existente
- Leer los Google Docs actuales de los capítulos y convertirlos a markdown/richText.
- Script que parte cada capítulo en secciones (por `##` o por párrafos según longitud) y las importa al campo `sections` de cada capítulo en español.
- Revisión manual en el admin.
- **Criterio de éxito:** los 24 capítulos están en el admin con su contenido real en español, bien estructurado.

### Sesión 3 — Web pública de lectura
- Páginas `/[locale]/capitulo/[slug]` que renderizan el capítulo desde la base de datos.
- Página índice `/[locale]/capitulos`.
- Selector de idioma (aunque el inglés todavía esté vacío).
- Estilos tipográficos básicos.
- **Criterio de éxito:** se puede leer el libro entero en español en el nuevo dominio de staging de Vercel.

### Sesión 4 — Traducción con Claude ✅ (2026-04-24)
- Endpoint `POST /api/translate-chapter/[id]` — traduce título, subtítulo y todas las secciones.
- `src/lib/translate.ts` — extrae nodos de texto del árbol Lexical, llama a Claude, los reinsertan preservando formato bold/italic.
- Collection `GlossaryTerms` registrada en Payload; script `src/scripts/seed-glossary.ts` carga los términos del libro.
- Botón "Traducir al inglés" en el admin (campo `ui` en Chapters → `src/components/admin/TranslateButton.tsx`).
- **Pendiente por el autor:** añadir `ANTHROPIC_API_KEY` real en `.env.local` y en Vercel Preview.
- **Criterio de éxito:** el autor pulsa un botón y el capítulo aparece traducido al inglés en la pestaña correspondiente del admin.

### Sesión 5 — PDFs
- Route handler `/[locale]/capitulo/[slug]/pdf` que genera PDF con `@react-pdf/renderer`.
- Estilos de libro (tipografía, portada por capítulo con título + autor + "elgrupoparanoide.com").
- **Criterio de éxito:** se descarga un PDF con el capítulo en el idioma elegido, bien maquetado.

### Sesión 6 — Páginas auxiliares + pulido
- Migrar `/sobre-mi`, `/obstinaciones`, `/depresion` desde Squarespace (contenido estático, collection `Pages`).
- Landing `/`.
- Selector de idioma final, menú, footer.
- Tests de extremo a extremo del flujo completo.
- **Criterio de éxito:** la web está lista para reemplazar a Squarespace.

### Sesión 7 — Corte y DNS
- Añadir `elgrupoparanoide.com` en Vercel, que genera registros DNS (`A` para apex y `CNAME` para `www`).
- Configurar esos registros en Namecheap → Advanced DNS del dominio.
- Verificar SSL (automático en Vercel).
- Hacer que el autor pruebe todo el flujo una última vez.
- Go live.

## Consideraciones

- **Coste.** Hosting Vercel y BD Neon: gratis en estos volúmenes. API de Claude: traducir los 24 capítulos completos la primera vez ≈ 2-5 €. Retraducciones posteriores son céntimos. Dominio ya lo tenéis.
- **Backups.** Supabase hace backups automáticos diarios en el tier gratis (retención 7 días). Además, un dump semanal a `.sql` se puede automatizar con GitHub Actions si queremos paranoia extra.
- **Qué NO construimos ahora (v2):** comentarios de lectores, búsqueda full-text, analytics avanzado, versionado de capítulos (Payload ya trae drafts y autosave).
- **Decisión pendiente:** si el contenido vive en la base de datos o en archivos Markdown en Git. Vamos con base de datos — más simple para el autor, y Payload ya da versionado y drafts sin que tengamos que construirlo.
