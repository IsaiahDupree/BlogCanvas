'use client';

import type { OfferPage, PageBlock } from '@/types/offer-page';
import HeroBlock from './blocks/HeroBlock';
import VSLBlock from './blocks/VSLBlock';
import ProblemSolutionBlock from './blocks/ProblemSolutionBlock';
import FeaturesBlock from './blocks/FeaturesBlock';
import TestimonialsBlock from './blocks/TestimonialsBlock';
import OfferStackBlock from './blocks/OfferStackBlock';
import PricingBlock from './blocks/PricingBlock';
import FAQBlock from './blocks/FAQBlock';
import CTABlock from './blocks/CTABlock';

interface PublicPageRendererProps {
  page: OfferPage;
  preview?: boolean;
}

export default function PublicPageRenderer({ page, preview = false }: PublicPageRendererProps) {
  const blocks = page.blocks || [];

  // Sort blocks by order
  const sortedBlocks = [...blocks].sort((a, b) => a.order - b.order);

  return (
    <div className="min-h-screen bg-white">
      {/* Render each block */}
      {sortedBlocks.map((block) => (
        <div key={block.id}>
          {renderBlock(block, preview)}
        </div>
      ))}

      {/* Empty state */}
      {blocks.length === 0 && (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center text-gray-500">
            <p className="text-lg">No content yet</p>
            <p className="text-sm">Add blocks in the editor to build your page</p>
          </div>
        </div>
      )}
    </div>
  );
}

function renderBlock(block: PageBlock, preview: boolean) {
  switch (block.type) {
    case 'hero':
      return <HeroBlock key={block.id} data={block.data} preview={preview} />;
    case 'vsl':
      return <VSLBlock key={block.id} data={block.data} preview={preview} />;
    case 'problem_solution':
      return <ProblemSolutionBlock key={block.id} data={block.data} preview={preview} />;
    case 'features':
      return <FeaturesBlock key={block.id} data={block.data} preview={preview} />;
    case 'testimonials':
      return <TestimonialsBlock key={block.id} data={block.data} preview={preview} />;
    case 'offer_stack':
      return <OfferStackBlock key={block.id} data={block.data} preview={preview} />;
    case 'pricing':
      return <PricingBlock key={block.id} data={block.data} preview={preview} />;
    case 'faq':
      return <FAQBlock key={block.id} data={block.data} preview={preview} />;
    case 'cta':
      return <CTABlock key={block.id} data={block.data} preview={preview} />;
    default:
      return (
        <div key={block.id} className="p-8 text-center text-gray-500">
          Unknown block type: {block.type}
        </div>
      );
  }
}
