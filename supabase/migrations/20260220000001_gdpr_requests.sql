-- Create gdpr_requests table for tracking data export and deletion requests
-- feat-045: Data export/deletion/consent

CREATE TABLE IF NOT EXISTS public.gdpr_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    request_type TEXT NOT NULL CHECK (request_type IN ('data_export', 'data_deletion', 'consent_withdrawal')),
    status TEXT NOT NULL CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    completed_at TIMESTAMPTZ,
    error_message TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_gdpr_requests_user_id ON public.gdpr_requests(user_id);
CREATE INDEX idx_gdpr_requests_status ON public.gdpr_requests(status);
CREATE INDEX idx_gdpr_requests_type ON public.gdpr_requests(request_type);

-- Enable RLS
ALTER TABLE public.gdpr_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own GDPR requests"
    ON public.gdpr_requests
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own GDPR requests"
    ON public.gdpr_requests
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Create user_consents table for tracking consent preferences
CREATE TABLE IF NOT EXISTS public.user_consents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    consent_type TEXT NOT NULL CHECK (consent_type IN ('marketing', 'analytics', 'cookies', 'data_processing')),
    consent_given BOOLEAN NOT NULL DEFAULT false,
    consent_date TIMESTAMPTZ NOT NULL DEFAULT now(),
    ip_address TEXT,
    user_agent TEXT,
    revoked_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(user_id, consent_type)
);

-- Create indexes
CREATE INDEX idx_user_consents_user_id ON public.user_consents(user_id);
CREATE INDEX idx_user_consents_type ON public.user_consents(consent_type);

-- Enable RLS
ALTER TABLE public.user_consents ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own consents"
    ON public.user_consents
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own consents"
    ON public.user_consents
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Comments
COMMENT ON TABLE public.gdpr_requests IS 'Tracks GDPR data export and deletion requests';
COMMENT ON TABLE public.user_consents IS 'Tracks user consent preferences for GDPR compliance';
