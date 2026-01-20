'use client';

import React from 'react';
import type { Vendor } from '@/types/vendor';
import type { OfferPage, PageBlock } from '@/types/offer-page';
import PageTracker from '@/components/tracking/PageTracker';
import HeroBlock from './blocks/HeroBlock';
import VSLBlock from './blocks/VSLBlock';
import ProblemSolutionBlock from './blocks/ProblemSolutionBlock';
import FeaturesBlock from './blocks/FeaturesBlock';
import TestimonialsBlock from './blocks/TestimonialsBlock';
import OfferStackBlock from './blocks/OfferStackBlock';
import PricingBlock from './blocks/PricingBlock';
import FAQBlock from './blocks/FAQBlock';
import CTABlock from './blocks/CTABlock';

interface OfferPageRendererProps {
  vendor: Vendor;
  page: OfferPage;
}

export default function OfferPageRenderer({ vendor, page }: OfferPageRendererProps) {
  const blocks = page.blocks || [];

  return (
    <div className="min-h-screen bg-white">
      {/* Event Tracking */}
      <PageTracker vendorId={vendor.id} pageId={page.id} />

      {/* SEO Meta Tags (handled by Next.js metadata) */}

      {/* Vendor Branding Bar */}
      <div 
        className="sticky top-0 z-50 bg-white border-b shadow-sm"
        style={{ borderBottomColor: vendor.brand_color || '#000000' }}
      >
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {vendor.logo_url && (
              <img 
                src={vendor.logo_url} 
                alt={vendor.business_name}
                className="h-8 w-auto"
              />
            )}
            <span className="font-bold text-lg">{vendor.business_name}</span>
          </div>
          {vendor.phone && (
            <a 
              href={`tel:${vendor.phone}`}
              className="text-sm text-gray-600 hover:text-gray-900"
            >
              {vendor.phone}
            </a>
          )}
        </div>
      </div>

      {/* Page Content - Render Blocks */}
      <main>
        {blocks.length === 0 ? (
          <div className="container mx-auto px-4 py-24 text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">{page.title}</h1>
            <p className="text-gray-600">{page.description || 'This page is being built.'}</p>
          </div>
        ) : (
          blocks.map((block) => (
            <div key={block.id}>
              {renderBlock(block, vendor)}
            </div>
          ))
        )}
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 border-t py-8 mt-16">
        <div className="container mx-auto px-4 text-center">
          <p className="text-sm text-gray-600">
            © {new Date().getFullYear()} {vendor.business_name}. All rights reserved.
          </p>
          {vendor.bio && (
            <p className="text-sm text-gray-500 mt-2 max-w-2xl mx-auto">
              {vendor.bio}
            </p>
          )}
        </div>
      </footer>
    </div>
  );
}

// Helper function to render individual blocks
function renderBlock(block: PageBlock, vendor: Vendor) {
  switch (block.type) {
    case 'hero':
      return <HeroBlock data={block.data} vendor={vendor} />;
    case 'vsl':
      return <VSLBlock data={block.data} />;
    case 'problem_solution':
      return <ProblemSolutionBlock data={block.data} />;
    case 'features':
      return <FeaturesBlock data={block.data} />;
    case 'testimonials':
      return <TestimonialsBlock data={block.data} />;
    case 'offer_stack':
      return <OfferStackBlock data={block.data} />;
    case 'pricing':
      return <PricingBlock data={block.data} vendor={vendor} />;
    case 'faq':
      return <FAQBlock data={block.data} />;
    case 'cta':
      return <CTABlock data={block.data} vendor={vendor} />;
    default:
      return (
        <div className="container mx-auto px-4 py-8">
          <p className="text-gray-500">Unknown block type: {block.type}</p>
        </div>
      );
  }
}
