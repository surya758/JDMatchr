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

    console.log('🔄 Starting monthly free subscription credits refresh...')

    // Get current timestamp for logging
    const now = new Date()
    const currentMonth = now.toLocaleString('default', { month: 'long', year: 'numeric' })
    
    console.log(`Processing free subscription credits refresh for ${currentMonth}`)

    // Find all active free subscriptions
    const { data: freeSubscriptions, error: fetchError } = await supabaseClient
      .from('subscriptions')
      .select('id, user_id, job_credits, job_credits_used, updated_at')
      .eq('plan_name', 'free')

    if (fetchError) {
      console.error('Error fetching free subscriptions:', fetchError)
      throw fetchError
    }

    console.log(`Found ${freeSubscriptions?.length || 0} active free subscriptions`)

    if (!freeSubscriptions || freeSubscriptions.length === 0) {
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'No active free subscriptions to refresh',
          processed: 0,
          month: currentMonth
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200 
        }
      )
    }

    let refreshedCount = 0
    let alreadyFreshCount = 0

    // Process each free subscription
    for (const subscription of freeSubscriptions) {
      try {
        // Check if credits need refreshing (if any have been used)
        if (subscription.job_credits_used > 0) {
          console.log(`Refreshing credits for subscription: ${subscription.id} (user: ${subscription.user_id})`)
          console.log(`  Previous: ${subscription.job_credits_used}/${subscription.job_credits} credits used`)

          // Reset credits used back to 0, effectively giving them their full credit allowance
          const { error: updateError } = await supabaseClient
            .from('subscriptions')
            .update({
              job_credits_used: 0,
              updated_at: new Date().toISOString()
            })
            .eq('id', subscription.id)

          if (updateError) {
            console.error(`Error updating subscription ${subscription.id}:`, updateError)
            continue
          }

          refreshedCount++
          console.log(`  ✅ Credits refreshed: ${subscription.job_credits}/${subscription.job_credits} credits available`)

        } else {
          // User hasn't used any credits yet, no need to refresh
          alreadyFreshCount++
          console.log(`Subscription ${subscription.id} already has full credits (${subscription.job_credits}/${subscription.job_credits})`)
        }

      } catch (error) {
        console.error(`Error processing subscription ${subscription.id}:`, error)
        continue
      }
    }

    const totalProcessed = refreshedCount + alreadyFreshCount
    console.log(`🎉 Monthly credit refresh completed:`)
    console.log(`  - ${refreshedCount} subscriptions refreshed`)
    console.log(`  - ${alreadyFreshCount} subscriptions already had full credits`)
    console.log(`  - ${totalProcessed} total free subscriptions processed`)

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: `Successfully processed ${totalProcessed} free subscriptions`,
        refreshed: refreshedCount,
        alreadyFresh: alreadyFreshCount,
        total: totalProcessed,
        month: currentMonth
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )

  } catch (error) {
    console.error('Error in refresh-free-subscription-credits:', error)
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