// Form Field Component - Renders individual form fields
'use client';

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';

export interface FormFieldDefinition {
  id: string;
  type: 'text' | 'textarea' | 'email' | 'phone' | 'url' | 'number' | 'select' | 'checkbox' | 'radio' | 'date';
  label: string;
  description?: string;
  placeholder?: string;
  required?: boolean;
  options?: { value: string; label: string }[]; // For select, radio
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

interface FormFieldProps {
  field: FormFieldDefinition;
  value: any;
  onChange: (value: any) => void;
  error?: string;
}

export function FormField({ field, value, onChange, error }: FormFieldProps) {
  const commonProps = {
    id: field.id,
    required: field.required,
  };

  const renderField = () => {
    switch (field.type) {
      case 'text':
      case 'email':
      case 'phone':
      case 'url':
      case 'number':
      case 'date':
        return (
          <Input
            {...commonProps}
            type={field.type}
            placeholder={field.placeholder}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            className={error ? 'border-red-500' : ''}
          />
        );

      case 'textarea':
        return (
          <Textarea
            {...commonProps}
            placeholder={field.placeholder}
            value={value || ''}
            onChange={(e) => onChange(e.target.value)}
            rows={4}
            className={error ? 'border-red-500' : ''}
          />
        );

      case 'select':
        return (
          <Select value={value || ''} onValueChange={onChange}>
            <SelectTrigger className={error ? 'border-red-500' : ''}>
              <SelectValue placeholder={field.placeholder || 'Select an option'} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'checkbox':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={field.id}
              checked={value === true}
              onCheckedChange={onChange}
              className={error ? 'border-red-500' : ''}
            />
            <label
              htmlFor={field.id}
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              {field.description || field.label}
            </label>
          </div>
        );

      case 'radio':
        return (
          <RadioGroup value={value || ''} onValueChange={onChange}>
            <div className="space-y-2">
              {field.options?.map((option) => (
                <div key={option.value} className="flex items-center space-x-2">
                  <RadioGroupItem value={option.value} id={`${field.id}-${option.value}`} />
                  <Label htmlFor={`${field.id}-${option.value}`}>{option.label}</Label>
                </div>
              ))}
            </div>
          </RadioGroup>
        );

      default:
        return <Input {...commonProps} value={value || ''} onChange={(e) => onChange(e.target.value)} />;
    }
  };

  return (
    <div className="space-y-2">
      {field.type !== 'checkbox' && (
        <Label htmlFor={field.id}>
          {field.label}
          {field.required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}
      {field.description && field.type !== 'checkbox' && (
        <p className="text-sm text-muted-foreground">{field.description}</p>
      )}
      {renderField()}
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
