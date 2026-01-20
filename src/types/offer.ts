// Offer and Add-on Types

export type OfferType = 'one_time' | 'subscription' | 'retainer' | 'book_call';
export type BillingPeriod = 'monthly' | 'annual' | 'weekly';

export interface Offer {
  id: string;
  page_id: string;
  vendor_id: string;

  // Offer details
  name: string;
  description?: string;

  // Pricing
  offer_type: OfferType;
  base_price: number;
  currency: string;

  // Subscription-specific
  billing_period?: BillingPeriod;

  // Quote mode
  is_quote_mode: boolean;

  // Stripe
  stripe_product_id?: string;
  stripe_price_id?: string;

  // Status
  is_active: boolean;

  // Metadata
  created_at: string;
  updated_at: string;
}

export interface OfferCreateInput {
  page_id: string;
  vendor_id: string;
  name: string;
  description?: string;
  offer_type: OfferType;
  base_price: number;
  currency?: string;
  billing_period?: BillingPeriod;
  is_quote_mode?: boolean;
}

export interface OfferUpdateInput {
  name?: string;
  description?: string;
  offer_type?: OfferType;
  base_price?: number;
  currency?: string;
  billing_period?: BillingPeriod;
  is_quote_mode?: boolean;
  is_active?: boolean;
}

// ============================================================================
// ADD-ONS
// ============================================================================

export type AddonType =
  | 'setup_fee'
  | 'rush_delivery'
  | 'extra_revisions'
  | 'retainer_upgrade'
  | 'custom';

export interface OfferAddon {
  id: string;
  offer_id: string;
  vendor_id: string;

  // Add-on details
  name: string;
  description?: string;
  addon_type: AddonType;

  // Pricing
  price: number;
  currency: string;

  // Stripe
  stripe_product_id?: string;
  stripe_price_id?: string;

  // Status
  is_active: boolean;

  // Metadata
  created_at: string;
  updated_at: string;
}

export interface OfferAddonCreateInput {
  offer_id: string;
  vendor_id: string;
  name: string;
  description?: string;
  addon_type: AddonType;
  price: number;
  currency?: string;
}

export interface OfferAddonUpdateInput {
  name?: string;
  description?: string;
  addon_type?: AddonType;
  price?: number;
  currency?: string;
  is_active?: boolean;
}
