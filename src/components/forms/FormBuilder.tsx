// Form Builder Component - Vendor creates forms
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, Trash2, GripVertical, Save } from 'lucide-react';
import type { FormFieldDefinition } from './FormField';

interface FormBuilderProps {
  initialFields?: FormFieldDefinition[];
  onSave: (fields: FormFieldDefinition[]) => Promise<void>;
}

export function FormBuilder({ initialFields = [], onSave }: FormBuilderProps) {
  const [fields, setFields] = useState<FormFieldDefinition[]>(initialFields);
  const [saving, setSaving] = useState(false);

  const fieldTypes: Array<{ value: FormFieldDefinition['type']; label: string }> = [
    { value: 'text', label: 'Text' },
    { value: 'textarea', label: 'Long Text' },
    { value: 'email', label: 'Email' },
    { value: 'phone', label: 'Phone' },
    { value: 'url', label: 'URL' },
    { value: 'number', label: 'Number' },
    { value: 'date', label: 'Date' },
    { value: 'select', label: 'Dropdown' },
    { value: 'checkbox', label: 'Checkbox' },
    { value: 'radio', label: 'Radio Buttons' },
  ];

  function addField() {
    const newField: FormFieldDefinition = {
      id: `field-${Date.now()}`,
      type: 'text',
      label: 'New Field',
      required: false,
    };
    setFields([...fields, newField]);
  }

  function updateField(index: number, updates: Partial<FormFieldDefinition>) {
    const newFields = [...fields];
    newFields[index] = { ...newFields[index], ...updates };
    setFields(newFields);
  }

  function removeField(index: number) {
    setFields(fields.filter((_, i) => i !== index));
  }

  function moveField(index: number, direction: 'up' | 'down') {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === fields.length - 1)
    ) {
      return;
    }

    const newFields = [...fields];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    [newFields[index], newFields[targetIndex]] = [newFields[targetIndex], newFields[index]];
    setFields(newFields);
  }

  async function handleSave() {
    setSaving(true);
    try {
      await onSave(fields);
    } finally {
      setSaving(false);
    }
  }

  function addOption(fieldIndex: number) {
    const field = fields[fieldIndex];
    const options = field.options || [];
    updateField(fieldIndex, {
      options: [...options, { value: `option-${Date.now()}`, label: 'New Option' }],
    });
  }

  function updateOption(fieldIndex: number, optionIndex: number, label: string) {
    const field = fields[fieldIndex];
    const options = [...(field.options || [])];
    options[optionIndex] = { ...options[optionIndex], label };
    updateField(fieldIndex, { options });
  }

  function removeOption(fieldIndex: number, optionIndex: number) {
    const field = fields[fieldIndex];
    const options = (field.options || []).filter((_, i) => i !== optionIndex);
    updateField(fieldIndex, { options });
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex justify-between items-center">
        <div>
          <h3 className="text-lg font-semibold">Form Builder</h3>
          <p className="text-sm text-muted-foreground">
            Drag and drop fields to reorder, click to edit
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={addField} variant="outline">
            <Plus className="mr-2 h-4 w-4" />
            Add Field
          </Button>
          <Button onClick={handleSave} disabled={saving || fields.length === 0}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Saving...' : 'Save Form'}
          </Button>
        </div>
      </div>

      {/* Fields */}
      {fields.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <p className="text-muted-foreground">No fields yet. Click "Add Field" to get started.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {fields.map((field, index) => (
            <Card key={field.id}>
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="flex flex-col gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => moveField(index, 'up')}
                      disabled={index === 0}
                    >
                      ↑
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-6 w-6 p-0"
                      onClick={() => moveField(index, 'down')}
                      disabled={index === fields.length - 1}
                    >
                      ↓
                    </Button>
                  </div>
                  <GripVertical className="h-5 w-5 text-muted-foreground" />
                  <div className="flex-1">
                    <CardTitle className="text-base">Field {index + 1}</CardTitle>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeField(index)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  {/* Field Type */}
                  <div className="space-y-2">
                    <Label>Field Type</Label>
                    <Select
                      value={field.type}
                      onValueChange={(value: FormFieldDefinition['type']) =>
                        updateField(index, { type: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {fieldTypes.map((type) => (
                          <SelectItem key={type.value} value={type.value}>
                            {type.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Field Label */}
                  <div className="space-y-2">
                    <Label>Label</Label>
                    <Input
                      value={field.label}
                      onChange={(e) => updateField(index, { label: e.target.value })}
                      placeholder="Field label"
                    />
                  </div>
                </div>

                {/* Description */}
                <div className="space-y-2">
                  <Label>Description (Optional)</Label>
                  <Textarea
                    value={field.description || ''}
                    onChange={(e) => updateField(index, { description: e.target.value })}
                    placeholder="Help text for this field"
                    rows={2}
                  />
                </div>

                {/* Placeholder */}
                {['text', 'textarea', 'email', 'phone', 'url', 'number', 'select'].includes(
                  field.type
                ) && (
                  <div className="space-y-2">
                    <Label>Placeholder (Optional)</Label>
                    <Input
                      value={field.placeholder || ''}
                      onChange={(e) => updateField(index, { placeholder: e.target.value })}
                      placeholder="Placeholder text"
                    />
                  </div>
                )}

                {/* Options for select/radio */}
                {(field.type === 'select' || field.type === 'radio') && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label>Options</Label>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => addOption(index)}
                      >
                        <Plus className="mr-2 h-3 w-3" />
                        Add Option
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {(field.options || []).map((option, optionIndex) => (
                        <div key={option.value} className="flex gap-2">
                          <Input
                            value={option.label}
                            onChange={(e) =>
                              updateOption(index, optionIndex, e.target.value)
                            }
                            placeholder="Option label"
                          />
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeOption(index, optionIndex)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Required checkbox */}
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id={`required-${field.id}`}
                    checked={field.required}
                    onCheckedChange={(checked) =>
                      updateField(index, { required: checked === true })
                    }
                  />
                  <label
                    htmlFor={`required-${field.id}`}
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    Required field
                  </label>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
