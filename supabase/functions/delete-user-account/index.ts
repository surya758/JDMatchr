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
    // Create Supabase client with service role key for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Get the authorization header
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Create regular client to verify user authentication
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        },
        global: {
          headers: { Authorization: authHeader }
        }
      }
    )

    // Verify user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { 
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    const userId = user.id

    console.log(`🗑️ Starting account deletion for user: ${userId}`)

    // Check if user exists in our users table
    const { data: userData, error: userCheckError } = await supabaseAdmin
      .from('users')
      .select('id, email')
      .eq('id', userId)
      .single()

    if (userCheckError && userCheckError.code !== 'PGRST116') {
      console.error('❌ Error checking user existence:', userCheckError)
      throw new Error('Failed to verify user account')
    }

    if (userData) {
      console.log(`📋 Found user data for: ${userData.email}`)
    }

    // Delete user from authentication - this should cascade to all related tables
    // because users table has ON DELETE CASCADE from auth.users
    // and all other tables cascade from users table
    console.log('🔐 Deleting user from authentication (this will cascade to all related data)...')
    
    const { error: deleteUserError } = await supabaseAdmin.auth.admin.deleteUser(userId)

    if (deleteUserError) {
      console.error('❌ Error deleting user from auth:', deleteUserError)
      
      // If auth deletion fails, let's try to clean up manually
      console.log('🧹 Auth deletion failed, attempting manual cleanup...')
      
      try {
        // Delete in order to avoid foreign key constraints
        console.log('🧹 Cleaning up job_applications...')
        
        // First get the user's job IDs
        const { data: userJobs } = await supabaseAdmin
          .from('jobs')
          .select('id')
          .eq('user_id', userId)
        
        if (userJobs && userJobs.length > 0) {
          const jobIds = userJobs.map(job => job.id)
          await supabaseAdmin
            .from('job_applications')
            .delete()
            .in('job_id', jobIds)
        }

        console.log('🧹 Cleaning up candidates...')
        await supabaseAdmin
          .from('candidates')
          .delete()
          .eq('user_id', userId)

        console.log('🧹 Cleaning up jobs...')
        await supabaseAdmin
          .from('jobs')
          .delete()
          .eq('user_id', userId)

        console.log('🧹 Cleaning up user_preferences...')
        await supabaseAdmin
          .from('user_preferences')
          .delete()
          .eq('user_id', userId)

        console.log('🧹 Cleaning up subscriptions...')
        await supabaseAdmin
          .from('subscriptions')
          .delete()
          .eq('user_id', userId)

        console.log('🧹 Cleaning up users table...')
        await supabaseAdmin
          .from('users')
          .delete()
          .eq('id', userId)

        // Try auth deletion again
        console.log('🔐 Retrying auth user deletion...')
        const { error: retryDeleteError } = await supabaseAdmin.auth.admin.deleteUser(userId)
        
        if (retryDeleteError) {
          console.error('❌ Failed to delete user from auth even after cleanup:', retryDeleteError)
          throw new Error(`Failed to delete user from authentication: ${retryDeleteError.message}`)
        }
        
      } catch (cleanupError) {
        console.error('❌ Manual cleanup failed:', cleanupError)
        throw new Error(`Account deletion failed: ${cleanupError.message}`)
      }
    }

    console.log('✅ Account deletion completed successfully')

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Account deleted successfully',
        deletedUserId: userId
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('❌ Account deletion error:', error)
    
    return new Response(
      JSON.stringify({ 
        error: error.message || 'Failed to delete account',
        success: false
      }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}) 