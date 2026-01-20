'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { HeroBlock } from '@/types/offer-page';

interface HeroBlockEditorProps {
  data: HeroBlock['data'];
  onChange: (data: HeroBlock['data']) => void;
}

export default function HeroBlockEditor({ data, onChange }: HeroBlockEditorProps) {
  const handleChange = (field: keyof HeroBlock['data'], value: any) => {
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
          placeholder="Your Compelling Headline"
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="subheadline">Subheadline</Label>
        <Textarea
          id="subheadline"
          value={data.subheadline || ''}
          onChange={(e) => handleChange('subheadline', e.target.value)}
          placeholder="Supporting text that explains the value"
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
          placeholder="Get Started"
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="ctaLink">CTA Link (optional)</Label>
        <Input
          id="ctaLink"
          value={data.ctaLink || ''}
          onChange={(e) => handleChange('ctaLink', e.target.value)}
          placeholder="#pricing"
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="alignment">Alignment</Label>
        <Select
          value={data.alignment || 'center'}
          onValueChange={(value) => handleChange('alignment', value)}
        >
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="left">Left</SelectItem>
            <SelectItem value="center">Center</SelectItem>
            <SelectItem value="right">Right</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="backgroundImage">Background Image URL</Label>
        <Input
          id="backgroundImage"
          value={data.backgroundImage || ''}
          onChange={(e) => handleChange('backgroundImage', e.target.value)}
          placeholder="https://..."
          className="mt-1"
        />
      </div>
    </div>
  );
}
