import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
)

export function useAuth() {
  const [user, setUser] = useState<any>(null)
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    // Load session and profile
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!isMounted) return

      setUser(session?.user || null)

      if (session?.user) {
        try {
          const { data: prof, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()

          if (!isMounted) return

          if (error) {
            console.error('Profile fetch error:', error)
            setProfile(null)
          } else {
            setProfile(prof)
          }
        } catch (err) {
          if (!isMounted) return
          console.error('Profile fetch exception:', err)
          setProfile(null)
        }
      }

      setLoading(false)
    }).catch(err => {
      if (!isMounted) return
      console.error('Session fetch error:', err)
      setLoading(false)
    })

    // Subscribe to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_, session) => {
      if (!isMounted) return

      setUser(session?.user || null)

      if (session?.user) {
        try {
          const { data: prof, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()

          if (!isMounted) return

          if (error) {
            console.error('Profile fetch error:', error)
            setProfile(null)
          } else {
            setProfile(prof)
          }
        } catch (err) {
          if (!isMounted) return
          console.error('Profile fetch exception:', err)
          setProfile(null)
        }
      } else {
        setProfile(null)
      }

      setLoading(false)
    })

    return () => {
      isMounted = false
      subscription?.unsubscribe()
    }
  }, [])

  return { user, profile, loading, isAdmin: profile?.role === 'ADMIN' }
}
