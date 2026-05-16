/**
 * Actualiza las páginas auxiliares con su traducción al inglés.
 * Ejecutar con: npm run translate-pages
 */

import { getPayload } from 'payload'
import config from '@payload-config'

function para(text: string) {
  return {
    type: 'paragraph' as const,
    version: 1,
    format: '' as const,
    indent: 0,
    direction: 'ltr' as const,
    children: [
      { type: 'text', version: 1, text, format: 0, detail: 0, mode: 'normal' as const, style: '' },
    ],
  }
}

function lexical(paragraphs: string[]) {
  return {
    root: {
      type: 'root' as const,
      version: 1,
      format: '' as const,
      indent: 0,
      direction: 'ltr' as const,
      children: paragraphs.map(para),
    },
  }
}

const translations: Record<string, { title: string; content: ReturnType<typeof lexical> }> = {
  'sobre-mi': {
    title: 'About me',
    content: lexical([
      'I was born in 1960 in Sabadell (Barcelona).',
      'I obtained my degree in Medicine and Surgery from the Autonomous University of Barcelona.',
      'I completed my psychiatry residency (MIR) at the Hospital General Universitario Gregorio Marañón (formerly known as the Provincial Hospital) in Madrid.',
      'Almost the entirety of my professional career — both clinical practice and teaching — has been linked to the Hospital Universitario Doce de Octubre, in the Usera district of Madrid.',
      'I currently work clinically at the Centro de Salud Mental de Villaverde (affiliated with that hospital) and at UNINPSI (Clinical Psychology Unit), part of the Universidad Pontificia de Comillas.',
      'For many years I collaborated with the Barcelona-based association AIS (Asesoramiento e Información en Socioadicciones). Initially, this organisation focused on the problem of sectarian or manipulative groups. It later expanded its activities to include youth gangs and behavioural dependencies.',
      'My curiosity has been directed primarily towards two pathologies: paranoia and hysteria. I have consistently defended the thesis that paranoia is a contagious phenomenon, affecting not only individuals but also groups.',
      'In the late 19th century, hysteria began to be subdivided into increasingly defined and homogeneous clinical entities, and this process of fragmentation led to its disappearance from official psychiatry today. It has been replaced by a number of diagnoses that are more easily identified but are artificial constructs. Hysteria exists — doctors have diagnosed it at least since Ancient Greece — and its elimination is a mistake.',
      'On this website, I aim only to record those areas to which I have dedicated the most hours of study and reflection. Perhaps I can contribute my small part to the advancement of scientific knowledge.',
    ]),
  },
  'obstinaciones': {
    title: 'Obstinaciones',
    content: lexical([
      'From obsessive to obstinate personality',
      '[Link pending — add the link from the admin panel]',
    ]),
  },
  'depresion': {
    title: 'Depresión',
    content: lexical([
      '1. Ethology of depression',
      '2. Guilt and the dualistic complex',
      '3. Universality of the dualistic complex',
      '4. Sociobiology. Affiliative behaviour. Orangutans',
      '5. Various sociobiological patterns in Primates',
      '6. Cat colonies, wolf pairs and Palaeolithic bands',
      '7. The benevolent complex',
      '8. Natural selection',
      '9. Final digressions',
      '[Links pending — add links from the admin panel]',
    ]),
  },
}

async function run() {
  const payload = await getPayload({ config })

  for (const [slug, { title, content }] of Object.entries(translations)) {
    const { docs } = await payload.find({
      collection: 'pages',
      where: { slug: { equals: slug } },
      limit: 1,
    })

    const page = docs[0]
    if (!page) {
      console.log(`⚠  No encontrada: ${slug}`)
      continue
    }

    await payload.update({
      collection: 'pages',
      id: page.id,
      locale: 'en',
      data: { title, content },
    })

    console.log(`✓  Traducida: ${slug}`)
  }

  console.log('\nListo.')
  process.exit(0)
}

run().catch((err) => {
  console.error(err)
  process.exit(1)
})
