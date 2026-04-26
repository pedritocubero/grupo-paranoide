import type { NextConfig } from 'next'
import { withPayload } from '@payloadcms/next/withPayload'

const nextConfig: NextConfig = {
  serverExternalPackages: ['@react-pdf/renderer'],
}

export default withPayload(nextConfig)
