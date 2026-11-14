'use client'

import { useEffect } from 'react'

// El <html> es común a los dos idiomas; aquí se ajusta su etiqueta `lang` al idioma de la página
// (útil para lectores de pantalla y para el traductor automático del navegador).
export default function HtmlLang({ locale }: { locale: string }) {
  useEffect(() => {
    document.documentElement.lang = locale === 'en' ? 'en' : 'es'
  }, [locale])
  return null
}
