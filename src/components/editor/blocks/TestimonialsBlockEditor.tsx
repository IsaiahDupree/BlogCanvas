'use client';

import { Plus, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { TestimonialsBlock } from '@/types/offer-page';

interface TestimonialsBlockEditorProps {
  data: TestimonialsBlock['data'];
  onChange: (data: TestimonialsBlock['data']) => void;
}

export default function TestimonialsBlockEditor({ data, onChange }: TestimonialsBlockEditorProps) {
  const handleChange = (field: keyof TestimonialsBlock['data'], value: any) => {
    onChange({ ...data, [field]: value });
  };

  const addTestimonial = () => {
    const newTestimonial = {
      id: crypto.randomUUID(),
      quote: 'Great service!',
      author: 'Customer Name',
      rating: 5
    };
    handleChange('testimonials', [...(data.testimonials || []), newTestimonial]);
  };

  const updateTestimonial = (index: number, field: string, value: any) => {
    const updated = [...(data.testimonials || [])];
    updated[index] = { ...updated[index], [field]: value };
    handleChange('testimonials', updated);
  };

  const deleteTestimonial = (index: number) => {
    const updated = data.testimonials?.filter((_, i) => i !== index) || [];
    handleChange('testimonials', updated);
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="headline">Headline *</Label>
        <Input
          id="headline"
          value={data.headline || ''}
          onChange={(e) => handleChange('headline', e.target.value)}
          placeholder="What Clients Say"
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="layout">Layout</Label>
        <Select
          value={data.layout || 'grid'}
          onValueChange={(value) => handleChange('layout', value)}
        >
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="grid">Grid</SelectItem>
            <SelectItem value="carousel">Carousel</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="border-t pt-4">
        <div className="flex items-center justify-between mb-3">
          <Label>Testimonials</Label>
          <Button size="sm" variant="outline" onClick={addTestimonial}>
            <Plus className="h-4 w-4 mr-1" />
            Add Testimonial
          </Button>
        </div>

        <div className="space-y-3">
          {(data.testimonials || []).map((testimonial, index) => (
            <div key={testimonial.id} className="p-3 border rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Testimonial {index + 1}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => deleteTestimonial(index)}
                  className="text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <Textarea
                value={testimonial.quote}
                onChange={(e) => updateTestimonial(index, 'quote', e.target.value)}
                placeholder="Testimonial quote"
                rows={2}
              />
              <Input
                value={testimonial.author}
                onChange={(e) => updateTestimonial(index, 'author', e.target.value)}
                placeholder="Author name"
              />
              <Input
                value={testimonial.authorTitle || ''}
                onChange={(e) => updateTestimonial(index, 'authorTitle', e.target.value)}
                placeholder="Author title (optional)"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
