'use client';

import { Plus, Trash2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { FeaturesBlock } from '@/types/offer-page';

interface FeaturesBlockEditorProps {
  data: FeaturesBlock['data'];
  onChange: (data: FeaturesBlock['data']) => void;
}

export default function FeaturesBlockEditor({ data, onChange }: FeaturesBlockEditorProps) {
  const handleChange = (field: keyof FeaturesBlock['data'], value: any) => {
    onChange({ ...data, [field]: value });
  };

  const addFeature = () => {
    const newFeature = {
      id: crypto.randomUUID(),
      title: 'New Feature',
      description: 'Feature description'
    };
    handleChange('features', [...(data.features || []), newFeature]);
  };

  const updateFeature = (index: number, field: string, value: string) => {
    const updatedFeatures = [...(data.features || [])];
    updatedFeatures[index] = { ...updatedFeatures[index], [field]: value };
    handleChange('features', updatedFeatures);
  };

  const deleteFeature = (index: number) => {
    const updatedFeatures = data.features?.filter((_, i) => i !== index) || [];
    handleChange('features', updatedFeatures);
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="headline">Headline *</Label>
        <Input
          id="headline"
          value={data.headline || ''}
          onChange={(e) => handleChange('headline', e.target.value)}
          placeholder="What's Included"
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
            <SelectItem value="list">List</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="border-t pt-4">
        <div className="flex items-center justify-between mb-3">
          <Label>Features</Label>
          <Button size="sm" variant="outline" onClick={addFeature}>
            <Plus className="h-4 w-4 mr-1" />
            Add Feature
          </Button>
        </div>

        <div className="space-y-3">
          {(data.features || []).map((feature, index) => (
            <div key={feature.id} className="p-3 border rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Feature {index + 1}</span>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => deleteFeature(index)}
                  className="text-red-600"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <Input
                value={feature.title}
                onChange={(e) => updateFeature(index, 'title', e.target.value)}
                placeholder="Feature title"
              />
              <Textarea
                value={feature.description}
                onChange={(e) => updateFeature(index, 'description', e.target.value)}
                placeholder="Feature description"
                rows={2}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
