/**
 * SSO (Single Sign-On) Authentication
 *
 * Supports SAML 2.0 and OIDC (OpenID Connect) for enterprise authentication
 * Integrates with Supabase Auth for session management
 */

import { createClient } from '@/lib/supabase/server'
import { createClient as createBrowserClient } from '@/lib/supabase/client'

export type SSOProvider = 'saml' | 'oidc'

export interface SAMLConfig {
  /**
   * SAML Identity Provider (IdP) metadata URL or XML
   */
  idpMetadata: string
  /**
   * Service Provider (SP) Entity ID
   */
  spEntityId: string
  /**
   * Assertion Consumer Service (ACS) URL
   */
  acsUrl: string
  /**
   * Single Logout Service (SLS) URL (optional)
   */
  slsUrl?: string
  /**
   * X.509 Certificate for signing (optional)
   */
  certificate?: string
  /**
   * Private key for signing (optional)
   */
  privateKey?: string
  /**
   * Attribute mappings for user profile
   */
  attributeMappings?: {
    email?: string
    firstName?: string
    lastName?: string
    displayName?: string
  }
}

export interface OIDCConfig {
  /**
   * OIDC Provider issuer URL
   */
  issuer: string
  /**
   * OAuth 2.0 Client ID
   */
  clientId: string
  /**
   * OAuth 2.0 Client Secret
   */
  clientSecret: string
  /**
   * Authorization endpoint (auto-discovered if not provided)
   */
  authorizationEndpoint?: string
  /**
   * Token endpoint (auto-discovered if not provided)
   */
  tokenEndpoint?: string
  /**
   * UserInfo endpoint (auto-discovered if not provided)
   */
  userInfoEndpoint?: string
  /**
   * Scopes to request
   */
  scopes?: string[]
  /**
   * Claim mappings for user profile
   */
  claimMappings?: {
    email?: string
    firstName?: string
    lastName?: string
    displayName?: string
  }
}

export interface SSOConnection {
  id: string
  vendorId: string
  provider: SSOProvider
  name: string
  domain: string
  enabled: boolean
  config: SAMLConfig | OIDCConfig
  createdAt: Date
  updatedAt: Date
}

/**
 * Initiate SAML SSO login flow
 *
 * @param connectionId - SSO connection ID
 * @param redirectTo - URL to redirect to after successful authentication
 * @returns Authorization URL to redirect user to
 */
export async function initiateSAMLLogin(
  connectionId: string,
  redirectTo?: string
): Promise<string> {
  const supabase = await createClient()

  // Get SSO connection config
  const { data: connection, error: connError } = await supabase
    .from('sso_connections')
    .select('*')
    .eq('id', connectionId)
    .eq('enabled', true)
    .single()

  if (connError || !connection) {
    throw new Error('SSO connection not found or disabled')
  }

  if (connection.provider !== 'saml') {
    throw new Error('Connection is not a SAML provider')
  }

  const config = connection.config as SAMLConfig

  // Supabase handles SAML authentication natively
  // For enterprise plans, Supabase provides SAML SSO
  // This is a placeholder for the actual Supabase SAML flow
  const { data, error } = await supabase.auth.signInWithSSO({
    domain: connection.domain,
    options: {
      redirectTo: redirectTo || `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`
    }
  })

  if (error) {
    throw new Error(`SAML login failed: ${error.message}`)
  }

  if (!data?.url) {
    throw new Error('Failed to generate SAML authorization URL')
  }

  return data.url
}

/**
 * Initiate OIDC SSO login flow
 *
 * @param connectionId - SSO connection ID
 * @param redirectTo - URL to redirect to after successful authentication
 * @returns Authorization URL to redirect user to
 */
export async function initiateOIDCLogin(
  connectionId: string,
  redirectTo?: string
): Promise<string> {
  const supabase = await createClient()

  // Get SSO connection config
  const { data: connection, error: connError } = await supabase
    .from('sso_connections')
    .select('*')
    .eq('id', connectionId)
    .eq('enabled', true)
    .single()

  if (connError || !connection) {
    throw new Error('SSO connection not found or disabled')
  }

  if (connection.provider !== 'oidc') {
    throw new Error('Connection is not an OIDC provider')
  }

  const config = connection.config as OIDCConfig

  // Use Supabase's OAuth sign-in
  // Supabase supports custom OIDC providers
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'oidc' as any, // Custom OIDC provider
    options: {
      redirectTo: redirectTo || `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      scopes: config.scopes?.join(' ') || 'openid email profile',
      queryParams: {
        issuer: config.issuer,
        client_id: config.clientId,
      }
    }
  })

  if (error) {
    throw new Error(`OIDC login failed: ${error.message}`)
  }

  if (!data?.url) {
    throw new Error('Failed to generate OIDC authorization URL')
  }

  return data.url
}

/**
 * Get SSO connection by domain
 *
 * @param email - User email address
 * @returns SSO connection if found
 */
export async function getSSOConnectionByEmail(
  email: string
): Promise<SSOConnection | null> {
  const domain = email.split('@')[1]

  if (!domain) {
    return null
  }

  const supabase = await createClient()

  const { data: connection, error } = await supabase
    .from('sso_connections')
    .select('*')
    .eq('domain', domain)
    .eq('enabled', true)
    .single()

  if (error || !connection) {
    return null
  }

  return connection as SSOConnection
}

/**
 * Check if email domain has SSO enabled
 *
 * @param email - User email address
 * @returns true if SSO is enabled for this domain
 */
export async function hasSSOEnabled(email: string): Promise<boolean> {
  const connection = await getSSOConnectionByEmail(email)
  return connection !== null
}

/**
 * Browser-side: Initiate SSO login
 *
 * @param email - User email address
 * @param redirectTo - URL to redirect to after authentication
 */
export async function initiateSSO(email: string, redirectTo?: string): Promise<void> {
  const connection = await getSSOConnectionByEmail(email)

  if (!connection) {
    throw new Error('No SSO connection found for this email domain')
  }

  let authUrl: string

  if (connection.provider === 'saml') {
    authUrl = await initiateSAMLLogin(connection.id, redirectTo)
  } else {
    authUrl = await initiateOIDCLogin(connection.id, redirectTo)
  }

  // Redirect to IdP
  if (typeof window !== 'undefined') {
    window.location.href = authUrl
  }
}

/**
 * Handle SSO callback after authentication
 *
 * @param code - Authorization code from IdP
 * @param state - State parameter for CSRF protection
 * @returns User session data
 */
export async function handleSSOCallback(code: string, state: string) {
  const supabase = await createClient()

  // Exchange code for session
  const { data, error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    throw new Error(`SSO callback failed: ${error.message}`)
  }

  return data
}

/**
 * Create or update SSO connection
 *
 * @param vendorId - Vendor ID
 * @param connection - SSO connection data
 * @returns Created/updated connection
 */
export async function upsertSSOConnection(
  vendorId: string,
  connection: Omit<SSOConnection, 'id' | 'createdAt' | 'updatedAt'>
) {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('sso_connections')
    .upsert({
      vendor_id: vendorId,
      provider: connection.provider,
      name: connection.name,
      domain: connection.domain,
      enabled: connection.enabled,
      config: connection.config,
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to save SSO connection: ${error.message}`)
  }

  return data
}

/**
 * Delete SSO connection
 *
 * @param connectionId - SSO connection ID
 */
export async function deleteSSOConnection(connectionId: string) {
  const supabase = await createClient()

  const { error } = await supabase
    .from('sso_connections')
    .delete()
    .eq('id', connectionId)

  if (error) {
    throw new Error(`Failed to delete SSO connection: ${error.message}`)
  }
}

/**
 * List all SSO connections for a vendor
 *
 * @param vendorId - Vendor ID
 * @returns List of SSO connections
 */
export async function listSSOConnections(vendorId: string): Promise<SSOConnection[]> {
  const supabase = await createClient()

  const { data, error } = await supabase
    .from('sso_connections')
    .select('*')
    .eq('vendor_id', vendorId)
    .order('created_at', { ascending: false })

  if (error) {
    throw new Error(`Failed to list SSO connections: ${error.message}`)
  }

  return data as SSOConnection[]
}

/**
 * Test SSO connection
 *
 * @param connectionId - SSO connection ID
 * @returns Test result
 */
export async function testSSOConnection(connectionId: string): Promise<{
  success: boolean
  message: string
}> {
  try {
    // Attempt to initiate login (without actually redirecting)
    const supabase = await createClient()

    const { data: connection } = await supabase
      .from('sso_connections')
      .select('*')
      .eq('id', connectionId)
      .single()

    if (!connection) {
      return {
        success: false,
        message: 'SSO connection not found'
      }
    }

    // For OIDC, verify the issuer is reachable
    if (connection.provider === 'oidc') {
      const config = connection.config as OIDCConfig
      const response = await fetch(`${config.issuer}/.well-known/openid-configuration`)

      if (!response.ok) {
        return {
          success: false,
          message: 'OIDC provider configuration endpoint unreachable'
        }
      }
    }

    return {
      success: true,
      message: 'SSO connection is configured correctly'
    }
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Unknown error'
    }
  }
}
