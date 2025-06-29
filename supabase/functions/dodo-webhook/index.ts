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
        await handlePaymentSucceeded(supabase, eventData)
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

// Handle payment success - update subscription with payment_id
async function handlePaymentSucceeded(supabase: any, eventData: any) {
  console.log('Payment succeeded:', eventData)
}

// Handle subscription activation - activate pending subscription and manage free plan
async function handleSubscriptionActive(supabase: any, eventData: any) {
  try {
    const { subscription_id, customer, billing_interval, next_billing_date } = eventData
    
    if (!customer?.customer_id) {
      console.log('subscription.active: Missing customer_id, skipping')
      return
    }

    console.log(`Processing subscription activation for customer: ${customer.customer_id}`)

    // Update the pending subscription to active using dodo_customer_id
    const { data: updatedSub, error: updateError } = await supabase
      .from('subscriptions')
      .update({
        status: 'active',
        dodo_subscription_id: subscription_id, // Update with the subscription_id from webhook
        billing_interval: billing_interval || 'monthly',
        current_period_end: next_billing_date,
        cancel_at_period_end: false,
        updated_at: new Date().toISOString(),
      })
      .eq('dodo_customer_id', customer.customer_id)
      .select('user_id')
      .single()

    if (updateError) {
      console.error('Error activating subscription:', updateError)
      throw updateError
    }

    console.log('updatedSub', updatedSub)

    if (!updatedSub) {
      console.log(`No pending Pro subscription found for customer: ${customer.customer_id}`)
      return
    }

    console.log(`Successfully activated subscription for user: ${updatedSub.user_id}`)

    // Expire the Free plan when Pro becomes active
    await manageFreeSubscription(supabase, updatedSub.user_id, 'expired')

  } catch (error) {
    console.error('Error in handleSubscriptionActive:', error)
    throw error
  }
}

// Handle subscription renewal - reset credits and update period
async function handleSubscriptionRenewed(supabase: any, eventData: any) {
  try {
    const { subscription_id, next_billing_date, customer } = eventData
    
    if (!customer?.customer_id) {
      console.log('subscription.renewed: Missing customer_id, skipping')
      return
    }

    console.log(`Processing subscription renewal for customer: ${customer.customer_id}`)

    // Reset job credits and update billing period using dodo_customer_id
    const { data: updatedSub, error: updateError } = await supabase
      .from('subscriptions')
      .update({
        job_credits: 30, // Reset Pro plan credits
        job_credits_used: 0,
        dodo_subscription_id: subscription_id,
        current_period_start: new Date().toISOString(),
        current_period_end: next_billing_date,
        cancel_at_period_end: false,
        updated_at: new Date().toISOString()
      })
      .eq('dodo_customer_id', customer.customer_id)
      .select('user_id')
      .single()

    if (updateError) {
      console.error('Error renewing subscription:', updateError)
      throw updateError
    }

    if (!updatedSub) {
      console.log(`No active Pro subscription found for customer: ${customer.customer_id}`)
      return
    }

    console.log(`Successfully renewed subscription for customer: ${customer.customer_id}`)

    // Ensure Free plan is expired when Pro is renewed
    await manageFreeSubscription(supabase, updatedSub.user_id, 'expired') 

  } catch (error) {
    console.error('Error in handleSubscriptionRenewed:', error)
    throw error
  }
}

// Handle subscription on hold
async function handleSubscriptionOnHold(supabase: any, eventData: any) {
  try {
    const { subscription_id, customer } = eventData

    if (!customer?.customer_id) {
      console.log('subscription.on_hold: Missing customer_id, skipping')
      return
    }

    console.log(`Processing subscription on hold for customer: ${customer.customer_id}`)

    // Update the subscription to on hold status using dodo_customer_id
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        status: 'on_hold',
        updated_at: new Date().toISOString()
      })
      .eq('dodo_customer_id', customer.customer_id)

    if (updateError) {
      console.error('Error updating subscription to on hold:', updateError)
      throw updateError
    }

    console.log(`Successfully updated subscription to on hold for customer: ${customer.customer_id}`)

  } catch (error) {
    console.error('Error in handleSubscriptionOnHold:', error)
    throw error
  }
}

// Handle subscription paused
async function handleSubscriptionPaused(supabase: any, eventData: any) {
  try {
    const { subscription_id, customer } = eventData
    
    if (!customer?.customer_id) {
      console.log('subscription.paused: Missing customer_id, skipping')
      return
    }

    console.log(`Processing subscription pause for customer: ${customer.customer_id}`)

    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        status: 'paused',
        updated_at: new Date().toISOString()
      })
      .eq('dodo_customer_id', customer.customer_id)

    if (updateError) {
      console.error('Error pausing subscription:', updateError)
      throw updateError
    }

    console.log(`Successfully paused subscription for customer: ${customer.customer_id}`)

  } catch (error) {
    console.error('Error in handleSubscriptionPaused:', error)
    throw error
  }
}

// Handle subscription cancellation - set cancel_at_period_end but keep active
async function handleSubscriptionCancelled(supabase: any, eventData: any) {
  try {
    const { subscription_id, cancel_at_next_billing_date, customer } = eventData
    
    if (!customer?.customer_id) {
      console.log('subscription.cancelled: Missing customer_id, skipping')
      return
    }

    console.log(`Processing subscription cancellation for customer: ${customer.customer_id}`)

    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        status: 'cancelled',
        cancel_at_period_end: cancel_at_next_billing_date || true,
        updated_at: new Date().toISOString()
      })
      .eq('dodo_customer_id', customer.customer_id)

    if (updateError) {
      console.error('Error cancelling subscription:', updateError)
      throw updateError
    }

    console.log(`Successfully cancelled subscription for customer: ${customer.customer_id}`)

  } catch (error) {
    console.error('Error in handleSubscriptionCancelled:', error)
    throw error
  }
}

// Handle subscription failure
async function handleSubscriptionFailed(supabase: any, eventData: any) {
  try {
    const { subscription_id, customer } = eventData
    
    if (!customer?.customer_id) {
      console.log('subscription.failed: Missing customer_id, skipping')
      return
    }

    console.log(`Processing subscription failure for customer: ${customer.customer_id}`)

    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        status: 'failed',
        updated_at: new Date().toISOString()
      })
      .eq('dodo_customer_id', customer.customer_id)

    if (updateError) {
      console.error('Error marking subscription as failed:', updateError)
      throw updateError
    }

    console.log(`Successfully marked subscription as failed for customer: ${customer.customer_id}`)

  } catch (error) {
    console.error('Error in handleSubscriptionFailed:', error)
    throw error
  }
}

// Handle subscription expiration - expire subscription and reactivate free plan
async function handleSubscriptionExpired(supabase: any, eventData: any) {
  try {
    const { subscription_id, customer } = eventData
    
    if (!customer?.customer_id) {
      console.log('subscription.expired: Missing customer_id, skipping')
      return
    }

    console.log(`Processing subscription expiration for customer: ${customer.customer_id}`)

    // Update subscription status and reset credits
    const { data: expiredSub, error: updateError } = await supabase
      .from('subscriptions')
      .update({
        status: 'expired',
        job_credits: 0,
        updated_at: new Date().toISOString()
      })
      .eq('dodo_customer_id', customer.customer_id)
      .select('user_id')
      .single()

    if (updateError) {
      console.error('Error expiring subscription:', updateError)
      throw updateError
    }

    if (!expiredSub) {
      console.log(`No Pro subscription found for customer: ${customer.customer_id}`)
      return
    }

    console.log(`Successfully expired subscription for user: ${expiredSub.user_id}`)

    // Reactivate Free plan when Pro expires
    await manageFreeSubscription(supabase, expiredSub.user_id, 'active')

  } catch (error) {
    console.error('Error in handleSubscriptionExpired:', error)
    throw error
  }
}

// Helper function to manage Free subscription status based on Pro subscriptions
async function manageFreeSubscription(supabase: any, userId: string, targetStatus: 'active' | 'expired') {
  try {
    console.log(`Managing Free subscription for user: ${userId}, target status: ${targetStatus}`)
    
    // Find existing Free plan
    const { data: existingFreePlan, error: checkError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('plan_name', 'free')
      .single()
    
    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking for existing Free plan:', checkError)
      throw checkError
    }
    
    if (existingFreePlan) {
      // Update existing Free plan status
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({
          status: targetStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingFreePlan.id)
      
      if (updateError) {
        console.error('Error updating Free plan status:', updateError)
        throw updateError
      }
      
      console.log(`Successfully updated Free plan to ${targetStatus} for user: ${userId}`)
    } else if (targetStatus === 'active') {
      // Create new Free plan if none exists and we want it active
      const { error: createError } = await supabase
        .from('subscriptions')
        .insert({
          user_id: userId,
          plan_name: 'free',
          status: 'active',
          job_credits: 1,
          job_credits_used: 0,
          current_period_start: new Date().toISOString(),
          current_period_end: null, // Free plan doesn't expire
          cancel_at_period_end: false
        })
      
      if (createError) {
        console.error('Error creating Free plan:', createError)
        throw createError
      }
      
      console.log(`Successfully created new Free plan for user: ${userId}`)
    }
  } catch (error) {
    console.error('Error in manageFreeSubscription:', error)
    throw error
  }
} 