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
      recurring_pre_tax_amount,
      cancel_at_next_billing_date,
      payment_frequency_interval,
      currency
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
    
    // Look for pending subscription with matching dodo_subscription_id
    const { data: pendingSubscription, error: pendingError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', jdmatchrUserId)
      .eq('dodo_subscription_id', subscription_id)
      .eq('status', 'pending')
      .single()
    
    let targetSubscription
    
    if (pendingSubscription) {
      // UPDATE pending subscription to active
      console.log(`Activating pending subscription for user: ${jdmatchrUserId}`)
      
      const { data: activatedSubscription, error: updateError } = await supabase
        .from('subscriptions')
        .update({
          status: 'active',
          job_credits: 30, // Grant credits when payment is confirmed
          current_period_start: new Date().toISOString(),
          current_period_end: next_billing_date ? new Date(next_billing_date).toISOString() : null,
          subscription_period_count: subscription_period_count || null,
          subscription_period_interval: subscription_period_interval || null,
          natural_expiry_date: naturalExpiryDate ? naturalExpiryDate.toISOString() : null,
          cancel_at_period_end: cancel_at_next_billing_date || false,
          billing_interval: payment_frequency_interval,
          currency: currency,
          updated_at: new Date().toISOString(),
          metadata: JSON.stringify(eventData)
        })
        .eq('id', pendingSubscription.id)
        .select()
        .single()
      
      if (updateError) {
        console.error('Error activating pending subscription:', updateError)
        throw updateError
      }
      
      targetSubscription = activatedSubscription
      
    } else {
      // Fallback: Check for existing Pro subscription (edge case)
      const { data: existingProSubscription, error: checkError } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', jdmatchrUserId)
        .eq('plan_name', 'pro')
        .eq('dodo_subscription_id', subscription_id)
        .single()
      
      if (existingProSubscription) {
        // UPDATE existing Pro subscription
        console.log(`Updating existing Pro subscription for user: ${jdmatchrUserId}`)
        
        const { data: updatedSubscription, error: updateError } = await supabase
          .from('subscriptions')
          .update({
            status: 'active',
            job_credits: 30,
            job_credits_used: 0,
            current_period_start: new Date().toISOString(),
            current_period_end: next_billing_date ? new Date(next_billing_date).toISOString() : null,
            subscription_period_count: subscription_period_count || null,
            subscription_period_interval: subscription_period_interval || null,
            natural_expiry_date: naturalExpiryDate ? naturalExpiryDate.toISOString() : null,
            cancel_at_period_end: cancel_at_next_billing_date || false,
            billing_interval: payment_frequency_interval,
            currency: currency,
            updated_at: new Date().toISOString(),
            metadata: JSON.stringify(eventData)
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
        // CREATE new Pro subscription (fallback for edge cases)
        console.log(`Creating new Pro subscription for user: ${jdmatchrUserId} (fallback)`)
        
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
            billing_interval: payment_frequency_interval,
            currency: currency,
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
    }
    
    // Manage Free subscription: expire when Pro becomes active
    await manageFreeSubscription(supabase, jdmatchrUserId, 'expired')
    
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
    const { subscription_id, next_billing_date, recurring_pre_tax_amount, 
            payment_frequency_interval, currency } = eventData
    const jdmatchrUserId = eventData.metadata?.jdmatchr_user_id
    
    if (!jdmatchrUserId) {
      console.error('No jdmatchr_user_id found in subscription.renewed metadata')
      return
    }

    console.log(`Processing subscription renewal for user: ${jdmatchrUserId}`)

    // 1. Mark current active Pro subscription as 'completed'
    const { error: completeError } = await supabase
      .from('subscriptions')
      .update({
        status: 'completed',
        updated_at: new Date().toISOString()
      })
      .eq('user_id', jdmatchrUserId)
      .eq('plan_type', 'pro')
      .eq('status', 'active')

    if (completeError) {
      console.error('Error completing previous subscription:', completeError)
      throw completeError
    }

    // 2. CREATE new subscription record for this renewal
    const nextBillingDate = next_billing_date ? new Date(next_billing_date) : null
    const naturalExpiryDate = nextBillingDate ? new Date(nextBillingDate.getTime() + (30 * 24 * 60 * 60 * 1000)) : null

    const { error: createError } = await supabase
      .from('subscriptions')
      .insert({
        user_id: jdmatchrUserId,
        plan_type: 'pro',
        status: 'active',
        job_credits: 30, // Reset to Pro plan credits
        job_credits_used: 0,
        dodo_subscription_id: subscription_id,
        next_billing_date: nextBillingDate ? nextBillingDate.toISOString() : null,
        amount_cents: recurring_pre_tax_amount || null,
        billing_interval: payment_frequency_interval,
        currency: currency,
        cancel_at_period_end: false,
        natural_expiry_date: naturalExpiryDate ? naturalExpiryDate.toISOString() : null,
        metadata: JSON.stringify(eventData)
      })

    if (createError) {
      console.error('Error creating renewal subscription:', createError)
      throw createError
    }

    console.log(`Successfully created renewal subscription for user: ${jdmatchrUserId}`)
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
    const { subscription_id, cancel_at_next_billing_date } = eventData
    const jdmatchrUserId = eventData.metadata?.jdmatchr_user_id
    
    if (!jdmatchrUserId) {
      console.error('No jdmatchr_user_id found in subscription.cancelled metadata')
      return
    }

    console.log(`Processing subscription cancellation for user: ${jdmatchrUserId}`)

    // Update subscription to cancelled but keep it active until period ends
    const { error } = await supabase
      .from('subscriptions')
      .update({
        status: 'cancelled',
        cancel_at_period_end: cancel_at_next_billing_date || true,
        updated_at: new Date().toISOString(),
        metadata: JSON.stringify(eventData)
      })
      .eq('dodo_subscription_id', subscription_id)

    if (error) {
      console.error('Error updating cancelled subscription:', error)
      throw error
    }

    // DO NOT reactivate free plan here - let them use Pro until expiry
    console.log(`Successfully cancelled subscription for user: ${jdmatchrUserId}. Pro access continues until expiry.`)
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

async function handlePaymentSucceeded(supabase: any, eventData: any) {
  try {
    const { payment_id, subscription_id } = eventData
    const jdmatchrUserId = eventData.metadata?.jdmatchr_user_id
    
    if (!jdmatchrUserId || !payment_id) {
      console.log('payment.succeeded: Missing required data, skipping payment_id update')
      return
    }

    console.log(`Processing payment success for user: ${jdmatchrUserId}, payment_id: ${payment_id}`)

    // Find the latest active subscription for this user/DODO subscription
    const { data: subscription, error: findError } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('user_id', jdmatchrUserId)
      .eq('dodo_subscription_id', subscription_id)
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (findError || !subscription) {
      console.log('No active subscription found for payment_id update')
      return
    }

    // Update with payment_id for invoice downloads
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        payment_id: payment_id,
        updated_at: new Date().toISOString()
      })
      .eq('id', subscription.id)

    if (updateError) {
      console.error('Error updating subscription with payment_id:', updateError)
      throw updateError
    }

    console.log(`Successfully updated subscription with payment_id: ${payment_id}`)
  } catch (error) {
    console.error('Error in handlePaymentSucceeded:', error)
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

// Helper function to reactivate Free plan when Pro subscription ends (legacy wrapper)
async function reactivateFreePlan(supabase: any, userId: string) {
  return manageFreeSubscription(supabase, userId, 'active')
} 