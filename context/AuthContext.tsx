'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'

interface AuthContextType {
  token: string | null;
  role: string | null;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  token: null,
  role: null,
  logout: () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [token, setToken] = useState<string | null>(null)
  const [role, setRole] = useState<string | null>(null)
  const [isInitializing, setIsInitializing] = useState(true)

  useEffect(() => {
    // 1. Initial check of standard manual login
    const storedEmail = sessionStorage.getItem('userEmail')
    const storedRole = sessionStorage.getItem('userRole')
    
    if (storedEmail) {
      setToken(storedEmail)
      setRole(storedRole || 'user')
    }

    // 2. Listen for Supabase native auth changes (This catches the Google OAuth redirect!)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user?.email) {
        const userEmail = session.user.email;
        
        // Sync Google login with your custom sessionStorage
        sessionStorage.setItem('userEmail', userEmail)
        sessionStorage.setItem('userRole', 'user')
        setToken(userEmail)
        setRole('user')

        // Check if this Google user exists in the profiles table yet
        const { data: existingProfile } = await supabase
          .from('profiles')
          .select('id')
          .eq('email', userEmail)
          .single()

        // If they don't exist, create a profile for them automatically!
        if (!existingProfile) {
          await supabase.from('profiles').insert([{
            email: userEmail,
            full_name: session.user.user_metadata?.full_name || 'Google User',
            role: 'user'
          }])
        }
        
        // If they just logged in and are stuck on the auth pages, push them to the dashboard
        if (window.location.pathname === '/login' || window.location.pathname === '/signup') {
            router.push('/dashboard')
        }
      } else if (event === 'SIGNED_OUT') {
        sessionStorage.clear()
        setToken(null)
        setRole(null)
      }
      
      setIsInitializing(false)
    })

    // Fail-safe timeout to stop loading if no session is found
    const timeout = setTimeout(() => setIsInitializing(false), 1000)

    return () => {
      subscription.unsubscribe()
      clearTimeout(timeout)
    }
  }, [router])

  const logout = async () => {
    await supabase.auth.signOut()
    sessionStorage.clear()
    setToken(null)
    setRole(null)
    router.push('/login')
  }

  return (
    <AuthContext.Provider value={{ token, role, logout }}>
      {/* Wait for Google Auth to initialize before rendering protected pages */}
      {isInitializing && pathname !== '/login' && pathname !== '/signup' && pathname !== '/' ? (
         <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
         </div>
      ) : children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { token } = useAuth()
  const router = useRouter()
  const [isReady, setIsReady] = useState(false)

  useEffect(() => {
    // Wait briefly to let the AuthContext sync up with Supabase
    const timer = setTimeout(() => {
      if (!sessionStorage.getItem('userEmail')) {
        router.push('/login')
      } else {
        setIsReady(true)
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [router, token])

  if (!isReady) return null

  return <>{children}</>
}