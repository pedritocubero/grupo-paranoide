import { NotFoundPage } from '@payloadcms/next/views'
import { importMap } from '../../importMap'
import config from '@payload-config'

type Args = {
  params: Promise<{ segments: string[] }>
  searchParams: Promise<{ [key: string]: string | string[] }>
}

export default function NotFound(args: Args) {
  return NotFoundPage({ config, importMap, ...args })
}
