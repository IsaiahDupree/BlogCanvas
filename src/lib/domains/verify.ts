// WL-002: Domain Verification
// DNS verification for custom domains

import dns from 'dns';
import { promisify } from 'util';
import type {
  CustomDomain,
  DomainVerificationResult,
  VerificationMethod,
  DNSRecord,
  DomainSetupInstructions,
} from '@/types/custom-domain';
import {
  updateVerificationStatus,
  logDomainVerification,
} from '@/lib/db/custom-domains';

const resolveTxt = promisify(dns.resolveTxt);
const resolveCname = promisify(dns.resolveCname);

/**
 * Verify domain ownership via DNS TXT record
 */
export async function verifyDomainTXT(domain: CustomDomain): Promise<DomainVerificationResult> {
  try {
    // Update status to verifying
    await updateVerificationStatus(domain.id, 'verifying');
    await logDomainVerification(domain.id, 'verification_attempt', 'verifying', {
      method: 'txt',
      txt_name: domain.txt_name,
    });

    // Query TXT records
    const txtRecords = await resolveTxt(domain.txt_name || domain.domain);

    // Flatten TXT records (they come as arrays of strings)
    const flatRecords = txtRecords.map((record) => record.join(''));

    // Check if our verification token exists
    const found = flatRecords.includes(domain.verification_token);

    if (found) {
      // Mark as verified
      await updateVerificationStatus(domain.id, 'verified', new Date());
      await logDomainVerification(domain.id, 'verification_success', 'verified', {
        method: 'txt',
        txt_name: domain.txt_name,
        records_found: flatRecords.length,
      });

      return {
        success: true,
        verified: true,
        message: 'Domain verified successfully via TXT record',
        details: {
          method: 'txt',
          record_name: domain.txt_name,
          record_value: domain.verification_token,
          dns_found: true,
        },
      };
    } else {
      await updateVerificationStatus(domain.id, 'failed');
      await logDomainVerification(
        domain.id,
        'verification_failed',
        'failed',
        {
          method: 'txt',
          txt_name: domain.txt_name,
          records_found: flatRecords,
          expected: domain.verification_token,
        },
        'TXT record not found or does not match'
      );

      return {
        success: false,
        verified: false,
        message: 'TXT record not found or does not match expected value',
        details: {
          method: 'txt',
          record_name: domain.txt_name,
          record_value: domain.verification_token,
          dns_found: false,
        },
      };
    }
  } catch (error: any) {
    console.error('Error verifying TXT record:', error);

    await updateVerificationStatus(domain.id, 'failed');
    await logDomainVerification(
      domain.id,
      'verification_error',
      'failed',
      { method: 'txt', error: error.message },
      error.message
    );

    return {
      success: false,
      verified: false,
      message: `DNS verification failed: ${error.message}`,
      details: {
        method: 'txt',
        record_name: domain.txt_name,
        record_value: domain.verification_token,
        dns_found: false,
      },
    };
  }
}

/**
 * Verify domain ownership via CNAME record
 */
export async function verifyDomainCNAME(domain: CustomDomain): Promise<DomainVerificationResult> {
  try {
    await updateVerificationStatus(domain.id, 'verifying');
    await logDomainVerification(domain.id, 'verification_attempt', 'verifying', {
      method: 'cname',
      cname_name: domain.cname_name,
    });

    // Build CNAME hostname
    const cnameHost = domain.subdomain
      ? `${domain.subdomain}.${domain.domain}`
      : `www.${domain.domain}`;

    // Query CNAME records
    const cnameRecords = await resolveCname(cnameHost);

    // Check if points to our CNAME target
    const found = cnameRecords.some((record) =>
      record.toLowerCase() === (domain.cname_value || '').toLowerCase()
    );

    if (found) {
      await updateVerificationStatus(domain.id, 'verified', new Date());
      await logDomainVerification(domain.id, 'verification_success', 'verified', {
        method: 'cname',
        cname_name: cnameHost,
        records_found: cnameRecords,
      });

      return {
        success: true,
        verified: true,
        message: 'Domain verified successfully via CNAME record',
        details: {
          method: 'cname',
          record_name: cnameHost,
          record_value: domain.cname_value,
          dns_found: true,
        },
      };
    } else {
      await updateVerificationStatus(domain.id, 'failed');
      await logDomainVerification(
        domain.id,
        'verification_failed',
        'failed',
        {
          method: 'cname',
          cname_name: cnameHost,
          records_found: cnameRecords,
          expected: domain.cname_value,
        },
        'CNAME record not found or does not match'
      );

      return {
        success: false,
        verified: false,
        message: 'CNAME record not found or does not match expected value',
        details: {
          method: 'cname',
          record_name: cnameHost,
          record_value: domain.cname_value,
          dns_found: false,
        },
      };
    }
  } catch (error: any) {
    console.error('Error verifying CNAME record:', error);

    await updateVerificationStatus(domain.id, 'failed');
    await logDomainVerification(
      domain.id,
      'verification_error',
      'failed',
      { method: 'cname', error: error.message },
      error.message
    );

    return {
      success: false,
      verified: false,
      message: `CNAME verification failed: ${error.message}`,
      details: {
        method: 'cname',
        record_name: domain.cname_name,
        record_value: domain.cname_value,
        dns_found: false,
      },
    };
  }
}

/**
 * Verify domain using the configured verification method
 */
export async function verifyDomain(domain: CustomDomain): Promise<DomainVerificationResult> {
  switch (domain.verification_method) {
    case 'txt':
      return verifyDomainTXT(domain);
    case 'cname':
      return verifyDomainCNAME(domain);
    case 'meta':
      // Meta tag verification would require fetching the HTML
      // This is more complex and less reliable, so we'll skip for now
      return {
        success: false,
        verified: false,
        message: 'Meta tag verification not yet implemented',
        details: {
          method: 'meta',
        },
      };
    default:
      return {
        success: false,
        verified: false,
        message: 'Invalid verification method',
        details: {
          method: domain.verification_method,
        },
      };
  }
}

/**
 * Generate setup instructions for domain verification
 */
export function generateSetupInstructions(domain: CustomDomain): DomainSetupInstructions {
  const dnsRecords: DNSRecord[] = [];

  // Add TXT record for verification
  if (domain.txt_name && domain.txt_value) {
    dnsRecords.push({
      type: 'TXT',
      name: domain.txt_name,
      value: domain.txt_value,
      required: domain.verification_method === 'txt',
      status: 'pending',
    });
  }

  // Add CNAME record for routing
  if (domain.cname_name && domain.cname_value) {
    const cnameHost = domain.subdomain
      ? `${domain.subdomain}.${domain.domain}`
      : `www.${domain.domain}`;

    dnsRecords.push({
      type: 'CNAME',
      name: cnameHost,
      value: domain.cname_value,
      required: domain.verification_method === 'cname',
      status: 'pending',
    });
  }

  // Add A record pointing to BlogCanvas (if needed)
  dnsRecords.push({
    type: 'A',
    name: domain.domain,
    value: '76.76.21.21', // TODO: Replace with actual IP
    required: false,
    status: 'pending',
  });

  const steps: string[] = [];

  if (domain.verification_method === 'txt') {
    steps.push('1. Log in to your domain registrar or DNS provider');
    steps.push('2. Navigate to DNS settings for your domain');
    steps.push(`3. Add a new TXT record:`);
    steps.push(`   - Name/Host: ${domain.txt_name}`);
    steps.push(`   - Value: ${domain.txt_value}`);
    steps.push('4. Save the DNS record');
    steps.push('5. Wait 5-15 minutes for DNS propagation');
    steps.push('6. Return here and click "Verify Domain"');
  } else if (domain.verification_method === 'cname') {
    const cnameHost = domain.subdomain
      ? `${domain.subdomain}.${domain.domain}`
      : `www.${domain.domain}`;

    steps.push('1. Log in to your domain registrar or DNS provider');
    steps.push('2. Navigate to DNS settings for your domain');
    steps.push(`3. Add a new CNAME record:`);
    steps.push(`   - Name/Host: ${cnameHost}`);
    steps.push(`   - Value: ${domain.cname_value}`);
    steps.push('4. Save the DNS record');
    steps.push('5. Wait 5-15 minutes for DNS propagation');
    steps.push('6. Return here and click "Verify Domain"');
  }

  return {
    domain: domain.domain,
    verification_token: domain.verification_token,
    dns_records: dnsRecords,
    steps,
    estimated_time: '15-30 minutes',
  };
}

/**
 * Check DNS records status (helper for UI)
 */
export async function checkDNSRecords(domain: CustomDomain): Promise<DNSRecord[]> {
  const records: DNSRecord[] = [];

  // Check TXT record
  if (domain.txt_name && domain.txt_value) {
    try {
      const txtRecords = await resolveTxt(domain.txt_name);
      const flatRecords = txtRecords.map((r) => r.join(''));
      const found = flatRecords.includes(domain.verification_token);

      records.push({
        type: 'TXT',
        name: domain.txt_name,
        value: domain.txt_value,
        required: domain.verification_method === 'txt',
        status: found ? 'found' : 'missing',
      });
    } catch {
      records.push({
        type: 'TXT',
        name: domain.txt_name,
        value: domain.txt_value,
        required: domain.verification_method === 'txt',
        status: 'missing',
      });
    }
  }

  // Check CNAME record
  if (domain.cname_name && domain.cname_value) {
    const cnameHost = domain.subdomain
      ? `${domain.subdomain}.${domain.domain}`
      : `www.${domain.domain}`;

    try {
      const cnameRecords = await resolveCname(cnameHost);
      const found = cnameRecords.some(
        (r) => r.toLowerCase() === (domain.cname_value || '').toLowerCase()
      );

      records.push({
        type: 'CNAME',
        name: cnameHost,
        value: domain.cname_value,
        required: domain.verification_method === 'cname',
        status: found ? 'found' : 'missing',
      });
    } catch {
      records.push({
        type: 'CNAME',
        name: cnameHost,
        value: domain.cname_value,
        required: domain.verification_method === 'cname',
        status: 'missing',
      });
    }
  }

  return records;
}
