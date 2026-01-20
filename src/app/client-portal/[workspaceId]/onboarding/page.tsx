// Client Portal - Onboarding Checklist Page
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Circle, Upload, FileText } from 'lucide-react';
import type { OnboardingStep } from '@/types/portal';

export default function OnboardingPage() {
  const params = useParams();
  const workspaceId = params.workspaceId as string;

  const [steps, setSteps] = useState<OnboardingStep[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadOnboardingSteps();
  }, [workspaceId]);

  async function loadOnboardingSteps() {
    try {
      const { data, error } = await supabase
        .from('onboarding_steps')
        .select('*')
        .eq('workspace_id', workspaceId)
        .order('step_order', { ascending: true });

      if (error) {
        console.error('Error loading onboarding steps:', error);
        return;
      }

      setSteps(data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function toggleStepCompletion(stepId: string, currentStatus: boolean) {
    try {
      const { error } = await supabase
        .from('onboarding_steps')
        .update({
          is_completed: !currentStatus,
          completed_at: !currentStatus ? new Date().toISOString() : null,
        })
        .eq('id', stepId);

      if (error) {
        console.error('Error updating step:', error);
        return;
      }

      // Reload steps
      loadOnboardingSteps();
    } catch (error) {
      console.error('Error:', error);
    }
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  const completedSteps = steps.filter((s) => s.is_completed).length;
  const totalSteps = steps.length;
  const progress = totalSteps > 0 ? Math.round((completedSteps / totalSteps) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Onboarding Checklist</h1>
        <p className="mt-2 text-muted-foreground">
          Complete these steps to get started with your project
        </p>
      </div>

      {/* Progress Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Your Progress</CardTitle>
          <CardDescription>
            {completedSteps} of {totalSteps} steps completed
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Progress value={progress} className="h-2" />
          <p className="mt-2 text-sm text-muted-foreground">{progress}% complete</p>
        </CardContent>
      </Card>

      {/* Steps List */}
      <div className="space-y-4">
        {steps.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              No onboarding steps have been set up yet.
            </CardContent>
          </Card>
        ) : (
          steps.map((step, index) => (
            <Card
              key={step.id}
              className={step.is_completed ? 'border-green-200 bg-green-50/50' : ''}
            >
              <CardHeader>
                <div className="flex items-start gap-4">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="mt-1 p-0 hover:bg-transparent"
                    onClick={() => toggleStepCompletion(step.id, step.is_completed)}
                  >
                    {step.is_completed ? (
                      <CheckCircle2 className="h-6 w-6 text-green-600" />
                    ) : (
                      <Circle className="h-6 w-6 text-gray-400" />
                    )}
                  </Button>

                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-muted-foreground">
                        Step {index + 1}
                      </span>
                      {step.requires_file_upload && (
                        <Upload className="h-4 w-4 text-blue-600" />
                      )}
                      {step.requires_form_submission && (
                        <FileText className="h-4 w-4 text-purple-600" />
                      )}
                    </div>
                    <CardTitle className="mt-1">{step.title}</CardTitle>
                    {step.description && (
                      <CardDescription className="mt-2">{step.description}</CardDescription>
                    )}

                    {step.is_completed && step.completed_at && (
                      <p className="mt-2 text-sm text-green-600">
                        Completed on {new Date(step.completed_at).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </div>
              </CardHeader>

              {/* Action buttons for special requirements */}
              {!step.is_completed && (step.requires_file_upload || step.requires_form_submission) && (
                <CardContent className="border-t pt-4">
                  <div className="flex gap-2">
                    {step.requires_file_upload && (
                      <Button variant="outline" size="sm">
                        <Upload className="mr-2 h-4 w-4" />
                        Upload File
                      </Button>
                    )}
                    {step.requires_form_submission && (
                      <Button variant="outline" size="sm">
                        <FileText className="mr-2 h-4 w-4" />
                        Fill Form
                      </Button>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          ))
        )}
      </div>

      {/* Completion Message */}
      {progress === 100 && totalSteps > 0 && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="py-6 text-center">
            <CheckCircle2 className="mx-auto h-12 w-12 text-green-600" />
            <h3 className="mt-4 text-lg font-semibold">Onboarding Complete!</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Great job! You've completed all the onboarding steps.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
