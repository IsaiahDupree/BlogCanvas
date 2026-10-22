import type { Metadata } from 'next'
import Link from 'next/link'
import { SITE_URL } from '@/lib/site-url'

export const metadata: Metadata = {
  title: 'Website scans',
  description: 'Run and review real website scans from your BlogCanvas workspace.',
  alternates: { canonical: `${SITE_URL}/analyze` },
  robots: { index: false, follow: true },
}

export default function WebsiteAnalysisPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6 py-16">
      <p className="text-sm font-semibold uppercase tracking-wide text-indigo-700">BlogCanvas workspace</p>
      <h1 className="mt-3 text-4xl font-bold tracking-tight text-gray-950">Run a real website scan</h1>
      <p className="mt-5 text-lg leading-8 text-gray-700">
        This public preview no longer displays sample analysis results. Sign in to open the
        Website Scanner for a site connected to your workspace and review its recorded scan data.
      </p>
      <div className="mt-8">
        <Link
          href="/login"
          className="inline-flex rounded-lg bg-indigo-700 px-5 py-3 font-semibold text-white hover:bg-indigo-800"
        >
          Sign in to BlogCanvas
        </Link>
      </div>
    </main>
  )
}
