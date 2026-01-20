/**
 * SSO Type Definitions
 */

export type SSOProvider = 'saml' | 'oidc'

export interface SAMLConfig {
  idpMetadata: string
  spEntityId: string
  acsUrl: string
  slsUrl?: string
  certificate?: string
  privateKey?: string
  attributeMappings?: {
    email?: string
    firstName?: string
    lastName?: string
    displayName?: string
  }
}

export interface OIDCConfig {
  issuer: string
  clientId: string
  clientSecret: string
  authorizationEndpoint?: string
  tokenEndpoint?: string
  userInfoEndpoint?: string
  scopes?: string[]
  claimMappings?: {
    email?: string
    firstName?: string
    lastName?: string
    displayName?: string
  }
}

export interface SSOConnection {
  id: string
  vendor_id: string
  provider: SSOProvider
  name: string
  domain: string
  enabled: boolean
  config: SAMLConfig | OIDCConfig
  created_at: string
  updated_at: string
}

export interface SSOTestResult {
  success: boolean
  message: string
}

export interface SSOLoginResponse {
  authUrl: string
  provider: SSOProvider
  name: string
}

export interface SSOAvailability {
  available: boolean
  provider?: SSOProvider
  name?: string
  domain?: string
  message?: string
}
