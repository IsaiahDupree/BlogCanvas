'use client'

import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getAllSearchIntents, SearchIntent } from '@/lib/search-intent'

interface SearchIntentSelectorProps {
  value?: SearchIntent | null
  onChange: (value: SearchIntent | null) => void
  disabled?: boolean
  className?: string
  allowNull?: boolean
}

export function SearchIntentSelector({
  value,
  onChange,
  disabled = false,
  className,
  allowNull = false,
}: SearchIntentSelectorProps) {
  const intents = getAllSearchIntents()

  const handleChange = (newValue: string) => {
    if (newValue === 'none') {
      onChange(null)
    } else {
      onChange(newValue as SearchIntent)
    }
  }

  return (
    <div className={className}>
      <Label htmlFor="search-intent">Search Intent</Label>
      <Select
        value={value || 'none'}
        onValueChange={handleChange}
        disabled={disabled}
      >
        <SelectTrigger id="search-intent" className="mt-1.5">
          <SelectValue placeholder="Select search intent" />
        </SelectTrigger>
        <SelectContent>
          {allowNull && (
            <SelectItem value="none">
              <div className="flex flex-col items-start py-1">
                <span className="font-medium text-muted-foreground">No specific intent</span>
                <span className="text-xs text-muted-foreground mt-0.5">
                  Let AI determine based on topic
                </span>
              </div>
            </SelectItem>
          )}
          {intents.map((intent) => (
            <SelectItem key={intent.id} value={intent.id}>
              <div className="flex flex-col items-start py-1">
                <span className="font-medium">
                  {intent.icon} {intent.label}
                </span>
                <span className="text-xs text-muted-foreground mt-0.5">
                  {intent.description}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {value && (
        <p className="text-xs text-muted-foreground mt-2">
          <strong>User Goal:</strong>{' '}
          {intents.find((i) => i.id === value)?.userGoal}
        </p>
      )}
    </div>
  )
}
