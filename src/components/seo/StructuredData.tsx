import { WebSite, Organization, WithContext } from 'schema-dts'
import { SITE_URL } from '@/lib/site-url'

/**
 * Structured Data for SEO
 * Provides JSON-LD markup for search engines
 */
export function StructuredData() {
  const websiteSchema: WithContext<WebSite> = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${SITE_URL}/#website`,
    name: 'BlogCanvas',
    description: 'AI-Powered Content Management Platform',
    url: SITE_URL,
    publisher: { '@id': `${SITE_URL}/#organization` },
  }

  const organizationSchema: WithContext<Organization> = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${SITE_URL}/#organization`,
    name: 'BlogCanvas',
    description: 'AI-Powered Content Management Platform for bloggers and content creators',
    url: SITE_URL,
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(websiteSchema).replace(/</g, '\\u003c'),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationSchema).replace(/</g, '\\u003c'),
        }}
      />
    </>
  )
}
