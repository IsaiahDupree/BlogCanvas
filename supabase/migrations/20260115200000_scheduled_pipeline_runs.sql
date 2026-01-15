-- Scheduled Pipeline Runs Table
-- Stores recurring schedule configuration for automated pipeline runs

CREATE TABLE IF NOT EXISTS scheduled_pipeline_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
    client_id UUID REFERENCES clients(id) ON DELETE CASCADE,

    -- Schedule configuration
    name TEXT NOT NULL,
    website_url TEXT NOT NULL,
    target_market TEXT,
    client_goals TEXT,
    ideal_customer_profile TEXT,

    -- Frequency settings
    frequency TEXT NOT NULL CHECK (frequency IN ('daily', 'weekly', 'biweekly', 'monthly')),
    day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday, 6=Saturday (for weekly/biweekly)
    day_of_month INTEGER CHECK (day_of_month >= 1 AND day_of_month <= 31), -- for monthly
    time_of_day TIME DEFAULT '09:00:00', -- When to run (in UTC)

    -- Schedule status
    is_active BOOLEAN DEFAULT true,
    last_run_at TIMESTAMPTZ,
    next_run_at TIMESTAMPTZ,
    last_job_id UUID REFERENCES pipeline_jobs(id) ON DELETE SET NULL,

    -- Stats
    total_runs INTEGER DEFAULT 0,
    successful_runs INTEGER DEFAULT 0,
    failed_runs INTEGER DEFAULT 0,

    -- Metadata
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_scheduled_pipeline_runs_vendor_id ON scheduled_pipeline_runs(vendor_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_pipeline_runs_client_id ON scheduled_pipeline_runs(client_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_pipeline_runs_is_active ON scheduled_pipeline_runs(is_active);
CREATE INDEX IF NOT EXISTS idx_scheduled_pipeline_runs_next_run_at ON scheduled_pipeline_runs(next_run_at) WHERE is_active = true;

-- Enable RLS
ALTER TABLE scheduled_pipeline_runs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Vendors can view their own scheduled pipeline runs"
    ON scheduled_pipeline_runs FOR SELECT
    TO authenticated
    USING (
        vendor_id IN (
            SELECT vendor_id FROM profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Vendors can create scheduled pipeline runs"
    ON scheduled_pipeline_runs FOR INSERT
    TO authenticated
    WITH CHECK (
        vendor_id IN (
            SELECT vendor_id FROM profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Vendors can update their own scheduled pipeline runs"
    ON scheduled_pipeline_runs FOR UPDATE
    TO authenticated
    USING (
        vendor_id IN (
            SELECT vendor_id FROM profiles WHERE id = auth.uid()
        )
    );

CREATE POLICY "Vendors can delete their own scheduled pipeline runs"
    ON scheduled_pipeline_runs FOR DELETE
    TO authenticated
    USING (
        vendor_id IN (
            SELECT vendor_id FROM profiles WHERE id = auth.uid()
        )
    );

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_scheduled_pipeline_runs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER scheduled_pipeline_runs_updated_at
    BEFORE UPDATE ON scheduled_pipeline_runs
    FOR EACH ROW
    EXECUTE FUNCTION update_scheduled_pipeline_runs_updated_at();

-- Function to calculate next run time based on frequency
CREATE OR REPLACE FUNCTION calculate_next_run_time(
    p_frequency TEXT,
    p_day_of_week INTEGER,
    p_day_of_month INTEGER,
    p_time_of_day TIME,
    p_from_timestamp TIMESTAMPTZ DEFAULT NOW()
)
RETURNS TIMESTAMPTZ AS $$
DECLARE
    next_run TIMESTAMPTZ;
    current_date DATE;
    current_time TIME;
    target_datetime TIMESTAMPTZ;
BEGIN
    current_date := p_from_timestamp::DATE;
    current_time := p_from_timestamp::TIME;

    IF p_frequency = 'daily' THEN
        -- Run every day at specified time
        target_datetime := (current_date + p_time_of_day::TIME)::TIMESTAMPTZ;
        IF target_datetime <= p_from_timestamp THEN
            target_datetime := ((current_date + INTERVAL '1 day') + p_time_of_day::TIME)::TIMESTAMPTZ;
        END IF;
        next_run := target_datetime;

    ELSIF p_frequency = 'weekly' THEN
        -- Run on specific day of week
        DECLARE
            days_until_target INTEGER;
            current_dow INTEGER;
        BEGIN
            current_dow := EXTRACT(DOW FROM current_date)::INTEGER;
            days_until_target := (p_day_of_week - current_dow + 7) % 7;

            IF days_until_target = 0 THEN
                -- It's the target day - check if time has passed
                target_datetime := (current_date + p_time_of_day::TIME)::TIMESTAMPTZ;
                IF target_datetime <= p_from_timestamp THEN
                    days_until_target := 7; -- Next week
                END IF;
            END IF;

            next_run := ((current_date + (days_until_target || ' days')::INTERVAL) + p_time_of_day::TIME)::TIMESTAMPTZ;
        END;

    ELSIF p_frequency = 'biweekly' THEN
        -- Run every 2 weeks on specific day
        DECLARE
            days_until_target INTEGER;
            current_dow INTEGER;
        BEGIN
            current_dow := EXTRACT(DOW FROM current_date)::INTEGER;
            days_until_target := (p_day_of_week - current_dow + 7) % 7;

            IF days_until_target = 0 THEN
                target_datetime := (current_date + p_time_of_day::TIME)::TIMESTAMPTZ;
                IF target_datetime <= p_from_timestamp THEN
                    days_until_target := 14;
                END IF;
            END IF;

            next_run := ((current_date + (days_until_target || ' days')::INTERVAL) + p_time_of_day::TIME)::TIMESTAMPTZ;
        END;

    ELSIF p_frequency = 'monthly' THEN
        -- Run on specific day of month
        DECLARE
            target_date DATE;
            current_month_target DATE;
            next_month_target DATE;
        BEGIN
            -- Try current month
            current_month_target := make_date(
                EXTRACT(YEAR FROM current_date)::INTEGER,
                EXTRACT(MONTH FROM current_date)::INTEGER,
                LEAST(p_day_of_month, EXTRACT(DAY FROM (DATE_TRUNC('month', current_date) + INTERVAL '1 month - 1 day'))::INTEGER)
            );

            target_datetime := (current_month_target + p_time_of_day::TIME)::TIMESTAMPTZ;

            IF target_datetime <= p_from_timestamp THEN
                -- Use next month
                next_month_target := make_date(
                    EXTRACT(YEAR FROM (current_date + INTERVAL '1 month'))::INTEGER,
                    EXTRACT(MONTH FROM (current_date + INTERVAL '1 month'))::INTEGER,
                    LEAST(p_day_of_month, EXTRACT(DAY FROM (DATE_TRUNC('month', current_date + INTERVAL '2 months') - INTERVAL '1 day'))::INTEGER)
                );
                next_run := (next_month_target + p_time_of_day::TIME)::TIMESTAMPTZ;
            ELSE
                next_run := target_datetime;
            END IF;
        END;
    ELSE
        -- Default to daily
        next_run := ((current_date + INTERVAL '1 day') + p_time_of_day::TIME)::TIMESTAMPTZ;
    END IF;

    RETURN next_run;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Function to automatically set next_run_at on insert/update
CREATE OR REPLACE FUNCTION auto_set_next_run_at()
RETURNS TRIGGER AS $$
BEGIN
    -- Only recalculate if frequency or schedule params changed (or on insert)
    IF TG_OP = 'INSERT' OR
       OLD.frequency IS DISTINCT FROM NEW.frequency OR
       OLD.day_of_week IS DISTINCT FROM NEW.day_of_week OR
       OLD.day_of_month IS DISTINCT FROM NEW.day_of_month OR
       OLD.time_of_day IS DISTINCT FROM NEW.time_of_day THEN

        NEW.next_run_at := calculate_next_run_time(
            NEW.frequency,
            NEW.day_of_week,
            NEW.day_of_month,
            NEW.time_of_day,
            COALESCE(NEW.last_run_at, NOW())
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER auto_set_next_run_at_trigger
    BEFORE INSERT OR UPDATE ON scheduled_pipeline_runs
    FOR EACH ROW
    EXECUTE FUNCTION auto_set_next_run_at();
