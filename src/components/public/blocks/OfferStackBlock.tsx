import { Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import type { OfferStackBlock as OfferStackBlockType } from '@/types/offer-page';

interface OfferStackBlockProps {
  data: OfferStackBlockType['data'];
  preview?: boolean;
}

export default function OfferStackBlock({ data, preview }: OfferStackBlockProps) {
  return (
    <section className="py-16 px-6 md:px-12 lg:px-20">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {data.headline || 'Everything You Get'}
          </h2>
          {data.description && (
            <p className="text-xl text-gray-600">
              {data.description}
            </p>
          )}
        </div>

        <Card className="p-8">
          <div className="space-y-4 mb-6">
            {(data.items || []).map((item) => (
              <div key={item.id} className="flex items-start gap-4 pb-4 border-b last:border-b-0">
                <div className="flex-shrink-0 mt-1">
                  <Check className="h-6 w-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 text-lg">{item.name}</h3>
                      {item.description && (
                        <p className="text-gray-600 text-sm mt-1">{item.description}</p>
                      )}
                    </div>
                    <span className="text-gray-700 font-medium ml-4">{item.value}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {data.totalValue && (
            <div className="border-t-2 pt-4 flex items-center justify-between text-xl font-bold">
              <span>Total Value:</span>
              <span className="text-green-600">{data.totalValue}</span>
            </div>
          )}

          {data.ctaText && (
            <div className="mt-6 text-center">
              <Button size="lg" className="text-lg px-8 py-6">
                {data.ctaText}
              </Button>
            </div>
          )}
        </Card>

        {(!data.items || data.items.length === 0) && (
          <div className="text-center text-gray-500">
            <p>No items added yet</p>
          </div>
        )}
      </div>
    </section>
  );
}
