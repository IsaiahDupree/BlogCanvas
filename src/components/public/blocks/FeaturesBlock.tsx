import { CheckCircle2 } from 'lucide-react';
import type { FeaturesBlock as FeaturesBlockType } from '@/types/offer-page';

interface FeaturesBlockProps {
  data: FeaturesBlockType['data'];
  preview?: boolean;
}

export default function FeaturesBlock({ data, preview }: FeaturesBlockProps) {
  const isGrid = data.layout === 'grid';

  return (
    <section className="py-16 px-6 md:px-12 lg:px-20">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            {data.headline || 'Features'}
          </h2>
          {data.description && (
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              {data.description}
            </p>
          )}
        </div>

        <div className={isGrid ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8' : 'space-y-6 max-w-3xl mx-auto'}>
          {(data.features || []).map((feature) => (
            <div
              key={feature.id}
              className={isGrid ? 'bg-white p-6 rounded-lg border shadow-sm' : 'flex gap-4'}
            >
              <div className={isGrid ? 'mb-4' : 'flex-shrink-0 mt-1'}>
                <CheckCircle2 className="h-6 w-6 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">
                  {feature.description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {(!data.features || data.features.length === 0) && (
          <div className="text-center text-gray-500">
            <p>No features added yet</p>
          </div>
        )}
      </div>
    </section>
  );
}
