-- A/B Testing Framework Migration
-- Feature flag-based experiments with statistical significance tracking

-- Create experiments table
CREATE TABLE IF NOT EXISTS experiments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'running', 'paused', 'completed')),
  variants JSONB NOT NULL DEFAULT '[]'::jsonb,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  target_sample_size INTEGER,
  success_metric TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create experiment_assignments table
CREATE TABLE IF NOT EXISTS experiment_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  experiment_id UUID NOT NULL REFERENCES experiments(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  variant_id TEXT NOT NULL,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(experiment_id, user_id),
  UNIQUE(experiment_id, session_id)
);

-- Create experiment_conversions table
CREATE TABLE IF NOT EXISTS experiment_conversions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  experiment_id UUID NOT NULL REFERENCES experiments(id) ON DELETE CASCADE,
  assignment_id UUID NOT NULL REFERENCES experiment_assignments(id) ON DELETE CASCADE,
  variant_id TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  converted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(assignment_id) -- One conversion per assignment
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_experiments_status ON experiments(status);
CREATE INDEX IF NOT EXISTS idx_experiments_created_at ON experiments(created_at);

CREATE INDEX IF NOT EXISTS idx_assignments_experiment ON experiment_assignments(experiment_id);
CREATE INDEX IF NOT EXISTS idx_assignments_user ON experiment_assignments(user_id);
CREATE INDEX IF NOT EXISTS idx_assignments_session ON experiment_assignments(session_id);
CREATE INDEX IF NOT EXISTS idx_assignments_variant ON experiment_assignments(variant_id);

CREATE INDEX IF NOT EXISTS idx_conversions_experiment ON experiment_conversions(experiment_id);
CREATE INDEX IF NOT EXISTS idx_conversions_assignment ON experiment_conversions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_conversions_variant ON experiment_conversions(variant_id);
CREATE INDEX IF NOT EXISTS idx_conversions_converted_at ON experiment_conversions(converted_at);

-- Function to get experiment metrics
CREATE OR REPLACE FUNCTION get_experiment_metrics(p_experiment_id UUID)
RETURNS TABLE (
  variant_id TEXT,
  total_assignments BIGINT,
  total_conversions BIGINT,
  conversion_rate DECIMAL,
  avg_time_to_convert DECIMAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ea.variant_id,
    COUNT(DISTINCT ea.id) as total_assignments,
    COUNT(DISTINCT ec.id) as total_conversions,
    CASE
      WHEN COUNT(DISTINCT ea.id) > 0
      THEN (COUNT(DISTINCT ec.id)::DECIMAL / COUNT(DISTINCT ea.id)::DECIMAL * 100)
      ELSE 0
    END as conversion_rate,
    AVG(EXTRACT(EPOCH FROM (ec.converted_at - ea.assigned_at)))::DECIMAL as avg_time_to_convert
  FROM experiment_assignments ea
  LEFT JOIN experiment_conversions ec ON ea.id = ec.assignment_id
  WHERE ea.experiment_id = p_experiment_id
  GROUP BY ea.variant_id;
END;
$$ LANGUAGE plpgsql;

-- Function to check if experiment has reached statistical significance
CREATE OR REPLACE FUNCTION check_experiment_significance(
  p_experiment_id UUID,
  p_control_variant_id TEXT,
  p_test_variant_id TEXT
)
RETURNS TABLE (
  is_significant BOOLEAN,
  confidence_level DECIMAL,
  p_value DECIMAL
) AS $$
DECLARE
  v_control_conversions BIGINT;
  v_control_total BIGINT;
  v_test_conversions BIGINT;
  v_test_total BIGINT;
  v_p1 DECIMAL;
  v_p2 DECIMAL;
  v_pooled_p DECIMAL;
  v_se DECIMAL;
  v_z DECIMAL;
BEGIN
  -- Get control metrics
  SELECT total_conversions, total_assignments INTO v_control_conversions, v_control_total
  FROM get_experiment_metrics(p_experiment_id)
  WHERE variant_id = p_control_variant_id;

  -- Get test metrics
  SELECT total_conversions, total_assignments INTO v_test_conversions, v_test_total
  FROM get_experiment_metrics(p_experiment_id)
  WHERE variant_id = p_test_variant_id;

  -- Check if we have enough data
  IF v_control_total < 30 OR v_test_total < 30 THEN
    RETURN QUERY SELECT FALSE, 0::DECIMAL, 1::DECIMAL;
    RETURN;
  END IF;

  -- Calculate proportions
  v_p1 := v_control_conversions::DECIMAL / v_control_total::DECIMAL;
  v_p2 := v_test_conversions::DECIMAL / v_test_total::DECIMAL;

  -- Pooled proportion
  v_pooled_p := (v_control_conversions + v_test_conversions)::DECIMAL / (v_control_total + v_test_total)::DECIMAL;

  -- Standard error
  v_se := SQRT(v_pooled_p * (1 - v_pooled_p) * (1.0 / v_control_total + 1.0 / v_test_total));

  -- Z-score
  v_z := ABS(v_p1 - v_p2) / v_se;

  -- Simple p-value approximation (for z > 1.96, p < 0.05)
  RETURN QUERY SELECT
    v_z > 1.96 as is_significant,
    (1 - 2 * EXP(-0.717 * v_z - 0.416 * v_z * v_z)) * 100 as confidence_level,
    2 * (1 - 0.5 * (1 + TANH(v_z / SQRT(2)))) as p_value;
END;
$$ LANGUAGE plpgsql;

-- Function to auto-stop experiments that have reached significance
CREATE OR REPLACE FUNCTION auto_stop_significant_experiments()
RETURNS void AS $$
DECLARE
  v_experiment RECORD;
  v_significance RECORD;
BEGIN
  FOR v_experiment IN
    SELECT id, variants
    FROM experiments
    WHERE status = 'running'
      AND start_date < NOW() - INTERVAL '7 days' -- Minimum run time
  LOOP
    -- Check significance between control (first variant) and each test variant
    FOR v_significance IN
      SELECT * FROM check_experiment_significance(
        v_experiment.id,
        (v_experiment.variants->0->>'id')::TEXT,
        (v_experiment.variants->1->>'id')::TEXT
      )
    LOOP
      IF v_significance.is_significant THEN
        UPDATE experiments
        SET
          status = 'completed',
          end_date = NOW(),
          updated_at = NOW()
        WHERE id = v_experiment.id;
      END IF;
    END LOOP;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Enable RLS
ALTER TABLE experiments ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiment_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE experiment_conversions ENABLE ROW LEVEL SECURITY;

-- RLS policies for experiments
CREATE POLICY "Authenticated users can view experiments"
  ON experiments
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Admins can manage experiments"
  ON experiments
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
        AND role = 'admin'
    )
  );

-- RLS policies for experiment_assignments
CREATE POLICY "Users can insert assignments"
  ON experiment_assignments
  FOR INSERT
  WITH CHECK (true); -- Allow anonymous assignments

CREATE POLICY "Users can view their own assignments"
  ON experiment_assignments
  FOR SELECT
  USING (auth.uid() = user_id OR session_id IS NOT NULL);

CREATE POLICY "Admins can view all assignments"
  ON experiment_assignments
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
        AND role = 'admin'
    )
  );

-- RLS policies for experiment_conversions
CREATE POLICY "Users can insert conversions"
  ON experiment_conversions
  FOR INSERT
  WITH CHECK (true); -- Allow anonymous conversions

CREATE POLICY "Users can view their own conversions"
  ON experiment_conversions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all conversions"
  ON experiment_conversions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
        AND role = 'admin'
    )
  );

-- Grant permissions
GRANT SELECT, INSERT ON experiments TO authenticated;
GRANT SELECT, INSERT ON experiment_assignments TO authenticated, anon;
GRANT SELECT, INSERT ON experiment_conversions TO authenticated, anon;

-- Comments
COMMENT ON TABLE experiments IS 'A/B testing experiments with variants and configuration';
COMMENT ON TABLE experiment_assignments IS 'User/session assignments to experiment variants';
COMMENT ON TABLE experiment_conversions IS 'Conversion events for experiment tracking';
COMMENT ON FUNCTION get_experiment_metrics IS 'Calculate metrics for each variant in an experiment';
COMMENT ON FUNCTION check_experiment_significance IS 'Check statistical significance between variants';
COMMENT ON FUNCTION auto_stop_significant_experiments IS 'Automatically stop experiments that reach significance';
