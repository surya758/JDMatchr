import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Import DODO Payments (you'll need to add this as an npm module or use HTTP requests)
// For now, we'll use direct HTTP requests to DODO API

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
    const { planName, userEmail, userName } = await req.json()

    if (!planName || !userEmail) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: planName, userEmail' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

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
    
    // Check if user has any existing subscription with a dodo_customer_id
    const { data: existingSubscription, error: existingError } = await supabase
      .from('subscriptions')
      .select('dodo_customer_id')
      .eq('user_id', user.id)
      .not('dodo_customer_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (existingSubscription?.dodo_customer_id && !existingError) {
      // Reuse existing customer
      console.log('Reusing existing DODO customer:', existingSubscription.dodo_customer_id)
      customer = { customer_id: existingSubscription.dodo_customer_id }
    } else {
      // Create new customer
      console.log('Creating new DODO customer for:', userEmail)
    
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
          source: 'jdmatchr_app'
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

    // Step 2: Map plan to DODO product ID
    const productMapping: Record<string, string> = {
      'Pro': Deno.env.get('DODO_PRODUCT_PRO_MONTHLY') || 'prod_pro_monthly',
    }

    const productId = productMapping[planName]
    if (!productId) {
      return new Response(
        JSON.stringify({ error: `Product not found for plan: ${planName}` }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Step 3: Create subscription
    console.log('Creating DODO subscription for product:', productId)
    
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
        return_url: `${req.headers.get('origin')}/dashboard/settings/billing?success=true`,
        metadata: {
          jdmatchr_user_id: user.id,
          plan_name: planName,
          source: 'jdmatchr_app'
        }
      })
    })

    if (!subscriptionResponse.ok) {
      const errorText = await subscriptionResponse.text()
      console.error('DODO subscription creation failed:', errorText)
      throw new Error(`Failed to create subscription: ${subscriptionResponse.status}`)
    }

    const subscription = await subscriptionResponse.json()
    console.log('DODO subscription created:', subscription.subscription_id)
    console.log('DODO customer:', customer)

    // Return the subscription session data without creating subscription record
    return new Response(
      JSON.stringify({
        success: true,
        customer_id: customer.customer_id,
        payment_id: subscription.payment_id,
        subscription_id: subscription.subscription_id,
        checkout_url: subscription.payment_link,
        client_secret: subscription.client_secret
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('❌ Error creating DODO payment:', error)
    
    return new Response(
      JSON.stringify({ 
        error: 'Failed to create payment session',
        message: error.message 
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}) 