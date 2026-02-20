import { Metadata } from 'next'

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
}: GenerateMetadataParams): Metadata {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://blogcanvas.com'
  const url = `${baseUrl}${path}`
  const defaultImage = `${baseUrl}/og-default.png`
  const ogImage = image || defaultImage

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
      creator: '@blogcanvas',
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
  authors: [{ name: 'BlogCanvas' }],
  creator: 'BlogCanvas',
  publisher: 'BlogCanvas',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'https://blogcanvas.com'),
  openGraph: {
    title: 'BlogCanvas - Client-Vendor Relationship Management',
    description: 'The all-in-one platform for bloggers to manage clients, create offers, and streamline content delivery.',
    url: process.env.NEXT_PUBLIC_APP_URL || 'https://blogcanvas.com',
    siteName: 'BlogCanvas',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'BlogCanvas - Client-Vendor Relationship Management',
    description: 'The all-in-one platform for bloggers to manage clients, create offers, and streamline content delivery.',
    creator: '@blogcanvas',
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
