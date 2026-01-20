// Form Submission Component - Clients fill out forms
'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FormField, type FormFieldDefinition } from './FormField';
import { Send, CheckCircle } from 'lucide-react';

interface FormSubmissionProps {
  formId: string;
  formName: string;
  formDescription?: string;
  fields: FormFieldDefinition[];
  onSubmit: (responses: Record<string, any>) => Promise<void>;
  initialValues?: Record<string, any>;
}

export function FormSubmission({
  formId,
  formName,
  formDescription,
  fields,
  onSubmit,
  initialValues = {},
}: FormSubmissionProps) {
  const [responses, setResponses] = useState<Record<string, any>>(initialValues);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function handleFieldChange(fieldId: string, value: any) {
    setResponses((prev) => ({ ...prev, [fieldId]: value }));
    // Clear error when user starts typing
    if (errors[fieldId]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[fieldId];
        return newErrors;
      });
    }
  }

  function validateForm(): boolean {
    const newErrors: Record<string, string> = {};

    fields.forEach((field) => {
      const value = responses[field.id];

      // Required validation
      if (field.required) {
        if (value === undefined || value === null || value === '') {
          newErrors[field.id] = 'This field is required';
          return;
        }

        // For checkbox, ensure it's true
        if (field.type === 'checkbox' && !value) {
          newErrors[field.id] = 'This field must be checked';
          return;
        }
      }

      // Skip further validation if field is empty and not required
      if (!value && !field.required) return;

      // Email validation
      if (field.type === 'email' && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          newErrors[field.id] = 'Please enter a valid email address';
        }
      }

      // URL validation
      if (field.type === 'url' && value) {
        try {
          new URL(value);
        } catch {
          newErrors[field.id] = 'Please enter a valid URL';
        }
      }

      // Number validation
      if (field.type === 'number' && value) {
        const num = Number(value);
        if (isNaN(num)) {
          newErrors[field.id] = 'Please enter a valid number';
        } else if (field.validation?.min !== undefined && num < field.validation.min) {
          newErrors[field.id] = `Value must be at least ${field.validation.min}`;
        } else if (field.validation?.max !== undefined && num > field.validation.max) {
          newErrors[field.id] = `Value must be at most ${field.validation.max}`;
        }
      }

      // Pattern validation
      if (field.validation?.pattern && value) {
        const regex = new RegExp(field.validation.pattern);
        if (!regex.test(value)) {
          newErrors[field.id] = 'Please match the required format';
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      await onSubmit(responses);
      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting form:', error);
      alert('Failed to submit form. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="py-12 text-center">
          <CheckCircle className="mx-auto h-16 w-16 text-green-600" />
          <h3 className="mt-4 text-xl font-semibold text-green-900">Form Submitted!</h3>
          <p className="mt-2 text-green-800">
            Thank you for completing this form. Your vendor has been notified.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>{formName}</CardTitle>
          {formDescription && <CardDescription>{formDescription}</CardDescription>}
        </CardHeader>
        <CardContent className="space-y-6">
          {fields.map((field) => (
            <FormField
              key={field.id}
              field={field}
              value={responses[field.id]}
              onChange={(value) => handleFieldChange(field.id, value)}
              error={errors[field.id]}
            />
          ))}

          <div className="flex gap-2 pt-4">
            <Button type="submit" disabled={submitting}>
              {submitting ? (
                'Submitting...'
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Submit Form
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}
