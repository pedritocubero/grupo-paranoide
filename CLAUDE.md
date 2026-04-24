# CLAUDE.md — Instrucciones para Claude Code en este proyecto

## Sobre el proyecto

Sistema de gestión y traducción de un libro de ensayo ("El grupo paranoide" de Pedro Cubero Bros). El plan completo está en `PLAN.md`; léelo al principio de cada sesión.

## Sobre el usuario con el que trabajas

- **No es desarrollador de Next.js ni React.** Nunca los ha tocado.
- Entiende de producto y de flujos; sabe seguir instrucciones de terminal y Git.
- Antes de escribir código, explícale en 2-3 frases qué vas a hacer y por qué. En lenguaje llano, sin jerga innecesaria.
- Después de cada bloque importante de cambios, resume qué hiciste y qué debería comprobar él.
- Cuando introduzcas un concepto nuevo de Next.js/React/Payload que vaya a volver a aparecer, explícalo una vez con una analogía sencilla. No lo repitas en siguientes sesiones.
- No pegues bloques de 300 líneas sin explicación. Divide.

## Cómo trabajar

1. **Un objetivo por sesión.** Mira la sesión actual en `PLAN.md` y cíñete a ella. Si algo se sale de alcance, anótalo en `NOTES.md` y sigue.
2. **Verifica antes de avanzar.** Después de cada cambio relevante, ejecuta `npm run build` (o el test correspondiente) y arregla errores antes de continuar. No entregues código que no compila.
3. **Commits pequeños y descriptivos.** Haz commit tú mismo con mensajes claros después de cada hito. El usuario revisa `git log` para entender qué cambió.
4. **Pregunta cuando haya ambigüedad real.** No inventes decisiones de producto (naming de rutas, textos visibles al usuario, etc.). Pregúntale.
5. **No toques Squarespace.** La web vieja sigue viva hasta el corte final (sesión 7).

## Convenciones técnicas

- TypeScript estricto. Nada de `any` sin justificación.
- Estructura de carpetas: `src/app` para páginas y API routes, `src/collections` para Payload, `src/lib` para utilidades (traducción, hashing, PDF).
- Variables de entorno en `.env.local` (nunca en commits). Las listamos en `.env.example`.
- Idiomas: siempre `['es', 'en']` con `es` como default. Aunque empecemos solo con inglés activo, la estructura multilingüe está desde el día 1.
- Modelo de Claude para traducción: `claude-sonnet-4-6`. No hardcodear; leer de `process.env.ANTHROPIC_MODEL`.

## Glosario del libro (para traducción y para entender el dominio)

Términos recurrentes que aparecerán en el código, en prompts de traducción, y en conversaciones:

- **Conducta paranoide** → *paranoid behavior* (no "paranoid conduct").
- **Grupo de contagio paranoide (GCP)** → *paranoid contagion group (PCG)*.
- **Folie à deux / folie à famille** → se mantienen en francés en ambos idiomas.
- **Apiñamiento** → *huddling* (no "crowding"; matiz específico del autor).
- **Paranoidización** → *paranoidization* (neologismo del autor, se mantiene).
- **Hipersociabilidad** → *hypersociability*.
- **Piramidalismo** → *pyramidalism*.
- **Sokagakkai, sectas, cultos de crisis** → *Sokagakkai, cults, crisis cults* (términos antropológicos estándar).

Esta lista vive también en la collection `GlossaryTerms` y se actualiza allí. Este bloque es solo para que tú, Claude Code, tengas contexto del dominio.

## Qué NO hacer

- No introducir dependencias sin avisar al usuario y justificar por qué.
- No reorganizar código que ya funciona "porque quedaría más limpio". Si ves algo mejorable, propónselo y que decida él.
- No desplegar a producción sin que el usuario lo pida explícitamente.
- No modificar el dominio `elgrupoparanoide.com` ni su DNS hasta la sesión 7.
- No escribir tests que no se ejecuten nunca. Si añades tests, que corran en `npm test` y en el CI.

## Comandos que el usuario debe recordar

```bash
# Arrancar el servidor local
npm run dev           # http://localhost:3000

# Admin de Payload
# http://localhost:3000/admin

# Crear los 25 capítulos vacíos en la BD (solo una vez)
npm run seed

# Importar contenido de los .docx (necesita el servidor corriendo)
python3 src/scripts/import-content.py

# Cargar términos del glosario (solo una vez, necesita el servidor corriendo)
npx tsx src/scripts/seed-glossary.ts

# Build de producción (verifica que compila sin errores)
npm run build

# Deploy a Vercel (staging — NO producción)
vercel
```
