import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import { Database } from '../types/database'

type Subscription = Database['public']['Tables']['subscriptions']['Row']
type SubscriptionUpdate = Database['public']['Tables']['subscriptions']['Update']
type SubscriptionInsert = Database['public']['Tables']['subscriptions']['Insert']

// Query key factory for subscriptions
const subscriptionKeys = {
  all: ['subscription'] as const,
  detail: (userId: string) => [...subscriptionKeys.all, userId] as const,
  history: (userId: string) => [...subscriptionKeys.all, 'history', userId] as const,
}

export const useSubscription = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  // Fetch current subscription
  const {
    data: subscription,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: subscriptionKeys.detail(user?.id || ''),
    queryFn: async (): Promise<Subscription | null> => {
      if (!user?.id) return null

      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error) throw error
      return data
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
  })

  // Fetch billing history (all subscriptions)
  const {
    data: billingHistory,
    isLoading: isHistoryLoading,
    error: historyError,
  } = useQuery({
    queryKey: subscriptionKeys.history(user?.id || ''),
    queryFn: async (): Promise<Subscription[]> => {
      if (!user?.id) return []

      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('user_id', user.id)
        .neq('plan_name', 'free') // Don't show free plan in billing history
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    },
    enabled: !!user?.id,
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
  })

  // Update subscription mutation
  const updateSubscriptionMutation = useMutation({
    mutationFn: async (updates: SubscriptionUpdate): Promise<Subscription> => {
      if (!user?.id || !subscription?.id) {
        throw new Error('No active subscription found')
      }

      const { data, error } = await supabase
        .from('subscriptions')
        .update(updates)
        .eq('id', subscription.id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (updatedSubscription) => {
      // Update the cache with new data
      queryClient.setQueryData(
        subscriptionKeys.detail(user?.id || ''),
        updatedSubscription
      )
      // Refetch billing history to show updated subscription status
      queryClient.invalidateQueries({
        queryKey: subscriptionKeys.history(user?.id || '')
      })
    },
    onError: (error) => {
      console.error('Error updating subscription:', error)
    },
  })

  // Create new subscription mutation
  const createSubscriptionMutation = useMutation({
    mutationFn: async (subscriptionData: SubscriptionInsert): Promise<Subscription> => {
      if (!user?.id) throw new Error('No user logged in')

      // First, cancel any existing active subscriptions
      await supabase
        .from('subscriptions')
        .update({ 
          status: 'cancelled',
          cancelled_at: new Date().toISOString()
        })
        .eq('user_id', user.id)
        .eq('status', 'active')

      // Create new subscription
      const { data, error } = await supabase
        .from('subscriptions')
        .insert({
          ...subscriptionData,
          user_id: user.id,
        })
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (newSubscription) => {
      // Update the cache with new data
      queryClient.setQueryData(
        subscriptionKeys.detail(user?.id || ''),
        newSubscription
      )
      // Refetch billing history to show the new subscription
      queryClient.invalidateQueries({
        queryKey: subscriptionKeys.history(user?.id || '')
      })
    },
  })

  // Upgrade subscription
  const upgradeSubscription = async (planName: 'free' | 'pro' | 'enterprise') => {
    if (!user?.id) throw new Error('No user logged in')
    
    const now = new Date()
    const periodEnd = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
    
    // Set credits based on plan
    const credits = planName === 'free' ? 1 : planName === 'pro' ? 30 : 999

    return createSubscriptionMutation.mutateAsync({
      user_id: user.id,
      plan_name: planName,
      status: 'active',
      current_period_start: now.toISOString(),
      current_period_end: periodEnd.toISOString(),
      cancel_at_period_end: false,
      job_credits: credits,
      job_credits_used: 0,
    })
  }

  // Cancel subscription (set to cancel at period end)
  const cancelSubscription = async () => {
    if (!subscription) throw new Error('No active subscription')

    return updateSubscriptionMutation.mutateAsync({
      cancel_at_period_end: true,
      cancelled_at: new Date().toISOString(),
    })
  }

  // Reactivate subscription (remove cancellation)
  const reactivateSubscription = async () => {
    if (!subscription) throw new Error('No active subscription')

    return updateSubscriptionMutation.mutateAsync({
      cancel_at_period_end: false,
      cancelled_at: null,
    })
  }

  // Check if subscription is cancelled but still active
  const isSubscriptionCancelled = subscription?.cancel_at_period_end || false
  const subscriptionExpiresAt = subscription?.current_period_end
  const subscriptionStatus = subscription?.plan_name || 'free'

  // Check if subscription has expired
  const isExpired = subscription?.current_period_end 
    ? new Date(subscription.current_period_end) < new Date()
    : false


  // Client-side check for expired subscriptions (backup to Edge Function)
  useEffect(() => {
    if (subscription && isExpired && subscription.status === 'active') {
      console.log('🔄 Detected expired subscription, triggering processing...')
      
      // Call the Edge Function to process expired subscriptions
      fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-expired-subscriptions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json',
        },
      })
      .then(response => response.json())
      .then(data => {
        console.log('✅ Expired subscription processing result:', data)
        if (data.success) {
          // Refresh subscription data
          refetch()
        }
      })
      .catch(error => {
        console.error('❌ Error processing expired subscription:', error)
      })
    }
  }, [subscription, isExpired, refetch])

  // Add credit mutation for using credits
  const useJobCreditMutation = useMutation({
    mutationFn: async (): Promise<Subscription> => {
      if (!user?.id || !subscription?.id) {
        throw new Error('No active subscription found')
      }

      const { data, error } = await supabase
        .from('subscriptions')
        .update({ 
          job_credits_used: (subscription.job_credits_used || 0) + 1 
        })
        .eq('id', subscription.id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (updatedSubscription) => {
      queryClient.setQueryData(
        subscriptionKeys.detail(user?.id || ''),
        updatedSubscription
      )
    },
  })

  const useJobCredit = () => {
    if (!subscription) return Promise.reject('No active subscription')
    const remainingCredits = (subscription.job_credits || 0) - (subscription.job_credits_used || 0)
    if (remainingCredits <= 0) return Promise.reject('No credits remaining')
    
    return useJobCreditMutation.mutateAsync()
  }

  return {
    // Data
    subscription,
    isLoading,
    error,
    billingHistory,
    isHistoryLoading,
    historyError,
    
    // Actions
    refetch,
    upgradeSubscription,
    cancelSubscription,
    reactivateSubscription,
    useJobCredit,
    
    // Mutation states
    isUpdating: updateSubscriptionMutation.isPending || createSubscriptionMutation.isPending || useJobCreditMutation.isPending,
    updateError: updateSubscriptionMutation.error || createSubscriptionMutation.error || useJobCreditMutation.error,
    
    // Convenience getters
    subscriptionStatus,
    isSubscriptionCancelled,
    subscriptionExpiresAt,
    isExpired,
    canUpgrade: !isSubscriptionCancelled && !isExpired,
    jobCredits: subscription?.job_credits || 0,
    jobCreditsUsed: subscription?.job_credits_used || 0,
    jobCreditsRemaining: (subscription?.job_credits || 0) - (subscription?.job_credits_used || 0),
    canUseService: ((subscription?.job_credits || 0) - (subscription?.job_credits_used || 0)) > 0 || subscriptionStatus !== 'free',
  }
} 