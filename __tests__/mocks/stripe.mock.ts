/**
 * Stripe Mock
 *
 * Mocks Stripe payment processing for testing
 */

import Stripe from 'stripe';

export const mockStripeCustomer: Stripe.Customer = {
  id: 'cus_test123',
  object: 'customer',
  address: null,
  balance: 0,
  created: Math.floor(Date.now() / 1000),
  currency: 'usd',
  default_source: null,
  delinquent: false,
  description: 'Test customer',
  discount: null,
  email: 'test@example.com',
  invoice_prefix: 'INV',
  invoice_settings: {
    custom_fields: null,
    default_payment_method: null,
    footer: null,
    rendering_options: null
  },
  livemode: false,
  metadata: {},
  name: 'Test Customer',
  phone: null,
  preferred_locales: [],
  shipping: null,
  tax_exempt: 'none',
  test_clock: null
};

export const mockStripeSubscription: Stripe.Subscription = {
  id: 'sub_test123',
  object: 'subscription',
  application: null,
  application_fee_percent: null,
  automatic_tax: {
    enabled: false,
    liability: null
  },
  billing_cycle_anchor: Math.floor(Date.now() / 1000),
  billing_thresholds: null,
  cancel_at: null,
  cancel_at_period_end: false,
  canceled_at: null,
  cancellation_details: null,
  collection_method: 'charge_automatically',
  created: Math.floor(Date.now() / 1000),
  currency: 'usd',
  current_period_end: Math.floor(Date.now() / 1000) + 2592000,
  current_period_start: Math.floor(Date.now() / 1000),
  customer: 'cus_test123',
  days_until_due: null,
  default_payment_method: null,
  default_source: null,
  default_tax_rates: [],
  description: null,
  discount: null,
  ended_at: null,
  invoice_settings: null,
  items: {
    object: 'list',
    data: [],
    has_more: false,
    url: '/v1/subscription_items'
  },
  latest_invoice: null,
  livemode: false,
  metadata: {},
  next_pending_invoice_item_invoice: null,
  on_behalf_of: null,
  pause_collection: null,
  payment_settings: null,
  pending_invoice_item_interval: null,
  pending_setup_intent: null,
  pending_update: null,
  schedule: null,
  start_date: Math.floor(Date.now() / 1000),
  status: 'active',
  test_clock: null,
  transfer_data: null,
  trial_end: null,
  trial_settings: null,
  trial_start: null
};

export const mockStripePaymentIntent: Stripe.PaymentIntent = {
  id: 'pi_test123',
  object: 'payment_intent',
  amount: 5000,
  amount_capturable: 0,
  amount_details: {
    tip: {}
  },
  amount_received: 0,
  application: null,
  application_fee_amount: null,
  automatic_payment_methods: null,
  canceled_at: null,
  cancellation_reason: null,
  capture_method: 'automatic',
  client_secret: 'pi_test123_secret',
  confirmation_method: 'automatic',
  created: Math.floor(Date.now() / 1000),
  currency: 'usd',
  customer: 'cus_test123',
  description: 'Test payment',
  invoice: null,
  last_payment_error: null,
  latest_charge: null,
  livemode: false,
  metadata: {},
  next_action: null,
  on_behalf_of: null,
  payment_method: null,
  payment_method_configuration_details: null,
  payment_method_options: {},
  payment_method_types: ['card'],
  processing: null,
  receipt_email: null,
  review: null,
  setup_future_usage: null,
  shipping: null,
  source: null,
  statement_descriptor: null,
  statement_descriptor_suffix: null,
  status: 'succeeded',
  transfer_data: null,
  transfer_group: null
};

export const createMockStripe = () => ({
  customers: {
    create: jest.fn().mockResolvedValue(mockStripeCustomer),
    retrieve: jest.fn().mockResolvedValue(mockStripeCustomer),
    update: jest.fn().mockResolvedValue(mockStripeCustomer),
    del: jest.fn().mockResolvedValue({ id: 'cus_test123', deleted: true })
  },
  subscriptions: {
    create: jest.fn().mockResolvedValue(mockStripeSubscription),
    retrieve: jest.fn().mockResolvedValue(mockStripeSubscription),
    update: jest.fn().mockResolvedValue(mockStripeSubscription),
    cancel: jest.fn().mockResolvedValue({ ...mockStripeSubscription, status: 'canceled' }),
    list: jest.fn().mockResolvedValue({
      object: 'list',
      data: [mockStripeSubscription],
      has_more: false,
      url: '/v1/subscriptions'
    })
  },
  paymentIntents: {
    create: jest.fn().mockResolvedValue(mockStripePaymentIntent),
    retrieve: jest.fn().mockResolvedValue(mockStripePaymentIntent),
    update: jest.fn().mockResolvedValue(mockStripePaymentIntent),
    cancel: jest.fn().mockResolvedValue({ ...mockStripePaymentIntent, status: 'canceled' })
  },
  webhooks: {
    constructEvent: jest.fn((payload: string, signature: string, secret: string) => {
      return {
        id: 'evt_test123',
        object: 'event',
        type: 'payment_intent.succeeded',
        data: {
          object: mockStripePaymentIntent
        },
        created: Math.floor(Date.now() / 1000),
        livemode: false
      };
    })
  }
});

export const mockStripeError = (message: string, type: string = 'card_error') => {
  const error: any = new Error(message);
  error.type = type;
  error.code = 'test_error';
  error.decline_code = 'test_decline';
  return error;
};
