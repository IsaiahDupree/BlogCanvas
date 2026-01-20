'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  FileText,
  Plus,
  Eye,
  Edit,
  Trash2,
  Globe,
  ExternalLink,
  AlertCircle
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { OfferPage } from '@/types/offer-page';
import type { Vendor } from '@/types/vendor';

export default function VendorPagesPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [pages, setPages] = useState<OfferPage[]>([]);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // Load vendor profile
      const profileResponse = await fetch('/api/vendor/profile');
      const profileData = await profileResponse.json();

      if (!profileData.success) {
        router.push('/vendor/register');
        return;
      }

      setVendor(profileData.vendor);

      // Load pages
      const pagesResponse = await fetch('/api/vendor/pages');
      const pagesData = await pagesResponse.json();

      if (pagesData.success) {
        setPages(pagesData.pages || []);
      }

      setLoading(false);
    } catch (error) {
      console.error('Error loading data:', error);
      setLoading(false);
    }
  };

  const handleDelete = async (pageId: string) => {
    if (!confirm('Are you sure you want to delete this page? This action cannot be undone.')) {
      return;
    }

    setDeletingId(pageId);
    try {
      const response = await fetch(`/api/vendor/pages/${pageId}`, {
        method: 'DELETE'
      });

      const data = await response.json();

      if (data.success) {
        setPages(pages.filter(p => p.id !== pageId));
      } else {
        alert(data.error || 'Failed to delete page');
      }
    } catch (error) {
      console.error('Error deleting page:', error);
      alert('Failed to delete page');
    } finally {
      setDeletingId(null);
    }
  };

  const togglePublish = async (page: OfferPage) => {
    try {
      const response = await fetch(`/api/vendor/pages/${page.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_published: !page.is_published })
      });

      const data = await response.json();

      if (data.success) {
        setPages(pages.map(p => p.id === page.id ? data.page : p));
      } else {
        alert(data.error || 'Failed to update page');
      }
    } catch (error) {
      console.error('Error updating page:', error);
      alert('Failed to update page');
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Offer Pages</h1>
          <p className="text-gray-600 mt-1">
            Create and manage your landing pages
          </p>
        </div>
        <Button
          onClick={() => router.push('/vendor/pages/new')}
          className="flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          Create Page
        </Button>
      </div>

      {/* Empty State */}
      {pages.length === 0 && (
        <Card className="p-12 text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-blue-100 p-4">
              <FileText className="h-8 w-8 text-blue-600" />
            </div>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            No Offer Pages Yet
          </h2>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Create your first offer page to start attracting clients. Use our block-based editor to build beautiful landing pages.
          </p>
          <Button
            onClick={() => router.push('/vendor/pages/new')}
            className="flex items-center gap-2 mx-auto"
          >
            <Plus className="h-5 w-5" />
            Create Your First Page
          </Button>
        </Card>
      )}

      {/* Pages List */}
      {pages.length > 0 && (
        <div className="space-y-4">
          {pages.map((page) => {
            const publicUrl = vendor ? `/@${vendor.handle}/${page.slug}` : '#';

            return (
              <Card key={page.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold text-gray-900">
                        {page.title}
                      </h3>
                      <Badge variant={page.is_published ? 'default' : 'secondary'}>
                        {page.is_published ? 'Published' : 'Draft'}
                      </Badge>
                    </div>

                    {page.description && (
                      <p className="text-gray-600 mb-3">
                        {page.description}
                      </p>
                    )}

                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Globe className="h-4 w-4" />
                        <span className="font-mono">{publicUrl}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Eye className="h-4 w-4" />
                        <span>{page.view_count} views</span>
                      </div>
                      <div>
                        {page.blocks?.length || 0} blocks
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 ml-6">
                    {page.is_published && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(publicUrl, '_blank')}
                        className="flex items-center gap-2"
                      >
                        <ExternalLink className="h-4 w-4" />
                        View
                      </Button>
                    )}

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/vendor/pages/${page.id}/edit`)}
                      className="flex items-center gap-2"
                    >
                      <Edit className="h-4 w-4" />
                      Edit
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => togglePublish(page)}
                    >
                      {page.is_published ? 'Unpublish' : 'Publish'}
                    </Button>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(page.id)}
                      disabled={deletingId === page.id}
                      className="text-red-600 hover:text-red-700 hover:border-red-300"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
