import { Suspense } from 'react';
import { CohortAnalysisView } from '@/components/analytics/CohortAnalysisView';
import { CohortAnalysisSkeleton } from '@/components/analytics/CohortAnalysisSkeleton';

export const metadata = {
  title: 'Cohort Analysis - BlogCanvas',
  description: 'Analyze customer retention and engagement over time',
};

/**
 * Cohort Analysis Page
 * Displays customer retention metrics grouped by signup cohorts
 */
export default function CohortAnalysisPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cohort Analysis</h1>
          <p className="text-muted-foreground mt-2">
            Track customer retention and engagement patterns over time
          </p>
        </div>
      </div>

      <Suspense fallback={<CohortAnalysisSkeleton />}>
        <CohortAnalysisView />
      </Suspense>
    </div>
  );
}
