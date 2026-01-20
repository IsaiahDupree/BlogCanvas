'use client';

import { useEffect, useState } from 'react';
import { useParams, notFound } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import type { OfferPage } from '@/types/offer-page';
import type { Vendor } from '@/types/vendor';
import OfferPageRenderer from '@/components/public/OfferPageRenderer';

export default function PublicOfferPage() {
  const params = useParams();
  const vendorHandle = params?.vendorHandle as string;
  const slug = params?.slug as string;

  const [loading, setLoading] = useState(true);
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [page, setPage] = useState<OfferPage | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPage();
  }, [vendorHandle, slug]);

  const loadPage = async () => {
    try {
      setLoading(true);
      setError(null);

      // Remove @ prefix if present
      const cleanHandle = vendorHandle.startsWith('@')
        ? vendorHandle.substring(1)
        : vendorHandle;

      // Load vendor first
      const response = await fetch(`/api/public/vendor/${cleanHandle}`);
      const vendorData = await response.json();

      if (!vendorData.success || !vendorData.vendor) {
        setError('Vendor not found');
        setLoading(false);
        return;
      }

      setVendor(vendorData.vendor);

      // Load offer page
      const pageResponse = await fetch(`/api/public/vendor/${cleanHandle}/page/${slug}`);
      const pageData = await pageResponse.json();

      if (!pageData.success || !pageData.page) {
        setError('Page not found');
        setLoading(false);
        return;
      }

      setPage(pageData.page);
      setLoading(false);

      // Track page view
      await fetch('/api/events/track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event_name: 'page_view',
          event_type: 'page',
          vendor_id: vendorData.vendor.id,
          page_id: pageData.page.id,
          properties: {
            vendor_handle: cleanHandle,
            page_slug: slug,
            url: window.location.href
          }
        })
      });

    } catch (err) {
      console.error('Error loading page:', err);
      setError('Failed to load page');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error || !vendor || !page) {
    return notFound();
  }

  return <OfferPageRenderer vendor={vendor} page={page} />;
}
