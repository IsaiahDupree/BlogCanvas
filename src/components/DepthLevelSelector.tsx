'use client'

import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { DEPTH_LEVELS, DepthLevel } from '@/lib/content-depth'

interface DepthLevelSelectorProps {
  value?: DepthLevel | null
  onChange: (value: DepthLevel) => void
  disabled?: boolean
  className?: string
}

export function DepthLevelSelector({
  value,
  onChange,
  disabled = false,
  className,
}: DepthLevelSelectorProps) {
  return (
    <div className={className}>
      <Label htmlFor="depth-level">Content Depth Level</Label>
      <Select
        value={value || 'standard'}
        onValueChange={onChange}
        disabled={disabled}
      >
        <SelectTrigger id="depth-level" className="mt-1.5">
          <SelectValue placeholder="Select depth level" />
        </SelectTrigger>
        <SelectContent>
          {Object.values(DEPTH_LEVELS).map((level) => (
            <SelectItem key={level.value} value={level.value}>
              <div className="flex flex-col items-start py-1">
                <span className="font-medium">{level.label}</span>
                <span className="text-xs text-muted-foreground mt-0.5">
                  {level.description} ({level.wordCountMin}-{level.wordCountMax} words)
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}
