import { Star } from 'lucide-react';
import { Card } from '@/components/ui/card';
import type { TestimonialsBlock as TestimonialsBlockType } from '@/types/offer-page';

interface TestimonialsBlockProps {
  data: TestimonialsBlockType['data'];
  preview?: boolean;
}

export default function TestimonialsBlock({ data, preview }: TestimonialsBlockProps) {
  return (
    <section className="py-16 px-6 md:px-12 lg:px-20 bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-12 text-center">
          {data.headline || 'Testimonials'}
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {(data.testimonials || []).map((testimonial) => (
            <Card key={testimonial.id} className="p-6">
              {testimonial.rating && (
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
              )}
              <p className="text-gray-700 mb-4 italic">"{testimonial.quote}"</p>
              <div>
                <p className="font-semibold text-gray-900">{testimonial.author}</p>
                {testimonial.authorTitle && (
                  <p className="text-sm text-gray-600">{testimonial.authorTitle}</p>
                )}
              </div>
            </Card>
          ))}
        </div>

        {(!data.testimonials || data.testimonials.length === 0) && (
          <div className="text-center text-gray-500">
            <p>No testimonials added yet</p>
          </div>
        )}
      </div>
    </section>
  );
}
