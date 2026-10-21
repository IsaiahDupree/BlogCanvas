import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site-url'

export default function sitemap(): MetadataRoute.Sitemap {
  // /blog is explicitly noindex until its content and rendering dependencies are ready.
  return [{ url: `${SITE_URL}/` }]
}
