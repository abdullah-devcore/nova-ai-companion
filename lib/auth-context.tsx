'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'

interface AuthContextType {
  user: User | null
  loading: boolean
  error: string | null
  isSignedIn: boolean
  refreshSession: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const refreshSession = async () => {
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
      setError(null)
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to refresh session'
      console.error('[Auth] Refresh session error:', errorMsg)
      setError(errorMsg)
    }
  }

  useEffect(() => {
    const supabase = createClient()

    // Get initial session
    supabase.auth.getSession()
      .then(({ data: { session }, error: sessionError }) => {
        if (sessionError) {
          console.error('[Auth] Initial session error:', sessionError.message)
          setError(sessionError.message)
        } else {
          console.log('[Auth] Initial session:', session?.user?.email || 'none')
          setUser(session?.user ?? null)
        }
        setLoading(false)
      })
      .catch((err) => {
        console.error('[Auth] Unexpected error getting session:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
        setLoading(false)
      })

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('[Auth] Event:', event, 'User:', session?.user?.email || 'none')
        
        switch (event) {
          case 'SIGNED_IN':
          case 'USER_UPDATED':
            setUser(session?.user ?? null)
            setError(null)
            break
          case 'SIGNED_OUT':
            setUser(null)
            setError(null)
            break
          case 'INITIAL_SESSION':
            // Handled by getSession above
            break
          case 'TOKEN_REFRESHED':
            setUser(session?.user ?? null)
            break
          case 'MFA_CHALLENGE_VERIFIED':
            setUser(session?.user ?? null)
            break
          default:
            break
        }
        setLoading(false)
      }
    )

    return () => {
      subscription?.unsubscribe()
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, error, isSignedIn: !!user, refreshSession }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

