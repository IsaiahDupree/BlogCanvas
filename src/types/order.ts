// Order and Subscription Types

export type PaymentMethod = 'stripe' | 'manual';
export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded';
export type SubscriptionStatus = 'active' | 'paused' | 'cancelled' | 'expired';
export type OrderItemType = 'base_offer' | 'addon';

export interface VendorOrder {
  id: string;
  vendor_id: string;
  client_id: string;
  workspace_id?: string;
  offer_id: string;

  // Order details
  order_number: string;

  // Pricing
  base_amount: number;
  addons_amount: number;
  total_amount: number;
  currency: string;

  // Payment
  payment_method?: PaymentMethod;
  payment_status: PaymentStatus;

  // Stripe
  stripe_checkout_session_id?: string;
  stripe_payment_intent_id?: string;
  stripe_customer_id?: string;

  // Metadata
  metadata?: Record<string, any>;

  paid_at?: string;
  created_at: string;
  updated_at: string;
}

export interface VendorOrderItem {
  id: string;
  order_id: string;

  // Item details
  item_type: OrderItemType;
  offer_id?: string;
  addon_id?: string;

  name: string;
  description?: string;

  // Pricing
  unit_price: number;
  quantity: number;
  total_price: number;

  created_at: string;
}

export interface VendorSubscription {
  id: string;
  vendor_id: string;
  client_id: string;
  workspace_id?: string;
  offer_id: string;

  // Subscription details
  status: SubscriptionStatus;

  // Pricing
  amount: number;
  currency: string;
  billing_period: string;

  // Stripe
  stripe_subscription_id?: string;
  stripe_customer_id?: string;

  // Dates
  current_period_start?: string;
  current_period_end?: string;
  cancel_at?: string;
  cancelled_at?: string;

  created_at: string;
  updated_at: string;
}

export interface CreateOrderInput {
  vendor_id: string;
  client_id: string;
  workspace_id?: string;
  offer_id: string;
  base_amount: number;
  addons_amount?: number;
  total_amount: number;
  currency?: string;
  payment_method?: PaymentMethod;
  stripe_checkout_session_id?: string;
  metadata?: Record<string, any>;
}
