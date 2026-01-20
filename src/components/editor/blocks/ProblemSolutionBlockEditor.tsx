'use client';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { ProblemSolutionBlock } from '@/types/offer-page';

interface ProblemSolutionBlockEditorProps {
  data: ProblemSolutionBlock['data'];
  onChange: (data: ProblemSolutionBlock['data']) => void;
}

export default function ProblemSolutionBlockEditor({ data, onChange }: ProblemSolutionBlockEditorProps) {
  const handleChange = (field: keyof ProblemSolutionBlock['data'], value: any) => {
    onChange({ ...data, [field]: value });
  };

  return (
    <div className="space-y-4">
      <div className="border-b pb-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Problem Section</h3>
        <div className="space-y-3">
          <div>
            <Label htmlFor="problemHeadline">Problem Headline</Label>
            <Input
              id="problemHeadline"
              value={data.problemHeadline || ''}
              onChange={(e) => handleChange('problemHeadline', e.target.value)}
              placeholder="The Problem"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="problemDescription">Problem Description</Label>
            <Textarea
              id="problemDescription"
              value={data.problemDescription || ''}
              onChange={(e) => handleChange('problemDescription', e.target.value)}
              placeholder="Describe the problem"
              rows={3}
              className="mt-1"
            />
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-gray-700 mb-3">Solution Section</h3>
        <div className="space-y-3">
          <div>
            <Label htmlFor="solutionHeadline">Solution Headline</Label>
            <Input
              id="solutionHeadline"
              value={data.solutionHeadline || ''}
              onChange={(e) => handleChange('solutionHeadline', e.target.value)}
              placeholder="The Solution"
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="solutionDescription">Solution Description</Label>
            <Textarea
              id="solutionDescription"
              value={data.solutionDescription || ''}
              onChange={(e) => handleChange('solutionDescription', e.target.value)}
              placeholder="Describe the solution"
              rows={3}
              className="mt-1"
            />
          </div>
        </div>
      </div>

      <div>
        <Label htmlFor="imageUrl">Image URL (optional)</Label>
        <Input
          id="imageUrl"
          value={data.imageUrl || ''}
          onChange={(e) => handleChange('imageUrl', e.target.value)}
          placeholder="https://..."
          className="mt-1"
        />
      </div>
    </div>
  );
}
