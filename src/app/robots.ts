import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://blogcanvas.com'

  return {
    rules: [
      {
        userAgent: '*',
        allow: [
          '/',
          '/vendor/*',
          '/portal/*',
          '/about',
          '/pricing',
          '/features',
          '/blog',
        ],
        disallow: [
          '/api/*',
          '/vendor/dashboard/*',
          '/vendor/settings/*',
          '/admin/*',
          '/*?*session=*',
          '/*?*token=*',
        ],
      },
      {
        userAgent: 'GPTBot',
        disallow: ['/'],
      },
      {
        userAgent: 'CCBot',
        disallow: ['/'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
