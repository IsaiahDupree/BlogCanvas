-- Add client_id foreign key to websites table
-- This enables proper client-website relationship per PRD requirements

-- Add client_id column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'websites' AND column_name = 'client_id'
  ) THEN
    ALTER TABLE websites ADD COLUMN client_id UUID REFERENCES clients(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Create index for client_id lookups
CREATE INDEX IF NOT EXISTS idx_websites_client_id ON websites(client_id) WHERE client_id IS NOT NULL;

-- Update RLS policies for websites to enforce client-based access
-- Drop old policies if they exist
DROP POLICY IF EXISTS websites_select ON websites;
DROP POLICY IF EXISTS websites_insert ON websites;
DROP POLICY IF EXISTS websites_update ON websites;
DROP POLICY IF EXISTS websites_delete ON websites;

-- Enable RLS
ALTER TABLE websites ENABLE ROW LEVEL SECURITY;

-- Allow vendors to select their clients' websites
CREATE POLICY websites_select ON websites
  FOR SELECT
  USING (
    -- Vendor can see websites for their clients
    client_id IN (
      SELECT id FROM clients
      WHERE vendor_user_id = auth.uid()
    )
    OR
    -- Client users can see their own websites
    client_id IN (
      SELECT client_id FROM client_profiles
      WHERE user_id = auth.uid()
    )
  );

-- Allow vendors to insert websites for their clients
CREATE POLICY websites_insert ON websites
  FOR INSERT
  WITH CHECK (
    client_id IN (
      SELECT id FROM clients
      WHERE vendor_user_id = auth.uid()
    )
  );

-- Allow vendors to update their clients' websites
CREATE POLICY websites_update ON websites
  FOR UPDATE
  USING (
    client_id IN (
      SELECT id FROM clients
      WHERE vendor_user_id = auth.uid()
    )
  )
  WITH CHECK (
    client_id IN (
      SELECT id FROM clients
      WHERE vendor_user_id = auth.uid()
    )
  );

-- Allow vendors to delete their clients' websites
CREATE POLICY websites_delete ON websites
  FOR DELETE
  USING (
    client_id IN (
      SELECT id FROM clients
      WHERE vendor_user_id = auth.uid()
    )
  );

-- Add comment for documentation
COMMENT ON COLUMN websites.client_id IS 'Links website to client - required per PRD data model. Cascades on client deletion.';
