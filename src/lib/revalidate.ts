import { revalidatePath } from 'next/cache'

// Al guardar en el admin, tira a la basura las copias en caché de las páginas públicas
// para que el cambio se vea al momento. Fuera de Next (scripts sueltos) no hace nada.
export function refreshPublicPages() {
  try {
    revalidatePath('/', 'layout')
  } catch {
    // sin contexto de Next: las páginas se refrescan solas al cumplirse la hora
  }
}
