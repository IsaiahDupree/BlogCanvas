import { WebSite, Organization, WithContext } from 'schema-dts'

/**
 * Structured Data for SEO
 * Provides JSON-LD markup for search engines
 */
export function StructuredData() {
  const websiteSchema: WithContext<WebSite> = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'BlogCanvas',
    description: 'AI-Powered Content Management Platform',
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://blogcanvas.com',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${process.env.NEXT_PUBLIC_APP_URL || 'https://blogcanvas.com'}/search?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  }

  const organizationSchema: WithContext<Organization> = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'BlogCanvas',
    description: 'AI-Powered Content Management Platform for bloggers and content creators',
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://blogcanvas.com',
    logo: `${process.env.NEXT_PUBLIC_APP_URL || 'https://blogcanvas.com'}/logo.png`,
    sameAs: [
      'https://twitter.com/blogcanvas',
      'https://github.com/blogcanvas',
    ],
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(websiteSchema),
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(organizationSchema),
        }}
      />
    </>
  )
}
