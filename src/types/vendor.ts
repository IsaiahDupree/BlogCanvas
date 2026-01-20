// Vendor Platform Types

export type VendorStatus = 'active' | 'suspended' | 'deleted';

export interface Vendor {
  id: string;
  user_id: string;

  // Profile
  handle: string;
  business_name: string;
  full_name?: string;
  email: string;
  phone?: string;
  avatar_url?: string;
  bio?: string;

  // Branding
  brand_color?: string;
  logo_url?: string;

  // Settings
  timezone?: string;

  // Stripe
  stripe_account_id?: string;

  // Status
  status: VendorStatus;

  // Metadata
  created_at: string;
  updated_at: string;
}

export type VendorMemberRole = 'owner' | 'admin' | 'member';

export interface VendorMember {
  id: string;
  vendor_id: string;
  user_id: string;
  role: VendorMemberRole;
  created_at: string;
  updated_at: string;
}

export interface VendorCreateInput {
  handle: string;
  business_name: string;
  email: string;
  full_name?: string;
  phone?: string;
  bio?: string;
  brand_color?: string;
  timezone?: string;
}

export interface VendorUpdateInput {
  handle?: string;
  business_name?: string;
  full_name?: string;
  phone?: string;
  avatar_url?: string;
  bio?: string;
  brand_color?: string;
  logo_url?: string;
  timezone?: string;
}
