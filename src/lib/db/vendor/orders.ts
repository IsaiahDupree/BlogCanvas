// Vendor order database operations

import { supabase } from '@/lib/supabase';
import type { VendorOrder, VendorOrderItem, CreateOrderInput } from '@/types/order';

/**
 * Generate a unique order number
 */
async function generateOrderNumber(): Promise<string> {
  const { data, error } = await supabase.rpc('generate_order_number');

  if (error || !data) {
    // Fallback to timestamp-based number
    return `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  }

  return data;
}

/**
 * Get all orders for a vendor
 */
export async function getVendorOrders(vendorId: string): Promise<VendorOrder[]> {
  const { data, error } = await supabase
    .from('vendor_orders')
    .select('*')
    .eq('vendor_id', vendorId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching orders:', error);
    return [];
  }

  return data || [];
}

/**
 * Get order by ID
 */
export async function getOrderById(orderId: string): Promise<VendorOrder | null> {
  const { data, error } = await supabase
    .from('vendor_orders')
    .select('*')
    .eq('id', orderId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Error fetching order:', error);
    return null;
  }

  return data;
}

/**
 * Get order with items
 */
export async function getOrderWithItems(orderId: string) {
  const { data, error } = await supabase
    .from('vendor_orders')
    .select(`
      *,
      items:vendor_order_items(*),
      client:vendor_clients(*),
      workspace:vendor_workspaces(*),
      offer:offers(*)
    `)
    .eq('id', orderId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    console.error('Error fetching order with items:', error);
    return null;
  }

  return data;
}

/**
 * Get orders for a client
 */
export async function getClientOrders(clientId: string): Promise<VendorOrder[]> {
  const { data, error } = await supabase
    .from('vendor_orders')
    .select('*')
    .eq('client_id', clientId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching client orders:', error);
    return [];
  }

  return data || [];
}

/**
 * Get orders for a workspace
 */
export async function getWorkspaceOrders(workspaceId: string): Promise<VendorOrder[]> {
  const { data, error } = await supabase
    .from('vendor_orders')
    .select('*')
    .eq('workspace_id', workspaceId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching workspace orders:', error);
    return [];
  }

  return data || [];
}

/**
 * Create a new order
 */
export async function createOrder(
  input: CreateOrderInput
): Promise<VendorOrder | null> {
  const orderNumber = await generateOrderNumber();

  const { data, error } = await supabase
    .from('vendor_orders')
    .insert({
      vendor_id: input.vendor_id,
      client_id: input.client_id,
      workspace_id: input.workspace_id,
      offer_id: input.offer_id,
      order_number: orderNumber,
      base_amount: input.base_amount,
      addons_amount: input.addons_amount || 0,
      total_amount: input.total_amount,
      currency: input.currency || 'USD',
      payment_method: input.payment_method,
      payment_status: 'pending',
      stripe_checkout_session_id: input.stripe_checkout_session_id,
      metadata: input.metadata,
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating order:', error);
    throw error;
  }

  return data;
}

/**
 * Update order status
 */
export async function updateOrderStatus(
  orderId: string,
  status: 'pending' | 'paid' | 'failed' | 'refunded'
): Promise<VendorOrder | null> {
  const updateData: any = { payment_status: status };

  // If marking as paid, set paid_at timestamp
  if (status === 'paid') {
    updateData.paid_at = new Date().toISOString();
  }

  const { data, error } = await supabase
    .from('vendor_orders')
    .update(updateData)
    .eq('id', orderId)
    .select()
    .single();

  if (error) {
    console.error('Error updating order status:', error);
    throw error;
  }

  return data;
}

/**
 * Add order item
 */
export async function addOrderItem(
  orderId: string,
  item: {
    item_type: 'base_offer' | 'addon';
    offer_id?: string;
    addon_id?: string;
    name: string;
    description?: string;
    unit_price: number;
    quantity?: number;
  }
): Promise<VendorOrderItem | null> {
  const quantity = item.quantity || 1;
  const total_price = item.unit_price * quantity;

  const { data, error } = await supabase
    .from('vendor_order_items')
    .insert({
      order_id: orderId,
      item_type: item.item_type,
      offer_id: item.offer_id,
      addon_id: item.addon_id,
      name: item.name,
      description: item.description,
      unit_price: item.unit_price,
      quantity,
      total_price,
    })
    .select()
    .single();

  if (error) {
    console.error('Error adding order item:', error);
    throw error;
  }

  return data;
}

/**
 * Get orders by payment status
 */
export async function getOrdersByStatus(
  vendorId: string,
  status: 'pending' | 'paid' | 'failed' | 'refunded'
): Promise<VendorOrder[]> {
  const { data, error } = await supabase
    .from('vendor_orders')
    .select('*')
    .eq('vendor_id', vendorId)
    .eq('payment_status', status)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching orders by status:', error);
    return [];
  }

  return data || [];
}

/**
 * Get total revenue for a vendor
 */
export async function getTotalRevenue(
  vendorId: string,
  startDate?: Date,
  endDate?: Date
): Promise<number> {
  let query = supabase
    .from('vendor_orders')
    .select('total_amount')
    .eq('vendor_id', vendorId)
    .eq('payment_status', 'paid');

  if (startDate) {
    query = query.gte('paid_at', startDate.toISOString());
  }

  if (endDate) {
    query = query.lte('paid_at', endDate.toISOString());
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching total revenue:', error);
    return 0;
  }

  return data?.reduce((sum, order) => sum + Number(order.total_amount), 0) || 0;
}

/**
 * Get order count by status
 */
export async function getOrderCountByStatus(
  vendorId: string
): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from('vendor_orders')
    .select('payment_status')
    .eq('vendor_id', vendorId);

  if (error) {
    console.error('Error fetching order count:', error);
    return { pending: 0, paid: 0, failed: 0, refunded: 0 };
  }

  const counts = { pending: 0, paid: 0, failed: 0, refunded: 0 };

  data?.forEach((order) => {
    counts[order.payment_status as keyof typeof counts]++;
  });

  return counts;
}

/**
 * Get recent orders
 */
export async function getRecentOrders(
  vendorId: string,
  limit: number = 10
): Promise<VendorOrder[]> {
  const { data, error } = await supabase
    .from('vendor_orders')
    .select('*')
    .eq('vendor_id', vendorId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching recent orders:', error);
    return [];
  }

  return data || [];
}
