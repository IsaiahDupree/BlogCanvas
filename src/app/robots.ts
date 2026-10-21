import type { MetadataRoute } from 'next'
import { SITE_URL } from '@/lib/site-url'

const disallowPrivatePaths = [
  '/admin',
  '/api',
  '/app',
  '/auth',
  '/client',
  '/client-portal',
  '/login',
  '/portal',
  '/register',
  '/settings',
  '/shared',
  '/vendor/dashboard',
  '/vendor/login',
  '/vendor/register',
  '/vendor/settings',
  '/*?*session=*',
  '/*?*token=*',
]

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: disallowPrivatePaths,
      },
      {
        userAgent: 'OAI-SearchBot',
        allow: '/',
        disallow: disallowPrivatePaths,
      },
      { userAgent: 'GPTBot', disallow: '/' },
      { userAgent: 'CCBot', disallow: '/' },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  }
}
