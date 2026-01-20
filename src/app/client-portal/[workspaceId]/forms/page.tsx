// Client Portal - Forms Page
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { FormSubmission } from '@/components/forms/FormSubmission';
import { FileText, CheckCircle, Clock } from 'lucide-react';

interface VendorForm {
  id: string;
  name: string;
  description: string | null;
  fields: any[];
  created_at: string;
}

interface FormSubmissionData {
  id: string;
  form_id: string;
  responses: Record<string, any>;
  is_reviewed: boolean;
  created_at: string;
  form?: VendorForm;
}

export default function ClientFormsPage() {
  const params = useParams();
  const workspaceId = params.workspaceId as string;

  const [availableForms, setAvailableForms] = useState<VendorForm[]>([]);
  const [submissions, setSubmissions] = useState<FormSubmissionData[]>([]);
  const [selectedForm, setSelectedForm] = useState<VendorForm | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFormsAndSubmissions();
  }, [workspaceId]);

  async function loadFormsAndSubmissions() {
    try {
      // Get workspace to find vendor_id
      const { data: workspace } = await supabase
        .from('vendor_workspaces')
        .select('vendor_id')
        .eq('id', workspaceId)
        .single();

      if (!workspace) return;

      // Load vendor's forms
      const { data: formsData } = await supabase
        .from('vendor_forms')
        .select('*')
        .eq('vendor_id', workspace.vendor_id)
        .eq('is_template', false) // Only show non-template forms
        .order('created_at', { ascending: false });

      setAvailableForms(formsData || []);

      // Load submissions for this workspace
      const { data: submissionsData } = await supabase
        .from('vendor_form_submissions')
        .select('*, form:vendor_forms(*)')
        .eq('workspace_id', workspaceId)
        .order('created_at', { ascending: false });

      setSubmissions(submissionsData as any || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleFormSubmit(formId: string, responses: Record<string, any>) {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert('You must be logged in to submit a form');
        return;
      }

      // Get workspace details
      const { data: workspace } = await supabase
        .from('vendor_workspaces')
        .select('vendor_id, client_id')
        .eq('id', workspaceId)
        .single();

      if (!workspace) {
        alert('Workspace not found');
        return;
      }

      // Create submission
      const { error } = await supabase.from('vendor_form_submissions').insert({
        form_id: formId,
        workspace_id: workspaceId,
        vendor_id: workspace.vendor_id,
        client_id: workspace.client_id,
        responses,
        is_reviewed: false,
      });

      if (error) {
        console.error('Error submitting form:', error);
        throw error;
      }

      // Reload data
      setSelectedForm(null);
      loadFormsAndSubmissions();
    } catch (error) {
      console.error('Error:', error);
      throw error;
    }
  }

  if (loading) {
    return <div>Loading forms...</div>;
  }

  // Check if a form is already submitted
  const getFormSubmission = (formId: string) => {
    return submissions.find((s) => s.form_id === formId);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Forms</h1>
        <p className="mt-2 text-muted-foreground">
          Complete these forms to help your vendor understand your needs
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Completed Forms</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{submissions.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Pending Forms</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {availableForms.filter((f) => !getFormSubmission(f.id)).length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Selected Form */}
      {selectedForm && (
        <div className="space-y-4">
          <Button variant="outline" onClick={() => setSelectedForm(null)}>
            Back to Forms List
          </Button>
          <FormSubmission
            formId={selectedForm.id}
            formName={selectedForm.name}
            formDescription={selectedForm.description || undefined}
            fields={selectedForm.fields}
            onSubmit={(responses) => handleFormSubmit(selectedForm.id, responses)}
          />
        </div>
      )}

      {/* Forms List */}
      {!selectedForm && (
        <>
          {/* Pending Forms */}
          {availableForms.filter((f) => !getFormSubmission(f.id)).length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Pending Forms</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {availableForms
                  .filter((f) => !getFormSubmission(f.id))
                  .map((form) => (
                    <Card key={form.id} className="hover:shadow-lg transition-shadow">
                      <CardHeader>
                        <div className="flex items-start gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                            <FileText className="h-5 w-5 text-blue-600" />
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <CardTitle className="text-base">{form.name}</CardTitle>
                              <Badge variant="outline">
                                <Clock className="mr-1 h-3 w-3" />
                                Pending
                              </Badge>
                            </div>
                            {form.description && (
                              <CardDescription className="mt-2">
                                {form.description}
                              </CardDescription>
                            )}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex justify-between items-center">
                          <p className="text-sm text-muted-foreground">
                            {form.fields.length} fields
                          </p>
                          <Button onClick={() => setSelectedForm(form)}>Fill Out Form</Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
              </div>
            </div>
          )}

          {/* Completed Submissions */}
          {submissions.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-xl font-semibold">Completed Forms</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {submissions.map((submission) => (
                  <Card key={submission.id} className="border-green-200 bg-green-50/50">
                    <CardHeader>
                      <div className="flex items-start gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100">
                          <CheckCircle className="h-5 w-5 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <CardTitle className="text-base">
                              {submission.form?.name || 'Form'}
                            </CardTitle>
                            <Badge variant="default" className="bg-green-600">
                              Submitted
                            </Badge>
                          </div>
                          <CardDescription className="mt-2">
                            Submitted on {new Date(submission.created_at).toLocaleDateString()}
                          </CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        {submission.is_reviewed ? (
                          <Badge variant="secondary">Reviewed</Badge>
                        ) : (
                          <Badge variant="outline">Pending Review</Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Empty State */}
          {availableForms.length === 0 && submissions.length === 0 && (
            <Card>
              <CardContent className="py-12 text-center">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-semibold">No forms yet</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  Your vendor hasn't created any forms for you to fill out yet.
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
