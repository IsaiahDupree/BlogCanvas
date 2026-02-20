import { Organization, Product, BreadcrumbList, Article, WithContext } from 'schema-dts'

export function generateOrganizationSchema(): WithContext<Organization> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://blogcanvas.com'

  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'BlogCanvas',
    url: baseUrl,
    logo: `${baseUrl}/logo.png`,
    description: 'Client-Vendor Relationship Management Platform for Bloggers',
    sameAs: [
      'https://twitter.com/blogcanvas',
      'https://linkedin.com/company/blogcanvas',
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'Customer Support',
      email: 'support@blogcanvas.com',
    },
  }
}

interface ProductSchemaParams {
  name: string
  description: string
  price: number
  currency?: string
  url: string
  image?: string
  vendor: {
    name: string
    handle: string
  }
}

export function generateProductSchema({
  name,
  description,
  price,
  currency = 'USD',
  url,
  image,
  vendor,
}: ProductSchemaParams): WithContext<Product> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://blogcanvas.com'

  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description,
    image: image || `${baseUrl}/og-default.png`,
    url,
    offers: {
      '@type': 'Offer',
      price: price.toString(),
      priceCurrency: currency,
      availability: 'https://schema.org/InStock',
      seller: {
        '@type': 'Organization',
        name: vendor.name,
        url: `${baseUrl}/@${vendor.handle}`,
      },
    },
  }
}

interface BreadcrumbItem {
  name: string
  url: string
}

export function generateBreadcrumbSchema(items: BreadcrumbItem[]): WithContext<BreadcrumbList> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  }
}

interface ArticleSchemaParams {
  title: string
  description: string
  url: string
  image?: string
  datePublished: string
  dateModified?: string
  author: {
    name: string
    url?: string
  }
}

export function generateArticleSchema({
  title,
  description,
  url,
  image,
  datePublished,
  dateModified,
  author,
}: ArticleSchemaParams): WithContext<Article> {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://blogcanvas.com'

  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description,
    image: image || `${baseUrl}/og-default.png`,
    url,
    datePublished,
    dateModified: dateModified || datePublished,
    author: {
      '@type': 'Person',
      name: author.name,
      url: author.url,
    },
    publisher: {
      '@type': 'Organization',
      name: 'BlogCanvas',
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/logo.png`,
      },
    },
  }
}

// Helper component to render JSON-LD script tag
export function StructuredData({ data }: { data: WithContext<Organization | Product | BreadcrumbList | Article> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}
