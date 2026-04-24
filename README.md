# Arranque del proyecto

Guía rápida de lo que tienes que hacer **antes** de tu primera sesión con Claude Code.

## 1. Crea las cuentas que vas a necesitar (15 min)

Todas tienen tier gratis suficiente:

- **GitHub** — https://github.com (si no la tienes ya). Aquí vivirá el código.
- **Vercel** — https://vercel.com — conéctala a tu GitHub. Aquí se desplegará la web.
- **Supabase** — https://supabase.com — base de datos PostgreSQL. Crea un proyecto nuevo llamado `grupo-paranoide`. En la región, elige la más cercana a Europa (`eu-central-1` Frankfurt o `eu-west-1` Irlanda). Cuando esté creado, ve a **Project Settings → Database → Connection string** y copia la que dice **Transaction pooler** (puerto 6543). Esa es la que necesitas; la directa no sirve para Vercel.
- **Anthropic Console** — https://console.anthropic.com — ya deberías tenerla si usas Claude Code. En "API Keys" crea una clave nueva específica para este proyecto y cárgale unos 5 € de crédito. Guarda la clave.

## 2. Instala lo que te falte en local (10 min)

Abre Terminal y comprueba:

```
node --version     # tiene que ser 20 o superior
git --version      # cualquier versión moderna vale
```

Si no tienes Node 20+: instálalo desde https://nodejs.org (la versión LTS) o con `brew install node` si usas Mac con Homebrew.

Instala Claude Code si no lo tienes:

```
npm install -g @anthropic-ai/claude-code
```

## 3. Configura un perfil separado de Claude Code (5 min)

Como usas Claude Code con tu cuenta del trabajo, vas a crear un perfil independiente para este proyecto personal. Así no mezclas historial, créditos ni contexto.

Abre tu archivo de configuración de shell (`~/.zshrc` en Mac, `~/.bashrc` en Linux) y añade al final:

```bash
# Claude Code — cuentas separadas
alias claude-work='CLAUDE_CONFIG_DIR=~/.claude command claude'
alias claude-personal='CLAUDE_CONFIG_DIR=~/.claude-personal command claude'
```

Recarga: `source ~/.zshrc` (o reinicia la terminal).

A partir de ahora:
- `claude-work` → tu cuenta del trabajo (con el historial y setup que ya tienes).
- `claude-personal` → cuenta personal, que crearás la primera vez que lo ejecutes.

Para **este proyecto** usarás siempre `claude-personal`.

## 4. Instala lo que te falte en local (10 min)

```
mkdir -p ~/code/grupo-paranoide
cd ~/code/grupo-paranoide
# Copia aquí los tres archivos: PLAN.md, CLAUDE.md y este README.md
claude-personal
```

## 5. Primer mensaje a Claude Code

Cuando Claude Code arranque, pégale este mensaje:

> Hola. Lee primero `CLAUDE.md` y `PLAN.md`, que tienes en esta carpeta. 
> Son las instrucciones del proyecto y la hoja de ruta. Recuerda que no soy 
> desarrollador de Next.js: explícame cada paso en lenguaje llano antes de 
> escribir código.
>
> Objetivo de esta primera sesión: completar la "Sesión 1 — Andamiaje" 
> descrita en PLAN.md.
>
> Empieza preguntándome lo que necesites saber (credenciales, rutas, 
> decisiones de naming) antes de tocar nada.

## 6. Datos que te va a pedir en la sesión 1

Ten a mano:

- **Connection string de Supabase** (Transaction pooler, puerto 6543).
- **API key de Anthropic** (la que creaste para este proyecto).
- **Nombre, email y contraseña** que tu padre usará para entrar al admin del libro. Apúntalos en un gestor de contraseñas; Claude Code no los verá después de la sesión.
- **Cómo quieres llamar al repo en GitHub** (p. ej. `grupo-paranoide-web`).

## 7. Después de cada sesión

1. `git status` para ver qué cambió.
2. `git log --oneline` para leer los commits que hizo Claude Code.
3. Si algo no entiendes, pregúntale antes de cerrar la sesión.
4. Haz `git push` al final (Claude Code puede hacerlo también, pero está bien que lo hagas tú conscientemente).

## Contacto de emergencia

Si algo se atasca o una sesión acaba en un estado raro, vuelve a la 
conversación principal (esta, donde estás leyendo esto) y cuéntame qué pasó. 
El `PLAN.md` es nuestro sitio común de referencia.
