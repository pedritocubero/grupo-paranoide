import { RootPage, generatePageMetadata } from '@payloadcms/next/views'
import { importMap } from '../../importMap'
import config from '@payload-config'

type Args = {
  params: Promise<{
    segments: string[]
  }>
  searchParams: Promise<{
    [key: string]: string | string[]
  }>
}

export const generateMetadata = async ({ params, searchParams }: Args) =>
  generatePageMetadata({ config, params, searchParams })

const Page = async ({ params, searchParams }: Args) =>
  RootPage({ config, importMap, params, searchParams })

export default Page
