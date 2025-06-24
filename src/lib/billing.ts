import { supabase } from './supabase';

export interface BillingPDFRequest {
  subscriptionId: string;
}

export interface BillingPDFResponse {
  success: boolean;
  error?: string;
}

/**
 * Generate and download a comprehensive billing report with all subscriptions
 */
export async function generateBillingReport(): Promise<BillingPDFResponse> {
  try {
    // Get the current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      throw new Error('User not authenticated');
    }

    // Call the Edge Function with proper response handling for PDF
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    const response = await fetch(`${supabaseUrl}/functions/v1/generate-billing-report`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
        'apikey': supabaseAnonKey,
      },
      body: JSON.stringify({}),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Edge function error:', errorText);
      throw new Error('Failed to generate billing report');
    }

    // Get PDF binary data
    const pdfBlob = await response.blob();
    
    // Create download link
    const url = window.URL.createObjectURL(pdfBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `JDMatchr-Billing-Report-${new Date().toISOString().split('T')[0]}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    return { success: true };

  } catch (error) {
    console.error('Error generating billing report:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Generate and download a billing PDF for a subscription
 */
export async function generateBillingPDF(subscriptionId: string): Promise<BillingPDFResponse> {
  try {
    // Get the current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError || !session) {
      throw new Error('User not authenticated');
    }

    // Call the Edge Function with proper response handling for PDF
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    const response = await fetch(`${supabaseUrl}/functions/v1/generate-billing-pdf`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
        'apikey': supabaseAnonKey,
      },
      body: JSON.stringify({ subscriptionId }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Edge function error:', errorText);
      throw new Error('Failed to generate PDF');
    }

    // Get PDF binary data
    const pdfBlob = await response.blob();
    
    // Create download link
    const url = window.URL.createObjectURL(pdfBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `JDMatchr-Invoice-${subscriptionId.slice(-8).toUpperCase()}.pdf`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);

    return { success: true };

  } catch (error) {
    console.error('Error generating billing PDF:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Get billing history for the current user
 */
export async function getBillingHistory() {
  try {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError || !user) {
      throw new Error('User not authenticated');
    }

    const { data: subscriptions, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return subscriptions || [];
  } catch (error) {
    console.error('Error fetching billing history:', error);
    throw error;
  }
}

/**
 * Format subscription data for display
 */
export function formatSubscriptionForDisplay(subscription: any) {
  return {
    id: subscription.id,
    invoiceNumber: `INV-${subscription.id.slice(-8).toUpperCase()}`,
    planName: subscription.plan_name.charAt(0).toUpperCase() + subscription.plan_name.slice(1),
    amount: subscription.plan_name === 'pro' ? 9.99 : 0,
    status: subscription.status,
    createdAt: new Date(subscription.created_at).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }),
    billingPeriod: subscription.billing_period,
    expiresAt: new Date(subscription.expires_at).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  };
} 