'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Eye,
  Save,
  Globe,
  AlertCircle,
  CheckCircle2,
  FileText
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { OfferPage } from '@/types/offer-page';
import PageBlockEditor from '@/components/editor/PageBlockEditor';
import PagePreview from '@/components/editor/PagePreview';

export default function EditPagePage() {
  const router = useRouter();
  const params = useParams();
  const pageId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState<OfferPage | null>(null);
  const [error, setError] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'edit' | 'preview'>('edit');

  useEffect(() => {
    loadPage();
  }, [pageId]);

  const loadPage = async () => {
    try {
      const response = await fetch(`/api/vendor/pages/${pageId}`);
      const data = await response.json();

      if (!data.success) {
        setError(data.error || 'Failed to load page');
        setLoading(false);
        return;
      }

      setPage(data.page);
      setLoading(false);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!page) return;

    setSaving(true);
    setSaveSuccess(false);
    setError('');

    try {
      const response = await fetch(`/api/vendor/pages/${pageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: page.title,
          description: page.description,
          blocks: page.blocks,
          meta_title: page.meta_title,
          meta_description: page.meta_description,
          og_image_url: page.og_image_url
        })
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.error || 'Failed to save page');
        setSaving(false);
        return;
      }

      setPage(data.page);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      setSaving(false);
    } catch (err: any) {
      setError(err.message || 'An error occurred');
      setSaving(false);
    }
  };

  const handlePublishToggle = async () => {
    if (!page) return;

    try {
      const response = await fetch(`/api/vendor/pages/${pageId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          is_published: !page.is_published
        })
      });

      const data = await response.json();

      if (data.success) {
        setPage(data.page);
      } else {
        setError(data.error || 'Failed to update publish status');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  if (error && !page) {
    return (
      <div className="p-8">
        <Card className="p-6">
          <div className="flex items-center gap-3 text-red-600">
            <AlertCircle className="h-6 w-6" />
            <p>{error}</p>
          </div>
          <Button
            onClick={() => router.push('/vendor/pages')}
            className="mt-4"
          >
            Back to Pages
          </Button>
        </Card>
      </div>
    );
  }

  if (!page) {
    return (
      <div className="p-8">
        <Card className="p-6 text-center">
          <p className="text-gray-600">Page not found</p>
          <Button
            onClick={() => router.push('/vendor/pages')}
            className="mt-4"
          >
            Back to Pages
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link
                href="/vendor/pages"
                className="text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  {page.title}
                  <Badge variant={page.is_published ? 'default' : 'secondary'}>
                    {page.is_published ? 'Published' : 'Draft'}
                  </Badge>
                </h1>
                <p className="text-sm text-gray-500">
                  /@yourhandle/{page.slug}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {saveSuccess && (
                <div className="flex items-center gap-2 text-green-600 text-sm">
                  <CheckCircle2 className="h-4 w-4" />
                  Saved
                </div>
              )}

              <Button
                variant="outline"
                size="sm"
                onClick={handlePublishToggle}
                disabled={saving}
              >
                <Globe className="h-4 w-4 mr-2" />
                {page.is_published ? 'Unpublish' : 'Publish'}
              </Button>

              <Button
                onClick={handleSave}
                disabled={saving}
                size="sm"
              >
                <Save className="h-4 w-4 mr-2" />
                {saving ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="px-8 py-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <p className="text-sm text-red-800">{error}</p>
          </div>
        </div>
      )}

      {/* Editor Tabs */}
      <div className="px-8 py-6">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
          <TabsList className="mb-4">
            <TabsTrigger value="edit" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Edit
            </TabsTrigger>
            <TabsTrigger value="preview" className="flex items-center gap-2">
              <Eye className="h-4 w-4" />
              Preview
            </TabsTrigger>
          </TabsList>

          <TabsContent value="edit" className="mt-0">
            <PageBlockEditor
              page={page}
              onChange={(updatedPage) => setPage(updatedPage)}
            />
          </TabsContent>

          <TabsContent value="preview" className="mt-0">
            <PagePreview page={page} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
