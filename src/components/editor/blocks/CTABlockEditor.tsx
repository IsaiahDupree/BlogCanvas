'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { CTABlock } from '@/types/offer-page';

interface CTABlockEditorProps {
  data: CTABlock['data'];
  onChange: (data: CTABlock['data']) => void;
}

export default function CTABlockEditor({ data, onChange }: CTABlockEditorProps) {
  const handleChange = (field: keyof CTABlock['data'], value: any) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="headline">Headline *</Label>
        <Input
          id="headline"
          value={data.headline || ''}
          onChange={(e) => handleChange('headline', e.target.value)}
          placeholder="Ready to Get Started?"
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={data.description || ''}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder="Supporting text to encourage action"
          rows={2}
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="ctaText">CTA Button Text</Label>
        <Input
          id="ctaText"
          value={data.ctaText || ''}
          onChange={(e) => handleChange('ctaText', e.target.value)}
          placeholder="Take Action Now"
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="ctaLink">CTA Link</Label>
        <Input
          id="ctaLink"
          value={data.ctaLink || ''}
          onChange={(e) => handleChange('ctaLink', e.target.value)}
          placeholder="#pricing"
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="urgency">Urgency Text (optional)</Label>
        <Input
          id="urgency"
          value={data.urgency || ''}
          onChange={(e) => handleChange('urgency', e.target.value)}
          placeholder="Limited spots available"
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="backgroundColor">Background Color</Label>
        <Input
          id="backgroundColor"
          type="color"
          value={data.backgroundColor || '#000000'}
          onChange={(e) => handleChange('backgroundColor', e.target.value)}
          className="mt-1 h-10"
        />
      </div>
    </div>
  );
}
