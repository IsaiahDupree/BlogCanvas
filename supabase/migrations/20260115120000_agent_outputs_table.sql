-- Migration: Create agent_outputs table for AI pipeline tracking
-- Purpose: Store each AI agent's input/output for debugging, replay, and audit trail
-- Feature: feat-118 - PRD Pipeline: agent_outputs database table
-- Date: 2026-01-15

-- Create agent_outputs table
-- Stores each agent's output for debugging and replay
CREATE TABLE IF NOT EXISTS agent_outputs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blog_post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
  agent_name TEXT NOT NULL,  -- outline, draft, seo, fact_check, enhance
  agent_version TEXT DEFAULT '1.0',  -- Track agent version for future updates
  input JSONB,
  output JSONB,
  duration_ms INTEGER,
  model_used TEXT,
  token_count INTEGER,
  status TEXT DEFAULT 'completed',  -- completed, failed, skipped
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Add constraint to ensure agent_name is valid
  CONSTRAINT valid_agent_name CHECK (
    agent_name IN ('outline', 'draft', 'seo', 'fact_check', 'enhance', 'orchestrator')
  ),

  -- Add constraint to ensure status is valid
  CONSTRAINT valid_status CHECK (
    status IN ('completed', 'failed', 'skipped')
  )
);

-- Create index on blog_post_id for fast lookups
CREATE INDEX IF NOT EXISTS idx_agent_outputs_blog_post_id ON agent_outputs(blog_post_id);

-- Create index on agent_name for filtering by agent type
CREATE INDEX IF NOT EXISTS idx_agent_outputs_agent_name ON agent_outputs(agent_name);

-- Create index on created_at for chronological queries
CREATE INDEX IF NOT EXISTS idx_agent_outputs_created_at ON agent_outputs(created_at DESC);

-- Create composite index for common query pattern (post + agent + time)
CREATE INDEX IF NOT EXISTS idx_agent_outputs_post_agent_time
  ON agent_outputs(blog_post_id, agent_name, created_at DESC);

-- Enable Row Level Security
ALTER TABLE agent_outputs ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow authenticated users to read agent outputs for posts they have access to
CREATE POLICY "Users can view agent outputs for accessible posts"
  ON agent_outputs
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM blog_posts bp
      WHERE bp.id = agent_outputs.blog_post_id
      AND (
        -- User owns the client
        EXISTS (SELECT 1 FROM clients c WHERE c.id = bp.client_id AND c.id IN (
          SELECT client_id FROM client_profiles WHERE user_id = auth.uid()
        ))
        OR
        -- User is authenticated (vendor access)
        auth.uid() IS NOT NULL
      )
    )
  );

-- RLS Policy: Allow authenticated users to insert agent outputs
CREATE POLICY "Authenticated users can create agent outputs"
  ON agent_outputs
  FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- RLS Policy: Allow authenticated users to update agent outputs (for re-runs)
CREATE POLICY "Authenticated users can update agent outputs"
  ON agent_outputs
  FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- RLS Policy: Allow authenticated users to delete agent outputs
CREATE POLICY "Authenticated users can delete agent outputs"
  ON agent_outputs
  FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- Add comment to table for documentation
COMMENT ON TABLE agent_outputs IS 'Stores AI agent inputs and outputs for the blog post generation pipeline. Used for debugging, replay, and audit trail.';

-- Add comments to columns
COMMENT ON COLUMN agent_outputs.agent_name IS 'Name of the AI agent: outline, draft, seo, fact_check, enhance, or orchestrator';
COMMENT ON COLUMN agent_outputs.agent_version IS 'Version of the agent for tracking changes over time';
COMMENT ON COLUMN agent_outputs.input IS 'JSON input provided to the agent';
COMMENT ON COLUMN agent_outputs.output IS 'JSON output produced by the agent';
COMMENT ON COLUMN agent_outputs.duration_ms IS 'Execution time in milliseconds';
COMMENT ON COLUMN agent_outputs.model_used IS 'AI model used (e.g., gpt-4, claude-3-opus)';
COMMENT ON COLUMN agent_outputs.token_count IS 'Total tokens used for cost tracking';
COMMENT ON COLUMN agent_outputs.status IS 'Status of the agent execution: completed, failed, or skipped';
COMMENT ON COLUMN agent_outputs.error_message IS 'Error message if status is failed';
