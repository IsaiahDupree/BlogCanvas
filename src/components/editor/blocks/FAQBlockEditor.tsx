'use client';

import { Plus, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import type { FAQBlock } from '@/types/offer-page';

interface FAQBlockEditorProps {
  data: FAQBlock['data'];
  onChange: (data: FAQBlock['data']) => void;
}

export default function FAQBlockEditor({ data, onChange }: FAQBlockEditorProps) {
  const handleChange = (field: keyof FAQBlock['data'], value: any) => {
    onChange({ ...data, [field]: value });
  };

  const addFAQ = () => {
    const newFAQ = {
      id: crypto.randomUUID(),
      question: 'New question?',
      answer: 'Answer here'
    };
    handleChange('faqs', [...(data.faqs || []), newFAQ]);
  };

  const updateFAQ = (index: number, field: string, value: string) => {
    const updatedFAQs = [...(data.faqs || [])];
    updatedFAQs[index] = { ...updatedFAQs[index], [field]: value };
    handleChange('faqs', updatedFAQs);
  };

  const deleteFAQ = (index: number) => {
    const updatedFAQs = data.faqs?.filter((_, i) => i !== index) || [];
    handleChange('faqs', updatedFAQs);
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="headline">Headline *</Label>
        <Input
          id="headline"
          value={data.headline || ''}
          onChange={(e) => handleChange('headline', e.target.value)}
          placeholder="Frequently Asked Questions"
          className="mt-1"
        />
      </div>

      <div className="border-t pt-4">
        <div className="flex items-center justify-between mb-3">
          <Label>FAQs</Label>
          <Button size="sm" variant="outline" onClick={addFAQ}>
            <Plus className="h-4 w-4 mr-1" />
            Add FAQ
          </Button>
        </div>

        <div className="space-y-3">
          {(data.faqs || []).map((faq, index) => (
            <div key={faq.id} className="p-3 border rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">FAQ {index + 1}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => deleteFAQ(index)}
                  className="text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <Input
                value={faq.question}
                onChange={(e) => updateFAQ(index, 'question', e.target.value)}
                placeholder="Question"
              />
              <Textarea
                value={faq.answer}
                onChange={(e) => updateFAQ(index, 'answer', e.target.value)}
                placeholder="Answer"
                rows={3}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
