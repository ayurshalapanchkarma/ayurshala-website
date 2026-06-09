import { useState, useEffect } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
)

export function useAuth() {
  const [user, setUser] = useState<any>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let isMounted = true

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!isMounted) return

      setUser(session?.user || null)

      if (session?.user) {
        try {
          // Check if user is admin
          const { data: admin } = await supabase
            .from('admins')
            .select('id')
            .eq('id', session.user.id)
            .single()

          if (!isMounted) return
          setIsAdmin(!!admin)
        } catch (err) {
          if (!isMounted) return
          setIsAdmin(false)
        }
      }

      setLoading(false)
    }).catch(() => {
      if (!isMounted) return
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_, session) => {
      if (!isMounted) return

      setUser(session?.user || null)

      if (session?.user) {
        try {
          const { data: admin } = await supabase
            .from('admins')
            .select('id')
            .eq('id', session.user.id)
            .single()

          if (!isMounted) return
          setIsAdmin(!!admin)
        } catch (err) {
          if (!isMounted) return
          setIsAdmin(false)
        }
      } else {
        setIsAdmin(false)
      }

      setLoading(false)
    })

    return () => {
      isMounted = false
      subscription?.unsubscribe()
    }
  }, [])

  return { user, loading, isAdmin }
}
