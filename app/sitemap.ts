import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: 'https://www.ayurshalapanchakarma.com',       lastModified: new Date(), changeFrequency: 'monthly', priority: 1 },
    { url: 'https://www.ayurshalapanchakarma.com/book',  lastModified: new Date(), changeFrequency: 'monthly', priority: 0.9 },
  ]
}
