import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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

    // Get user's cancelled Pro subscription
    const { data: subscription, error: subError } = await supabase
      .from('subscriptions')
      .select('dodo_subscription_id, dodo_customer_id')
      .eq('user_id', user.id)
      .eq('plan_name', 'pro')
      .eq('status', 'cancelled')
      .order('created_at', { ascending: false })
      .eq('cancel_at_period_end', true)
      .single()

    console.log('subscription', subscription)

    if (subError || !subscription) {
      return new Response(
        JSON.stringify({ error: 'No cancelled Pro subscription found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!subscription.dodo_subscription_id) {
      return new Response(
        JSON.stringify({ error: 'Missing DODO subscription ID' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Reactivate subscription via DODO API
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
        cancel_at_next_billing_date: false,
      }),
    })

    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({
        status: 'active',
        cancel_at_period_end: false,
        updated_at: new Date().toISOString()
      })
      .eq('dodo_subscription_id', subscription.dodo_subscription_id)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('DODO API error:', response.status, errorText)
      return new Response(
        JSON.stringify({ error: 'Failed to reactivate subscription' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const reactivatedSubscription = await response.json()
    console.log('DODO subscription reactivated:', reactivatedSubscription)

    return new Response(
      JSON.stringify({ 
        success: true,
        message: 'Subscription reactivated successfully. Your billing will continue as normal.',
        subscription_id: subscription.dodo_subscription_id
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('Error in reactivate-dodo-subscription:', error)
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}) 