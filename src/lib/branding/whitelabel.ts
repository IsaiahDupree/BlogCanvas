// WL-004: White-Label Branding
// Remove BlogCanvas branding and apply custom vendor branding

import type { CustomDomain } from '@/types/custom-domain';
import { getCustomDomainByName } from '@/lib/db/custom-domains';

export interface BrandingConfig {
  // Logo and favicon
  logo_url?: string;
  favicon_url?: string;

  // Colors
  primary_color?: string;
  secondary_color?: string;

  // Typography
  font_family?: string;

  // Custom CSS
  custom_css?: string;

  // Show/hide BlogCanvas branding
  show_powered_by: boolean;

  // Custom domain
  custom_domain?: string;
}

/**
 * Get branding configuration for a domain
 */
export async function getBrandingForDomain(hostname: string): Promise<BrandingConfig | null> {
  // Check if this is a custom domain
  const customDomain = await getCustomDomainByName(hostname);

  if (!customDomain || !customDomain.is_active) {
    // Use default BlogCanvas branding
    return {
      show_powered_by: true,
    };
  }

  // Return custom branding
  return {
    logo_url: customDomain.logo_url,
    favicon_url: customDomain.favicon_url,
    primary_color: customDomain.primary_color,
    secondary_color: customDomain.secondary_color,
    font_family: customDomain.font_family,
    custom_css: customDomain.custom_css,
    show_powered_by: false, // Hide BlogCanvas branding on custom domains
    custom_domain: customDomain.domain,
  };
}

/**
 * Generate CSS variables from branding config
 */
export function generateBrandingCSS(branding: BrandingConfig): string {
  const cssVars: string[] = [];

  if (branding.primary_color) {
    cssVars.push(`--primary: ${branding.primary_color};`);
  }

  if (branding.secondary_color) {
    cssVars.push(`--secondary: ${branding.secondary_color};`);
  }

  if (branding.font_family) {
    cssVars.push(`--font-family: ${branding.font_family};`);
  }

  let css = '';

  if (cssVars.length > 0) {
    css += `:root {\n  ${cssVars.join('\n  ')}\n}\n\n`;
  }

  if (branding.custom_css) {
    css += branding.custom_css;
  }

  return css;
}

/**
 * Get default branding colors
 */
export function getDefaultBranding(): BrandingConfig {
  return {
    primary_color: '#2563eb', // Blue-600
    secondary_color: '#7c3aed', // Purple-600
    font_family: 'Inter, system-ui, sans-serif',
    show_powered_by: true,
  };
}

/**
 * Validate branding configuration
 */
export function validateBrandingConfig(config: Partial<BrandingConfig>): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  // Validate colors (hex format)
  if (config.primary_color && !/^#[0-9A-Fa-f]{6}$/.test(config.primary_color)) {
    errors.push('Primary color must be a valid hex color (e.g., #2563eb)');
  }

  if (config.secondary_color && !/^#[0-9A-Fa-f]{6}$/.test(config.secondary_color)) {
    errors.push('Secondary color must be a valid hex color (e.g., #7c3aed)');
  }

  // Validate URLs
  if (config.logo_url) {
    try {
      new URL(config.logo_url);
    } catch {
      errors.push('Logo URL must be a valid URL');
    }
  }

  if (config.favicon_url) {
    try {
      new URL(config.favicon_url);
    } catch {
      errors.push('Favicon URL must be a valid URL');
    }
  }

  // Validate font family
  if (config.font_family && config.font_family.length > 100) {
    errors.push('Font family name is too long (max 100 characters)');
  }

  // Validate custom CSS length
  if (config.custom_css && config.custom_css.length > 10000) {
    errors.push('Custom CSS is too long (max 10000 characters)');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Apply branding to HTML metadata
 */
export function getBrandingMetadata(branding: BrandingConfig) {
  return {
    title: branding.custom_domain
      ? `${branding.custom_domain}`
      : 'BlogCanvas',
    favicon: branding.favicon_url || '/favicon.ico',
    appleTouchIcon: branding.logo_url || '/apple-touch-icon.png',
    themeColor: branding.primary_color || '#2563eb',
  };
}

/**
 * Check if domain has white-label enabled
 */
export async function isWhiteLabelDomain(hostname: string): Promise<boolean> {
  const customDomain = await getCustomDomainByName(hostname);
  return (
    customDomain !== null &&
    customDomain.is_active &&
    customDomain.verification_status === 'verified'
  );
}

/**
 * Get branding for vendor (used in vendor dashboard)
 */
export function getVendorBranding(customDomain: CustomDomain | null): BrandingConfig {
  if (!customDomain) {
    return getDefaultBranding();
  }

  return {
    logo_url: customDomain.logo_url,
    favicon_url: customDomain.favicon_url,
    primary_color: customDomain.primary_color,
    secondary_color: customDomain.secondary_color,
    font_family: customDomain.font_family,
    custom_css: customDomain.custom_css,
    show_powered_by: false,
    custom_domain: customDomain.domain,
  };
}

/**
 * Sanitize custom CSS to prevent XSS
 */
export function sanitizeCustomCSS(css: string): string {
  // Remove any <script>, <style>, or other potentially dangerous content
  // This is a basic implementation - consider using a CSS parser library for production

  // Remove script tags
  css = css.replace(/<script[\s\S]*?<\/script>/gi, '');

  // Remove style tags
  css = css.replace(/<style[\s\S]*?<\/style>/gi, '');

  // Remove javascript: URLs
  css = css.replace(/javascript:/gi, '');

  // Remove data: URLs (except for data:image)
  css = css.replace(/data:(?!image)/gi, '');

  // Remove expressions
  css = css.replace(/expression\s*\(/gi, '');

  // Remove imports that aren't fonts
  css = css.replace(/@import\s+(?!url\([^)]*fonts\.googleapis\.com)/gi, '');

  return css;
}

/**
 * Get font import statement for custom fonts
 */
export function getFontImportCSS(fontFamily: string): string {
  // Support for Google Fonts
  const googleFonts = [
    'Inter',
    'Roboto',
    'Open Sans',
    'Lato',
    'Montserrat',
    'Poppins',
    'Raleway',
    'Nunito',
    'Work Sans',
    'Playfair Display',
  ];

  const fontName = fontFamily.split(',')[0].trim().replace(/['"]/g, '');

  if (googleFonts.includes(fontName)) {
    const formattedName = fontName.replace(/\s+/g, '+');
    return `@import url('https://fonts.googleapis.com/css2?family=${formattedName}:wght@300;400;500;600;700&display=swap');`;
  }

  return '';
}
