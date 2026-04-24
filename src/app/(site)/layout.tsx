import type { Metadata } from 'next'
import { Crimson_Pro, Inter } from 'next/font/google'
import '../globals.css'

const crimsonPro = Crimson_Pro({
  variable: '--font-serif',
  subsets: ['latin'],
  weight: ['400', '600'],
  style: ['normal', 'italic'],
})

const inter = Inter({
  variable: '--font-sans',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'El grupo paranoide',
  description: 'Pedro Cubero Bros',
}

export default function SiteLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="es"
      className={`${crimsonPro.variable} ${inter.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-white text-stone-900">{children}</body>
    </html>
  )
}
