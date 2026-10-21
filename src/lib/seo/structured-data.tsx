import type { Organization, Product, BreadcrumbList, Article, WithContext } from 'schema-dts'
import { SITE_URL } from '@/lib/site-url'

export function generateOrganizationSchema(): WithContext<Organization> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'BlogCanvas',
    url: `${SITE_URL}/`,
    description: 'Client-Vendor Relationship Management Platform for Bloggers',
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
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name,
    description,
    ...(image ? { image } : {}),
    url,
    offers: {
      '@type': 'Offer',
      price: price.toString(),
      priceCurrency: currency,
      availability: 'https://schema.org/InStock',
      seller: {
        '@type': 'Organization',
        name: vendor.name,
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
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: title,
    description,
    ...(image ? { image } : {}),
    url,
    datePublished,
    ...(dateModified ? { dateModified } : {}),
    author: {
      '@type': 'Person',
      name: author.name,
      url: author.url,
    },
    publisher: {
      '@type': 'Organization',
      name: 'BlogCanvas',
    },
  }
}

// Helper component to render JSON-LD script tag
export function StructuredData({ data }: { data: WithContext<Organization | Product | BreadcrumbList | Article> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data).replace(/</g, '\\u003c') }}
    />
  )
}
