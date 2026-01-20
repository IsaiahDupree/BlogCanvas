/**
 * AI Insights Email Template
 * Weekly summary of AI-generated insights sent to vendors
 */

export type AIInsightEmail = {
  recipientName: string;
  insights: Array<{
    type: 'trend' | 'anomaly' | 'opportunity' | 'warning';
    title: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
  }>;
  metrics: {
    revenue: number;
    revenueChange: number;
    customers: number;
    customersChange: number;
    conversionRate: number;
    conversionRateChange: number;
  };
  period: string;
};

/**
 * Generate HTML email with AI insights
 */
export function generateAIInsightsEmail(data: AIInsightEmail): string {
  const {
    recipientName,
    insights,
    metrics,
    period,
  } = data;

  const formatNumber = (num: number) => num.toLocaleString();
  const formatCurrency = (num: number) => `$${num.toLocaleString()}`;
  const formatPercent = (num: number) => {
    const sign = num > 0 ? '+' : '';
    return `${sign}${num.toFixed(1)}%`;
  };

  const getChangeColor = (change: number) => {
    return change >= 0 ? '#22c55e' : '#ef4444';
  };

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Your Weekly AI Insights</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
          }
          .container {
            background-color: white;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .header h1 {
            color: #4f46e5;
            margin: 0 0 10px 0;
          }
          .metrics {
            display: flex;
            justify-content: space-between;
            margin: 30px 0;
            padding: 20px;
            background-color: #f9fafb;
            border-radius: 8px;
          }
          .metric {
            text-align: center;
            flex: 1;
          }
          .metric-value {
            font-size: 24px;
            font-weight: bold;
            color: #111;
          }
          .metric-label {
            font-size: 12px;
            color: #666;
            text-transform: uppercase;
            margin-top: 5px;
          }
          .metric-change {
            font-size: 14px;
            margin-top: 5px;
          }
          .insights {
            margin: 30px 0;
          }
          .insight {
            margin: 15px 0;
            padding: 15px;
            border-left: 4px solid #ddd;
            background-color: #f9fafb;
          }
          .insight.high {
            border-left-color: #ef4444;
          }
          .insight.medium {
            border-left-color: #f59e0b;
          }
          .insight.low {
            border-left-color: #3b82f6;
          }
          .insight-header {
            display: flex;
            align-items: center;
            margin-bottom: 10px;
          }
          .insight-icon {
            font-size: 24px;
            margin-right: 10px;
          }
          .insight-title {
            font-weight: bold;
            color: #111;
            flex: 1;
          }
          .insight-badge {
            padding: 2px 8px;
            border-radius: 4px;
            font-size: 11px;
            text-transform: uppercase;
            font-weight: 600;
          }
          .insight-description {
            color: #666;
            font-size: 14px;
          }
          .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            text-align: center;
            color: #666;
            font-size: 12px;
          }
          .cta {
            text-align: center;
            margin: 30px 0;
          }
          .cta-button {
            display: inline-block;
            padding: 12px 24px;
            background-color: #4f46e5;
            color: white;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🤖 AI Insights</h1>
            <p>Your weekly intelligence summary for ${period}</p>
          </div>

          <p>Hi ${recipientName},</p>
          <p>Here are your AI-powered insights for this week:</p>

          <div class="metrics">
            <div class="metric">
              <div class="metric-value">${formatCurrency(metrics.revenue)}</div>
              <div class="metric-label">Revenue</div>
              <div class="metric-change" style="color: ${getChangeColor(metrics.revenueChange)}">
                ${formatPercent(metrics.revenueChange)}
              </div>
            </div>
            <div class="metric">
              <div class="metric-value">${formatNumber(metrics.customers)}</div>
              <div class="metric-label">Customers</div>
              <div class="metric-change" style="color: ${getChangeColor(metrics.customersChange)}">
                ${formatPercent(metrics.customersChange)}
              </div>
            </div>
            <div class="metric">
              <div class="metric-value">${metrics.conversionRate.toFixed(1)}%</div>
              <div class="metric-label">Conversion</div>
              <div class="metric-change" style="color: ${getChangeColor(metrics.conversionRateChange)}">
                ${formatPercent(metrics.conversionRateChange)}
              </div>
            </div>
          </div>

          <div class="insights">
            <h2>Key Insights</h2>
            ${insights.map((insight) => {
              const icon = {
                trend: '📈',
                anomaly: '⚠️',
                opportunity: '💡',
                warning: '🔴',
              }[insight.type] || '📊';

              return `
                <div class="insight ${insight.impact}">
                  <div class="insight-header">
                    <span class="insight-icon">${icon}</span>
                    <span class="insight-title">${insight.title}</span>
                    <span class="insight-badge" style="background-color: ${
                      insight.impact === 'high' ? '#fecaca' :
                      insight.impact === 'medium' ? '#fed7aa' :
                      '#bfdbfe'
                    }; color: ${
                      insight.impact === 'high' ? '#991b1b' :
                      insight.impact === 'medium' ? '#9a3412' :
                      '#1e40af'
                    }">
                      ${insight.impact}
                    </span>
                  </div>
                  <div class="insight-description">${insight.description}</div>
                </div>
              `;
            }).join('')}
          </div>

          <div class="cta">
            <a href="#" class="cta-button">View Full Dashboard</a>
          </div>

          <div class="footer">
            <p>
              These insights are generated by AI based on your business data.<br>
              You're receiving this email because you're subscribed to weekly insights.
            </p>
            <p>
              <a href="#">Unsubscribe</a> | <a href="#">Manage Preferences</a>
            </p>
          </div>
        </div>
      </body>
    </html>
  `;
}

/**
 * Generate plain text version of the email
 */
export function generateAIInsightsTextEmail(data: AIInsightEmail): string {
  const { recipientName, insights, metrics, period } = data;

  const formatPercent = (num: number) => {
    const sign = num > 0 ? '+' : '';
    return `${sign}${num.toFixed(1)}%`;
  };

  let text = `AI Insights - ${period}\n\n`;
  text += `Hi ${recipientName},\n\n`;
  text += `Here are your AI-powered insights for this week:\n\n`;
  text += `KEY METRICS:\n`;
  text += `Revenue: $${metrics.revenue.toLocaleString()} (${formatPercent(metrics.revenueChange)})\n`;
  text += `Customers: ${metrics.customers.toLocaleString()} (${formatPercent(metrics.customersChange)})\n`;
  text += `Conversion Rate: ${metrics.conversionRate.toFixed(1)}% (${formatPercent(metrics.conversionRateChange)})\n\n`;
  text += `INSIGHTS:\n\n`;

  insights.forEach((insight, i) => {
    text += `${i + 1}. ${insight.title} [${insight.impact.toUpperCase()} IMPACT]\n`;
    text += `   ${insight.description}\n\n`;
  });

  text += `View your full dashboard: [LINK]\n\n`;
  text += `---\n`;
  text += `These insights are generated by AI based on your business data.\n`;

  return text;
}
