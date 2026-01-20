'use client';

import { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import type { FAQBlock as FAQBlockType } from '@/types/offer-page';

interface FAQBlockProps {
  data: FAQBlockType['data'];
  preview?: boolean;
}

export default function FAQBlock({ data, preview }: FAQBlockProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  return (
    <section className="py-16 px-6 md:px-12 lg:px-20">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-12 text-center">
          {data.headline || 'FAQ'}
        </h2>

        <div className="space-y-4">
          {(data.faqs || []).map((faq, index) => (
            <div
              key={faq.id}
              className="border rounded-lg overflow-hidden bg-white"
            >
              <button
                className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
                onClick={() => setOpenIndex(openIndex === index ? null : index)}
              >
                <span className="font-semibold text-gray-900">{faq.question}</span>
                <ChevronDown
                  className={`h-5 w-5 text-gray-500 transition-transform ${
                    openIndex === index ? 'transform rotate-180' : ''
                  }`}
                />
              </button>
              {openIndex === index && (
                <div className="px-6 pb-4 text-gray-600">
                  {faq.answer}
                </div>
              )}
            </div>
          ))}
        </div>

        {(!data.faqs || data.faqs.length === 0) && (
          <div className="text-center text-gray-500">
            <p>No FAQs added yet</p>
          </div>
        )}
      </div>
    </section>
  );
}
