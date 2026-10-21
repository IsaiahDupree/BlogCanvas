import type { Metadata } from 'next'
import { SITE_URL } from '@/lib/site-url'

interface GenerateMetadataParams {
  title: string
  description: string
  path: string
  image?: string
  type?: 'website' | 'article' | 'profile'
  publishedTime?: string
  modifiedTime?: string
  author?: string
  noIndex?: boolean
  vendorName?: string
  ogType?: 'default' | 'post' | 'offer'
}

export function generateMetadata({
  title,
  description,
  path,
  image,
  type = 'website',
  publishedTime,
  modifiedTime,
  author,
  noIndex = false,
  vendorName,
  ogType = 'default',
}: GenerateMetadataParams): Metadata {
  const baseUrl = SITE_URL
  const url = `${baseUrl}${path}`

  // Generate dynamic OG image if no custom image is provided
  let ogImage = image
  if (!ogImage) {
    const params = new URLSearchParams({
      title: title.slice(0, 100), // Limit length for URL
      description: description.slice(0, 150),
      type: ogType,
    })
    if (vendorName) params.set('vendor', vendorName)
    if (author) params.set('author', author)
    ogImage = `${baseUrl}/api/og?${params.toString()}`
  }

  const metadata: Metadata = {
    title,
    description,
    robots: noIndex ? {
      index: false,
      follow: false,
    } : {
      index: true,
      follow: true,
    },
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: 'BlogCanvas',
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title,
        },
      ],
      locale: 'en_US',
      type,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  }

  // Add article-specific metadata
  if (type === 'article' && (publishedTime || modifiedTime || author)) {
    metadata.openGraph = {
      ...metadata.openGraph,
      type: 'article',
      publishedTime,
      modifiedTime,
      authors: author ? [author] : undefined,
    }
  }

  return metadata
}

export const defaultMetadata: Metadata = {
  title: {
    template: '%s | BlogCanvas',
    default: 'BlogCanvas - Client-Vendor Relationship Management',
  },
  description: 'The all-in-one platform for bloggers to manage clients, create offers, and streamline content delivery.',
  keywords: [
    'blogger management',
    'client portal',
    'content management',
    'vendor platform',
    'blog canvas',
    'client relationships',
  ],
  creator: 'BlogCanvas',
  publisher: 'BlogCanvas',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(SITE_URL),
  openGraph: {
    title: 'BlogCanvas - Client-Vendor Relationship Management',
    description: 'The all-in-one platform for bloggers to manage clients, create offers, and streamline content delivery.',
    siteName: 'BlogCanvas',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BlogCanvas - Client-Vendor Relationship Management',
    description: 'The all-in-one platform for bloggers to manage clients, create offers, and streamline content delivery.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
}
