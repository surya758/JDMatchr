import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { Webhook } from "npm:standardwebhooks";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Log incoming request for debugging
  console.log('🔔 Webhook request received:', {
    method: req.method,
    url: req.url,
    headers: Object.fromEntries(req.headers.entries())
  })

  try {
    // Parse the webhook payload first to get the raw body for signature verification
    const body = await req.text()
    let payload
    try {
      payload = JSON.parse(body)
    } catch (error) {
      console.error('Invalid JSON payload:', error)
      return new Response(
        JSON.stringify({ error: 'Invalid JSON payload' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Verify webhook signature using Standard Webhooks library (same as Express example)
    const webhookId = req.headers.get('webhook-id')
    const webhookTimestamp = req.headers.get('webhook-timestamp')
    const webhookSignature = req.headers.get('webhook-signature')
    const webhookSecret = Deno.env.get('DODO_WEBHOOK_SECRET')
  
    
    if (webhookSecret) {
      if (!webhookSignature || !webhookId || !webhookTimestamp) {
        console.error('Missing required webhook headers')
        return new Response(
          JSON.stringify({ error: 'Missing required webhook headers' }),
          { 
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }
      
      try {
        // Use Standard Webhooks library for verification (same as Express example)
        const webhook = new Webhook(webhookSecret)
        
        const webhookHeaders = {
          "webhook-id": webhookId,
          "webhook-signature": webhookSignature,
          "webhook-timestamp": webhookTimestamp,
        }
        
        // Verify using the raw body (same as Express: JSON.stringify(body) but we already have raw body)
        const verifiedPayload = await webhook.verify(body, webhookHeaders)
        
        console.log('✅ Webhook signature verified successfully')
        
      } catch (error) {
        console.error('Webhook signature verification failed:', error.message)
        return new Response(
          JSON.stringify({ error: 'Invalid webhook signature' }),
          { 
            status: 401,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        )
      }
    } else {
      console.warn('⚠️ Webhook secret not configured - skipping signature verification')
    }

    // Create Supabase client with service role key
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Use the already parsed payload
    const eventType = payload.type || payload.event_type
    const eventData = payload.data || payload

    console.log(`🔔 Received Dodo webhook: ${eventType}`)

    // Handle different webhook events
    switch (eventType) {
      case 'subscription.active':
        await handleSubscriptionActive(supabase, eventData)
        break
        
      case 'subscription.renewed':
        await handleSubscriptionRenewed(supabase, eventData)
        break
        
      case 'subscription.on_hold':
        await handleSubscriptionOnHold(supabase, eventData)
        break
        
      case 'subscription.paused':
        await handleSubscriptionPaused(supabase, eventData)
        break
        
      case 'subscription.cancelled':
        await handleSubscriptionCancelled(supabase, eventData)
        break
        
      case 'subscription.failed':
        await handleSubscriptionFailed(supabase, eventData)
        break
        
      case 'subscription.expired':
        await handleSubscriptionExpired(supabase, eventData)
        break
      
      case 'payment.succeeded':
        await handlePaymentSuccess(supabase, eventData)
        break
      
      default:
        console.log(`Unhandled webhook event: ${eventType}`)
    }

    return new Response(
      JSON.stringify({ received: true, event: eventType }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('❌ Webhook processing error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Webhook processing failed',
        message: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

async function handleSubscriptionActive(supabase: any, eventData: any) {
  try {
    const { 
      subscription_id, 
      customer, 
      next_billing_date,
      subscription_period_count,
      subscription_period_interval,
      created_at,
      product_id,
      recurring_pre_tax_amount
    } = eventData
    const jdmatchrUserId = eventData.metadata?.jdmatchr_user_id
    
    if (!jdmatchrUserId) {
      console.error('No jdmatchr_user_id in subscription metadata')
      return
    }
    
    console.log(`Processing subscription.active for user: ${jdmatchrUserId}`)
    
    // Calculate natural expiry date if we have period info
    let naturalExpiryDate: Date | null = null
    if (subscription_period_count && subscription_period_interval && created_at) {
      const startDate = new Date(created_at)
      
      switch (subscription_period_interval) {
        case 'Day':
          naturalExpiryDate = new Date(startDate.getTime() + (subscription_period_count * 24 * 60 * 60 * 1000))
          break
        case 'Month':
          const monthDate = new Date(startDate)
          monthDate.setMonth(monthDate.getMonth() + subscription_period_count)
          naturalExpiryDate = monthDate
          break
        case 'Year':
          const yearDate = new Date(startDate)
          yearDate.setFullYear(yearDate.getFullYear() + subscription_period_count)
          naturalExpiryDate = yearDate
          break
      }
    }
    
    // Check if user already has a Pro subscription
    const { data: existingProSubscription, error: checkError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', jdmatchrUserId)
      .eq('plan_name', 'pro')
      .single()
    
    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking for existing Pro subscription:', checkError)
      throw checkError
    }
    
    let targetSubscription
    
    if (existingProSubscription) {
      // UPDATE existing Pro subscription
      console.log(`Updating existing Pro subscription for user: ${jdmatchrUserId}`)
      
      const { data: updatedSubscription, error: updateError } = await supabase
        .from('subscriptions')
        .update({
          dodo_subscription_id: subscription_id,
          dodo_customer_id: customer.customer_id,
          dodo_product_id: product_id,
          status: 'active',
          job_credits: 30,
          job_credits_used: 0,
          current_period_start: new Date().toISOString(),
          current_period_end: next_billing_date ? new Date(next_billing_date).toISOString() : null,
          subscription_period_count: subscription_period_count || null,
          subscription_period_interval: subscription_period_interval || null,
          natural_expiry_date: naturalExpiryDate ? naturalExpiryDate.toISOString() : null,
          cancel_at_period_end: false,
          amount_cents: recurring_pre_tax_amount || null,
          metadata: JSON.stringify(eventData),
          updated_at: new Date().toISOString()
        })
        .eq('id', existingProSubscription.id)
        .select()
        .single()
      
      if (updateError) {
        console.error('Error updating existing Pro subscription:', updateError)
        throw updateError
      }
      
      targetSubscription = updatedSubscription
      
    } else {
      // CREATE new Pro subscription
      console.log(`Creating new Pro subscription for user: ${jdmatchrUserId}`)
      
      const { data: newSubscription, error: insertError } = await supabase
        .from('subscriptions')
        .insert({
          user_id: jdmatchrUserId,
          dodo_subscription_id: subscription_id,
          dodo_customer_id: customer.customer_id,
          dodo_product_id: product_id,
          plan_name: 'pro',
          status: 'active',
          job_credits: 30,
          job_credits_used: 0,
          current_period_start: new Date().toISOString(),
          current_period_end: next_billing_date ? new Date(next_billing_date).toISOString() : null,
          subscription_period_count: subscription_period_count || null,
          subscription_period_interval: subscription_period_interval || null,
          natural_expiry_date: naturalExpiryDate ? naturalExpiryDate.toISOString() : null,
          cancel_at_period_end: false,
          amount_cents: recurring_pre_tax_amount || null,
          metadata: JSON.stringify(eventData)
        })
        .select()
        .single()
      
      if (insertError) {
        console.error('Error creating new Pro subscription:', insertError)
        throw insertError
      }
      
      targetSubscription = newSubscription
    }
    
    // Expire other active subscriptions (Free plan or other Pro subscriptions)
    await expireOtherSubscriptions(supabase, jdmatchrUserId, targetSubscription.id)
    
    console.log(`Successfully activated subscription for user: ${jdmatchrUserId}`)
    if (naturalExpiryDate) {
      console.log(`Natural expiry date set to: ${naturalExpiryDate.toISOString()}`)
    }
  } catch (error) {
    console.error('Error in handleSubscriptionActive:', error)
    throw error
  }
}

async function handleSubscriptionRenewed(supabase: any, eventData: any) {
  try {
    const { subscription_id, customer, next_billing_date } = eventData
    const jdmatchrUserId = eventData.metadata?.jdmatchr_user_id
    
    if (!jdmatchrUserId) {
      console.error('No jdmatchr_user_id in subscription metadata')
      return
    }
    
    console.log(`Processing subscription.renewed for user: ${jdmatchrUserId}`)
    
    // Update subscription and reset job credits for new period
    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: 'active',
        current_period_end: next_billing_date ? new Date(next_billing_date).toISOString() : null,
        job_credits: 30, // Reset credits for Pro plan
        updated_at: new Date().toISOString()
      })
      .eq('dodo_subscription_id', subscription_id)
    
    if (error) {
      console.error('Error updating renewed subscription:', error)
      throw error
    }
    
    console.log(`Successfully renewed subscription for user: ${jdmatchrUserId}`)
  } catch (error) {
    console.error('Error in handleSubscriptionRenewed:', error)
    throw error
  }
}

async function handleSubscriptionOnHold(supabase: any, eventData: any) {
  try {
    const { subscription_id } = eventData
    const jdmatchrUserId = eventData.metadata?.jdmatchr_user_id
    
    console.log(`Processing subscription.on_hold for user: ${jdmatchrUserId}`)
    console.log('Subscription on hold - logging only, no database changes')
    console.log('Subscription ID:', subscription_id)
    
    // Just log the event, don't modify database as requested
  } catch (error) {
    console.error('Error in handleSubscriptionOnHold:', error)
    throw error
  }
}

async function handleSubscriptionPaused(supabase: any, eventData: any) {
  try {
    const { subscription_id } = eventData
    const jdmatchrUserId = eventData.metadata?.jdmatchr_user_id
    
    if (!jdmatchrUserId) {
      console.error('No jdmatchr_user_id in subscription metadata')
      return
    }
    
    console.log(`Processing subscription.paused for user: ${jdmatchrUserId}`)
    
    // Update subscription to paused status
    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: 'paused',
        updated_at: new Date().toISOString()
      })
      .eq('dodo_subscription_id', subscription_id)
    
    if (error) {
      console.error('Error updating subscription to paused:', error)
      throw error
    }
    
    console.log(`Successfully paused subscription for user: ${jdmatchrUserId}`)
  } catch (error) {
    console.error('Error in handleSubscriptionPaused:', error)
    throw error
  }
}

async function handleSubscriptionCancelled(supabase: any, eventData: any) {
  try {
    const { subscription_id, cancelled_at, cancel_at_next_billing_date, next_billing_date } = eventData
    const jdmatchrUserId = eventData.metadata?.jdmatchr_user_id
    
    if (!jdmatchrUserId) {
      console.error('No jdmatchr_user_id in subscription metadata')
      return
    }
    
    console.log(`Processing subscription.cancelled for user: ${jdmatchrUserId}`)
    
    // Update subscription to cancelled status, map cancel_at_next_billing_date to cancel_at_period_end
    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: 'cancelled',
        cancelled_at: cancelled_at ? new Date(cancelled_at).toISOString() : null,
        cancel_at_period_end: cancel_at_next_billing_date || false,
        current_period_end: next_billing_date ? new Date(next_billing_date).toISOString() : null,
        updated_at: new Date().toISOString()
      })
      .eq('dodo_subscription_id', subscription_id)
    
    if (error) {
      console.error('Error updating subscription to cancelled:', error)
      throw error
    }
    
    // When Pro subscription is cancelled, reactivate Free plan
    await reactivateFreePlan(supabase, jdmatchrUserId)
    
    console.log(`Successfully cancelled subscription for user: ${jdmatchrUserId}`)
  } catch (error) {
    console.error('Error in handleSubscriptionCancelled:', error)
    throw error
  }
}

async function handleSubscriptionFailed(supabase: any, eventData: any) {
  try {
    const { subscription_id } = eventData
    const jdmatchrUserId = eventData.metadata?.jdmatchr_user_id
    
    if (!jdmatchrUserId) {
      console.error('No jdmatchr_user_id in subscription metadata')
      return
    }
    
    console.log(`Processing subscription.failed for user: ${jdmatchrUserId}`)
    
    // Update subscription to failed status
    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: 'failed',
        updated_at: new Date().toISOString()
      })
      .eq('dodo_subscription_id', subscription_id)
    
    if (error) {
      console.error('Error updating subscription to failed:', error)
      throw error
    }
    
    console.log(`Successfully marked subscription as failed for user: ${jdmatchrUserId}`)
  } catch (error) {
    console.error('Error in handleSubscriptionFailed:', error)
    throw error
  }
}

async function handleSubscriptionExpired(supabase: any, eventData: any) {
  try {
    const { subscription_id } = eventData
    const jdmatchrUserId = eventData.metadata?.jdmatchr_user_id
    
    if (!jdmatchrUserId) {
      console.error('No jdmatchr_user_id in subscription metadata')
      return
    }
    
    console.log(`Processing subscription.expired for user: ${jdmatchrUserId}`)
    
    // Update subscription to expired status and reset job credits to 0
    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: 'expired',
        job_credits: 0, // Reset credits to 0 on expiration
        updated_at: new Date().toISOString()
      })
      .eq('dodo_subscription_id', subscription_id)
    
    if (error) {
      console.error('Error updating subscription to expired:', error)
      throw error
    }
    
    // When Pro subscription expires, reactivate Free plan
    await reactivateFreePlan(supabase, jdmatchrUserId)
    
    console.log(`Successfully expired subscription and reset credits for user: ${jdmatchrUserId}`)
  } catch (error) {
    console.error('Error in handleSubscriptionExpired:', error)
    throw error
  }
}

async function handlePaymentSuccess(supabase: any, eventData: any) {
  try {
    console.log('💳 Processing payment success:', eventData.id || eventData.payment_id)
    
    if (eventData.subscription_id) {
      const { error } = await supabase
        .from('subscriptions')
        .update({ 
          last_payment_date: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('dodo_subscription_id', eventData.subscription_id)

      if (error) {
        console.error('Error resetting job credits:', error)
      } else {
        console.log('✅ Job credits reset for subscription renewal')
      }
    }

  } catch (error) {
    console.error('Error handling payment success:', error)
  }
}

// Helper function to expire other active subscriptions when a new one becomes active
async function expireOtherSubscriptions(supabase: any, userId: string, excludeSubscriptionId: string) {
  try {
    console.log(`Expiring other active subscriptions for user: ${userId}`)
    
    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: 'expired',
        updated_at: new Date().toISOString()
      })
      .eq('user_id', userId)
      .eq('status', 'active')
      .neq('id', excludeSubscriptionId) // Use internal ID, not DODO subscription ID
    
    if (error) {
      console.error('Error expiring other subscriptions:', error)
      throw error
    }
    
    console.log(`Successfully expired other active subscriptions for user: ${userId}`)
  } catch (error) {
    console.error('Error in expireOtherSubscriptions:', error)
    throw error
  }
}

// Helper function to reactivate Free plan when paid subscription ends
async function reactivateFreePlan(supabase: any, userId: string) {
  try {
    console.log(`Reactivating Free plan for user: ${userId}`)
    
    // First, try to reactivate an existing Free plan subscription
    const { data: existingFreePlan, error: fetchError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('plan_name', 'free')
      .single()
    
    if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error fetching Free plan:', fetchError)
      throw fetchError
    }
    
      // Reactivate existing Free plan
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        status: 'active',
        job_credits: 1, // Free plan gets 1 credit
        updated_at: new Date().toISOString()
      })
      .eq('id', existingFreePlan.id)
    
    if (updateError) {
      console.error('Error reactivating Free plan:', updateError)
      throw updateError
    }
    
    console.log(`Successfully reactivated Free plan for user: ${userId}`)
  } catch (error) {
    console.error('Error in reactivateFreePlan:', error)
    throw error
  }
} 