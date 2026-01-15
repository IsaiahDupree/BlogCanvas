-- Add ETA tracking to pipeline_jobs
-- feat-152: Pipeline job progress percentage display with ETA

-- Add eta_seconds column to track estimated time remaining
ALTER TABLE pipeline_jobs
ADD COLUMN IF NOT EXISTS eta_seconds INTEGER;

-- Add comment for documentation
COMMENT ON COLUMN pipeline_jobs.eta_seconds IS 'Estimated time remaining in seconds for running jobs';

-- Create index for queries that filter by running jobs with ETA
CREATE INDEX IF NOT EXISTS idx_pipeline_jobs_running_eta
ON pipeline_jobs(status, eta_seconds)
WHERE status = 'running';
