import { createServerFeature } from '@payloadcms/richtext-lexical'

export const BlueTextFeature = createServerFeature({
  feature: {
    ClientFeature: '@/components/admin/BlueTextFeatureClient#BlueTextFeatureClient',
  },
  key: 'blueText',
})
