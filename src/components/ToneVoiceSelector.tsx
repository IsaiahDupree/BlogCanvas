'use client'

import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { getAllToneVoiceOptions, ToneVoice } from '@/lib/tone-voice'

interface ToneVoiceSelectorProps {
  value?: ToneVoice | null
  onChange: (value: ToneVoice | null) => void
  disabled?: boolean
  className?: string
  allowNull?: boolean
  label?: string
  helperText?: string
}

export function ToneVoiceSelector({
  value,
  onChange,
  disabled = false,
  className,
  allowNull = false,
  label = 'Tone & Voice',
  helperText,
}: ToneVoiceSelectorProps) {
  const toneOptions = getAllToneVoiceOptions()

  const handleChange = (newValue: string) => {
    if (newValue === 'none') {
      onChange(null)
    } else {
      onChange(newValue as ToneVoice)
    }
  }

  const selectedOption = value ? toneOptions.find((t) => t.id === value) : null

  return (
    <div className={className}>
      <Label htmlFor="tone-voice">{label}</Label>
      <Select
        value={value || 'none'}
        onValueChange={handleChange}
        disabled={disabled}
      >
        <SelectTrigger id="tone-voice" className="mt-1.5">
          <SelectValue placeholder="Select tone & voice" />
        </SelectTrigger>
        <SelectContent>
          {allowNull && (
            <SelectItem value="none">
              <div className="flex flex-col items-start py-1">
                <span className="font-medium text-muted-foreground">Default</span>
                <span className="text-xs text-muted-foreground mt-0.5">
                  Use brand guide default or professional
                </span>
              </div>
            </SelectItem>
          )}
          {toneOptions.map((tone) => (
            <SelectItem key={tone.id} value={tone.id}>
              <div className="flex flex-col items-start py-1">
                <span className="font-medium">
                  {tone.icon} {tone.label}
                </span>
                <span className="text-xs text-muted-foreground mt-0.5">
                  {tone.description}
                </span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {helperText && (
        <p className="text-xs text-muted-foreground mt-2">{helperText}</p>
      )}
      {selectedOption && !helperText && (
        <div className="mt-2 space-y-1">
          <p className="text-xs text-muted-foreground">
            <strong>Best for:</strong> {selectedOption.bestFor.slice(0, 3).join(', ')}
          </p>
          <p className="text-xs text-muted-foreground">
            <strong>Key traits:</strong> {selectedOption.characteristics.slice(0, 2).join(', ')}
          </p>
        </div>
      )}
    </div>
  )
}
