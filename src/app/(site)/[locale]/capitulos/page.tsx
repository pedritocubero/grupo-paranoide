import { getPayloadClient } from '@/lib/payload'
import type { Metadata } from 'next'
import Link from 'next/link'

export const dynamic = 'force-dynamic'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale } = await params
  return {
    title: locale === 'es' ? 'Capítulos — El grupo paranoide' : 'Chapters — El grupo paranoide',
  }
}

const PART_LABELS: Record<string, { es: string; en: string }> = {
  I: { es: 'Parte I', en: 'Part I' },
  II: { es: 'Parte II', en: 'Part II' },
  III: { es: 'Parte III', en: 'Part III' },
}

type Props = {
  params: Promise<{ locale: string }>
}

export default async function CapitulosPage({ params }: Props) {
  const { locale } = await params
  const payload = await getPayloadClient()

  const { docs: chapters } = await payload.find({
    collection: 'chapters',
    locale: locale as 'es' | 'en',
    sort: 'order',
    limit: 100,
  })

  const byPart = (['I', 'II', 'III'] as const).map((part) => ({
    part,
    label: PART_LABELS[part][locale as 'es' | 'en'] ?? PART_LABELS[part].es,
    chapters: chapters.filter((c) => c.part === part),
  }))

  return (
    <div className="max-w-2xl mx-auto px-6 py-16">
      <div className="mb-16 text-center">
        <p className="font-sans text-xs tracking-widest uppercase text-stone-400 mb-4">
          Pedro Cubero Bros
        </p>
        <h1 className="font-serif text-4xl text-foreground leading-tight">
          {locale === 'en' ? 'The Paranoid Group' : 'El grupo paranoide'}
        </h1>
      </div>

      <details className="mb-16 group">
        <summary className="cursor-pointer list-none font-sans text-xs tracking-widest uppercase text-stone-400 hover:text-stone-600 transition-colors mb-0 flex items-center gap-2">
          <span className="inline-block transition-transform group-open:rotate-90">▶</span>
          {locale === 'es' ? 'Sobre «El Grupo Paranoide»' : 'About "El Grupo Paranoide"'}
        </summary>
        <div className="mt-6 font-serif text-base leading-relaxed text-stone-700 space-y-5">
        {locale === 'en' ? (
          <>
            <p>
              The book <em>El grupo paranoide</em> was published by Ediciones Experiencia in 2005.
              Since then I have never stopped revisiting it, again and again. Haltingly, I have added
              new observations and reflections, and have tried to improve the clarity of exposition.
              The text offered here is the result of that effort.
            </p>
            <p>The aim of the book is to convey five simple ideas:</p>
            <ol className="list-decimal pl-6 space-y-3">
              <li>
                There exists a &ldquo;paranoid behavior&rdquo; that manifests not only in various
                psychiatric disorders, but can be activated, transiently, in any human being.
              </li>
              <li>
                Today the term paranoid/paranoia is equated with distrust and ideas of harm and
                persecution. However, it would be worthwhile to recover the considerably broader
                meaning initially given to it by classical authors.
              </li>
              <li>
                Paranoid behavior is contagious. Paranoid groups are those in which intense
                reciprocal contagion occurs among their members. In this transmission, the group
                leader usually plays a primary role.
              </li>
              <li>
                <p>
                  Once collective contagion has been set in motion, paranoid activation will manifest
                  in:
                </p>
                <p className="mt-1">
                  a) The actions and characteristics of the group, taken as a being with a life of
                  its own.
                </p>
                <p>b) The individual behavior of each of its members.</p>
              </li>
              <li>
                Paranoid contagion can occur in very small human groups — a family, for example —
                as well as in larger ones, and can affect large societies as a whole.
              </li>
            </ol>
            <p>The book is structured in three parts.</p>
            <p>
              <a href="#parte-i" className="hover:text-stone-900 transition-colors">The first</a>{' '}
              introduces the concept of the{' '}
              <strong>paranoid contagion group</strong>, for which it is essential to first refer to{' '}
              <strong>&ldquo;paranoid behavior&rdquo;</strong>, understood as an individual
              phenomenon.
            </p>
            <p>
              <a href="#parte-ii" className="hover:text-stone-900 transition-colors">The second part</a>{' '}
              presents the <strong>cases</strong> that have been studied and that
              have served to describe the characteristics common to all paranoid contagion groups
              (PCG). Before beginning the description of <em>what</em> PCGs are like, it is
              necessary to specify <em>which or who</em> they are.
            </p>
            <p>
              <a href="#parte-iii" className="hover:text-stone-900 transition-colors">The third part</a>,
              the most extensive, is devoted to the detailed description of the{' '}
              <strong>characteristics of paranoid contagion groups</strong> and the changes they
              induce in individuals.
            </p>
          </>
        ) : (
          <>
            <p>
              El libro <em>El grupo paranoide</em> fue publicado por Ediciones Experiencia en el año 2005.
              Desde esa fecha no he dejado de revisarlo, una y otra vez. A trompicones, he ido añadiendo
              nuevas observaciones y reflexiones, y he intentado mejorar la claridad expositiva. El texto
              que aquí se ofrece es el resultado de ese esfuerzo.
            </p>
            <p>El objetivo del libro es transmitir cinco simples ideas:</p>
            <ol className="list-decimal pl-6 space-y-3">
              <li>
                Existe una &ldquo;conducta paranoide&rdquo; que no solamente se pone de manifiesto en
                varios trastornos psiquiátricos, sino que se puede activar, transitoriamente, en cualquier
                ser humano.
              </li>
              <li>
                Hoy en día se equipara el término paranoide/paranoia con la desconfianza y las ideas de
                perjuicio y persecución. Sin embargo, sería conveniente recuperar el sentido bastante más
                amplio que inicialmente le dieron los autores clásicos.
              </li>
              <li>
                La conducta paranoide es contagiosa. Los grupos paranoides son aquellos en los que se
                produce un intenso contagio recíproco entre sus miembros. En esta transmisión, el
                dirigente del grupo suele jugar un papel primordial.
              </li>
              <li>
                <p>
                  Una vez se ha puesto en marcha el contagio colectivo, la activación paranoide se pondrá
                  de manifiesto en:
                </p>
                <p className="mt-1">
                  a) Las acciones y características del grupo, tomado éste como un ser con vida propia.
                </p>
                <p>b) La conducta individual de cada uno de sus integrantes.</p>
              </li>
              <li>
                El contagio paranoide puede producirse tanto en grupos humanos muy reducidos —una familia,
                por poner un ejemplo—, como en otros de mayor tamaño, como afectar a grandes sociedades en
                su conjunto.
              </li>
            </ol>
            <p>El libro se estructura en tres partes.</p>
            <p>
              <a href="#parte-i" className="hover:text-stone-900 transition-colors">La primera</a>{' '}
              introduce el concepto de{' '}
              <strong>grupo de contagio paranoide</strong>, para lo cual es imprescindible referirse
              previamente a la <strong>
                &ldquo;conducta paranoide&rdquo;
              </strong>, entendida como fenómeno individual.
            </p>
            <p>
              En{' '}
              <a href="#parte-ii" className="hover:text-stone-900 transition-colors">la segunda parte</a>{' '}
              se presentan los <strong>casos</strong> que se han estudiado y que han
              servido para describir las características comunes al conjunto de los grupos de contagio
              paranoide (GCP). Antes de comenzar con la descripción de <em>cómo son</em> los GCP es
              necesario precisar <em>cuáles o quiénes son</em>.
            </p>
            <p>
              <a href="#parte-iii" className="hover:text-stone-900 transition-colors">La tercera parte</a>,
              la más extensa, se consagra a la descripción detallada de las{' '}
              <strong>características de los grupos de contagio paranoide</strong> y de los cambios que
              inducen en los individuos.
            </p>
          </>
        )}
        </div>
      </details>

      <div className="space-y-12">
        {byPart.map(({ part, label, chapters: partChapters }) => (
          <section key={part} id={`parte-${part.toLowerCase()}`}>
            <h2 className="font-sans text-xs tracking-widest uppercase text-stone-400 mb-6 pb-3 border-b border-stone-100">
              {label}
            </h2>
            <ol className="space-y-4">
              {partChapters.map((chapter) => (
                <li key={chapter.id}>
                  <div className="flex items-baseline gap-4">
                    <span className="font-sans text-xs text-stone-300 w-5 shrink-0 text-right">
                      {chapter.order}
                    </span>
                    <div className="flex-1 flex items-baseline justify-between gap-4">
                      <Link
                        href={`/${locale}/capitulo/${chapter.slug}`}
                        className="font-serif text-lg text-foreground hover:text-stone-500 transition-colors"
                      >
                        {chapter.title as string}
                      </Link>
                      <div className="flex items-center gap-3 shrink-0">
                        <Link
                          href={`/${locale}/capitulo/${chapter.slug}`}
                          className="font-sans text-[11px] tracking-widest uppercase text-stone-400 hover:text-stone-700 transition-colors"
                        >
                          {locale === 'en' ? 'Read' : 'Leer'}
                        </Link>
                        <a
                          href={`/${locale}/capitulo/${chapter.slug}/pdf`}
                          className="font-sans text-[11px] tracking-widest uppercase text-stone-400 hover:text-stone-700 transition-colors"
                        >
                          PDF
                        </a>
                      </div>
                      {chapter.subtitle && (
                        <p className="font-sans text-xs text-stone-400 mt-1 leading-relaxed">
                          {chapter.subtitle as string}
                        </p>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>
    </div>
  )
}
