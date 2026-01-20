import { ReportBuilder } from '@/components/reports/ReportBuilder';

export const metadata = {
  title: 'Report Builder - BlogCanvas',
  description: 'Create custom reports with your data',
};

/**
 * Report Builder Page
 * Allows vendors to create custom reports
 */
export default function ReportBuilderPage() {
  return (
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight">Report Builder</h1>
        <p className="text-muted-foreground mt-2">
          Create custom reports with your data and metrics
        </p>
      </div>

      <ReportBuilder />
    </div>
  );
}
