'use client';

import { useParams } from 'next/navigation';
import BookingCalendar from '@/components/scheduling/BookingCalendar';
import { Card } from '@/components/ui/card';
import { useEffect, useState } from 'react';
import { ArrowLeft, User } from 'lucide-react';
import Link from 'next/link';

interface VendorInfo {
  id: string;
  handle: string;
  business_name: string;
  bio?: string;
  logo_url?: string;
}

export default function PublicBookingPage() {
  const params = useParams();
  // Handle both @vendor and vendor formats
  const rawHandle = params.vendorHandle as string;
  const vendorHandle = rawHandle.startsWith('@') ? rawHandle.slice(1) : rawHandle;
  const meetingTypeId = params.meetingTypeId as string;

  const [loading, setLoading] = useState(true);
  const [vendor, setVendor] = useState<VendorInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadVendor();
  }, [vendorHandle]);

  const loadVendor = async () => {
    try {
      const response = await fetch(`/api/public/vendor/${vendorHandle}`);
      const data = await response.json();

      if (data.success) {
        setVendor(data.vendor);
      } else {
        setError('Vendor not found');
      }

      setLoading(false);
    } catch (err) {
      console.error('Error loading vendor:', err);
      setError('Failed to load vendor information');
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-4 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (error || !vendor) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="p-8 text-center max-w-md">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Page Not Found</h1>
          <p className="text-gray-600 mb-4">{error || 'This booking page does not exist.'}</p>
          <Link href="/" className="text-blue-600 hover:text-blue-700">
            Go to Homepage
          </Link>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b">
        <div className="max-w-3xl mx-auto px-4 py-4">
          <Link
            href={`/${vendorHandle}`}
            className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to {vendor.business_name}
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Vendor Info */}
        <div className="flex items-center gap-4 mb-8">
          {vendor.logo_url ? (
            <img
              src={vendor.logo_url}
              alt={vendor.business_name}
              className="w-16 h-16 rounded-full object-cover"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
              <User className="h-8 w-8 text-blue-600" />
            </div>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{vendor.business_name}</h1>
            {vendor.bio && (
              <p className="text-gray-600 mt-1">{vendor.bio}</p>
            )}
          </div>
        </div>

        {/* Booking Calendar */}
        <BookingCalendar
          vendorId={vendor.id}
          meetingTypeId={meetingTypeId}
          onBookingComplete={(meetingId) => {
            console.log('Meeting booked:', meetingId);
          }}
        />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t mt-12">
        <div className="max-w-3xl mx-auto px-4 py-6 text-center text-sm text-gray-500">
          Powered by <span className="font-semibold text-gray-700">BlogCanvas</span>
        </div>
      </footer>
    </div>
  );
}
