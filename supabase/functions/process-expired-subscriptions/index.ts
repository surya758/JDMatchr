import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
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
    // Create Supabase client with service role key for admin operations
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    console.log('🔄 Processing expired subscriptions...')

    // Get current timestamp
    const now = new Date().toISOString()

    // Find cancelled subscriptions that have reached their current period end
    const { data: expiredSubscriptions, error: fetchError } = await supabaseClient
      .from('subscriptions')
      .select('*')
      .eq('status', 'cancelled')
      .eq('plan_name', 'pro')
      .not('current_period_end', 'is', null)
      .lte('current_period_end', now)

    if (fetchError) {
      console.error('Error fetching expired subscriptions:', fetchError)
      throw fetchError
    }

    console.log(`Found ${expiredSubscriptions?.length || 0} expired cancelled subscriptions`)

    if (!expiredSubscriptions || expiredSubscriptions.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No expired subscriptions to process',
          processed: 0
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    let processedCount = 0

    // Process each expired subscription
    for (const subscription of expiredSubscriptions) {
      try {
        console.log(`Processing expired subscription for user: ${subscription.user_id}`)

        // 1. Update the cancelled subscription: set status to expired and job credits to 0
        const { error: updateError } = await supabaseClient
          .from('subscriptions')
          .update({
            status: 'expired',
            job_credits: 0,
            updated_at: new Date().toISOString()
          })
          .eq('id', subscription.id)

        if (updateError) {
          console.error(`Error updating subscription ${subscription.id}:`, updateError)
          continue
        }

        // 2. Reactivate Free plan for the user
        await reactivateFreePlan(supabaseClient, subscription.user_id)

        processedCount++
        console.log(`✅ Successfully processed expired subscription for user: ${subscription.user_id}`)

      } catch (error) {
        console.error(`Error processing subscription ${subscription.id}:`, error)
        continue
      }
    }

    console.log(`🎉 Processed ${processedCount} expired subscriptions`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Successfully processed ${processedCount} expired subscriptions`,
        processed: processedCount
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error in process-expired-subscriptions:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        details: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    )
  }
})

// Helper function to reactivate Free plan
async function reactivateFreePlan(supabase: any, userId: string) {
  try {
    console.log(`Reactivating Free plan for user: ${userId}`)
    
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
          job_credits: 1, // Free plan gets 1 credit
          job_credits_used: 0,
          amount_cents: 0,
          currency: 'USD',
          billing_interval: null,
          cancel_at_period_end: false
        })
      
      if (createError) {
        console.error('Error creating free subscription:', createError)
        throw createError
      }
      
      console.log(`Successfully created new Free plan for user: ${userId}`)
    }
  } catch (error) {
    console.error('Error in reactivateFreePlan:', error)
    throw error
  }
} 