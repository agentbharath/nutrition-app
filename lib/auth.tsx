'use client'
import { createContext, useContext, useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { Session, User } from '@supabase/supabase-js'
import { supabase } from '@/lib/supabase'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  displayName: string
  signOut: () => Promise<void>
  deleteAccount: () => Promise<void>
  updateDisplayName: (name: string) => Promise<void>
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  displayName: '',
  signOut: async () => {},
  deleteAccount: async () => {},
  updateDisplayName: async () => {},
})

const PUBLIC_PATHS = ['/login']

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [displayName, setDisplayName] = useState('')
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })

    return () => listener.subscription.unsubscribe()
  }, [])

  useEffect(() => {
    if (!session?.user) { setDisplayName(''); return }
    supabase.from('profiles').select('display_name').eq('id', session.user.id).maybeSingle()
      .then(({ data }) => setDisplayName(data?.display_name || session.user.user_metadata?.display_name || ''))
  }, [session?.user])

  useEffect(() => {
    if (loading) return
    const isPublic = PUBLIC_PATHS.includes(pathname)
    if (!session && !isPublic) {
      router.replace('/login')
    } else if (session && isPublic) {
      router.replace('/')
    }
  }, [session, loading, pathname, router])

  async function signOut() {
    await supabase.auth.signOut()
    router.replace('/login')
  }

  async function deleteAccount() {
    if (!session?.user) return
    // Delete all user data first (cascades handle most, but be explicit for safety)
    const uid = session.user.id
    await Promise.all([
      supabase.from('daily_logs').delete().eq('user_id', uid),
      supabase.from('quick_adds').delete().eq('user_id', uid),
      supabase.from('push_subscriptions').delete().eq('user_id', uid),
      supabase.from('meal_swaps_log').delete().eq('user_id', uid),
      supabase.from('nutrition_ai_reports').delete().eq('user_id', uid),
      supabase.from('health_connections').delete().eq('user_id', uid),
      supabase.from('health_daily_metrics').delete().eq('user_id', uid),
      supabase.from('profiles').delete().eq('id', uid),
    ])
    // Note: full auth.users deletion requires service role (server-side).
    // This call hits our API route which uses the service key.
    await fetch('/api/account/delete', {
      method: 'POST',
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
    await supabase.auth.signOut()
    router.replace('/login')
  }

  async function updateDisplayName(name: string) {
    if (!session?.user) return
    await supabase.from('profiles').upsert({ id: session.user.id, display_name: name, email: session.user.email })
    await supabase.auth.updateUser({ data: { display_name: name } })
    setDisplayName(name)
  }

  return (
    <AuthContext.Provider value={{
      user: session?.user || null,
      session,
      loading,
      displayName,
      signOut,
      deleteAccount,
      updateDisplayName,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
