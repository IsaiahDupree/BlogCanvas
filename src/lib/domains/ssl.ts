// WL-003: SSL Management
// Auto-provision SSL certificates for custom domains

import type { CustomDomain, SSLProvisionResult, SSLStatus } from '@/types/custom-domain';
import { updateSSLStatus, logDomainVerification } from '@/lib/db/custom-domains';

// Cloudflare for SaaS API configuration
const CLOUDFLARE_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
const CLOUDFLARE_ZONE_ID = process.env.CLOUDFLARE_ZONE_ID;
const CLOUDFLARE_API_BASE = 'https://api.cloudflare.com/client/v4';

/**
 * Provision SSL certificate via Cloudflare for SaaS
 * This requires a Cloudflare for SaaS plan
 */
export async function provisionSSLCloudflare(
  domain: CustomDomain
): Promise<SSLProvisionResult> {
  try {
    // Check if Cloudflare is configured
    if (!CLOUDFLARE_API_TOKEN || !CLOUDFLARE_ZONE_ID) {
      return {
        success: false,
        ssl_status: 'failed',
        message: 'Cloudflare API not configured',
        error: 'Missing CLOUDFLARE_API_TOKEN or CLOUDFLARE_ZONE_ID environment variables',
      };
    }

    // Update status to provisioning
    await updateSSLStatus(domain.id, 'provisioning');
    await logDomainVerification(domain.id, 'ssl_provisioning_started', 'provisioning', {
      provider: 'cloudflare',
      domain: domain.domain,
    });

    // Create custom hostname in Cloudflare
    const hostnameResponse = await fetch(
      `${CLOUDFLARE_API_BASE}/zones/${CLOUDFLARE_ZONE_ID}/custom_hostnames`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          hostname: domain.domain,
          ssl: {
            method: 'txt',
            type: 'dv',
            settings: {
              http2: 'on',
              min_tls_version: '1.2',
              tls_1_3: 'on',
            },
          },
        }),
      }
    );

    if (!hostnameResponse.ok) {
      const error = await hostnameResponse.json();
      throw new Error(`Cloudflare API error: ${JSON.stringify(error)}`);
    }

    const hostnameData = await hostnameResponse.json();
    const customHostname = hostnameData.result;

    // Save Cloudflare IDs
    const { createClient } = await import('@/lib/supabase');
    const supabase = createClient();

    await supabase
      .from('custom_domains')
      .update({
        cloudflare_zone_id: CLOUDFLARE_ZONE_ID,
        cloudflare_custom_hostname_id: customHostname.id,
      })
      .eq('id', domain.id);

    // Check SSL status
    const sslStatus = customHostname.ssl?.status;

    if (sslStatus === 'active') {
      // SSL is already active
      const issuedAt = new Date(customHostname.ssl.issued_on);
      const expiresAt = new Date(customHostname.ssl.expires_on);

      await updateSSLStatus(domain.id, 'active', issuedAt, expiresAt);
      await logDomainVerification(domain.id, 'ssl_provisioned', 'active', {
        provider: 'cloudflare',
        issued_at: issuedAt.toISOString(),
        expires_at: expiresAt.toISOString(),
      });

      return {
        success: true,
        ssl_status: 'active',
        message: 'SSL certificate provisioned successfully',
        ssl_issued_at: issuedAt.toISOString(),
        ssl_expires_at: expiresAt.toISOString(),
      };
    } else {
      // SSL is pending - will be provisioned by Cloudflare
      await logDomainVerification(domain.id, 'ssl_provisioning_pending', 'provisioning', {
        provider: 'cloudflare',
        ssl_status: sslStatus,
        message: 'SSL certificate is being provisioned by Cloudflare',
      });

      return {
        success: true,
        ssl_status: 'provisioning',
        message: 'SSL certificate is being provisioned. This may take a few minutes.',
      };
    }
  } catch (error: any) {
    console.error('Error provisioning SSL via Cloudflare:', error);

    await updateSSLStatus(domain.id, 'failed');
    await logDomainVerification(
      domain.id,
      'ssl_provisioning_failed',
      'failed',
      {
        provider: 'cloudflare',
        error: error.message,
      },
      error.message
    );

    return {
      success: false,
      ssl_status: 'failed',
      message: 'Failed to provision SSL certificate',
      error: error.message,
    };
  }
}

/**
 * Check SSL certificate status via Cloudflare
 */
export async function checkSSLStatusCloudflare(
  domain: CustomDomain
): Promise<SSLProvisionResult> {
  try {
    if (!CLOUDFLARE_API_TOKEN || !CLOUDFLARE_ZONE_ID) {
      return {
        success: false,
        ssl_status: 'failed',
        message: 'Cloudflare API not configured',
      };
    }

    if (!domain.cloudflare_custom_hostname_id) {
      return {
        success: false,
        ssl_status: 'pending',
        message: 'Custom hostname not yet created',
      };
    }

    // Get custom hostname details
    const response = await fetch(
      `${CLOUDFLARE_API_BASE}/zones/${CLOUDFLARE_ZONE_ID}/custom_hostnames/${domain.cloudflare_custom_hostname_id}`,
      {
        headers: {
          'Authorization': `Bearer ${CLOUDFLARE_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Cloudflare API error: ${JSON.stringify(error)}`);
    }

    const data = await response.json();
    const customHostname = data.result;
    const sslStatus = customHostname.ssl?.status;

    if (sslStatus === 'active') {
      const issuedAt = new Date(customHostname.ssl.issued_on);
      const expiresAt = new Date(customHostname.ssl.expires_on);

      // Update database if status changed
      if (domain.ssl_status !== 'active') {
        await updateSSLStatus(domain.id, 'active', issuedAt, expiresAt);
        await logDomainVerification(domain.id, 'ssl_active', 'active', {
          provider: 'cloudflare',
          issued_at: issuedAt.toISOString(),
          expires_at: expiresAt.toISOString(),
        });
      }

      return {
        success: true,
        ssl_status: 'active',
        message: 'SSL certificate is active',
        ssl_issued_at: issuedAt.toISOString(),
        ssl_expires_at: expiresAt.toISOString(),
      };
    } else if (sslStatus === 'pending_validation') {
      return {
        success: true,
        ssl_status: 'provisioning',
        message: 'SSL certificate is pending validation',
      };
    } else if (sslStatus === 'pending_issuance') {
      return {
        success: true,
        ssl_status: 'provisioning',
        message: 'SSL certificate is being issued',
      };
    } else {
      return {
        success: false,
        ssl_status: 'failed',
        message: `SSL status: ${sslStatus}`,
      };
    }
  } catch (error: any) {
    console.error('Error checking SSL status:', error);

    return {
      success: false,
      ssl_status: 'failed',
      message: 'Failed to check SSL status',
      error: error.message,
    };
  }
}

/**
 * Provision SSL certificate using Let's Encrypt
 * This is a simplified version - in production you'd use ACME protocol
 */
export async function provisionSSLLetsEncrypt(
  domain: CustomDomain
): Promise<SSLProvisionResult> {
  // Let's Encrypt provisioning would require:
  // 1. ACME client (e.g., acme-client npm package)
  // 2. HTTP-01 or DNS-01 challenge validation
  // 3. Certificate issuance and installation
  // 4. Auto-renewal setup

  // For MVP, we'll use Cloudflare for SaaS instead
  // This is a placeholder implementation

  return {
    success: false,
    ssl_status: 'failed',
    message: 'Let\'s Encrypt provisioning not yet implemented. Please use Cloudflare for SaaS.',
  };
}

/**
 * Main SSL provisioning function - chooses provider
 */
export async function provisionSSL(domain: CustomDomain): Promise<SSLProvisionResult> {
  // For MVP, we only support Cloudflare for SaaS
  // In the future, we can add support for:
  // - Let's Encrypt via ACME
  // - Custom SSL certificates
  // - Other SSL providers

  return provisionSSLCloudflare(domain);
}

/**
 * Check SSL certificate status
 */
export async function checkSSLStatus(domain: CustomDomain): Promise<SSLProvisionResult> {
  if (domain.ssl_provider === 'cloudflare') {
    return checkSSLStatusCloudflare(domain);
  } else if (domain.ssl_provider === 'lets_encrypt') {
    return provisionSSLLetsEncrypt(domain);
  } else {
    return {
      success: false,
      ssl_status: 'failed',
      message: 'Unknown SSL provider',
    };
  }
}

/**
 * Check if SSL certificate is expiring soon (within 30 days)
 */
export function isSSLExpiringSoon(domain: CustomDomain): boolean {
  if (!domain.ssl_expires_at) {
    return false;
  }

  const expiresAt = new Date(domain.ssl_expires_at);
  const thirtyDaysFromNow = new Date();
  thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

  return expiresAt <= thirtyDaysFromNow;
}

/**
 * Get SSL certificate details for display
 */
export function getSSLCertificateInfo(domain: CustomDomain) {
  if (!domain.ssl_issued_at || !domain.ssl_expires_at) {
    return null;
  }

  const issuedAt = new Date(domain.ssl_issued_at);
  const expiresAt = new Date(domain.ssl_expires_at);
  const now = new Date();
  const daysUntilExpiry = Math.floor(
    (expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  );

  return {
    issued_at: issuedAt.toISOString(),
    expires_at: expiresAt.toISOString(),
    days_until_expiry: daysUntilExpiry,
    is_expiring_soon: isSSLExpiringSoon(domain),
    provider: domain.ssl_provider,
  };
}
