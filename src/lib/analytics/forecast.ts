/**
 * Revenue Forecasting Utilities
 * Uses historical data to predict future revenue trends
 */

export type DataPoint = {
  date: string;
  value: number;
};

export type ForecastResult = {
  historical: DataPoint[];
  forecast: DataPoint[];
  trend: 'up' | 'down' | 'stable';
  confidence: number;
  growth: number;
};

/**
 * Calculate simple moving average
 */
function calculateMovingAverage(data: number[], period: number): number[] {
  const result: number[] = [];

  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) {
      result.push(data[i]);
      continue;
    }

    const sum = data.slice(i - period + 1, i + 1).reduce((a, b) => a + b, 0);
    result.push(sum / period);
  }

  return result;
}

/**
 * Calculate exponential moving average
 */
function calculateEMA(data: number[], period: number): number[] {
  const multiplier = 2 / (period + 1);
  const result: number[] = [];

  // Start with simple moving average
  const initialSMA = data.slice(0, period).reduce((a, b) => a + b, 0) / period;
  result.push(initialSMA);

  // Calculate EMA for remaining points
  for (let i = 1; i < data.length; i++) {
    const ema = (data[i] - result[i - 1]) * multiplier + result[i - 1];
    result.push(ema);
  }

  return result;
}

/**
 * Calculate linear regression for trend line
 */
function calculateLinearRegression(data: number[]): {
  slope: number;
  intercept: number;
} {
  const n = data.length;
  const sumX = data.reduce((sum, _, i) => sum + i, 0);
  const sumY = data.reduce((sum, val) => sum + val, 0);
  const sumXY = data.reduce((sum, val, i) => sum + i * val, 0);
  const sumXX = data.reduce((sum, _, i) => sum + i * i, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  return { slope, intercept };
}

/**
 * Generate revenue forecast based on historical data
 */
export function generateRevenueForecast(
  historicalData: DataPoint[],
  forecastPeriods: number = 6
): ForecastResult {
  if (historicalData.length < 2) {
    return {
      historical: historicalData,
      forecast: [],
      trend: 'stable',
      confidence: 0,
      growth: 0,
    };
  }

  // Extract values
  const values = historicalData.map((d) => d.value);

  // Calculate trend using linear regression
  const { slope, intercept } = calculateLinearRegression(values);

  // Determine trend direction
  let trend: 'up' | 'down' | 'stable' = 'stable';
  if (slope > values[values.length - 1] * 0.05) trend = 'up';
  else if (slope < -values[values.length - 1] * 0.05) trend = 'down';

  // Calculate moving averages for smoothing
  const ema = calculateEMA(values, Math.min(3, values.length));

  // Generate forecast
  const forecast: DataPoint[] = [];
  const lastDate = new Date(historicalData[historicalData.length - 1].date);

  for (let i = 1; i <= forecastPeriods; i++) {
    const x = historicalData.length + i - 1;
    const predictedValue = slope * x + intercept;

    // Add some variance based on historical volatility
    const volatility = calculateVolatility(values);
    const variance = (Math.random() - 0.5) * volatility;

    // Apply EMA smoothing
    const smoothedValue = Math.max(0, predictedValue + variance);

    // Calculate forecast date
    const forecastDate = new Date(lastDate);
    forecastDate.setMonth(forecastDate.getMonth() + i);

    forecast.push({
      date: forecastDate.toISOString().split('T')[0],
      value: Math.round(smoothedValue * 100) / 100,
    });
  }

  // Calculate confidence based on data consistency
  const confidence = calculateConfidence(values, ema);

  // Calculate growth rate
  const firstValue = values[0];
  const lastValue = values[values.length - 1];
  const growth = firstValue > 0 ? ((lastValue - firstValue) / firstValue) * 100 : 0;

  return {
    historical: historicalData,
    forecast,
    trend,
    confidence: Math.round(confidence * 100) / 100,
    growth: Math.round(growth * 10) / 10,
  };
}

/**
 * Calculate volatility (standard deviation)
 */
function calculateVolatility(data: number[]): number {
  const mean = data.reduce((a, b) => a + b, 0) / data.length;
  const squaredDiffs = data.map((val) => Math.pow(val - mean, 2));
  const variance = squaredDiffs.reduce((a, b) => a + b, 0) / data.length;
  return Math.sqrt(variance);
}

/**
 * Calculate forecast confidence based on data consistency
 */
function calculateConfidence(actual: number[], smoothed: number[]): number {
  if (actual.length !== smoothed.length || actual.length < 2) {
    return 0;
  }

  // Calculate mean absolute percentage error (MAPE)
  let totalError = 0;
  let count = 0;

  for (let i = 0; i < actual.length; i++) {
    if (actual[i] !== 0) {
      const percentageError = Math.abs((actual[i] - smoothed[i]) / actual[i]);
      totalError += percentageError;
      count++;
    }
  }

  if (count === 0) return 0;

  const mape = totalError / count;

  // Convert MAPE to confidence score (0-100)
  // Lower error = higher confidence
  const confidence = Math.max(0, Math.min(100, 100 * (1 - mape)));

  return confidence;
}

/**
 * Calculate compound annual growth rate (CAGR)
 */
export function calculateCAGR(
  startValue: number,
  endValue: number,
  years: number
): number {
  if (startValue <= 0 || years <= 0) return 0;

  const cagr = (Math.pow(endValue / startValue, 1 / years) - 1) * 100;
  return Math.round(cagr * 10) / 10;
}

/**
 * Calculate month-over-month growth rate
 */
export function calculateMoMGrowth(currentMonth: number, previousMonth: number): number {
  if (previousMonth === 0) return 0;

  const growth = ((currentMonth - previousMonth) / previousMonth) * 100;
  return Math.round(growth * 10) / 10;
}

/**
 * Generate revenue forecast with confidence intervals
 */
export function generateForecastWithConfidence(
  historicalData: DataPoint[],
  forecastPeriods: number = 6,
  confidenceLevel: number = 95
): {
  forecast: DataPoint[];
  upperBound: DataPoint[];
  lowerBound: DataPoint[];
} {
  const baseForecast = generateRevenueForecast(historicalData, forecastPeriods);

  // Calculate confidence interval width based on volatility
  const values = historicalData.map((d) => d.value);
  const volatility = calculateVolatility(values);
  const zScore = confidenceLevel === 95 ? 1.96 : 2.576; // 95% or 99%

  const intervalWidth = zScore * volatility;

  const upperBound = baseForecast.forecast.map((point) => ({
    date: point.date,
    value: Math.round((point.value + intervalWidth) * 100) / 100,
  }));

  const lowerBound = baseForecast.forecast.map((point) => ({
    date: point.date,
    value: Math.max(0, Math.round((point.value - intervalWidth) * 100) / 100),
  }));

  return {
    forecast: baseForecast.forecast,
    upperBound,
    lowerBound,
  };
}
