-- Migration: SSO Connections
-- Description: Add support for SAML and OIDC SSO authentication
-- Feature: SEC-003

-- Create sso_connections table
CREATE TABLE IF NOT EXISTS public.sso_connections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendor_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    provider TEXT NOT NULL CHECK (provider IN ('saml', 'oidc')),
    name TEXT NOT NULL,
    domain TEXT NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT true,
    config JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    -- Ensure one connection per domain per vendor
    UNIQUE(vendor_id, domain)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_sso_connections_vendor_id ON public.sso_connections(vendor_id);
CREATE INDEX IF NOT EXISTS idx_sso_connections_domain ON public.sso_connections(domain);
CREATE INDEX IF NOT EXISTS idx_sso_connections_enabled ON public.sso_connections(enabled) WHERE enabled = true;

-- Add helpful comments
COMMENT ON TABLE public.sso_connections IS 'SSO (SAML/OIDC) connection configurations for vendors';
COMMENT ON COLUMN public.sso_connections.provider IS 'SSO provider type: saml or oidc';
COMMENT ON COLUMN public.sso_connections.domain IS 'Email domain that triggers SSO (e.g., company.com)';
COMMENT ON COLUMN public.sso_connections.config IS 'Provider-specific configuration (SAML metadata or OIDC endpoints)';

-- Enable RLS
ALTER TABLE public.sso_connections ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Vendors can manage their own SSO connections
CREATE POLICY "Vendors can view their own SSO connections"
    ON public.sso_connections
    FOR SELECT
    USING (vendor_id = auth.uid());

CREATE POLICY "Vendors can insert their own SSO connections"
    ON public.sso_connections
    FOR INSERT
    WITH CHECK (vendor_id = auth.uid());

CREATE POLICY "Vendors can update their own SSO connections"
    ON public.sso_connections
    FOR UPDATE
    USING (vendor_id = auth.uid());

CREATE POLICY "Vendors can delete their own SSO connections"
    ON public.sso_connections
    FOR DELETE
    USING (vendor_id = auth.uid());

-- Admins can manage all SSO connections
CREATE POLICY "Admins can manage all SSO connections"
    ON public.sso_connections
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.role IN ('admin', 'owner')
        )
    );

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_sso_connections_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_sso_connections_updated_at
    BEFORE UPDATE ON public.sso_connections
    FOR EACH ROW
    EXECUTE FUNCTION public.update_sso_connections_updated_at();
