'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  FileText,
  Sparkles,
  Check
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { TEMPLATE_LIST } from '@/lib/templates/page-templates';
import type { OfferPageTemplate } from '@/types/offer-page';

export default function NewPagePage() {
  const router = useRouter();
  const [step, setStep] = useState<'template' | 'details'>('template');
  const [selectedTemplate, setSelectedTemplate] = useState<OfferPageTemplate | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: ''
  });

  const handleTemplateSelect = (templateId: OfferPageTemplate) => {
    setSelectedTemplate(templateId);
    setStep('details');
  };

  const handleStartFromScratch = () => {
    setSelectedTemplate(null);
    setStep('details');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));

    // Auto-generate slug from title
    if (name === 'title' && !formData.slug) {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '');
      setFormData(prev => ({ ...prev, slug }));
    }
  };

  const handleCreate = async () => {
    if (!formData.title || !formData.slug) {
      setError('Title and slug are required');
      return;
    }

    setCreating(true);
    setError('');

    try {
      // Get template blocks if a template was selected
      const template = selectedTemplate
        ? TEMPLATE_LIST.find(t => t.id === selectedTemplate)
        : null;

      const response = await fetch('/api/vendor/pages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: formData.title,
          slug: formData.slug,
          description: formData.description,
          blocks: template?.blocks || []
        })
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error || 'Failed to create page');
        setCreating(false);
        return;
      }

      // Redirect to editor
      router.push(`/vendor/pages/${data.page.id}/edit`);

    } catch (err: any) {
      setError(err.message || 'An error occurred');
      setCreating(false);
    }
  };

  // Template Selection Step
  if (step === 'template') {
    return (
      <div className="p-8 max-w-6xl mx-auto">
        <div className="mb-8">
          <Link
            href="/vendor/pages"
            className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Pages
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Create Offer Page</h1>
          <p className="text-gray-600 mt-1">
            Choose a template to get started quickly, or start from scratch
          </p>
        </div>

        <div className="space-y-6">
          {/* Start from Scratch Option */}
          <Card
            className="p-6 cursor-pointer hover:shadow-lg transition-shadow border-2 border-dashed border-gray-300 hover:border-blue-500"
            onClick={handleStartFromScratch}
          >
            <div className="flex items-center gap-4">
              <div className="rounded-lg bg-blue-100 p-3">
                <FileText className="h-8 w-8 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">
                  Start from Scratch
                </h3>
                <p className="text-gray-600 text-sm">
                  Build your page from the ground up with our block editor
                </p>
              </div>
            </div>
          </Card>

          {/* Template Options */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-yellow-500" />
              Or Choose a Template
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {TEMPLATE_LIST.map((template) => (
                <Card
                  key={template.id}
                  className="p-6 cursor-pointer hover:shadow-lg transition-all border-2 border-gray-200 hover:border-blue-500"
                  onClick={() => handleTemplateSelect(template.id)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900">
                      {template.name}
                    </h3>
                    <div className="rounded-full bg-blue-100 p-2">
                      <Sparkles className="h-4 w-4 text-blue-600" />
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm mb-4">
                    {template.description}
                  </p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">
                      {template.blocks.length} pre-built blocks
                    </span>
                    <span className="text-blue-600 font-medium">
                      Use Template →
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Page Details Step
  return (
    <div className="p-8 max-w-2xl mx-auto">
      <div className="mb-8">
        <button
          onClick={() => setStep('template')}
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Templates
        </button>
        <h1 className="text-3xl font-bold text-gray-900">Page Details</h1>
        <p className="text-gray-600 mt-1">
          {selectedTemplate
            ? `Creating from ${TEMPLATE_LIST.find(t => t.id === selectedTemplate)?.name} template`
            : 'Creating a blank page'}
        </p>
      </div>

      <Card className="p-6">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        <div className="space-y-6">
          <div>
            <Label htmlFor="title">Page Title *</Label>
            <Input
              id="title"
              name="title"
              type="text"
              placeholder="e.g., Newsletter Audit"
              value={formData.title}
              onChange={handleChange}
              className="mt-1"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              This is the internal name for your page
            </p>
          </div>

          <div>
            <Label htmlFor="slug">URL Slug *</Label>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-sm text-gray-500 whitespace-nowrap">
                /@yourhandle/
              </span>
              <Input
                id="slug"
                name="slug"
                type="text"
                placeholder="newsletter-audit"
                value={formData.slug}
                onChange={handleChange}
                className="lowercase"
                pattern="[a-z0-9-]+"
                required
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Lowercase letters, numbers, and hyphens only
            </p>
          </div>

          <div>
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              name="description"
              placeholder="Brief description of this offer..."
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="mt-1"
            />
          </div>

          <div className="flex gap-4 pt-4">
            <Button
              onClick={handleCreate}
              disabled={creating || !formData.title || !formData.slug}
              className="flex-1"
            >
              {creating ? (
                'Creating...'
              ) : (
                <>
                  <Check className="h-4 w-4 mr-2" />
                  Create Page
                </>
              )}
            </Button>
            <Button
              variant="outline"
              onClick={() => router.push('/vendor/pages')}
              disabled={creating}
            >
              Cancel
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
