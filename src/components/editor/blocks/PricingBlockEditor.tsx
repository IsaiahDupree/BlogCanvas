'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import type { PricingBlock } from '@/types/offer-page';

interface PricingBlockEditorProps {
  data: PricingBlock['data'];
  onChange: (data: PricingBlock['data']) => void;
}

export default function PricingBlockEditor({ data, onChange }: PricingBlockEditorProps) {
  const handleChange = (field: keyof PricingBlock['data'], value: any) => {
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
          placeholder="Investment"
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={data.description || ''}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder="Pricing description"
          rows={2}
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="offerId">Offer ID</Label>
        <Input
          id="offerId"
          value={data.offerId || ''}
          onChange={(e) => handleChange('offerId', e.target.value)}
          placeholder="Will be set when you create an offer"
          className="mt-1"
          disabled
        />
        <p className="text-xs text-gray-500 mt-1">
          Create an offer first, then link it here
        </p>
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

      <div className="flex items-center space-x-2">
        <Checkbox
          id="showAddons"
          checked={data.showAddons || false}
          onCheckedChange={(checked) => handleChange('showAddons', checked)}
        />
        <Label htmlFor="showAddons" className="cursor-pointer">
          Show add-ons
        </Label>
      </div>
    </div>
  );
}
