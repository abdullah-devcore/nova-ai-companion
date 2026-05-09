'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'

interface AuthContextType {
  user: User | null
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const supabase = createClient()

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log('[AuthContext] Initial session:', session?.user?.email || 'none')
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes - keep callback synchronous, no async calls inside
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('[AuthContext] Auth event:', event)
        // Only update state for meaningful events, ignore INITIAL_SESSION
        // since we already handle it with getSession above
        if (event !== 'INITIAL_SESSION') {
          setUser(session?.user ?? null)
          setLoading(false)
        }
      }
    )

    return () => {
      subscription?.unsubscribe()
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading }}>
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
