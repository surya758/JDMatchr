import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Helper function to activate Free plan
async function activateFreePlan(supabase: any, userId: string) {
  try {
    console.log(`Activating Free plan for user: ${userId}`)
    
    // Check if user has an existing Free plan subscription
    const { data: freeSubscription, error: fetchError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('plan_name', 'free')
      .single()
    
    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching free subscription:', fetchError)
      throw fetchError
    }
    
    if (freeSubscription) {
      // Reactivate existing Free plan
      const { error: updateError } = await supabase
        .from('subscriptions')
        .update({
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', freeSubscription.id)
      
      if (updateError) {
        console.error('Error reactivating free subscription:', updateError)
        throw updateError
      }
      
      console.log(`Successfully reactivated existing Free plan for user: ${userId}`)
    } else {
      // Create new Free plan subscription
      const { error: createError } = await supabase
        .from('subscriptions')
        .insert({
          user_id: userId,
          plan_name: 'free',
          status: 'active',
          job_credits: 10,
          job_credits_used: 0,
          current_period_start: new Date().toISOString(),
          current_period_end: null, // Free plan doesn't expire
          cancel_at_period_end: false
        })
      
      if (createError) {
        console.error('Error creating free subscription:', createError)
        throw createError
      }
      
      console.log(`Successfully created new Free plan for user: ${userId}`)
    }
  } catch (error) {
    console.error('Error in activateFreePlan:', error)
    throw error
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Get user from auth header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseKey)

    // Get user from JWT
    const jwt = authHeader.replace('Bearer ', '')
    const { data: { user }, error: userError } = await supabase.auth.getUser(jwt)
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid user token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get user's latest Pro subscription (regardless of status)
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('plan_name', 'pro')
      .neq('status', 'expired') // Don't cancel already expired subscriptions
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (subError || !subscription) {
      return new Response(
        JSON.stringify({ error: 'No Pro subscription found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    console.log('Found subscription to cancel:', subscription)

    const now = new Date()
    const currentPeriodEnd = subscription.current_period_end ? new Date(subscription.current_period_end) : null
    const isPastPeriodEnd = currentPeriodEnd && now > currentPeriodEnd

    console.log('Cancellation timing check:', {
      now: now.toISOString(),
      currentPeriodEnd: currentPeriodEnd?.toISOString(),
      isPastPeriodEnd
    })

    if (isPastPeriodEnd) {
      // Immediately expire the subscription if past current_period_end
      const { error: expireError } = await supabase
        .from('subscriptions')
        .update({
          status: 'expired',
          job_credits: 0,
          updated_at: now.toISOString()
        })
        .eq('id', subscription.id)

      if (expireError) {
        console.error('Error expiring subscription:', expireError)
        return new Response(
          JSON.stringify({ error: 'Failed to expire subscription' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Activate free plan
      await activateFreePlan(supabase, user.id)

      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Subscription expired immediately as it was past the billing period. You have been switched to the Free plan.',
          immediate_expiry: true
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    // For active subscriptions with valid DODO subscription ID, cancel via DODO API
    if (subscription.dodo_subscription_id && subscription.status === 'active') {
    const dodoBearerToken = Deno.env.get('DODO_API_KEY')
    const dodoEnvironment = Deno.env.get('DODO_ENVIRONMENT') || 'test_mode'
    const baseUrl = dodoEnvironment === 'test_mode' 
      ? 'https://test.dodopayments.com'
      : 'https://live.dodopayments.com'

    const response = await fetch(`${baseUrl}/subscriptions/${subscription.dodo_subscription_id}`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${dodoBearerToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        cancel_at_next_billing_date: true,
      }),
    })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('DODO API error:', response.status, errorText)
        return new Response(
          JSON.stringify({ error: 'Failed to cancel subscription with payment provider' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const cancelledSubscription = await response.json()
      console.log('DODO subscription cancelled:', cancelledSubscription)
    }

    // Update subscription to cancelled status
    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        status: 'cancelled',
        cancel_at_period_end: true,
        updated_at: now.toISOString()
      })
      .eq('id', subscription.id)

    if (updateError) {
      console.error('Error updating subscription status:', updateError)
      return new Response(
        JSON.stringify({ error: 'Failed to update subscription status' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Subscription cancelled successfully. It will remain active until the end of your current billing period.',
        subscription_id: subscription.dodo_subscription_id
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in cancel-dodo-subscription:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}) 