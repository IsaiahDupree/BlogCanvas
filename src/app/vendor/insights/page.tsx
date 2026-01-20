import { AIInsightsDashboard } from '@/components/insights/AIInsightsDashboard';

export const metadata = {
  title: 'AI Insights - BlogCanvas',
  description: 'AI-powered insights and anomaly detection for your business',
};

/**
 * AI Insights Page
 * Displays AI-generated insights and anomaly detection
 */
export default function AIInsightsPage() {
  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">AI Insights</h1>
        <p className="text-muted-foreground mt-2">
          Discover trends, anomalies, and actionable insights powered by AI
        </p>
      </div>

      <AIInsightsDashboard />
    </div>
  );
}
