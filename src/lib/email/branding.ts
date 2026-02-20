/**
 * Email Branding System
 * Allows vendors to customize email templates with their brand colors, logos, etc.
 */

import { createClient } from '@/lib/supabase/server';

export interface EmailBranding {
  // Colors
  primaryColor?: string;
  secondaryColor?: string;
  accentColor?: string;
  textColor?: string;
  backgroundColor?: string;

  // Logo
  logoUrl?: string;
  logoWidth?: number;
  logoHeight?: number;

  // Company info
  companyName?: string;
  supportEmail?: string;
  websiteUrl?: string;

  // Footer
  footerText?: string;
  socialLinks?: {
    twitter?: string;
    facebook?: string;
    linkedin?: string;
    instagram?: string;
  };
}

export const DEFAULT_BRANDING: EmailBranding = {
  primaryColor: '#667eea',
  secondaryColor: '#764ba2',
  accentColor: '#10b981',
  textColor: '#333333',
  backgroundColor: '#f9fafb',
  companyName: 'BlogCanvas',
  supportEmail: 'support@blogcanvas.io',
  websiteUrl: process.env.NEXT_PUBLIC_APP_URL || 'https://blogcanvas.io',
  footerText: 'Powered by BlogCanvas - The all-in-one platform for blogger-vendor relationships',
};

/**
 * Get vendor branding settings
 */
export async function getVendorBranding(vendorId: string): Promise<EmailBranding> {
  try {
    const supabase = await createClient();

    const { data: vendor, error } = await supabase
      .from('vendors')
      .select('name, email, logo_url, brand_color, website_url')
      .eq('id', vendorId)
      .single();

    if (error || !vendor) {
      console.error('Failed to get vendor branding:', error);
      return DEFAULT_BRANDING;
    }

    // Merge vendor settings with defaults
    return {
      ...DEFAULT_BRANDING,
      companyName: vendor.name || DEFAULT_BRANDING.companyName,
      supportEmail: vendor.email || DEFAULT_BRANDING.supportEmail,
      logoUrl: vendor.logo_url || undefined,
      primaryColor: vendor.brand_color || DEFAULT_BRANDING.primaryColor,
      websiteUrl: vendor.website_url || DEFAULT_BRANDING.websiteUrl,
    };
  } catch (error) {
    console.error('Error getting vendor branding:', error);
    return DEFAULT_BRANDING;
  }
}

/**
 * Generate email header with branding
 */
export function generateEmailHeader(branding: EmailBranding, title: string): string {
  const logoHtml = branding.logoUrl
    ? `<img src="${branding.logoUrl}" alt="${branding.companyName}" style="max-width: ${branding.logoWidth || 150}px; max-height: ${branding.logoHeight || 60}px; margin-bottom: 20px;" />`
    : '';

  return `
    <div style="background: linear-gradient(135deg, ${branding.primaryColor} 0%, ${branding.secondaryColor} 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0;">
      ${logoHtml}
      <h1 style="color: white; margin: 0; font-size: 28px;">${title}</h1>
    </div>
  `;
}

/**
 * Generate email footer with branding
 */
export function generateEmailFooter(branding: EmailBranding): string {
  const socialLinksHtml = branding.socialLinks
    ? Object.entries(branding.socialLinks)
        .filter(([, url]) => url)
        .map(([platform, url]) => {
          return `<a href="${url}" style="color: ${branding.primaryColor}; margin: 0 10px; text-decoration: none;">${platform.charAt(0).toUpperCase() + platform.slice(1)}</a>`;
        })
        .join(' | ')
    : '';

  return `
    <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center;">
      ${
        socialLinksHtml
          ? `<p style="font-size: 14px; color: #6b7280; margin-bottom: 15px;">${socialLinksHtml}</p>`
          : ''
      }
      <p style="font-size: 14px; color: #6b7280; margin: 10px 0;">
        ${branding.footerText || ''}
      </p>
      <p style="font-size: 12px; color: #9ca3af; margin: 10px 0;">
        <a href="${branding.websiteUrl}" style="color: ${branding.primaryColor}; text-decoration: none; font-weight: bold;">${branding.companyName}</a>
      </p>
      <p style="font-size: 12px; color: #9ca3af; margin: 10px 0;">
        If you have questions, contact us at <a href="mailto:${branding.supportEmail}" style="color: ${branding.primaryColor};">${branding.supportEmail}</a>
      </p>
    </div>
  `;
}

/**
 * Generate a button with branding
 */
export function generateButton(
  branding: EmailBranding,
  text: string,
  url: string,
  variant: 'primary' | 'secondary' = 'primary'
): string {
  const bgColor = variant === 'primary' ? branding.primaryColor : branding.secondaryColor;

  return `
    <div style="text-align: center; margin: 30px 0;">
      <a href="${url}" style="display: inline-block; background: ${bgColor}; color: white; padding: 15px 40px; text-decoration: none; border-radius: 8px; font-weight: bold; font-size: 16px;">
        ${text}
      </a>
    </div>
  `;
}

/**
 * Generate an info box with branding
 */
export function generateInfoBox(
  branding: EmailBranding,
  title: string,
  content: string,
  variant: 'info' | 'success' | 'warning' = 'info'
): string {
  let borderColor = branding.primaryColor;
  let backgroundColor = '#dbeafe';
  let textColor = '#1e40af';

  if (variant === 'success') {
    borderColor = branding.accentColor || '#10b981';
    backgroundColor = '#d1fae5';
    textColor = '#065f46';
  } else if (variant === 'warning') {
    borderColor = '#f59e0b';
    backgroundColor = '#fef3c7';
    textColor = '#92400e';
  }

  return `
    <div style="background: ${backgroundColor}; padding: 20px; border-radius: 8px; border-left: 4px solid ${borderColor}; margin: 20px 0;">
      ${title ? `<h3 style="margin-top: 0; color: ${textColor}; font-size: 18px;">${title}</h3>` : ''}
      <p style="margin: ${title ? '10px 0 0 0' : '0'}; color: ${textColor};">
        ${content}
      </p>
    </div>
  `;
}

/**
 * Wrap email content with standard structure and branding
 */
export function wrapEmailContent(
  branding: EmailBranding,
  headerTitle: string,
  content: string
): string {
  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${headerTitle}</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: ${branding.textColor}; max-width: 600px; margin: 0 auto; padding: 20px;">
  ${generateEmailHeader(branding, headerTitle)}

  <div style="background: ${branding.backgroundColor}; padding: 30px; border-radius: 0 0 10px 10px;">
    ${content}
    ${generateEmailFooter(branding)}
  </div>
</body>
</html>
  `.trim();
}
