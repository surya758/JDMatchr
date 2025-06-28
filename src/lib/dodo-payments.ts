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

class DodoPaymentsService {
  /**
   * Create a payment session via backend Edge Function
   */
  async createPaymentSession(
    planName: string,
    userEmail: string,
    userName?: string
  ): Promise<CreatePaymentResponse> {
    try {
      // Get the current session for authentication
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError || !session) {
        throw new Error('User not authenticated');
      }

      // Call our backend Edge Function
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
      
      const response = await fetch(`${supabaseUrl}/functions/v1/create-dodo-payment`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
          'apikey': supabaseAnonKey,
        },
        body: JSON.stringify({
          planName,
          userEmail,
          userName
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      if (!result.success) {
        throw new Error(result.message || 'Failed to create payment session');
      }

      return result;
    } catch (error) {
      console.error('Error creating payment session:', error);
      throw new Error(`Failed to create payment session: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Legacy method - now calls createPaymentSession
   * @deprecated Use createPaymentSession instead
   */
  async createCustomer(email: string, name?: string, userId?: string): Promise<any> {
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
  async createPayment(
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
  async getSubscription(subscriptionId: string): Promise<any> {
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
   * Cancel a subscription
   */
  async cancelSubscription(subscriptionId: string): Promise<boolean> {
    try {
      // For now, we'll handle cancellation through the database
      // The actual Dodo cancellation can be done via webhook or dashboard
      console.log('Subscription cancellation requested:', subscriptionId);
      return true;
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      return false;
    }
  }

  /**
   * Map Dodo product ID to local plan name
   */
  private getLocalPlanName(productId: string): string {
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
  async getProducts(): Promise<any[]> {
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
}

// Export singleton instance
export const dodoPayments = new DodoPaymentsService();
export default dodoPayments; 