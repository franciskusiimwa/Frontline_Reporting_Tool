import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

type CookieStore = {
  getAll: () => Array<{ name: string; value: string; options?: any }>
  set: (name: string, value: string, options?: any) => void
}

export function createClient() {
  const cookieStore = cookies() as unknown as CookieStore

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          try {
            return cookieStore.getAll()
          } catch {
            return []
          }
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
          try {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          } catch {}
        },
      },
    }
  )
}
