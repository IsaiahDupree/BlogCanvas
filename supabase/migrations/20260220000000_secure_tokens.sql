-- Create secure_tokens table for encrypted token storage
-- feat-038: Secure token storage/rotation

CREATE TABLE IF NOT EXISTS public.secure_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    token_type TEXT NOT NULL CHECK (token_type IN ('api_key', 'refresh_token', 'access_token', 'oauth_token')),
    encrypted_token TEXT NOT NULL,
    expires_at TIMESTAMPTZ,
    last_rotated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    rotation_count INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create indexes for faster queries
CREATE INDEX idx_secure_tokens_user_id ON public.secure_tokens(user_id);
CREATE INDEX idx_secure_tokens_token_type ON public.secure_tokens(token_type);
CREATE INDEX idx_secure_tokens_active ON public.secure_tokens(is_active) WHERE is_active = true;
CREATE INDEX idx_secure_tokens_expires_at ON public.secure_tokens(expires_at) WHERE expires_at IS NOT NULL;

-- Enable RLS
ALTER TABLE public.secure_tokens ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can only access their own tokens
CREATE POLICY "Users can view their own tokens"
    ON public.secure_tokens
    FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own tokens"
    ON public.secure_tokens
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own tokens"
    ON public.secure_tokens
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own tokens"
    ON public.secure_tokens
    FOR DELETE
    USING (auth.uid() = user_id);

-- Updated timestamp trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_secure_tokens_updated_at
    BEFORE UPDATE ON public.secure_tokens
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add comment to table
COMMENT ON TABLE public.secure_tokens IS 'Stores encrypted API tokens and OAuth tokens with rotation tracking';
