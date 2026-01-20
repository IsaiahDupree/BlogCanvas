/**
 * AI-Powered Pricing Optimization
 * Analyzes market data and historical performance to suggest optimal pricing
 */

export type PricingData = {
  currentPrice: number;
  competitorPrices: number[];
  historicalSales: {
    price: number;
    sales: number;
    date: string;
  }[];
  costs: number;
  targetMargin: number;
};

export type PricingRecommendation = {
  recommendedPrice: number;
  confidence: number;
  reasoning: string[];
  expectedRevenue: number;
  expectedSales: number;
  priceElasticity: number;
};

/**
 * Calculate price elasticity of demand
 * Measures how sensitive demand is to price changes
 */
function calculatePriceElasticity(historicalSales: any[]): number {
  if (historicalSales.length < 2) return 0;

  // Sort by price
  const sorted = [...historicalSales].sort((a, b) => a.price - b.price);

  // Calculate percentage changes
  let totalElasticity = 0;
  let count = 0;

  for (let i = 1; i < sorted.length; i++) {
    const priceChange = (sorted[i].price - sorted[i - 1].price) / sorted[i - 1].price;
    const quantityChange = (sorted[i].sales - sorted[i - 1].sales) / sorted[i - 1].sales;

    if (priceChange !== 0) {
      const elasticity = quantityChange / priceChange;
      totalElasticity += elasticity;
      count++;
    }
  }

  return count > 0 ? totalElasticity / count : 0;
}

/**
 * Predict sales volume at a given price point
 */
function predictSales(
  price: number,
  historicalSales: any[],
  elasticity: number
): number {
  if (historicalSales.length === 0) return 0;

  // Use the most recent sales data as baseline
  const baseline = historicalSales[historicalSales.length - 1];
  const priceChange = (price - baseline.price) / baseline.price;

  // Apply elasticity to predict new sales volume
  const volumeChange = elasticity * priceChange;
  const predictedSales = baseline.sales * (1 + volumeChange);

  return Math.max(0, predictedSales);
}

/**
 * Calculate optimal price using profit maximization
 */
export function calculateOptimalPrice(data: PricingData): PricingRecommendation {
  const elasticity = calculatePriceElasticity(data.historicalSales);

  // Generate price candidates within reasonable range
  const minPrice = data.costs * (1 + data.targetMargin);
  const maxPrice = Math.max(...data.competitorPrices) * 1.2;
  const priceRange = maxPrice - minPrice;
  const step = priceRange / 20; // Test 20 price points

  const candidates: Array<{
    price: number;
    revenue: number;
    sales: number;
    profit: number;
  }> = [];

  // Evaluate each price point
  for (let price = minPrice; price <= maxPrice; price += step) {
    const sales = predictSales(price, data.historicalSales, elasticity);
    const revenue = price * sales;
    const profit = (price - data.costs) * sales;

    candidates.push({ price, revenue, sales, profit });
  }

  // Find price that maximizes profit
  const optimal = candidates.reduce((best, current) =>
    current.profit > best.profit ? current : best
  );

  // Generate reasoning
  const reasoning: string[] = [];

  // Compare to current price
  const priceChange =
    ((optimal.price - data.currentPrice) / data.currentPrice) * 100;
  if (Math.abs(priceChange) < 5) {
    reasoning.push('Current price is already near optimal');
  } else if (priceChange > 0) {
    reasoning.push(
      `Increase price by ${priceChange.toFixed(1)}% to maximize profit`
    );
  } else {
    reasoning.push(
      `Decrease price by ${Math.abs(priceChange).toFixed(1)}% to increase volume`
    );
  }

  // Compare to competitors
  const avgCompetitorPrice =
    data.competitorPrices.reduce((a, b) => a + b, 0) /
    data.competitorPrices.length;
  const competitorDiff =
    ((optimal.price - avgCompetitorPrice) / avgCompetitorPrice) * 100;

  if (Math.abs(competitorDiff) < 10) {
    reasoning.push('Price is competitive with market average');
  } else if (competitorDiff > 0) {
    reasoning.push(
      `Price is ${competitorDiff.toFixed(1)}% above market average - premium positioning`
    );
  } else {
    reasoning.push(
      `Price is ${Math.abs(competitorDiff).toFixed(1)}% below market average - value positioning`
    );
  }

  // Elasticity insights
  if (Math.abs(elasticity) < 0.5) {
    reasoning.push('Demand is relatively inelastic - room for price increases');
  } else if (Math.abs(elasticity) > 1.5) {
    reasoning.push('Demand is highly elastic - price-sensitive customers');
  } else {
    reasoning.push('Demand shows moderate price sensitivity');
  }

  // Margin check
  const margin = ((optimal.price - data.costs) / optimal.price) * 100;
  if (margin < data.targetMargin * 100) {
    reasoning.push(
      `Warning: Margin (${margin.toFixed(1)}%) below target (${(data.targetMargin * 100).toFixed(1)}%)`
    );
  } else {
    reasoning.push(
      `Margin of ${margin.toFixed(1)}% meets target requirements`
    );
  }

  // Calculate confidence based on data quality
  let confidence = 50;
  if (data.historicalSales.length >= 12) confidence += 20;
  if (data.competitorPrices.length >= 3) confidence += 15;
  if (Math.abs(elasticity) > 0.1) confidence += 15;

  return {
    recommendedPrice: Math.round(optimal.price * 100) / 100,
    confidence: Math.min(100, confidence),
    reasoning,
    expectedRevenue: Math.round(optimal.revenue * 100) / 100,
    expectedSales: Math.round(optimal.sales),
    priceElasticity: Math.round(elasticity * 100) / 100,
  };
}

/**
 * Analyze pricing across multiple products/tiers
 */
export function analyzePricingStrategy(
  products: Array<{ name: string; data: PricingData }>
): {
  recommendations: Array<{ product: string; recommendation: PricingRecommendation }>;
  strategyInsights: string[];
} {
  const recommendations = products.map((product) => ({
    product: product.name,
    recommendation: calculateOptimalPrice(product.data),
  }));

  const strategyInsights: string[] = [];

  // Check for pricing tier consistency
  const prices = recommendations.map((r) => r.recommendation.recommendedPrice);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);

  if (maxPrice / minPrice < 2) {
    strategyInsights.push(
      'Consider larger price differentiation between tiers'
    );
  }

  // Check for overlap in pricing
  const sortedPrices = [...prices].sort((a, b) => a - b);
  for (let i = 1; i < sortedPrices.length; i++) {
    const gap = (sortedPrices[i] - sortedPrices[i - 1]) / sortedPrices[i - 1];
    if (gap < 0.3) {
      strategyInsights.push(
        'Some tiers have minimal price gaps - may cause confusion'
      );
      break;
    }
  }

  // Overall confidence
  const avgConfidence =
    recommendations.reduce((sum, r) => sum + r.recommendation.confidence, 0) /
    recommendations.length;

  if (avgConfidence >= 80) {
    strategyInsights.push(
      'High confidence in recommendations based on strong data'
    );
  } else if (avgConfidence < 60) {
    strategyInsights.push(
      'Limited historical data - recommendations should be tested carefully'
    );
  }

  return {
    recommendations,
    strategyInsights,
  };
}

/**
 * Simulate pricing scenarios
 */
export function simulatePricingScenarios(
  data: PricingData,
  scenarios: number[]
): Array<{
  price: number;
  expectedSales: number;
  expectedRevenue: number;
  expectedProfit: number;
}> {
  const elasticity = calculatePriceElasticity(data.historicalSales);

  return scenarios.map((price) => {
    const sales = predictSales(price, data.historicalSales, elasticity);
    const revenue = price * sales;
    const profit = (price - data.costs) * sales;

    return {
      price,
      expectedSales: Math.round(sales),
      expectedRevenue: Math.round(revenue * 100) / 100,
      expectedProfit: Math.round(profit * 100) / 100,
    };
  });
}
