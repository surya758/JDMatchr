import { supabase } from './supabase';

export interface DodoCustomer {
  customer_id: string;
  email: string;
  name?: string;
}

export interface DodoProduct {
  product_id: string;
  name: string;
  price_cents: number;
  currency: string;
  billing_interval: 'monthly' | 'yearly' | 'one_time';
}

export interface CheckoutSession {
  checkout_url: string;
  session_id: string;
  expires_at: string;
}

export interface SubscriptionData {
  subscription_id: string;
  customer_id: string;
  product_id: string;
  status: string;
  current_period_start: string;
  current_period_end: string;
  amount_cents: number;
  currency: string;
  billing_interval: string;
}

export interface CreatePaymentResponse {
  success: boolean;
  customer_id: string;
  payment_id: string;
  subscription_id: string;
  checkout_url: string;
  client_secret: string;
}

export async function createPaymentSession(planName: string, userEmail: string, userName: string): Promise<{ checkout_url: string }> {
  const { data, error } = await supabase.functions.invoke('create-dodo-payment', {
    body: { planName, userEmail, userName }
  })

  if (error) {
    console.error('Error creating payment session:', error)
    throw new Error(error.message || 'Failed to create payment session')
  }

  return data
}

export async function cancelSubscription(): Promise<{ success: boolean; message: string }> {
  const { data, error } = await supabase.functions.invoke('cancel-dodo-subscription', {
    body: {}
  })

  if (error) {
    console.error('Error cancelling subscription:', error)
    throw new Error(error.message || 'Failed to cancel subscription')
  }

  return data
}

export async function reactivateSubscription(): Promise<{ success: boolean; message: string }> {
  const { data, error } = await supabase.functions.invoke('reactivate-dodo-subscription', {
    body: {}
  })

  if (error) {
    console.error('Error reactivating subscription:', error)
    throw new Error(error.message || 'Failed to reactivate subscription')
  }

  return data
}

export async function retryPaymentSession(userEmail: string, userName?: string): Promise<any> {
  const { data, error } = await supabase.functions.invoke('retry-dodo-payment', {
    body: { userEmail, userName }
  })

  if (error) {
    console.error('Error creating retry payment session:', error)
    throw new Error(error.message || 'Failed to create retry payment session')
  }

  return data
}

/**
 * Legacy method - now calls createPaymentSession
 * @deprecated Use createPaymentSession instead
 */
async function createCustomer(email: string, name?: string, userId?: string): Promise<any> {
  // This method is kept for backward compatibility but doesn't actually create a customer
  // Customer creation is now handled in the backend
  return {
    customer_id: `temp_${Date.now()}`,
    email,
    name: name || email.split('@')[0]
  };
}

/**
 * Legacy method - now calls createPaymentSession  
 * @deprecated Use createPaymentSession instead
 */
async function createPayment(
  customerId: string,
  productId: string,
  successUrl: string,
  cancelUrl: string
): Promise<any> {
  throw new Error('createPayment is deprecated. Use createPaymentSession instead.');
}

/**
 * Get subscription details
 */
async function getSubscription(subscriptionId: string): Promise<any> {
  try {
    // This would need to be implemented via backend Edge Function as well
    // For now, we'll get subscription data from our local database
    const result = await supabase
      .from('subscriptions')
      .select('*')
      .eq('dodo_subscription_id', subscriptionId)
      .single();

    if (result.error) {
      console.error('Error fetching subscription:', result.error);
      return null;
    }

    return result.data;
  } catch (error) {
    console.error('Error fetching subscription:', error);
    return null;
  }
}

/**
 * Map Dodo product ID to local plan name
 */
function getLocalPlanName(productId: string): string {
  // Configure these based on your Dodo products
  const productMapping: Record<string, string> = {
    'prod_free': 'free',
    'prod_pro_monthly': 'pro',
  };

  return productMapping[productId] || 'free';
}

/**
 * Get available products/plans
 */
async function getProducts(): Promise<any[]> {
  try {
    // This would need to be implemented via backend Edge Function as well
    // For now, return empty array since we're not using product listing
    console.log('getProducts called - this method needs backend implementation');
    return [];
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}

// Export singleton instance
export const dodoPayments = {
  createPaymentSession,
  cancelSubscription,
  reactivateSubscription,
  retryPaymentSession,
  createCustomer,
  createPayment,
  getSubscription,
  getLocalPlanName,
  getProducts
};
export default dodoPayments; 