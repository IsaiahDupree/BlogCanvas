import { MetadataRoute } from 'next'
import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'
export const revalidate = 3600 // Revalidate every hour

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://blogcanvas.com'
  const supabase = await createClient()

  // Static routes
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/pricing`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/features`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
  ]

  // Dynamic vendor pages
  let vendorRoutes: MetadataRoute.Sitemap = []
  try {
    const { data: vendors } = await supabase
      .from('vendors')
      .select('handle, updated_at')
      .eq('status', 'active')
      .limit(1000)

    vendorRoutes = vendors?.map((vendor) => ({
      url: `${baseUrl}/@${vendor.handle}`,
      lastModified: new Date(vendor.updated_at),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })) || []
  } catch (error) {
    console.error('Error fetching vendors for sitemap:', error)
  }

  // Dynamic offer pages
  let offerRoutes: MetadataRoute.Sitemap = []
  try {
    const { data: offers } = await supabase
      .from('offer_pages')
      .select('id, slug, vendor:vendors(handle), updated_at')
      .eq('status', 'published')
      .limit(1000)

    offerRoutes = offers?.map((offer) => ({
      url: `${baseUrl}/@${offer.vendor?.handle}/${offer.slug}`,
      lastModified: new Date(offer.updated_at),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    })) || []
  } catch (error) {
    console.error('Error fetching offers for sitemap:', error)
  }

  return [...staticRoutes, ...vendorRoutes, ...offerRoutes]
}
