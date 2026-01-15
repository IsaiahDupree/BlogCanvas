-- CSV Import Column Mapping Preferences
-- This table stores user preferences for CSV column mapping per client/user

CREATE TABLE IF NOT EXISTS csv_import_mappings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    client_id UUID NOT NULL REFERENCES clients(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,

    -- The name of this mapping preset (e.g., "Standard Format", "Agency Template")
    mapping_name TEXT NOT NULL DEFAULT 'Default',

    -- Column mappings stored as JSONB
    -- Format: { "topic": "Post Title", "target_keyword": "Keywords", ... }
    -- Maps our internal field names to CSV column names
    column_mapping JSONB NOT NULL DEFAULT '{}'::jsonb,

    -- Custom field definitions
    -- Format: [{ "name": "custom_field_1", "csvColumn": "My Custom Data", "type": "text" }]
    custom_fields JSONB DEFAULT '[]'::jsonb,

    -- Whether this is the default mapping for this client
    is_default BOOLEAN DEFAULT false,

    -- Track when mapping was last used
    last_used_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_csv_import_mappings_client ON csv_import_mappings(client_id);
CREATE INDEX IF NOT EXISTS idx_csv_import_mappings_user ON csv_import_mappings(user_id);
CREATE INDEX IF NOT EXISTS idx_csv_import_mappings_default ON csv_import_mappings(client_id, is_default);

-- RLS Policies
ALTER TABLE csv_import_mappings ENABLE ROW LEVEL SECURITY;

-- Users can view their own client's mappings
CREATE POLICY "Users can view own client mappings"
    ON csv_import_mappings
    FOR SELECT
    USING (
        client_id IN (
            SELECT id FROM clients WHERE id = (
                SELECT client_id FROM profiles WHERE id = auth.uid()
            )
        )
    );

-- Users can insert their own client's mappings
CREATE POLICY "Users can insert own client mappings"
    ON csv_import_mappings
    FOR INSERT
    WITH CHECK (
        client_id IN (
            SELECT id FROM clients WHERE id = (
                SELECT client_id FROM profiles WHERE id = auth.uid()
            )
        )
    );

-- Users can update their own client's mappings
CREATE POLICY "Users can update own client mappings"
    ON csv_import_mappings
    FOR UPDATE
    USING (
        client_id IN (
            SELECT id FROM clients WHERE id = (
                SELECT client_id FROM profiles WHERE id = auth.uid()
            )
        )
    );

-- Users can delete their own client's mappings
CREATE POLICY "Users can delete own client mappings"
    ON csv_import_mappings
    FOR DELETE
    USING (
        client_id IN (
            SELECT id FROM clients WHERE id = (
                SELECT client_id FROM profiles WHERE id = auth.uid()
            )
        )
    );

-- Function to ensure only one default mapping per client
CREATE OR REPLACE FUNCTION ensure_single_default_mapping()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.is_default = true THEN
        UPDATE csv_import_mappings
        SET is_default = false
        WHERE client_id = NEW.client_id
        AND id != NEW.id
        AND is_default = true;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to enforce single default
DROP TRIGGER IF EXISTS trigger_ensure_single_default_mapping ON csv_import_mappings;
CREATE TRIGGER trigger_ensure_single_default_mapping
    BEFORE INSERT OR UPDATE ON csv_import_mappings
    FOR EACH ROW
    WHEN (NEW.is_default = true)
    EXECUTE FUNCTION ensure_single_default_mapping();

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_csv_import_mappings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_csv_import_mappings_updated_at ON csv_import_mappings;
CREATE TRIGGER trigger_update_csv_import_mappings_updated_at
    BEFORE UPDATE ON csv_import_mappings
    FOR EACH ROW
    EXECUTE FUNCTION update_csv_import_mappings_updated_at();
