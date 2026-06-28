import { MetadataRoute } from 'next'
import { getBaseUrl } from '@/lib/url'

export default function sitemap(): MetadataRoute.Sitemap {
  const baseUrl = getBaseUrl()
  return [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'monthly', priority: 1 },
    { url: `${baseUrl}/book`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.9 },
  ]
}
