'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import type { VSLBlock } from '@/types/offer-page';

interface VSLBlockEditorProps {
  data: VSLBlock['data'];
  onChange: (data: VSLBlock['data']) => void;
}

export default function VSLBlockEditor({ data, onChange }: VSLBlockEditorProps) {
  const handleChange = (field: keyof VSLBlock['data'], value: any) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="videoUrl">Video URL *</Label>
        <Input
          id="videoUrl"
          value={data.videoUrl || ''}
          onChange={(e) => handleChange('videoUrl', e.target.value)}
          placeholder="https://www.youtube.com/watch?v=..."
          className="mt-1"
        />
        <p className="text-xs text-gray-500 mt-1">
          YouTube or Vimeo link
        </p>
      </div>

      <div>
        <Label htmlFor="videoProvider">Video Provider</Label>
        <Select
          value={data.videoProvider || 'youtube'}
          onValueChange={(value) => handleChange('videoProvider', value)}
        >
          <SelectTrigger className="mt-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="youtube">YouTube</SelectItem>
            <SelectItem value="vimeo">Vimeo</SelectItem>
            <SelectItem value="custom">Custom</SelectItem>
          </SelectContent>
        </Select>
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

      <div className="flex items-center space-x-2">
        <Checkbox
          id="autoplay"
          checked={data.autoplay || false}
          onCheckedChange={(checked) => handleChange('autoplay', checked)}
        />
        <Label htmlFor="autoplay" className="cursor-pointer">
          Autoplay video
        </Label>
      </div>
    </div>
  );
}
