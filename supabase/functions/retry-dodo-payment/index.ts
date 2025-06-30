import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Verify user authentication
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    const { data: { user }, error: userError } = await supabase.auth.getUser()
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Parse request body
    const { userEmail, userName } = await req.json()

    if (!userEmail) {
      return new Response(
        JSON.stringify({ error: 'Missing required field: userEmail' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Find the user's failed or on_hold pro subscription
    const { data: failedSubscription, error: subError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .eq('plan_name', 'pro')
      .in('status', ['failed', 'on_hold'])
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (subError || !failedSubscription) {
      return new Response(
        JSON.stringify({ error: 'No failed or on-hold subscription found' }),
        { 
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    console.log('Found failed/on-hold subscription:', failedSubscription.id, 'Status:', failedSubscription.status)

    // Get DODO API credentials from environment
    const dodoApiKey = Deno.env.get('DODO_API_KEY')
    const dodoEnvironment = Deno.env.get('DODO_ENVIRONMENT') || 'test_mode'
    
    if (!dodoApiKey) {
      throw new Error('DODO API key not configured')
    }

    const baseUrl = dodoEnvironment === 'live_mode' 
      ? 'https://api.dodopayments.com'
      : 'https://test.dodopayments.com'

    // Step 1: Create or get DODO customer (reuse existing if available)
    console.log('Creating/getting DODO customer for:', userEmail)
    
    let customer
    
    // Try to reuse existing customer if we have dodo_customer_id
    if (failedSubscription.dodo_customer_id) {
      console.log('Reusing existing DODO customer:', failedSubscription.dodo_customer_id)
      customer = { customer_id: failedSubscription.dodo_customer_id }
    } else {
      // Create new customer
      const customerResponse: Response = await fetch(`${baseUrl}/customers`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${dodoApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: userEmail,
          name: userName || userEmail.split('@')[0],
          metadata: {
            jdmatchr_user_id: user.id,
            source: 'jdmatchr_retry_payment',
            original_subscription_id: failedSubscription.id
          }
        })
      })

      if (!customerResponse.ok) {
        const errorText = await customerResponse.text()
        console.error('DODO customer creation failed:', errorText)
        throw new Error(`Failed to create customer: ${customerResponse.status}`)
      }

      customer = await customerResponse.json()
      console.log('DODO customer created:', customer.customer_id)
    }

    // Step 2: Get product ID for Pro plan
    const productId = Deno.env.get('DODO_PRODUCT_PRO_MONTHLY')
    if (!productId) {
      return new Response(
        JSON.stringify({ error: 'Pro product configuration not found' }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Step 3: Create new subscription for retry
    console.log('Creating DODO subscription for retry, product:', productId)
    
    const subscriptionResponse = await fetch(`${baseUrl}/subscriptions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${dodoApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        billing: {
          city: 'Default',
          country: 'US',
          state: 'CA',
          street: 'Default',
          zipcode: '90210'
        },
        customer: { 
          customer_id: customer.customer_id 
        },
        product_id: productId,
        quantity: 1,
        payment_link: true,
        return_url: `${req.headers.get('origin')}/dashboard/settings/billing?success=true&retry=true`,
        metadata: {
          jdmatchr_user_id: user.id,
          plan_name: 'pro',
          source: 'jdmatchr_retry_payment',
          retry_tag: 'true',
          original_subscription_id: failedSubscription.id,
          retry_for_status: failedSubscription.status
        }
      })
    })

    if (!subscriptionResponse.ok) {
      const errorText = await subscriptionResponse.text()
      console.error('DODO subscription creation failed:', errorText)
      throw new Error(`Failed to create retry subscription: ${subscriptionResponse.status}`)
    }

    const subscription = await subscriptionResponse.json()
    console.log('DODO retry subscription created:', subscription.subscription_id)

    // Return the subscription session data
    return new Response(
      JSON.stringify({
        success: true,
        customer_id: customer.customer_id,
        payment_id: subscription.payment_id,
        subscription_id: subscription.subscription_id,
        checkout_url: subscription.payment_link,
        client_secret: subscription.client_secret,
        original_subscription_id: failedSubscription.id,
        retry: true
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('❌ Error creating DODO retry payment:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to create retry payment session',
        message: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}) 