/**
 * A/B Testing Framework
 * Feature flag-based A/B tests with statistical significance tracking
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Experiment variant
 */
export interface ExperimentVariant {
  id: string;
  name: string;
  weight: number; // 0-100 percentage
  config: Record<string, any>;
}

/**
 * Experiment definition
 */
export interface Experiment {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'running' | 'paused' | 'completed';
  variants: ExperimentVariant[];
  start_date?: string;
  end_date?: string;
  target_sample_size?: number;
  success_metric: string;
  created_at: string;
  updated_at: string;
}

/**
 * Experiment assignment
 */
export interface ExperimentAssignment {
  id: string;
  experiment_id: string;
  user_id?: string;
  session_id: string;
  variant_id: string;
  assigned_at: string;
}

/**
 * Experiment metrics
 */
export interface ExperimentMetrics {
  experiment_id: string;
  variant_id: string;
  total_users: number;
  conversions: number;
  conversion_rate: number;
  confidence_level?: number;
  is_significant?: boolean;
}

/**
 * Get or create experiment assignment for a user/session
 */
export async function getExperimentAssignment(
  experimentId: string,
  userId?: string
): Promise<string> {
  const sessionId = getOrCreateSessionId();

  // Check for existing assignment
  const { data: existing } = await supabase
    .from('experiment_assignments')
    .select('variant_id')
    .eq('experiment_id', experimentId)
    .or(`user_id.eq.${userId},session_id.eq.${sessionId}`)
    .single();

  if (existing) {
    return existing.variant_id;
  }

  // Get experiment details
  const { data: experiment } = await supabase
    .from('experiments')
    .select('variants')
    .eq('id', experimentId)
    .eq('status', 'running')
    .single();

  if (!experiment) {
    throw new Error('Experiment not found or not running');
  }

  // Assign variant based on weights
  const variantId = assignVariant(experiment.variants);

  // Save assignment
  await supabase.from('experiment_assignments').insert({
    experiment_id: experimentId,
    user_id: userId,
    session_id: sessionId,
    variant_id: variantId,
  });

  return variantId;
}

/**
 * Assign variant based on weights using deterministic hash
 */
function assignVariant(variants: ExperimentVariant[]): string {
  const random = Math.random() * 100;
  let cumulative = 0;

  for (const variant of variants) {
    cumulative += variant.weight;
    if (random <= cumulative) {
      return variant.id;
    }
  }

  // Fallback to control
  return variants[0].id;
}

/**
 * Get session ID for assignment
 */
function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') {
    return 'ssr-session';
  }

  let sessionId = sessionStorage.getItem('experiment_session_id');
  if (!sessionId) {
    sessionId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    sessionStorage.setItem('experiment_session_id', sessionId);
  }
  return sessionId;
}

/**
 * Track experiment conversion
 */
export async function trackConversion(
  experimentId: string,
  userId?: string,
  metadata?: Record<string, any>
): Promise<void> {
  const sessionId = getOrCreateSessionId();

  // Get assignment
  const { data: assignment } = await supabase
    .from('experiment_assignments')
    .select('id, variant_id')
    .eq('experiment_id', experimentId)
    .or(`user_id.eq.${userId},session_id.eq.${sessionId}`)
    .single();

  if (!assignment) {
    console.warn('No experiment assignment found for conversion tracking');
    return;
  }

  // Record conversion
  await supabase.from('experiment_conversions').insert({
    experiment_id: experimentId,
    assignment_id: assignment.id,
    variant_id: assignment.variant_id,
    user_id: userId,
    session_id: sessionId,
    metadata,
  });
}

/**
 * Get experiment metrics
 */
export async function getExperimentMetrics(
  experimentId: string
): Promise<ExperimentMetrics[]> {
  const { data: experiment } = await supabase
    .from('experiments')
    .select('variants')
    .eq('id', experimentId)
    .single();

  if (!experiment) {
    throw new Error('Experiment not found');
  }

  const metrics: ExperimentMetrics[] = [];

  for (const variant of experiment.variants) {
    // Count total assignments
    const { count: totalUsers } = await supabase
      .from('experiment_assignments')
      .select('*', { count: 'exact', head: true })
      .eq('experiment_id', experimentId)
      .eq('variant_id', variant.id);

    // Count conversions
    const { count: conversions } = await supabase
      .from('experiment_conversions')
      .select('*', { count: 'exact', head: true })
      .eq('experiment_id', experimentId)
      .eq('variant_id', variant.id);

    const conversionRate = totalUsers ? (conversions! / totalUsers) * 100 : 0;

    metrics.push({
      experiment_id: experimentId,
      variant_id: variant.id,
      total_users: totalUsers || 0,
      conversions: conversions || 0,
      conversion_rate: conversionRate,
    });
  }

  // Calculate statistical significance
  if (metrics.length >= 2) {
    const control = metrics[0];
    const variants = metrics.slice(1);

    variants.forEach((variant) => {
      const significance = calculateSignificance(control, variant);
      variant.confidence_level = significance.confidenceLevel;
      variant.is_significant = significance.isSignificant;
    });
  }

  return metrics;
}

/**
 * Calculate statistical significance using z-test
 */
function calculateSignificance(
  control: ExperimentMetrics,
  variant: ExperimentMetrics
): { confidenceLevel: number; isSignificant: boolean } {
  const p1 = control.conversions / control.total_users;
  const p2 = variant.conversions / variant.total_users;

  const n1 = control.total_users;
  const n2 = variant.total_users;

  // Pooled proportion
  const p = (control.conversions + variant.conversions) / (n1 + n2);

  // Standard error
  const se = Math.sqrt(p * (1 - p) * (1 / n1 + 1 / n2));

  // Z-score
  const z = Math.abs(p1 - p2) / se;

  // Convert to confidence level (using normal distribution approximation)
  const confidenceLevel = (1 - 2 * (1 - normalCDF(z))) * 100;

  // Significant if > 95% confidence
  const isSignificant = confidenceLevel > 95;

  return { confidenceLevel, isSignificant };
}

/**
 * Normal cumulative distribution function approximation
 */
function normalCDF(x: number): number {
  const t = 1 / (1 + 0.2316419 * Math.abs(x));
  const d = 0.3989423 * Math.exp(-x * x / 2);
  const prob =
    d *
    t *
    (0.3193815 +
      t * (-0.3565638 + t * (1.781478 + t * (-1.821256 + t * 1.330274))));
  return x > 0 ? 1 - prob : prob;
}

/**
 * Create a new experiment
 */
export async function createExperiment(
  name: string,
  description: string,
  variants: ExperimentVariant[],
  successMetric: string
): Promise<Experiment> {
  // Validate weights sum to 100
  const totalWeight = variants.reduce((sum, v) => sum + v.weight, 0);
  if (Math.abs(totalWeight - 100) > 0.01) {
    throw new Error('Variant weights must sum to 100');
  }

  const { data, error } = await supabase
    .from('experiments')
    .insert({
      name,
      description,
      variants,
      success_metric: successMetric,
      status: 'draft',
    })
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Start an experiment
 */
export async function startExperiment(experimentId: string): Promise<void> {
  await supabase
    .from('experiments')
    .update({
      status: 'running',
      start_date: new Date().toISOString(),
    })
    .eq('id', experimentId);
}

/**
 * Stop an experiment
 */
export async function stopExperiment(experimentId: string): Promise<void> {
  await supabase
    .from('experiments')
    .update({
      status: 'completed',
      end_date: new Date().toISOString(),
    })
    .eq('id', experimentId);
}

/**
 * Get winning variant
 */
export async function getWinningVariant(
  experimentId: string
): Promise<{ variantId: string; metrics: ExperimentMetrics } | null> {
  const metrics = await getExperimentMetrics(experimentId);

  // Find variant with highest conversion rate that's statistically significant
  const significantVariants = metrics.filter((m) => m.is_significant);

  if (significantVariants.length === 0) {
    return null;
  }

  const winner = significantVariants.reduce((best, current) =>
    current.conversion_rate > best.conversion_rate ? current : best
  );

  return {
    variantId: winner.variant_id,
    metrics: winner,
  };
}

/**
 * React hook for A/B testing
 */
export function useExperiment(experimentId: string, userId?: string) {
  const [variant, setVariant] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getExperimentAssignment(experimentId, userId)
      .then(setVariant)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [experimentId, userId]);

  const trackConv = useCallback(
    (metadata?: Record<string, any>) => {
      trackConversion(experimentId, userId, metadata);
    },
    [experimentId, userId]
  );

  return { variant, loading, trackConversion: trackConv };
}

// Missing imports
import { useState, useEffect, useCallback } from 'react';
