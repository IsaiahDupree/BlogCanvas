'use client';

import { Card } from '@/components/ui/card';
import type { OfferPage } from '@/types/offer-page';
import PublicPageRenderer from '@/components/public/PublicPageRenderer';

interface PagePreviewProps {
  page: OfferPage;
}

export default function PagePreview({ page }: PagePreviewProps) {
  return (
    <div className="bg-white rounded-lg border shadow-sm overflow-hidden">
      <div className="bg-gray-100 border-b px-4 py-2 flex items-center gap-2">
        <div className="flex gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-400"></div>
          <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
          <div className="w-3 h-3 rounded-full bg-green-400"></div>
        </div>
        <div className="flex-1 text-center text-sm text-gray-600 font-mono">
          Preview - blogcanvas.com/@yourhandle/{page.slug}
        </div>
      </div>

      <div className="max-h-[800px] overflow-y-auto">
        <PublicPageRenderer page={page} preview={true} />
      </div>
    </div>
  );
}
