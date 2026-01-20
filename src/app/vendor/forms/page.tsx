// Vendor Forms Management Page
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, FileText, Edit, Trash2, Eye } from 'lucide-react';

interface VendorForm {
  id: string;
  name: string;
  description: string | null;
  fields: any[];
  is_template: boolean;
  created_at: string;
  _count?: {
    submissions: number;
  };
}

export default function VendorFormsPage() {
  const router = useRouter();
  const [forms, setForms] = useState<VendorForm[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadForms();
  }, []);

  async function loadForms() {
    try {
      // Get current vendor
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: vendor } = await supabase
        .from('vendors')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!vendor) return;

      // Load forms
      const { data: formsData, error } = await supabase
        .from('vendor_forms')
        .select('*')
        .eq('vendor_id', vendor.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error loading forms:', error);
        return;
      }

      // Load submission counts for each form
      const formsWithCounts = await Promise.all(
        (formsData || []).map(async (form) => {
          const { count } = await supabase
            .from('vendor_form_submissions')
            .select('*', { count: 'exact', head: true })
            .eq('form_id', form.id);

          return {
            ...form,
            _count: { submissions: count || 0 },
          };
        })
      );

      setForms(formsWithCounts);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function deleteForm(formId: string) {
    if (!confirm('Are you sure you want to delete this form?')) return;

    try {
      const { error } = await supabase
        .from('vendor_forms')
        .delete()
        .eq('id', formId);

      if (error) {
        console.error('Error deleting form:', error);
        return;
      }

      loadForms();
    } catch (error) {
      console.error('Error:', error);
    }
  }

  if (loading) {
    return <div>Loading forms...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Forms</h1>
          <p className="mt-2 text-muted-foreground">
            Create and manage intake forms for your clients
          </p>
        </div>
        <Button onClick={() => router.push('/vendor/forms/new')}>
          <Plus className="mr-2 h-4 w-4" />
          Create Form
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Forms</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{forms.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Submissions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {forms.reduce((sum, f) => sum + (f._count?.submissions || 0), 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Templates</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {forms.filter((f) => f.is_template).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Forms List */}
      {forms.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No forms yet</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Create your first form to collect information from clients
            </p>
            <Button className="mt-4" onClick={() => router.push('/vendor/forms/new')}>
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Form
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {forms.map((form) => (
            <Card key={form.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-blue-600" />
                      <CardTitle className="text-base">{form.name}</CardTitle>
                    </div>
                    {form.description && (
                      <CardDescription className="mt-2 line-clamp-2">
                        {form.description}
                      </CardDescription>
                    )}
                  </div>
                  {form.is_template && (
                    <Badge variant="secondary" className="ml-2">
                      Template
                    </Badge>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>{form.fields.length} fields</span>
                  <span>{form._count?.submissions || 0} submissions</span>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => router.push(`/vendor/forms/${form.id}`)}
                  >
                    <Edit className="mr-2 h-3 w-3" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => router.push(`/vendor/forms/${form.id}/submissions`)}
                  >
                    <Eye className="mr-2 h-3 w-3" />
                    Submissions
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-red-600 hover:text-red-700"
                    onClick={() => deleteForm(form.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
