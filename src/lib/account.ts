import { supabase } from './supabase'

/**
 * Delete user account and all associated data
 * This calls the Supabase Edge Function that handles secure account deletion
 */
export async function deleteUserAccount(): Promise<{ success: boolean; error?: string }> {
  try {
    // Get current session to include in request
    const { data: { session } } = await supabase.auth.getSession()
    
    if (!session) {
      return { success: false, error: 'No active session found' }
    }

    // Call the Edge Function to delete account
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/delete-user-account`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
    })

    const result = await response.json()

    if (!response.ok) {
      console.error('Account deletion failed:', result)
      return { 
        success: false, 
        error: result.error || `HTTP ${response.status}: ${response.statusText}` 
      }
    }

    if (!result.success) {
      return { 
        success: false, 
        error: result.error || 'Account deletion failed' 
      }
    }

    console.log('✅ Account deleted successfully:', result)
    return { success: true }

  } catch (error) {
    console.error('❌ Account deletion error:', error)
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unexpected error occurred' 
    }
  }
} 