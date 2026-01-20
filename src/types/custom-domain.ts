// WL-001: Custom Domain Types

export type VerificationStatus = 'pending' | 'verifying' | 'verified' | 'failed';
export type VerificationMethod = 'txt' | 'cname' | 'meta';
export type SSLStatus = 'pending' | 'provisioning' | 'active' | 'failed' | 'expired';
export type SSLProvider = 'lets_encrypt' | 'cloudflare' | 'custom';

export interface CustomDomain {
  id: string;
  vendor_id: string;

  // Domain information
  domain: string;
  subdomain?: string;

  // Verification
  verification_status: VerificationStatus;
  verification_token: string;
  verification_method: VerificationMethod;
  verified_at?: string;

  // DNS records
  txt_name?: string;
  txt_value?: string;
  cname_name?: string;
  cname_value?: string;

  // SSL/TLS
  ssl_status: SSLStatus;
  ssl_provider: SSLProvider;
  ssl_issued_at?: string;
  ssl_expires_at?: string;

  // Cloudflare integration
  cloudflare_zone_id?: string;
  cloudflare_custom_hostname_id?: string;

  // Branding
  logo_url?: string;
  favicon_url?: string;
  primary_color?: string;
  secondary_color?: string;
  font_family?: string;
  custom_css?: string;

  // Status
  is_active: boolean;
  is_primary: boolean;

  // Metadata
  created_at: string;
  updated_at: string;
}

export interface DomainVerificationLog {
  id: string;
  custom_domain_id: string;
  action: string;
  status: string;
  details?: Record<string, any>;
  error_message?: string;
  created_at: string;
}

export interface CreateCustomDomainInput {
  domain: string;
  subdomain?: string;
  verification_method?: VerificationMethod;
}

export interface UpdateCustomDomainInput {
  logo_url?: string;
  favicon_url?: string;
  primary_color?: string;
  secondary_color?: string;
  font_family?: string;
  custom_css?: string;
  is_active?: boolean;
  is_primary?: boolean;
}

export interface DomainVerificationResult {
  success: boolean;
  verified: boolean;
  message: string;
  details?: {
    method: VerificationMethod;
    record_name?: string;
    record_value?: string;
    dns_found?: boolean;
    meta_found?: boolean;
  };
}

export interface SSLProvisionResult {
  success: boolean;
  ssl_status: SSLStatus;
  message: string;
  ssl_issued_at?: string;
  ssl_expires_at?: string;
  error?: string;
}

// DNS record helpers
export interface DNSRecord {
  type: 'TXT' | 'CNAME' | 'A';
  name: string;
  value: string;
  required: boolean;
  status?: 'pending' | 'found' | 'missing';
}

export interface DomainSetupInstructions {
  domain: string;
  verification_token: string;
  dns_records: DNSRecord[];
  steps: string[];
  estimated_time: string;
}
