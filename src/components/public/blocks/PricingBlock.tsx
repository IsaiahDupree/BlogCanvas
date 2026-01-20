import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { PricingBlock as PricingBlockType } from '@/types/offer-page';

interface PricingBlockProps {
  data: PricingBlockType['data'];
  preview?: boolean;
}

export default function PricingBlock({ data, preview }: PricingBlockProps) {
  return (
    <section id="pricing" className="py-16 px-6 md:px-12 lg:px-20 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {data.headline || 'Pricing'}
          </h2>
          {data.description && (
            <p className="text-xl text-gray-600">
              {data.description}
            </p>
          )}
        </div>

        <Card className="p-8 text-center">
          <p className="text-gray-600 mb-6">
            Pricing will be displayed here once you configure your offer.
          </p>
          {data.ctaText && (
            <Button size="lg" className="text-lg px-8 py-6">
              {data.ctaText}
            </Button>
          )}
        </Card>
      </div>
    </section>
  );
}
