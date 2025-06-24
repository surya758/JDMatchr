import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'
import { Database } from '../types/database'

type UserProfile = Database['public']['Tables']['users']['Row']
type UserProfileUpdate = Database['public']['Tables']['users']['Update']

// Query key factory for user profile
const userProfileKeys = {
  all: ['userProfile'] as const,
  detail: (userId: string) => [...userProfileKeys.all, userId] as const,
}

export const useUserProfile = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()

  // Fetch user profile with React Query
  const {
    data: profile,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: userProfileKeys.detail(user?.id || ''),
    queryFn: async (): Promise<UserProfile | null> => {
      if (!user?.id) return null

      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single()

      if (error) {
        // If user profile doesn't exist, create it
        if (error.code === 'PGRST116') {
          const { data: newProfile, error: createError } = await supabase
            .from('users')
            .insert({
              id: user.id,
              email: user.email!,
              full_name: user.user_metadata?.full_name || null,
              avatar_url: user.user_metadata?.avatar_url || null,
            })
            .select()
            .single()

          if (createError) throw createError
          return newProfile
        }
        throw error
      }

      return data
    },
    enabled: !!user?.id, // Only run query when user is available
    staleTime: 1000 * 60 * 5, // Consider data fresh for 5 minutes
    retry: (failureCount, error: any) => {
      // Don't retry if it's a user not found error
      if (error?.code === 'PGRST116') return false
      return failureCount < 3
    },
  })

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (updates: UserProfileUpdate): Promise<UserProfile> => {
      if (!user?.id) throw new Error('No user logged in')

      const { data, error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', user.id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: (updatedProfile) => {
      // Update the cache with new data
      queryClient.setQueryData(
        userProfileKeys.detail(user?.id || ''),
        updatedProfile
      )
    },
    onError: (error) => {
      console.error('Error updating profile:', error)
    },
  })

  return {
    // Data
    profile,
    isLoading,
    error,
    
    // Actions
    refetch,
    updateProfile: updateProfileMutation.mutateAsync,
    
    // Mutation states
    isUpdating: updateProfileMutation.isPending,
    updateError: updateProfileMutation.error,
    
    // Convenience getters
    fullName: profile?.full_name,
    avatarUrl: profile?.avatar_url,
  }
} 