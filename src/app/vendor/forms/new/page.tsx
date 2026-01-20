// Create New Form Page
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { FormBuilder } from '@/components/forms/FormBuilder';
import { ArrowLeft } from 'lucide-react';
import type { FormFieldDefinition } from '@/components/forms/FormField';

export default function NewFormPage() {
  const router = useRouter();
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [isTemplate, setIsTemplate] = useState(false);
  const [fields, setFields] = useState<FormFieldDefinition[]>([]);

  async function handleSave(updatedFields: FormFieldDefinition[]) {
    if (!formName.trim()) {
      alert('Please enter a form name');
      return;
    }

    if (updatedFields.length === 0) {
      alert('Please add at least one field to your form');
      return;
    }

    try {
      // Get current vendor
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('You must be logged in to create a form');
        return;
      }

      const { data: vendor } = await supabase
        .from('vendors')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!vendor) {
        alert('Vendor not found');
        return;
      }

      // Create form
      const { data, error } = await supabase
        .from('vendor_forms')
        .insert({
          vendor_id: vendor.id,
          name: formName.trim(),
          description: formDescription.trim() || null,
          fields: updatedFields,
          is_template: isTemplate,
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating form:', error);
        alert('Failed to create form');
        return;
      }

      router.push('/vendor/forms');
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred while creating the form');
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Create New Form</h1>
          <p className="mt-2 text-muted-foreground">
            Build a custom form to collect information from clients
          </p>
        </div>
      </div>

      {/* Form Details */}
      <Card>
        <CardHeader>
          <CardTitle>Form Details</CardTitle>
          <CardDescription>Basic information about your form</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Form Name *</Label>
            <Input
              id="name"
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder="e.g., Client Intake Form, Project Brief"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              placeholder="What is this form for?"
              rows={3}
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="is-template"
              checked={isTemplate}
              onCheckedChange={(checked) => setIsTemplate(checked === true)}
            />
            <label
              htmlFor="is-template"
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              Save as template (can be reused for multiple clients)
            </label>
          </div>
        </CardContent>
      </Card>

      {/* Form Builder */}
      <FormBuilder initialFields={fields} onSave={handleSave} />
    </div>
  );
}
