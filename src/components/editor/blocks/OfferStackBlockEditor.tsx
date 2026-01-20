'use client';

import { Plus, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import type { OfferStackBlock } from '@/types/offer-page';

interface OfferStackBlockEditorProps {
  data: OfferStackBlock['data'];
  onChange: (data: OfferStackBlock['data']) => void;
}

export default function OfferStackBlockEditor({ data, onChange }: OfferStackBlockEditorProps) {
  const handleChange = (field: keyof OfferStackBlock['data'], value: any) => {
    onChange({ ...data, [field]: value });
  };

  const addItem = () => {
    const newItem = {
      id: crypto.randomUUID(),
      name: 'Item name',
      value: '$100',
      description: ''
    };
    handleChange('items', [...(data.items || []), newItem]);
  };

  const updateItem = (index: number, field: string, value: string) => {
    const updated = [...(data.items || [])];
    updated[index] = { ...updated[index], [field]: value };
    handleChange('items', updated);
  };

  const deleteItem = (index: number) => {
    const updated = data.items?.filter((_, i) => i !== index) || [];
    handleChange('items', updated);
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="headline">Headline *</Label>
        <Input
          id="headline"
          value={data.headline || ''}
          onChange={(e) => handleChange('headline', e.target.value)}
          placeholder="Everything You Get"
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={data.description || ''}
          onChange={(e) => handleChange('description', e.target.value)}
          placeholder="Optional description"
          rows={2}
          className="mt-1"
        />
      </div>

      <div className="border-t pt-4">
        <div className="flex items-center justify-between mb-3">
          <Label>Stack Items</Label>
          <Button size="sm" variant="outline" onClick={addItem}>
            <Plus className="h-4 w-4 mr-1" />
            Add Item
          </Button>
        </div>

        <div className="space-y-3">
          {(data.items || []).map((item, index) => (
            <div key={item.id} className="p-3 border rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Item {index + 1}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => deleteItem(index)}
                  className="text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <Input
                value={item.name}
                onChange={(e) => updateItem(index, 'name', e.target.value)}
                placeholder="Item name"
              />
              <Input
                value={item.value}
                onChange={(e) => updateItem(index, 'value', e.target.value)}
                placeholder="Value (e.g., $500)"
              />
              <Textarea
                value={item.description || ''}
                onChange={(e) => updateItem(index, 'description', e.target.value)}
                placeholder="Description (optional)"
                rows={2}
              />
            </div>
          ))}
        </div>
      </div>

      <div>
        <Label htmlFor="totalValue">Total Value</Label>
        <Input
          id="totalValue"
          value={data.totalValue || ''}
          onChange={(e) => handleChange('totalValue', e.target.value)}
          placeholder="$3,500"
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="ctaText">CTA Button Text (optional)</Label>
        <Input
          id="ctaText"
          value={data.ctaText || ''}
          onChange={(e) => handleChange('ctaText', e.target.value)}
          placeholder="Get Started"
          className="mt-1"
        />
      </div>
    </div>
  );
}
